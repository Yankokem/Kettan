using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Returns;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

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
            query = query.Where(r => r.Resolution == resolution);
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
            Resolution = "Pending",
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
            .FirstOrDefaultAsync(r => r.ReturnId == returnId);

        if (returnEntry == null)
        {
            return false;
        }

        returnEntry.Resolution = dto.Resolution;
        returnEntry.CreditAmount = dto.CreditAmount;
        returnEntry.ReviewedBy_UserId = _currentUser.UserId.Value;
        returnEntry.ResolvedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

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
            Resolution = row.Resolution,
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
