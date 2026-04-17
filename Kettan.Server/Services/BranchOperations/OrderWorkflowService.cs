using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Orders;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Services.BranchOperations;

public class OrderWorkflowService : IOrderWorkflowService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;

    public OrderWorkflowService(
        ApplicationDbContext context,
        ICurrentUserService currentUser,
        INotificationService notificationService)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
    }

    public async Task<List<BranchOrderDto>> ListBranchOrdersAsync(string? status = null)
    {
        var query = _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .AsQueryable();

        if (_currentUser.BranchId.HasValue)
        {
            query = query.Where(o => o.SupplyRequest != null && o.SupplyRequest.BranchId == _currentUser.BranchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(o => o.Status == status);
        }

        var orders = await query
            .OrderByDescending(o => o.PushedToFulfillmentAt)
            .ToListAsync();

        return orders.Select(o => new BranchOrderDto
        {
            OrderId = o.OrderId,
            RequestId = o.RequestId,
            BranchId = o.SupplyRequest?.BranchId ?? 0,
            BranchName = o.SupplyRequest?.Branch?.Name ?? string.Empty,
            Status = o.Status,
            PushedToFulfillmentAt = o.PushedToFulfillmentAt
        }).ToList();
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

    public async Task<bool> ConfirmDeliveryAsync(int orderId, ConfirmDeliveryDto dto)
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(r => r!.Branch)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
        {
            return false;
        }

        if (_currentUser.BranchId.HasValue && order.SupplyRequest?.BranchId != _currentUser.BranchId.Value)
        {
            return false;
        }

        order.Status = "Delivered";

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = _currentUser.TenantId.Value,
            OrderId = order.OrderId,
            Status = "Delivered",
            ChangedBy_UserId = _currentUser.UserId.Value,
            Remarks = dto.Remarks,
            Timestamp = DateTime.UtcNow
        });

        if (!dto.ReceivedInFull)
        {
            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                TenantId = _currentUser.TenantId.Value,
                OrderId = order.OrderId,
                Status = "DeliveredWithVariance",
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

    private async Task<Order?> GetOrderForAccessCheckAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
        {
            return null;
        }

        if (_currentUser.BranchId.HasValue && order.SupplyRequest?.BranchId != _currentUser.BranchId.Value)
        {
            return null;
        }

        return order;
    }
}
