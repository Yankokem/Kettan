using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Returns;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Enums;

namespace Kettan.Server.Services.BranchOperations;

public class ReturnService : IReturnService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;

    public ReturnService(
        ApplicationDbContext context,
        ICurrentUserService currentUser,
        INotificationService notificationService)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
    }

    public async Task<List<ReturnDto>> ListAsync(string? resolution = null)
    {
        var query = _context.Returns
            .Include(r => r.Branch)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .AsQueryable();

        if (_currentUser.BranchId.HasValue)
        {
            query = query.Where(r => r.BranchId == _currentUser.BranchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(resolution))
        {
            if (Enum.TryParse<ReturnResolution>(resolution, true, out var parsedResolution))
            {
                query = query.Where(r => r.Resolution == parsedResolution);
            }
        }

        var rows = await query
            .OrderByDescending(r => r.LoggedAt)
            .ToListAsync();

        return rows.Select(MapToDto).ToList();
    }

    public async Task<ReturnDto?> GetByIdAsync(int returnId)
    {
        var row = await _context.Returns
            .Include(r => r.Branch)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(r => r.ReturnId == returnId);

        if (row == null)
        {
            return null;
        }

        if (_currentUser.BranchId.HasValue && row.BranchId != _currentUser.BranchId.Value)
        {
            return null;
        }

        return MapToDto(row);
    }

    public async Task<ReturnDto> CreateAsync(CreateReturnDto dto)
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue || !_currentUser.BranchId.HasValue)
        {
            throw new InvalidOperationException("Authenticated branch user context is required.");
        }

        if (dto.Items.Count == 0)
        {
            throw new InvalidOperationException("At least one return line is required.");
        }

        var order = await _context.Orders
            .Include(o => o.SupplyRequest)
            .FirstOrDefaultAsync(o => o.OrderId == dto.OrderId);

        if (order?.SupplyRequest == null)
        {
            throw new InvalidOperationException("Order was not found.");
        }

        if (order.SupplyRequest.BranchId != _currentUser.BranchId.Value)
        {
            throw new InvalidOperationException("Order does not belong to your branch.");
        }

        var returnEntry = new Return
        {
            TenantId = _currentUser.TenantId.Value,
            OrderId = dto.OrderId,
            BranchId = _currentUser.BranchId.Value,
            Reason = dto.Reason,
            PhotoUrls = dto.PhotoUrls,
            Resolution = ReturnResolution.Pending,
            LoggedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new ReturnItem
            {
                TenantId = _currentUser.TenantId.Value,
                ItemId = i.ItemId,
                QuantityReturned = i.QuantityReturned,
                Reason = i.Reason
            }).ToList()
        };

        _context.Returns.Add(returnEntry);
        await _context.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            ["TenantAdmin", "HqManager", "HqStaff"],
            "Return Filed",
            $"A new return #{returnEntry.ReturnId} was filed for order #{returnEntry.OrderId}.",
            type: "ReturnFiled",
            referenceType: nameof(Return),
            referenceId: returnEntry.ReturnId);

        var hydrated = await GetByIdAsync(returnEntry.ReturnId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load created return.");
        }

        return hydrated;
    }

    public async Task<bool> ResolveAsync(int returnId, ResolveReturnDto dto)
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user context is required.");
        }

        var returnEntry = await _context.Returns
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(r => r.ReturnId == returnId);

        if (returnEntry == null)
        {
            return false;
        }

        returnEntry.Resolution = Enum.TryParse<ReturnResolution>(dto.Resolution, true, out var resolution) ? resolution : ReturnResolution.Pending;
        returnEntry.ReviewedBy_UserId = _currentUser.UserId.Value;
        returnEntry.ResolvedAt = DateTime.UtcNow;

        await using var transaction = await _context.Database.BeginTransactionAsync();

        if (returnEntry.Resolution == ReturnResolution.Credited)
        {
            decimal totalCredit = 0;
            foreach (var item in returnEntry.Items)
            {
                totalCredit += item.QuantityReturned * (item.Item?.UnitCost ?? 0);
            }
            returnEntry.CreditAmount = totalCredit;
        }
        else if (returnEntry.Resolution == ReturnResolution.Replaced)
        {
            returnEntry.CreditAmount = null;

            var newRequest = new SupplyRequest
            {
                TenantId = _currentUser.TenantId.Value,
                BranchId = returnEntry.BranchId,
                RequestedBy_UserId = _currentUser.UserId.Value,
                Status = SupplyRequestStatus.Approved,
                RequestType = RequestType.Replacement,
                Priority = Priority.High,
                DispatchWindow = DispatchWindow.Today,
                CreatedAt = returnEntry.ResolvedAt.Value,
                UpdatedAt = returnEntry.ResolvedAt.Value,
                Items = returnEntry.Items.Select(i => new SupplyRequestItem
                {
                    TenantId = _currentUser.TenantId.Value,
                    ItemId = i.ItemId,
                    QuantityRequested = i.QuantityReturned,
                    QuantityApproved = i.QuantityReturned
                }).ToList()
            };

            _context.SupplyRequests.Add(newRequest);
            await _context.SaveChangesAsync();

            var newOrder = new Order
            {
                TenantId = _currentUser.TenantId.Value,
                RequestId = newRequest.RequestId,
                Status = OrderStatus.Processing,
                PushedToFulfillmentAt = returnEntry.ResolvedAt.Value
            };

            _context.Orders.Add(newOrder);

            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                TenantId = _currentUser.TenantId.Value,
                Order = newOrder,
                Status = OrderStatus.Processing,
                ChangedBy_UserId = _currentUser.UserId.Value,
                Remarks = $"Auto-generated replacement processing for Return #{returnEntry.ReturnId}.",
                Timestamp = returnEntry.ResolvedAt.Value
            });
        }
        else
        {
            returnEntry.CreditAmount = null;
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        await _notificationService.CreateForRolesAsync(
            ["BranchManager", "BranchOwner"],
            "Return Resolved",
            $"Return #{returnEntry.ReturnId} has been resolved as {returnEntry.Resolution}.",
            type: "ReturnResolved",
            branchId: returnEntry.BranchId,
            referenceType: nameof(Return),
            referenceId: returnEntry.ReturnId);

        return true;
    }

    private static ReturnDto MapToDto(Return row)
    {
        return new ReturnDto
        {
            ReturnId = row.ReturnId,
            OrderId = row.OrderId,
            BranchId = row.BranchId,
            BranchName = row.Branch?.Name ?? string.Empty,
            Reason = row.Reason,
            Resolution = row.Resolution.ToString(),
            PhotoUrls = row.PhotoUrls,
            CreditAmount = row.CreditAmount,
            LoggedAt = row.LoggedAt,
            ResolvedAt = row.ResolvedAt,
            Items = row.Items.Select(i => new ReturnItemDto
            {
                ItemId = i.ItemId,
                ItemName = i.Item?.Name ?? string.Empty,
                QuantityReturned = i.QuantityReturned,
                Reason = i.Reason
            }).ToList()
        };
    }
}
