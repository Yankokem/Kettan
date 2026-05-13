using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Orders;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Inventory;
using Kettan.Server.Enums;

namespace Kettan.Server.Services.BranchOperations;

public class OrderWorkflowService : IOrderWorkflowService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<OrderWorkflowService> _logger;
    private readonly IDocumentSequenceService _sequenceService;

    public OrderWorkflowService(
        ApplicationDbContext context,
        ICurrentUserService currentUser,
        INotificationService notificationService,
        IInventoryService inventoryService,
        IDocumentSequenceService sequenceService,
        ILogger<OrderWorkflowService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _inventoryService = inventoryService;
        _sequenceService = sequenceService;
        _logger = logger;
    }

    public async Task<List<BranchOrderDto>> ListBranchOrdersAsync(string? status = null, int? branchId = null)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return [];
        }

        var query = _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .Include(o => o.SupplyPushBatch)
            .Include(o => o.Shipment)
            .Include(o => o.ArrivedConfirmedByUser)
            .Include(o => o.CompletedByUser)
            .AsQueryable();

        if (branchId.HasValue)
        {
            if (IsBranchScopedUser() && branchId.Value != (_currentUser.BranchId ?? 0))
            {
                return [];
            }

            query = query.Where(o => o.SupplyRequest != null && o.SupplyRequest.BranchId == branchId.Value);
        }
        else if (IsBranchScopedUser())
        {
            var currentBranchId = _currentUser.BranchId ?? 0;
            query = query.Where(o => o.SupplyRequest != null && o.SupplyRequest.BranchId == currentBranchId);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(o => o.Status == parsedStatus);
            }
        }

        var orders = await query
            .OrderByDescending(o => o.PushedToFulfillmentAt)
            .AsSplitQuery()
            .ToListAsync();

        return orders.Distinct().Select(MapToBranchOrderDto).ToList();
    }

    public async Task<OrderDetailDto> CreateHqOrderAsync(CreateOrderDto dto)
    {
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        var branch = await _context.Branches
            .Where(b => b.BranchId == dto.BranchId && b.TenantId == tenantId && b.IsActive)
            .Select(b => new { b.BranchId, b.Name })
            .FirstOrDefaultAsync();
        if (branch == null)
        {
            throw new InvalidOperationException("Target branch was not found.");
        }

        var itemMetadataLookup = await ValidateCreateOrderItemsAsync(dto.Items, tenantId);
        var now = DateTime.UtcNow;

        var itemCostLookup = itemMetadataLookup.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.UnitCost);

        await using var tx = await _context.Database.BeginTransactionAsync();

        var (_, order) = await CreateHqInitiatedRequestAndOrderAsync(
            tenantId,
            userId,
            dto.BranchId,
            dto.Subject,
            dto.RequestType,
            dto.Priority,
            dto.DispatchWindow,
            dto.DispatchDate,
            dto.Notes,
            dto.Items.Select(i => new CreateOrderItemDto
            {
                ItemId = i.ItemId,
                QuantityRequested = i.QuantityRequested
            }).ToList(),
            itemCostLookup,
            now,
            supplyPushBatchId: null);

        await tx.CommitAsync();

        await _notificationService.CreateForRolesAsync(
            ["BranchManager", "BranchOwner"],
            "Incoming Supply Shipment",
            $"HQ is preparing a supply dispatch for {branch.Name}. {dto.Items.Count} item(s) selected.",
            type: "Info",
            branchId: dto.BranchId,
            referenceType: "SupplyDispatch",
            referenceId: order.OrderId);

        var createdOrder = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.RequestedBy_User)
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
                    .ThenInclude(b => b!.Item)
            .Include(o => o.SupplyPushBatch)
            .FirstAsync(o => o.OrderId == order.OrderId);

        return await MapToOrderDetailDto(createdOrder, null);
    }

    public async Task<MultiBranchSupplyPushDetailDto> CreateMultiBranchSupplyPushAsync(CreateMultiBranchSupplyPushDto dto)
    {
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        var branchIds = (dto.BranchIds ?? [])
            .Distinct()
            .ToList();

        if (branchIds.Count == 0)
        {
            throw new InvalidOperationException("At least one target branch is required.");
        }

        var branches = await _context.Branches
            .Where(b => b.TenantId == tenantId && b.IsActive && branchIds.Contains(b.BranchId))
            .Select(b => new { b.BranchId, b.Name })
            .ToListAsync();

        if (branches.Count != branchIds.Count)
        {
            throw new InvalidOperationException("One or more target branches are invalid.");
        }

        var createItems = (dto.Items ?? [])
            .Select(i => new CreateOrderItemDto
        {
            ItemId = i.ItemId,
            QuantityRequested = i.QuantityRequested
        })
            .ToList();
        var itemMetadataLookup = await ValidateCreateOrderItemsAsync(createItems, tenantId);
        // Pre-validate HQ inventory levels for multi-branch push: ensure HQ has enough
        // stock to fulfill (quantityRequested * branchCount) for every item.
        var shortages = new List<string>();
        foreach (var it in createItems)
        {
            var requiredTotal = it.QuantityRequested * branchIds.Count;
            var hqStock = await _inventoryService.GetStockLevelAsync(it.ItemId, null);
            if (requiredTotal > hqStock)
            {
                var itemName = itemMetadataLookup.TryGetValue(it.ItemId, out var metadata) ? metadata.Name : $"Item {it.ItemId}";
                shortages.Add($"'{itemName}': need {requiredTotal}, only {hqStock} available in HQ");
            }
        }

        if (shortages.Any())
        {
            throw new InvalidOperationException($"Insufficient HQ stock for selected items: {string.Join(", ", shortages)}");
        }

        var now = DateTime.UtcNow;
        var requestType = Enum.TryParse<RequestType>(dto.RequestType, true, out var parsedType) ? parsedType : RequestType.HqInitiated;
        var priority = Enum.TryParse<Priority>(dto.Priority, true, out var parsedPriority) ? parsedPriority : Priority.Normal;
        var dispatchWindow = Enum.TryParse<DispatchWindow>(dto.DispatchWindow, true, out var parsedDispatchWindow) ? parsedDispatchWindow : DispatchWindow.Today;

        var itemCostLookup = itemMetadataLookup.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.UnitCost);

        await using var tx = await _context.Database.BeginTransactionAsync();

        var batch = new SupplyPushBatch
        {
            TenantId = tenantId,
            TransactionCode = await _sequenceService.GenerateNextCodeAsync(tenantId, "SupplyPushBatch", "SPB"),
            CreatedByUserId = userId,
            Subject = NormalizeSubject(dto.Subject),
            RequestType = requestType,
            Priority = priority,
            DispatchWindow = dispatchWindow,
            DispatchDate = dto.DispatchDate,
            Notes = NormalizeOptional(dto.Notes),
            CreatedAt = now,
            UpdatedAt = now,
            Items = createItems.Select(i => new SupplyPushBatchItem
            {
                TenantId = tenantId,
                ItemId = i.ItemId,
                QuantityRequested = i.QuantityRequested,
                UnitCostSnapshot = itemCostLookup.TryGetValue(i.ItemId, out var unitCost) ? unitCost : 0
            }).ToList()
        };

        _context.SupplyPushBatches.Add(batch);
        await _context.SaveChangesAsync();

        foreach (var branch in branches)
        {
            var (_, order) = await CreateHqInitiatedRequestAndOrderAsync(
                tenantId,
                userId,
                branch.BranchId,
                dto.Subject,
                dto.RequestType,
                dto.Priority,
                dto.DispatchWindow,
                dto.DispatchDate,
                dto.Notes,
                createItems,
                itemCostLookup,
                now,
                batch.SupplyPushBatchId);

            await _notificationService.CreateForRolesAsync(
                ["BranchManager", "BranchOwner"],
                "Incoming Supply Shipment",
                $"HQ is preparing a supply dispatch for {branch.Name}. {createItems.Count} item(s) selected.",
                type: "Info",
                branchId: branch.BranchId,
                referenceType: "SupplyDispatch",
                referenceId: order.OrderId);
        }

        await tx.CommitAsync();
        return await GetMultiBranchSupplyPushByIdAsync(batch.SupplyPushBatchId)
            ?? throw new InvalidOperationException("Failed to load created multi-branch supply push.");
    }

    public async Task<List<MultiBranchSupplyPushDto>> ListMultiBranchSupplyPushesAsync(string? status = null)
    {
        EnsureTenantContext();

        var query = _context.SupplyPushBatches
            .Include(b => b.Orders)
            .OrderByDescending(b => b.CreatedAt)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(b => b.Orders.Any(o => o.Status == parsedStatus));
        }

        var rows = await query.ToListAsync();
        return rows.Select(MapToSupplyPushBatchDto).ToList();
    }

    public async Task<MultiBranchSupplyPushDetailDto?> GetMultiBranchSupplyPushByIdAsync(int batchId)
    {
        EnsureTenantContext();

        var batch = await _context.SupplyPushBatches
            .AsNoTracking()
            .AsSplitQuery()
            .Include(b => b.Items)
                .ThenInclude(i => i.Item)
            .Include(b => b.Orders)
                .ThenInclude(o => o.SupplyRequest)
                    .ThenInclude(r => r!.Branch)
            .Include(b => b.Orders)
                .ThenInclude(o => o.SupplyRequest)
                    .ThenInclude(r => r!.Items)
                        .ThenInclude(i => i.Item)
            .Include(b => b.Orders)
                .ThenInclude(o => o.Shipment)
            .Include(b => b.Orders)
                .ThenInclude(o => o.SupplyPushBatch)
            .FirstOrDefaultAsync(b => b.SupplyPushBatchId == batchId);

        if (batch == null)
        {
            return null;
        }

        var safeOrders = batch.Orders ?? new List<Order>();
        var safeItems = batch.Items ?? new List<SupplyPushBatchItem>();

        var detail = new MultiBranchSupplyPushDetailDto
        {
            SupplyPushBatchId = batch.SupplyPushBatchId,
            TransactionCode = batch.TransactionCode,
            Subject = batch.Subject,
            RequestType = batch.RequestType.ToString(),
            Priority = batch.Priority.ToString(),
            DispatchWindow = batch.DispatchWindow.ToString(),
            DispatchDate = batch.DispatchDate,
            Notes = batch.Notes,
            CreatedAt = batch.CreatedAt,
            UpdatedAt = batch.UpdatedAt,
            TotalBranches = safeOrders.Count,
            CompletedBranches = safeOrders.Count(o => o.Status == OrderStatus.Completed),
            CancelledBranches = safeOrders.Count(o => o.Status == OrderStatus.Cancelled),
            StatusBreakdown = safeOrders
                .GroupBy(o => o.Status)
                .OrderBy(g => g.Key.ToString())
                .Select(g => new SupplyPushBatchStatusCountDto
                {
                    Status = g.Key.ToString(),
                    Count = g.Count()
                })
                .ToList(),
            Items = safeItems
                .Select(i => new SupplyPushBatchItemDto
                {
                    ItemId = i.ItemId,
                    ItemName = i.Item?.Name ?? string.Empty,
                    ItemSku = i.Item?.SKU ?? string.Empty,
                    QuantityRequested = i.QuantityRequested,
                    UnitCostSnapshot = i.UnitCostSnapshot
                })
                .ToList(),
            BranchOrders = safeOrders
                .OrderByDescending(o => o.PushedToFulfillmentAt)
                .Select(MapToBranchOrderDto)
                .ToList()
        };

        return detail;
    }

    public async Task<OrderDetailDto?> GetOrderDetailAsync(int orderId)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return null;
        }

        var tenantId = _currentUser.TenantId.Value;

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.RequestedBy_User)
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .Include(o => o.SupplyPushBatch)
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
                    .ThenInclude(b => b!.Item)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        if (order == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && order.SupplyRequest?.BranchId != currentBranchId)
        {
            return null;
        }

        var shipment = await _context.Shipments
            .FirstOrDefaultAsync(s => s.OrderId == orderId);

        return await MapToOrderDetailDto(order, shipment);
    }

    public async Task<List<OrderStatusHistoryDto>> GetOrderHistoryAsync(int orderId)
    {
        var order = await GetOrderForAccessCheckAsync(orderId);
        if (order == null)
        {
            return [];
        }

        return await _context.OrderStatusHistories
            .Include(h => h.ChangedBy_User)
            .Where(h => h.OrderId == orderId)
            .OrderByDescending(h => h.Timestamp)
            .Select(h => new OrderStatusHistoryDto
            {
                HistoryId = h.HistoryId,
                Status = h.Status.ToString(),
                ChangedByUserId = h.ChangedBy_UserId,
                ChangedByName = h.ChangedBy_User == null
                    ? string.Empty
                    : $"{h.ChangedBy_User.FirstName} {h.ChangedBy_User.LastName}".Trim(),
                Remarks = h.Remarks,
                Timestamp = h.Timestamp
            })
            .ToListAsync();
    }

    public Task<bool> StartPickingAsync(int orderId, UpdateOrderStatusDto dto)
    {
        return TransitionOrderStatusAsync(
            orderId,
            expectedStatus: OrderStatus.Processing,
            nextStatus: OrderStatus.Picking,
            remarks: dto.Remarks,
            notificationTitle: "Order Picking Started",
            notificationType: "OrderPickingStarted");
    }

    public async Task<bool> ConfirmPackedAsync(int orderId, UpdateOrderStatusDto dto)
    {
        EnsureTenantContext();
        EnsureUserContext();

        var order = await GetOrderForWorkflowAsync(orderId);
        if (order == null)
        {
            return false;
        }

        if (order.Status != OrderStatus.Picking)
        {
            throw new InvalidOperationException($"Only Picking orders can be moved to Packed.");
        }

        var requestItems = await _context.SupplyRequestItems
            .Where(i => i.RequestId == order.RequestId && !i.IsRejectedDuringPicking)
            .ToListAsync();

        var now = DateTime.UtcNow;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            foreach (var item in requestItems)
            {
                var qtyToDeduct = item.SendQuantity ?? item.QuantityApproved ?? item.QuantityRequested;
                if (qtyToDeduct <= 0) continue;

                var deductions = await _inventoryService.DeductStockAsync(
                    item.ItemId,
                    branchId: null, // HQ stock
                    quantity: qtyToDeduct,
                    transactionType: TransactionType.OrderFulfillment,
                    remarks: $"Fulfilled order {order.OrderId}",
                    referenceType: ReferenceType.Order,
                    referenceId: order.OrderId);

                foreach (var deduction in deductions)
                {
                    _context.OrderAllocations.Add(new OrderAllocation
                    {
                        TenantId = _currentUser.TenantId.Value,
                        OrderId = order.OrderId,
                        BatchId = deduction.BatchId,
                        QuantityPicked = deduction.QuantityDeducted
                    });
                }
            }

            await RecalculateRequestTotalsAsync(order.RequestId);
            order.Status = OrderStatus.Packed;

            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                TenantId = _currentUser.TenantId.Value,
                OrderId = order.OrderId,
                Status = OrderStatus.Packed,
                ChangedBy_UserId = _currentUser.UserId.Value,
                Remarks = NormalizeOptional(dto.Remarks),
                Timestamp = now
            });

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        await NotifyBranchAsync(
            order,
            "Order Packed",
            $"Order #{order.OrderId} for {order.SupplyRequest?.Branch?.Name ?? "branch"} is now Packed.",
            "OrderPacked");

        return true;
    }

    public async Task<bool> DispatchAsync(int orderId, DispatchOrderDto dto)
    {
        EnsureTenantContext();
        EnsureUserContext();

        var order = await GetOrderForWorkflowAsync(orderId);
        if (order == null)
        {
            return false;
        }

        if (order.Status != OrderStatus.Packed)
        {
            throw new InvalidOperationException("Only packed orders can be dispatched.");
        }

        var now = DateTime.UtcNow;

        order.Status = OrderStatus.InTransit;
        await RecalculateRequestTotalsAsync(order.RequestId);

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = _currentUser.TenantId.Value,
            OrderId = order.OrderId,
            Status = OrderStatus.Dispatched,
            ChangedBy_UserId = _currentUser.UserId.Value,
            Remarks = dto.VehicleId.HasValue 
                ? $"Vehicle assigned and dispatched. {dto.Remarks}".Trim() 
                : NormalizeOptional(dto.Remarks),
            Timestamp = now
        });

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = _currentUser.TenantId.Value,
            OrderId = order.OrderId,
            Status = OrderStatus.InTransit,
            ChangedBy_UserId = _currentUser.UserId.Value,
            Remarks = "System auto-transition after dispatch.",
            Timestamp = now
        });

        var shipment = await _context.Shipments.FirstOrDefaultAsync(s => s.OrderId == order.OrderId);
        if (shipment == null)
        {
            shipment = new Shipment
            {
                TenantId = _currentUser.TenantId.Value,
                OrderId = order.OrderId
            };

            _context.Shipments.Add(shipment);
        }

        shipment.VehicleId = dto.VehicleId;
        shipment.TrackingNumber = NormalizeOptional(dto.TrackingNumber);
        shipment.DispatchDate = now;
        shipment.EstimatedArrival = dto.EstimatedArrival;

        await _context.SaveChangesAsync();

        await NotifyBranchAsync(
            order,
            "Order Dispatched",
            $"Order #{order.OrderId} for {order.SupplyRequest?.Branch?.Name ?? "branch"} has been dispatched.",
            notificationType: "OrderDispatched");

        return true;
    }

    public async Task<bool> ConfirmDeliveryAsync(int orderId, ConfirmDeliveryDto dto)
    {
        EnsureTenantContext();
        EnsureUserContext();

        var order = await GetOrderForWorkflowAsync(orderId);
        if (order == null)
        {
            return false;
        }

        if (order.Status is not (OrderStatus.Dispatched or OrderStatus.InTransit or OrderStatus.Packed))
        {
            throw new InvalidOperationException("Only dispatched orders can be confirmed as delivered.");
        }

        order.Status = OrderStatus.Delivered;

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = _currentUser.TenantId.Value,
            OrderId = order.OrderId,
            Status = OrderStatus.Delivered,
            ChangedBy_UserId = _currentUser.UserId.Value,
            Remarks = NormalizeOptional(dto.Remarks),
            Timestamp = DateTime.UtcNow
        });

        if (!dto.ReceivedInFull)
        {
            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                TenantId = _currentUser.TenantId.Value,
                OrderId = order.OrderId,
                Status = OrderStatus.DeliveredWithVariance,
                ChangedBy_UserId = _currentUser.UserId.Value,
                Remarks = "Delivery confirmed with quantity variance.",
                Timestamp = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            ["TenantAdmin", "HqManager", "HqStaff"],
            "Branch Delivery Confirmed",
            $"Order #{order.OrderId} from {order.SupplyRequest?.Branch?.Name ?? "branch"} has been confirmed as delivered.",
            type: "OrderDelivered",
            referenceType: nameof(Order),
            referenceId: order.OrderId);

        return true;
    }

    private async Task<bool> TransitionOrderStatusAsync(
        int orderId,
        OrderStatus expectedStatus,
        OrderStatus nextStatus,
        string? remarks,
        string notificationTitle,
        string notificationType)
    {
        EnsureTenantContext();
        EnsureUserContext();

        var order = await GetOrderForWorkflowAsync(orderId);
        if (order == null)
        {
            return false;
        }

        if (order.Status != expectedStatus)
        {
            throw new InvalidOperationException($"Only {expectedStatus} orders can be moved to {nextStatus}.");
        }

        order.Status = nextStatus;

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = _currentUser.TenantId.Value,
            OrderId = order.OrderId,
            Status = nextStatus,
            ChangedBy_UserId = _currentUser.UserId.Value,
            Remarks = NormalizeOptional(remarks),
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        await NotifyBranchAsync(
            order,
            notificationTitle,
            $"Order #{order.OrderId} for {order.SupplyRequest?.Branch?.Name ?? "branch"} is now {nextStatus}.",
            notificationType);

        return true;
    }

    private async Task NotifyBranchAsync(Order order, string title, string message, string notificationType)
    {
        if (order.SupplyRequest == null)
        {
            return;
        }

        await _notificationService.CreateForRolesAsync(
            ["BranchManager", "BranchOwner"],
            title,
            message,
            type: notificationType,
            branchId: order.SupplyRequest.BranchId,
            referenceType: nameof(Order),
            referenceId: order.OrderId);
    }

    private async Task<Order?> GetOrderForWorkflowAsync(int orderId)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return null;
        }

        var tenantId = _currentUser.TenantId.Value;

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .Include(o => o.SupplyPushBatch)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        if (order == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && order.SupplyRequest?.BranchId != currentBranchId)
        {
            return null;
        }

        return order;
    }

    private async Task<Order?> GetOrderForAccessCheckAsync(int orderId)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return null;
        }

        var tenantId = _currentUser.TenantId.Value;

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
            .Include(o => o.SupplyPushBatch)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        if (order == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && order.SupplyRequest?.BranchId != currentBranchId)
        {
            return null;
        }

        return order;
    }

    public async Task<List<BranchOrderDto>> ListHqDispatchesAsync(string? status = null)
    {
        if (!_currentUser.TenantId.HasValue) return [];

        var query = _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .Include(o => o.SupplyPushBatch)
            .Include(o => o.Shipment)
            .Where(o => o.IsHqInitiated);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(o => o.Status == parsedStatus);
        }

        var orders = await query.OrderByDescending(o => o.PushedToFulfillmentAt)
            .AsSplitQuery()
            .ToListAsync();

        return orders.Distinct().Select(MapToBranchOrderDto).ToList();
    }

    public async Task<List<BranchOrderDto>> ListIncomingShipmentsAsync(string? status = null)
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.BranchId.HasValue) return [];

        var branchId = _currentUser.BranchId.Value;

        var query = _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .Include(o => o.SupplyPushBatch)
            .Include(o => o.Shipment)
            .Where(o => o.IsHqInitiated && o.SupplyRequest != null && o.SupplyRequest.BranchId == branchId);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(o => o.Status == parsedStatus);
        }

        var orders = await query.OrderByDescending(o => o.PushedToFulfillmentAt).ToListAsync();
        return orders.Distinct().Select(MapToBranchOrderDto).ToList();
    }

    private static BranchOrderDto MapToBranchOrderDto(Order order)
    {
        var requestItems = order.SupplyRequest?.Items ?? [];
        var request = order.SupplyRequest;

        return new BranchOrderDto
        {
            TransactionCode = order.TransactionCode,
            OrderId = order.OrderId,
            RequestId = order.RequestId,
            Subject = request?.Subject,
            BranchId = request?.BranchId ?? 0,
            BranchName = request?.Branch?.Name ?? string.Empty,
            Status = order.Status.ToString(),
            DispatchScheduleStatus = TransactionScheduleStatus.Resolve(
                request?.DispatchDate,
                order.Shipment?.DispatchDate),
            PushedToFulfillmentAt = order.PushedToFulfillmentAt,
            ItemsCount = requestItems.Count,
            TotalRequestedValue = request?.TotalRequestedValue ?? 0,
            TotalApprovedValue = request?.TotalApprovedValue ?? 0,
            TotalFulfilledValue = request?.TotalFulfilledValue ?? 0,
            FulfillmentCost = request?.TotalFulfilledValue ?? 0,
            IsHqInitiated = order.IsHqInitiated,
            DispatchReason = order.DispatchReason,
            SupplyPushBatchId = order.SupplyPushBatchId,
            SupplyPushBatchCode = order.SupplyPushBatch?.TransactionCode
        };
    }

    private async Task<OrderDetailDto> MapToOrderDetailDto(Order order, Shipment? shipment)
    {
        var request = order.SupplyRequest;
        var requestedByName = request?.RequestedBy_User == null
            ? string.Empty
            : $"{request.RequestedBy_User.FirstName} {request.RequestedBy_User.LastName}".Trim();

        var dto = new OrderDetailDto
        {
            TransactionCode = order.TransactionCode,
            OrderId = order.OrderId,
            RequestId = order.RequestId,
            Subject = request?.Subject,
            BranchId = request?.BranchId ?? 0,
            BranchName = request?.Branch?.Name ?? string.Empty,
            Status = order.Status.ToString(),
            DispatchScheduleStatus = TransactionScheduleStatus.Resolve(
                request?.DispatchDate,
                shipment?.DispatchDate),
            PushedToFulfillmentAt = order.PushedToFulfillmentAt,
            RequestStatus = request?.Status.ToString() ?? string.Empty,
            RequestedByUserId = request?.RequestedBy_UserId ?? 0,
            RequestedByName = requestedByName,
            Notes = request?.Notes,
            TotalRequestedValue = request?.TotalRequestedValue ?? 0,
            TotalApprovedValue = request?.TotalApprovedValue ?? 0,
            TotalFulfilledValue = request?.TotalFulfilledValue ?? 0,
            FulfillmentCost = request?.TotalFulfilledValue ?? 0,
            TrackingNumber = shipment?.TrackingNumber,

            VehicleId = shipment?.VehicleId,
            DispatchDate = shipment?.DispatchDate,
            EstimatedArrival = shipment?.EstimatedArrival,

            ArrivedAt = order.ArrivedAt,
            ArrivedConfirmedByName = order.ArrivedConfirmedByUser != null 
                ? $"{order.ArrivedConfirmedByUser.FirstName} {order.ArrivedConfirmedByUser.LastName}".Trim() 
                : null,
            CompletedAt = order.CompletedAt,
            CompletedByName = order.CompletedByUser != null 
                ? $"{order.CompletedByUser.FirstName} {order.CompletedByUser.LastName}".Trim() 
                : null,
            IsHqInitiated = order.IsHqInitiated,
            DispatchReason = order.DispatchReason,
            SupplyPushBatchId = order.SupplyPushBatchId,
            SupplyPushBatchCode = order.SupplyPushBatch?.TransactionCode,
            RequestedItems = new List<OrderRequestItemDto>()
        };

        foreach (var i in (request?.Items ?? []))
        {
            var hqStock = await _inventoryService.GetStockLevelAsync(i.ItemId, null);
            var branchStock = request != null 
                ? await _inventoryService.GetStockLevelAsync(i.ItemId, request.BranchId)
                : 0;

            dto.RequestedItems.Add(new OrderRequestItemDto
            {
                RequestItemId = i.RequestItemId,
                ItemId = i.ItemId,
                ItemName = i.Item?.Name ?? string.Empty,
                ItemSku = i.Item?.SKU ?? string.Empty,
                QuantityRequested = i.QuantityRequested,
                QuantityApproved = i.QuantityApproved,
                UnitCost = ResolveUnitCost(i),
                IsPicked = i.IsPicked,
                SendQuantity = i.SendQuantity,
                IsRejectedDuringPicking = i.IsRejectedDuringPicking,
                PickingRejectionReason = i.PickingRejectionReason,
                IsPacked = i.IsPacked,
                IsBranchChecked = i.IsBranchChecked,
                HqStock = hqStock,
                BranchStock = branchStock
            });
        }

        dto.Allocations = (order.Allocations ?? [])
                .Select(a => new OrderAllocationDto
                {
                    AllocationId = a.AllocationId,
                    BatchId = a.BatchId,
                    BatchNumber = a.Batch?.BatchNumber ?? string.Empty,
                    ItemId = a.Batch?.ItemId ?? 0,
                    ItemName = a.Batch?.Item?.Name ?? string.Empty,
                    QuantityPicked = a.QuantityPicked,
                    RemainingBatchQuantity = a.Batch?.CurrentQuantity ?? 0
                }).ToList();

        return dto;
    }

    private MultiBranchSupplyPushDto MapToSupplyPushBatchDto(SupplyPushBatch batch)
    {
        var orders = batch.Orders ?? [];
        return new MultiBranchSupplyPushDto
        {
            SupplyPushBatchId = batch.SupplyPushBatchId,
            TransactionCode = batch.TransactionCode,
            Subject = batch.Subject,
            RequestType = batch.RequestType.ToString(),
            Priority = batch.Priority.ToString(),
            DispatchWindow = batch.DispatchWindow.ToString(),
            DispatchDate = batch.DispatchDate,
            Notes = batch.Notes,
            CreatedAt = batch.CreatedAt,
            UpdatedAt = batch.UpdatedAt,
            TotalBranches = orders.Count,
            CompletedBranches = orders.Count(o => o.Status == OrderStatus.Completed),
            CancelledBranches = orders.Count(o => o.Status == OrderStatus.Cancelled),
            StatusBreakdown = orders
                .GroupBy(o => o.Status)
                .OrderBy(g => g.Key.ToString())
                .Select(g => new SupplyPushBatchStatusCountDto
                {
                    Status = g.Key.ToString(),
                    Count = g.Count()
                })
                .ToList()
        };
    }

    private async Task<(SupplyRequest Request, Order Order)> CreateHqInitiatedRequestAndOrderAsync(
        int tenantId,
        int userId,
        int branchId,
        string? subject,
        string? requestType,
        string? priority,
        string? dispatchWindow,
        DateTime? dispatchDate,
        string? notes,
        IReadOnlyCollection<CreateOrderItemDto> items,
        IReadOnlyDictionary<int, decimal> itemCostLookup,
        DateTime now,
        int? supplyPushBatchId)
    {
        var request = new SupplyRequest
        {
            TenantId = tenantId,
            TransactionCode = await _sequenceService.GenerateNextCodeAsync(tenantId, "SupplyRequest", "SP"),
            BranchId = branchId,
            RequestedBy_UserId = userId,
            Status = SupplyRequestStatus.Approved,
            RequestType = Enum.TryParse<RequestType>(requestType, true, out var reqType) ? reqType : RequestType.HqInitiated,
            Priority = Enum.TryParse<Priority>(priority, true, out var parsedPriority) ? parsedPriority : Priority.Normal,
            DispatchWindow = Enum.TryParse<DispatchWindow>(dispatchWindow, true, out var parsedDispatchWindow) ? parsedDispatchWindow : DispatchWindow.Today,
            DispatchDate = dispatchDate,
            Subject = NormalizeSubject(subject),
            Notes = NormalizeOptional(notes),
            CreatedAt = now,
            UpdatedAt = now,
            Items = items.Select(i => new SupplyRequestItem
            {
                TenantId = tenantId,
                ItemId = i.ItemId,
                QuantityRequested = i.QuantityRequested,
                QuantityApproved = i.QuantityRequested,
                UnitCostSnapshot = itemCostLookup.TryGetValue(i.ItemId, out var unitCost) ? unitCost : 0
            }).ToList()
        };

        RecalculateRequestTotals(request);
        _context.SupplyRequests.Add(request);
        await _context.SaveChangesAsync();

        var order = new Order
        {
            TenantId = tenantId,
            TransactionCode = await _sequenceService.GenerateNextCodeAsync(tenantId, "Order", "ORD"),
            RequestId = request.RequestId,
            Status = OrderStatus.Processing,
            PushedToFulfillmentAt = now,
            IsHqInitiated = true,
            DispatchReason = ResolveDispatchReason(requestType),
            SupplyPushBatchId = supplyPushBatchId
        };

        _context.Orders.Add(order);
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = tenantId,
            Order = order,
            Status = OrderStatus.Processing,
            ChangedBy_UserId = userId,
            Remarks = "HQ initiated supply dispatch created.",
            Timestamp = now,
        });

        await _context.SaveChangesAsync();
        return (request, order);
    }

    private static string ResolveDispatchReason(string? requestType)
    {
        return requestType?.ToLowerInvariant() switch
        {
            "replenishment" => "Low-Stock Replenishment",
            "event" => "Event / Promo Loadout",
            "manual" or "hq_initiated" => "Manual Internal Request",
            _ => "HQ Supply Dispatch"
        };
    }

    private static string? NormalizeOptional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static string? NormalizeSubject(string? value)
    {
        var normalized = NormalizeOptional(value);
        if (normalized != null && normalized.Length > 80)
        {
            throw new InvalidOperationException("Subject cannot exceed 80 characters.");
        }

        return normalized;
    }

    private static decimal ResolveUnitCost(SupplyRequestItem item)
    {
        if (item.UnitCostSnapshot > 0)
        {
            return item.UnitCostSnapshot;
        }

        return item.Item?.UnitCost ?? 0;
    }

    private static decimal ResolveFulfilledQuantity(SupplyRequestItem item)
    {
        if (item.IsRejectedDuringPicking)
        {
            return 0;
        }

        return item.SendQuantity ?? item.QuantityApproved ?? 0;
    }

    private static void RecalculateRequestTotals(SupplyRequest request)
    {
        var items = request.Items ?? [];

        request.TotalRequestedValue = Math.Round(
            items.Sum(i => i.QuantityRequested * ResolveUnitCost(i)),
            2,
            MidpointRounding.AwayFromZero);

        request.TotalApprovedValue = Math.Round(
            items.Sum(i => Math.Max(i.QuantityApproved ?? 0, 0) * ResolveUnitCost(i)),
            2,
            MidpointRounding.AwayFromZero);

        request.TotalFulfilledValue = Math.Round(
            items.Sum(i => ResolveFulfilledQuantity(i) * ResolveUnitCost(i)),
            2,
            MidpointRounding.AwayFromZero);
    }

    private async Task RecalculateRequestTotalsAsync(int requestId)
    {
        var tenantId = EnsureTenantContext();

        var request = await _context.SupplyRequests
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(r => r.RequestId == requestId && r.TenantId == tenantId);

        if (request == null)
        {
            return;
        }

        RecalculateRequestTotals(request);
    }



    // ── SR WORKFLOW METHODS ──

    public async Task<List<PickingSuggestionDto>> GetPickingSuggestionsAsync(int orderId)
    {
        var tenantId = EnsureTenantContext();

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        if (order?.SupplyRequest == null) return [];
        if (IsBranchScopedUser() && order.SupplyRequest.BranchId != (_currentUser.BranchId ?? 0))
        {
            return [];
        }

        var branchId = order.SupplyRequest.BranchId;
        var suggestions = new List<PickingSuggestionDto>();

        foreach (var reqItem in order.SupplyRequest.Items)
        {
            var hqStock = await _inventoryService.GetStockLevelAsync(reqItem.ItemId, null);
            var branchStock = await _inventoryService.GetStockLevelAsync(reqItem.ItemId, branchId);
            var threshold = reqItem.Item?.DefaultThreshold ?? 0;
            var approvedQty = reqItem.QuantityApproved ?? reqItem.QuantityRequested;

            var branchDeficit = Math.Max(0, threshold - branchStock);
            var suggestedQty = Math.Min(branchDeficit, Math.Min(hqStock, approvedQty));

            suggestions.Add(new PickingSuggestionDto
            {
                RequestItemId = reqItem.RequestItemId,
                ItemId = reqItem.ItemId,
                ItemName = reqItem.Item?.Name ?? string.Empty,
                ItemSku = reqItem.Item?.SKU ?? string.Empty,
                ApprovedQty = approvedQty,
                HqStock = hqStock,
                BranchCurrentStock = branchStock,
                BranchThreshold = threshold,
                SuggestedSendQty = suggestedQty
            });
        }

        return suggestions;
    }

    public async Task<OrderDetailDto?> SavePickingAsync(int orderId, PickingSubmitDto dto)
    {
        var tenantId = EnsureTenantContext();

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        if (order?.SupplyRequest == null) return null;

        var now = DateTime.UtcNow;

        // ── Threshold / Stock Validation ──
        // Ensure no item's send quantity exceeds available HQ stock.
        // This is the authoritative server-side check (frontend also warns).
        var stockErrors = new List<string>();
        foreach (var item in dto.Items.Where(i => i.IsPicked && !i.IsRejected))
        {
            var reqItem = order.SupplyRequest.Items.FirstOrDefault(i => i.RequestItemId == item.RequestItemId);
            if (reqItem == null) continue;

            var sendQty = item.SendQuantity ?? reqItem.QuantityApproved ?? reqItem.QuantityRequested;
            var hqStock = await _inventoryService.GetStockLevelAsync(reqItem.ItemId, branchId: null);

            if (sendQty > hqStock)
            {
                stockErrors.Add(
                    $"'{reqItem.Item?.Name ?? $"Item {reqItem.ItemId}"}': send qty {sendQty} exceeds HQ stock {hqStock}");
            }
        }

        if (stockErrors.Count > 0)
        {
            throw new InvalidOperationException(
                $"Cannot confirm picking — insufficient HQ stock: {string.Join("; ", stockErrors)}.");
        }

        foreach (var item in dto.Items)
        {
            var reqItem = order.SupplyRequest.Items.FirstOrDefault(i => i.RequestItemId == item.RequestItemId);
            if (reqItem != null)
            {
                reqItem.IsPicked = item.IsPicked;
                reqItem.SendQuantity = item.SendQuantity;
                reqItem.IsRejectedDuringPicking = item.IsRejected;
                reqItem.PickingRejectionReason = item.RejectionReason;
            }
        }

        RecalculateRequestTotals(order.SupplyRequest);
        order.Status = OrderStatus.Packing;
        
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = order.TenantId,
            OrderId = order.OrderId,
            Status = OrderStatus.Packing,
            ChangedBy_UserId = _currentUser.UserId,
            Timestamp = now,
            Remarks = "Picking confirmed. Moved to packing checklist."
        });

        await _context.SaveChangesAsync();
        return await GetOrderDetailAsync(orderId);
    }

    public async Task<OrderDetailDto?> SavePackingAsync(int orderId, PackingSubmitDto dto)
    {
        var tenantId = EnsureTenantContext();

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        if (order?.SupplyRequest == null) return null;

        var now = DateTime.UtcNow;

        int updatedCount = 0;
        foreach (var item in dto.Items)
        {
            var reqItem = order.SupplyRequest.Items.FirstOrDefault(i => i.RequestItemId == item.RequestItemId);
            if (reqItem != null && !reqItem.IsRejectedDuringPicking)
            {
                reqItem.IsPacked = item.IsPacked;
                updatedCount++;
            }
        }
        _logger.LogInformation("SavePacking: Updated {Count} items out of {Total} in payload for Order {OrderId}", 
            updatedCount, dto.Items.Count, orderId);
        var allPacked = order.SupplyRequest.Items
            .Where(i => !i.IsRejectedDuringPicking)
            .All(i => i.IsPacked);

        var nextStatus = allPacked ? OrderStatus.Packed : OrderStatus.Packing;
        order.Status = nextStatus;

        // When all items are packed, validate stock THEN deduct HQ inventory
        if (allPacked)
        {
            var packedItems = order.SupplyRequest.Items
                .Where(i => !i.IsRejectedDuringPicking)
                .ToList();

            // ── Pre-deduction stock validation ──
            // Check every item has enough HQ stock before committing any deduction.
            var stockErrors = new List<string>();
            foreach (var item in packedItems)
            {
                var qtyToDeduct = item.SendQuantity ?? item.QuantityApproved ?? item.QuantityRequested;
                if (qtyToDeduct <= 0) continue;

                var hqStock = await _inventoryService.GetStockLevelAsync(item.ItemId, branchId: null);
                if (qtyToDeduct > hqStock)
                {
                    stockErrors.Add(
                        $"'{item.Item?.Name ?? $"Item {item.ItemId}"}': need {qtyToDeduct}, only {hqStock} available in HQ");
                }
            }

            if (stockErrors.Count > 0)
            {
                throw new InvalidOperationException(
                    $"Cannot pack — insufficient HQ stock for: {string.Join("; ", stockErrors)}. " +
                    "Please go back to picking and reduce the send quantities.");
            }

            // All good — now actually deduct
            foreach (var item in packedItems)
            {
                var qtyToDeduct = item.SendQuantity ?? item.QuantityApproved ?? item.QuantityRequested;
                if (qtyToDeduct <= 0) continue;

                var deductions = await _inventoryService.DeductStockAsync(
                    item.ItemId,
                    branchId: null,
                    quantity: qtyToDeduct,
                    transactionType: TransactionType.OrderFulfillment,
                    remarks: $"Packed for order {order.OrderId}",
                    referenceType: ReferenceType.Order,
                    referenceId: order.OrderId);

                foreach (var deduction in deductions)
                {
                    _context.OrderAllocations.Add(new OrderAllocation
                    {
                        TenantId = order.TenantId,
                        OrderId = order.OrderId,
                        BatchId = deduction.BatchId,
                        QuantityPicked = deduction.QuantityDeducted
                    });
                }
            }
        }

        RecalculateRequestTotals(order.SupplyRequest);
        
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = order.TenantId,
            OrderId = order.OrderId,
            Status = nextStatus,
            ChangedBy_UserId = _currentUser.UserId,
            Timestamp = now,
            Remarks = allPacked ? "All items packed. Ready for dispatch." : "Packing in progress."
        });

        await _context.SaveChangesAsync();
        return await GetOrderDetailAsync(orderId);
    }

    public async Task<OrderDetailDto?> SubmitDispatchAsync(int orderId, DispatchOrderDto dto)
    {
        var tenantId = EnsureTenantContext();

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        _logger.LogInformation("Dispatching Order {OrderId}. Payload: Vehicle={VehicleId}, Tracking={Tracking}, Arrival={Arrival}", 
            orderId, dto.VehicleId, dto.TrackingNumber, dto.EstimatedArrival);

        if (order?.SupplyRequest == null) 
        {
            _logger.LogWarning("Dispatch failed: Order {OrderId} or SupplyRequest is null.", orderId);
            return null;
        }

        var now = DateTime.UtcNow;

        var unpackedItems = order.SupplyRequest.Items
            .Where(i => !i.IsRejectedDuringPicking && !i.IsPacked)
            .ToList();

        _logger.LogInformation("SubmitDispatch: Order {OrderId} has {UnpackedCount} unpacked items.", orderId, unpackedItems.Count);

        if (unpackedItems.Any())
        {
            if (order.Status == OrderStatus.Packed)
            {
                _logger.LogWarning("Order {OrderId} is in Packed status but has {Count} unpacked items. Auto-packing them now.", orderId, unpackedItems.Count);
                foreach (var item in unpackedItems)
                {
                    item.IsPacked = true;
                }
            }
            else
            {
                var itemDetails = string.Join(", ", unpackedItems.Select(i => $"ItemID:{i.ItemId}"));
                _logger.LogWarning("Dispatch failed for Order {OrderId}: Items not packed: {Items}", orderId, itemDetails);
                throw new InvalidOperationException($"Cannot dispatch until all items are packed. Unpacked: {itemDetails}");
            }
        }

        _logger.LogInformation("Order {OrderId} validation successful. Moving to Dispatched status.", orderId);

        order.Status = OrderStatus.Dispatched;

        // Sync SupplyRequest status so HQ/Branch see the dispatch
        if (order.SupplyRequest != null)
        {
            order.SupplyRequest.Status = SupplyRequestStatus.InFulfillment;
            order.SupplyRequest.UpdatedAt = now;
            RecalculateRequestTotals(order.SupplyRequest);
        }
        
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = order.TenantId,
            OrderId = order.OrderId,
            Status = OrderStatus.Dispatched,
            ChangedBy_UserId = _currentUser.UserId,
            Timestamp = now,
            Remarks = dto.VehicleId.HasValue 
                ? $"Vehicle assigned and dispatched. {dto.Remarks}".Trim() 
                : NormalizeOptional(dto.Remarks) ?? "Order dispatched."
        });

        // Also add InTransit history since it moves directly
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = order.TenantId,
            OrderId = order.OrderId,
            Status = OrderStatus.InTransit,
            ChangedBy_UserId = _currentUser.UserId,
            Remarks = "System auto-transition after dispatch.",
            Timestamp = now
        });

        // Update/Create Shipment
        var shipment = await _context.Shipments.FirstOrDefaultAsync(s => s.OrderId == order.OrderId);
        if (shipment == null)
        {
            shipment = new Shipment
            {
                TenantId = order.TenantId,
                OrderId = order.OrderId
            };
            _context.Shipments.Add(shipment);
        }

        shipment.VehicleId = dto.VehicleId;
        shipment.TrackingNumber = NormalizeOptional(dto.TrackingNumber);
        shipment.DispatchDate = now;
        shipment.EstimatedArrival = dto.EstimatedArrival;

        await _context.SaveChangesAsync();
        return await GetOrderDetailAsync(orderId);
    }

    public async Task<OrderDetailDto?> ConfirmArrivalAsync(int orderId)
    {
        var tenantId = EnsureTenantContext();

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        if (order == null) return null;
        if (IsBranchScopedUser() && order.SupplyRequest?.BranchId != (_currentUser.BranchId ?? 0))
        {
            return null;
        }

        var now = DateTime.UtcNow;

        order.Status = OrderStatus.Arrived;
        order.ArrivedAt = now;
        order.ArrivedConfirmedByUserId = _currentUser.UserId;

        // Sync SupplyRequest status so HQ sees the update
        if (order.SupplyRequest != null)
        {
            order.SupplyRequest.Status = SupplyRequestStatus.Arrived;
            order.SupplyRequest.UpdatedAt = now;
        }
        await RecalculateRequestTotalsAsync(order.RequestId);
        
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = order.TenantId,
            OrderId = order.OrderId,
            Status = OrderStatus.Arrived,
            ChangedBy_UserId = _currentUser.UserId,
            Timestamp = now,
            Remarks = "Package arrived."
        });

        await _context.SaveChangesAsync();
        return await GetOrderDetailAsync(orderId);
    }

    public async Task<OrderDetailDto?> CompleteTransactionAsync(int orderId, BranchCheckSubmitDto dto)
    {
        var tenantId = EnsureTenantContext();

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        if (order?.SupplyRequest == null) return null;
        if (IsBranchScopedUser() && order.SupplyRequest.BranchId != (_currentUser.BranchId ?? 0))
        {
            return null;
        }

        if (order.Status == OrderStatus.Completed)
        {
            throw new InvalidOperationException("Order is already completed.");
        }

        var now = DateTime.UtcNow;

        foreach (var item in dto.Items)
        {
            var reqItem = order.SupplyRequest.Items.FirstOrDefault(i => i.RequestItemId == item.RequestItemId);
            if (reqItem != null && !reqItem.IsRejectedDuringPicking)
            {
                reqItem.IsBranchChecked = item.IsChecked;
            }
        }

        var allocations = await _context.OrderAllocations
            .Include(a => a.Batch)
            .Where(a => a.OrderId == orderId)
            .ToListAsync();

        var allocationsByItem = allocations
            .Where(a => a.Batch != null)
            .GroupBy(a => a.Batch!.ItemId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var orderTenantId = order.TenantId;
        var userId = _currentUser.UserId!.Value;
        var branchId = order.SupplyRequest.BranchId;

        foreach (var reqItem in order.SupplyRequest.Items.Where(i => !i.IsRejectedDuringPicking))
        {
            if (allocationsByItem.TryGetValue(reqItem.ItemId, out var itemAllocations))
            {
                foreach (var alloc in itemAllocations)
                {
                    var sourceBatch = alloc.Batch!;
                    
                    var targetBatch = await _context.Batches
                        .FirstOrDefaultAsync(b =>
                            b.ItemId == sourceBatch.ItemId &&
                            b.BranchId == branchId &&
                            b.BatchNumber == sourceBatch.BatchNumber &&
                            b.ExpiryDate == sourceBatch.ExpiryDate);

                    if (targetBatch == null)
                    {
                        targetBatch = new Batch
                        {
                            TenantId = orderTenantId,
                            ItemId = sourceBatch.ItemId,
                            BranchId = branchId,
                            BatchNumber = sourceBatch.BatchNumber,
                            ExpiryDate = sourceBatch.ExpiryDate,
                            CurrentQuantity = 0,
                            CreatedAt = now
                        };
                        _context.Batches.Add(targetBatch);
                    }

                    targetBatch.CurrentQuantity += alloc.QuantityPicked;

                    _context.InventoryTransactions.Add(new InventoryTransaction
                    {
                        TenantId = orderTenantId,
                        Batch = targetBatch,
                        UserId = userId,
                        QuantityChange = alloc.QuantityPicked,
                        TransactionType = TransactionType.StockIn,
                        ReferenceType = ReferenceType.Order,
                        ReferenceId = order.OrderId,
                        Remarks = $"Received from HQ order #{order.OrderId}.",
                        Timestamp = now
                    });

                    if (!reqItem.IsBranchChecked)
                    {
                        targetBatch.CurrentQuantity -= alloc.QuantityPicked;

                        _context.InventoryTransactions.Add(new InventoryTransaction
                        {
                            TenantId = tenantId,
                            Batch = targetBatch,
                            UserId = userId,
                            QuantityChange = -alloc.QuantityPicked,
                            TransactionType = TransactionType.Adjustment,
                            ReferenceType = ReferenceType.Order,
                            ReferenceId = order.OrderId,
                            Remarks = "Item not checked upon arrival, marked as lost in transit.",
                            Timestamp = now
                        });
                    }
                }
            }
        }

        order.Status = OrderStatus.Completed;
        order.CompletedAt = now;
        order.CompletedByUserId = _currentUser.UserId;

        order.SupplyRequest.Status = SupplyRequestStatus.Fulfilled;
        order.SupplyRequest.UpdatedAt = now;
        RecalculateRequestTotals(order.SupplyRequest);
        
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = order.TenantId,
            OrderId = order.OrderId,
            Status = OrderStatus.Completed,
            ChangedBy_UserId = _currentUser.UserId,
            Timestamp = now,
            Remarks = "Transaction completed."
        });

        await _context.SaveChangesAsync();
        return await GetOrderDetailAsync(orderId);
    }

    public async Task<OrderDetailDto?> CancelOrderAsync(int orderId, CancelOrderDto dto)
    {
        var tenantId = EnsureTenantContext();

        if (!IsHqRole())
            throw new UnauthorizedAccessException("Only HQ users can cancel orders.");

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);

        if (order == null) return null;

        var cancellableStatuses = new[] { OrderStatus.Processing, OrderStatus.Picking, OrderStatus.Packing, OrderStatus.Packed };
        if (!cancellableStatuses.Contains(order.Status))
        {
            throw new InvalidOperationException($"Order cannot be cancelled in {order.Status} status.");
        }

        var now = DateTime.UtcNow;

        // Revert inventory allocations
        if (order.Allocations.Any())
        {
            var userId = _currentUser.UserId!.Value;

            foreach (var alloc in order.Allocations)
            {
                if (alloc.Batch != null)
                {
                    alloc.Batch.CurrentQuantity += alloc.QuantityPicked;

                    _context.InventoryTransactions.Add(new InventoryTransaction
                    {
                        TenantId = tenantId,
                        Batch = alloc.Batch,
                        UserId = userId,
                        QuantityChange = alloc.QuantityPicked,
                        TransactionType = TransactionType.Adjustment,
                        ReferenceType = ReferenceType.Order,
                        ReferenceId = order.OrderId,
                        Remarks = $"Order #{order.OrderId} cancelled. Restoring stock.",
                        Timestamp = now
                    });
                }
            }
        }

        order.Status = OrderStatus.Cancelled;
        
        if (order.SupplyRequest != null)
        {
            order.SupplyRequest.Status = SupplyRequestStatus.Cancelled;
            order.SupplyRequest.UpdatedAt = now;
            var reasonSuffix = string.IsNullOrWhiteSpace(dto.Reason) ? "" : $"\nReason: {dto.Reason}";
            order.SupplyRequest.Notes = (order.SupplyRequest.Notes + $"\nCancelled by HQ.{reasonSuffix}").Trim();
        }

        await RecalculateRequestTotalsAsync(order.RequestId);

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = order.TenantId,
            OrderId = order.OrderId,
            Status = OrderStatus.Cancelled,
            ChangedBy_UserId = _currentUser.UserId,
            Remarks = string.IsNullOrWhiteSpace(dto.Reason) ? "Order cancelled by HQ." : $"Cancelled: {dto.Reason}",
            Timestamp = now
        });

        await _context.SaveChangesAsync();
        return await GetOrderDetailAsync(orderId);
    }

    public async Task<List<OrderMessageDto>> GetMessagesAsync(int orderId)
    {
        var order = await GetOrderForAccessCheckAsync(orderId);
        if (order == null)
        {
            return [];
        }

        var messages = await _context.OrderMessages
            .Include(m => m.SenderUser)
            .Where(m => m.OrderId == orderId)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return messages.Select(m => new OrderMessageDto
        {
            MessageId = m.MessageId,
            OrderId = m.OrderId,
            SenderUserId = m.SenderUserId,
            SenderName = m.SenderUser != null ? $"{m.SenderUser.FirstName} {m.SenderUser.LastName}".Trim() : string.Empty,
            SenderRole = m.SenderUser?.Role.ToString() ?? string.Empty,
            Content = m.Content,
            SentAt = m.SentAt
        }).ToList();
    }

    public async Task<OrderMessageDto?> SendMessageAsync(int orderId, SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
            throw new InvalidOperationException("Message content cannot be empty.");

        var order = await GetOrderForAccessCheckAsync(orderId);
        if (order == null) return null;

        var message = new OrderMessage
        {
            TenantId = order.TenantId,
            OrderId = orderId,
            SenderUserId = _currentUser.UserId!.Value,
            Content = dto.Content.Trim(),
            SentAt = DateTime.UtcNow
        };

        _context.OrderMessages.Add(message);
        await _context.SaveChangesAsync();

        var sentMessage = await _context.OrderMessages
            .Include(m => m.SenderUser)
            .FirstOrDefaultAsync(m => m.MessageId == message.MessageId);

        return new OrderMessageDto
        {
            MessageId = sentMessage!.MessageId,
            OrderId = sentMessage.OrderId,
            SenderUserId = sentMessage.SenderUserId,
            SenderName = sentMessage.SenderUser != null ? $"{sentMessage.SenderUser.FirstName} {sentMessage.SenderUser.LastName}".Trim() : string.Empty,
            SenderRole = sentMessage.SenderUser?.Role.ToString() ?? string.Empty,
            Content = sentMessage.Content,
            SentAt = sentMessage.SentAt
        };
    }

    private async Task<Dictionary<int, (decimal UnitCost, string Name)>> ValidateCreateOrderItemsAsync(IEnumerable<CreateOrderItemDto> items, int tenantId)
    {
        if (items == null)
        {
            throw new InvalidOperationException("At least one item is required.");
        }

        var rows = items.ToList();
        if (rows.Count == 0)
        {
            throw new InvalidOperationException("At least one item is required.");
        }

        if (rows.Any(i => i.QuantityRequested <= 0))
        {
            throw new InvalidOperationException("Requested quantities must be greater than zero.");
        }

        var itemIds = rows.Select(i => i.ItemId).ToList();
        if (itemIds.Distinct().Count() != itemIds.Count)
        {
            throw new InvalidOperationException("Duplicate item lines are not allowed.");
        }

        var validItems = await _context.Items
            .Where(i => i.TenantId == tenantId && itemIds.Contains(i.ItemId))
            .Select(i => new { i.ItemId, i.UnitCost, i.Name })
            .ToListAsync();

        if (validItems.Count != itemIds.Count)
        {
            throw new InvalidOperationException("One or more requested items are invalid.");
        }

        return validItems.ToDictionary(i => i.ItemId, i => (i.UnitCost, i.Name));
    }

    private int EnsureTenantContext()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant context is required.");
        }

        return _currentUser.TenantId.Value;
    }

    private int EnsureUserContext()
    {
        if (!_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated user context is required.");
        }

        return _currentUser.UserId.Value;
    }

    private bool IsBranchScopedUser()
    {
        return _currentUser.BranchId.HasValue && !IsHqRole();
    }

    private bool IsHqRole()
    {
        return _currentUser.Role is "TenantAdmin" or "HqManager" or "HqStaff";
    }
}
