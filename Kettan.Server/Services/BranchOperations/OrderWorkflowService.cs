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

    public OrderWorkflowService(
        ApplicationDbContext context,
        ICurrentUserService currentUser,
        INotificationService notificationService,
        IInventoryService inventoryService,
        ILogger<OrderWorkflowService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _inventoryService = inventoryService;
        _logger = logger;
    }

    public async Task<List<BranchOrderDto>> ListBranchOrdersAsync(string? status = null, int? branchId = null)
    {
        var query = _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .Include(o => o.ArrivedConfirmedByUser)
            .Include(o => o.CompletedByUser)
            .AsQueryable();

        if (branchId.HasValue)
        {
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
            .ToListAsync();

        return orders.Select(MapToBranchOrderDto).ToList();
    }

    public async Task<OrderDetailDto> CreateHqOrderAsync(CreateOrderDto dto)
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

        await ValidateCreateOrderItemsAsync(dto.Items);

        var branchExists = await _context.Branches.AnyAsync(b => b.BranchId == dto.BranchId && b.IsActive);
        if (!branchExists)
        {
            throw new InvalidOperationException("Target branch was not found.");
        }

        var now = DateTime.UtcNow;
        var tenantId = _currentUser.TenantId.Value;
        var userId = _currentUser.UserId.Value;

        await using var tx = await _context.Database.BeginTransactionAsync();

        var request = new SupplyRequest
        {
            TenantId = tenantId,
            BranchId = dto.BranchId,
            RequestedBy_UserId = userId,
            Status = SupplyRequestStatus.Approved,
            RequestType = Enum.TryParse<RequestType>(dto.RequestType, true, out var reqType) ? reqType : RequestType.HqInitiated,
            Priority = Enum.TryParse<Priority>(dto.Priority, true, out var priority) ? priority : Priority.Normal,
            DispatchWindow = Enum.TryParse<DispatchWindow>(dto.DispatchWindow, true, out var dispatchWindow) ? dispatchWindow : DispatchWindow.Today,
            DispatchDate = dto.DispatchDate,
            Notes = NormalizeOptional(dto.Notes),
            CreatedAt = now,
            UpdatedAt = now,
            Items = dto.Items.Select(i => new SupplyRequestItem
            {
                TenantId = tenantId,
                ItemId = i.ItemId,
                QuantityRequested = i.QuantityRequested,
                QuantityApproved = i.QuantityRequested,
            }).ToList(),
        };

        _context.SupplyRequests.Add(request);
        await _context.SaveChangesAsync();

        var order = new Order
        {
            TenantId = tenantId,
            RequestId = request.RequestId,
            Status = OrderStatus.Processing,
            PushedToFulfillmentAt = now,
        };

        _context.Orders.Add(order);
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = tenantId,
            Order = order,
            Status = OrderStatus.Processing,
            ChangedBy_UserId = userId,
            Remarks = "HQ initiated order created and moved to processing.",
            Timestamp = now,
        });

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return await MapToOrderDetailDto(order, null);
    }

    public async Task<OrderDetailDto?> GetOrderDetailAsync(int orderId)
    {
        var order = await _context.Orders
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
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

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
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

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

                var deductions = await _inventoryService.DeductFifoAsync(
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
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

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
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

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
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

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
        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

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
        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

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

    private static BranchOrderDto MapToBranchOrderDto(Order order)
    {
        var requestItems = order.SupplyRequest?.Items ?? [];

        return new BranchOrderDto
        {
            OrderId = order.OrderId,
            RequestId = order.RequestId,
            BranchId = order.SupplyRequest?.BranchId ?? 0,
            BranchName = order.SupplyRequest?.Branch?.Name ?? string.Empty,
            Status = order.Status.ToString(),
            PushedToFulfillmentAt = order.PushedToFulfillmentAt,
            ItemsCount = requestItems.Count,
            FulfillmentCost = requestItems.Sum(i => (i.QuantityApproved ?? i.QuantityRequested) * (i.Item?.UnitCost ?? 0))
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
            OrderId = order.OrderId,
            RequestId = order.RequestId,
            BranchId = request?.BranchId ?? 0,
            BranchName = request?.Branch?.Name ?? string.Empty,
            Status = order.Status.ToString(),
            PushedToFulfillmentAt = order.PushedToFulfillmentAt,
            RequestStatus = request?.Status.ToString() ?? string.Empty,
            RequestedByUserId = request?.RequestedBy_UserId ?? 0,
            RequestedByName = requestedByName,
            Notes = request?.Notes,
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
            RequestedItems = new List<OrderRequestItemDto>()
        };

        foreach (var i in (request?.Items ?? []))
        {
            var hqStock = await _inventoryService.GetStockLevelAsync(i.ItemId, null);
            dto.RequestedItems.Add(new OrderRequestItemDto
            {
                RequestItemId = i.RequestItemId,
                ItemId = i.ItemId,
                ItemName = i.Item?.Name ?? string.Empty,
                ItemSku = i.Item?.SKU ?? string.Empty,
                QuantityRequested = i.QuantityRequested,
                QuantityApproved = i.QuantityApproved,
                UnitCost = i.Item?.UnitCost ?? 0,
                IsPicked = i.IsPicked,
                SendQuantity = i.SendQuantity,
                IsRejectedDuringPicking = i.IsRejectedDuringPicking,
                PickingRejectionReason = i.PickingRejectionReason,
                IsPacked = i.IsPacked,
                IsBranchChecked = i.IsBranchChecked,
                HqStock = hqStock
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

    private static string? NormalizeOptional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }



    // ── SR WORKFLOW METHODS ──

    public async Task<List<PickingSuggestionDto>> GetPickingSuggestionsAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order?.SupplyRequest == null) return [];

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
        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

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
        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

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

                var deductions = await _inventoryService.DeductFifoAsync(
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
        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

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
        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null) return null;

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
        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order?.SupplyRequest == null) return null;

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

        var tenantId = order.TenantId;
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
                            TenantId = tenantId,
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
                        TenantId = tenantId,
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
        if (!IsHqRole())
            throw new UnauthorizedAccessException("Only HQ users can cancel orders.");

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
            .Include(o => o.Allocations)
                .ThenInclude(a => a.Batch)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

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
            var tenantId = order.TenantId;
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

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == orderId);
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

    private async Task ValidateCreateOrderItemsAsync(IEnumerable<CreateOrderItemDto> items)
    {
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

        var validIds = await _context.Items
            .Where(i => itemIds.Contains(i.ItemId))
            .Select(i => i.ItemId)
            .ToListAsync();

        if (validIds.Count != itemIds.Count)
        {
            throw new InvalidOperationException("One or more requested items are invalid.");
        }
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