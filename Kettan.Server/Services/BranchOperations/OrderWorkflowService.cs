using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Orders;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Inventory;

namespace Kettan.Server.Services.BranchOperations;

public class OrderWorkflowService : IOrderWorkflowService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IInventoryService _inventoryService;

    public OrderWorkflowService(
        ApplicationDbContext context,
        ICurrentUserService currentUser,
        INotificationService notificationService,
        IInventoryService inventoryService)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _inventoryService = inventoryService;
    }

    public async Task<List<BranchOrderDto>> ListBranchOrdersAsync(string? status = null, int? branchId = null)
    {
        var query = _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Items)
                    .ThenInclude(i => i.Item)
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
            query = query.Where(o => o.Status == status);
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
            Status = SupplyRequestStatuses.Approved,
            RequestType = NormalizeOptional(dto.RequestType) ?? "hq_initiated",
            Priority = NormalizeOptional(dto.Priority) ?? "normal",
            DispatchWindow = NormalizeOptional(dto.DispatchWindow) ?? "today",
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
            Status = OrderStatuses.Processing,
            PushedToFulfillmentAt = now,
        };

        _context.Orders.Add(order);
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = tenantId,
            Order = order,
            Status = OrderStatuses.Processing,
            ChangedBy_UserId = userId,
            Remarks = "HQ initiated order created and moved to processing.",
            Timestamp = now,
        });

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        var created = await GetOrderDetailAsync(order.OrderId);
        if (created == null)
        {
            throw new InvalidOperationException("Unable to load created order.");
        }

        return created;
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

        return MapToOrderDetailDto(order, shipment);
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
                Status = h.Status,
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
            expectedStatus: OrderStatuses.Processing,
            nextStatus: OrderStatuses.Picking,
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

        if (order.Status != OrderStatuses.Picking)
        {
            throw new InvalidOperationException($"Only Picking orders can be moved to Packed.");
        }

        var requestItems = await _context.SupplyRequestItems
            .Where(i => i.RequestId == order.RequestId && (i.QuantityApproved ?? 0) > 0)
            .ToListAsync();

        var now = DateTime.UtcNow;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            foreach (var item in requestItems)
            {
                var qtyToDeduct = item.QuantityApproved!.Value;
                var deductions = await _inventoryService.DeductFifoAsync(
                    item.ItemId,
                    branchId: null, // HQ stock
                    quantity: qtyToDeduct,
                    transactionType: "Order_Fulfillment",
                    remarks: $"Fulfilled order {order.OrderId}",
                    referenceType: "Order",
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

            order.Status = OrderStatuses.Packed;

            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                TenantId = _currentUser.TenantId.Value,
                OrderId = order.OrderId,
                Status = OrderStatuses.Packed,
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

        if (order.Status != OrderStatuses.Packed)
        {
            throw new InvalidOperationException("Only packed orders can be dispatched.");
        }

        var now = DateTime.UtcNow;

        order.Status = OrderStatuses.InTransit;

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = _currentUser.TenantId.Value,
            OrderId = order.OrderId,
            Status = OrderStatuses.Dispatched,
            ChangedBy_UserId = _currentUser.UserId.Value,
            Remarks = NormalizeOptional(dto.Remarks),
            Timestamp = now
        });

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = _currentUser.TenantId.Value,
            OrderId = order.OrderId,
            Status = OrderStatuses.InTransit,
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

        if (order.Status is not (OrderStatuses.Dispatched or OrderStatuses.InTransit or OrderStatuses.Packed))
        {
            throw new InvalidOperationException("Only dispatched orders can be confirmed as delivered.");
        }

        order.Status = OrderStatuses.Delivered;

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = _currentUser.TenantId.Value,
            OrderId = order.OrderId,
            Status = OrderStatuses.Delivered,
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
                Status = OrderStatuses.DeliveredWithVariance,
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
        string expectedStatus,
        string nextStatus,
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
            Status = order.Status,
            PushedToFulfillmentAt = order.PushedToFulfillmentAt,
            ItemsCount = requestItems.Count,
            FulfillmentCost = requestItems.Sum(i => (i.QuantityApproved ?? i.QuantityRequested) * (i.Item?.UnitCost ?? 0))
        };
    }

    private static OrderDetailDto MapToOrderDetailDto(Order order, Shipment? shipment)
    {
        var requestedByName = order.SupplyRequest?.RequestedBy_User == null
            ? string.Empty
            : $"{order.SupplyRequest.RequestedBy_User.FirstName} {order.SupplyRequest.RequestedBy_User.LastName}".Trim();

        return new OrderDetailDto
        {
            OrderId = order.OrderId,
            RequestId = order.RequestId,
            BranchId = order.SupplyRequest?.BranchId ?? 0,
            BranchName = order.SupplyRequest?.Branch?.Name ?? string.Empty,
            Status = order.Status,
            PushedToFulfillmentAt = order.PushedToFulfillmentAt,
            RequestStatus = order.SupplyRequest?.Status ?? string.Empty,
            RequestedByUserId = order.SupplyRequest?.RequestedBy_UserId ?? 0,
            RequestedByName = requestedByName,
            Notes = order.SupplyRequest?.Notes,
            TrackingNumber = shipment?.TrackingNumber,

            VehicleId = shipment?.VehicleId,
            DispatchDate = shipment?.DispatchDate,
            EstimatedArrival = shipment?.EstimatedArrival,
            RequestedItems = (order.SupplyRequest?.Items ?? [])
                .Select(i => new OrderRequestItemDto
                {
                    ItemId = i.ItemId,
                    ItemName = i.Item?.Name ?? string.Empty,
                    ItemSku = i.Item?.SKU ?? string.Empty,
                    QuantityRequested = i.QuantityRequested,
                    QuantityApproved = i.QuantityApproved,
                    UnitCost = i.Item?.UnitCost ?? 0,
                })
                .ToList(),
            Allocations = order.Allocations.Select(a => new OrderAllocationDto
            {
                AllocationId = a.AllocationId,
                BatchId = a.BatchId,
                BatchNumber = a.Batch?.BatchNumber ?? string.Empty,
                ItemId = a.Batch?.ItemId ?? 0,
                ItemName = a.Batch?.Item?.Name ?? string.Empty,
                QuantityPicked = a.QuantityPicked,
                RemainingBatchQuantity = a.Batch?.CurrentQuantity ?? 0
            }).ToList()
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
