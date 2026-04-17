using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.SupplyRequests;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Services.BranchOperations;

public class SupplyRequestService : ISupplyRequestService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;

    public SupplyRequestService(
        ApplicationDbContext context,
        ICurrentUserService currentUser,
        INotificationService notificationService)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
    }

    public async Task<List<SupplyRequestDto>> ListAsync(string? status = null)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return [];
        }

        var query = _context.SupplyRequests
            .Include(r => r.Branch)
            .Include(r => r.RequestedBy_User)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .AsQueryable();

        if (_currentUser.BranchId.HasValue)
        {
            query = query.Where(r => r.BranchId == _currentUser.BranchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var requests = await query
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();

        return requests.Select(MapToDto).ToList();
    }

    public async Task<SupplyRequestDto?> GetByIdAsync(int requestId)
    {
        var request = await _context.SupplyRequests
            .Include(r => r.Branch)
            .Include(r => r.RequestedBy_User)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (request == null)
        {
            return null;
        }

        if (_currentUser.BranchId.HasValue && request.BranchId != _currentUser.BranchId.Value)
        {
            return null;
        }

        return MapToDto(request);
    }

    public async Task<SupplyRequestDto> CreateDraftAsync(CreateSupplyRequestDto dto)
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

        if (dto.Items.Count == 0)
        {
            throw new InvalidOperationException("At least one item is required.");
        }

        var branchId = ResolveBranchId(dto.BranchId);

        var itemIds = dto.Items.Select(i => i.ItemId).Distinct().ToList();
        var validItems = await _context.Items
            .Where(i => itemIds.Contains(i.ItemId))
            .Select(i => i.ItemId)
            .ToListAsync();

        if (validItems.Count != itemIds.Count)
        {
            throw new InvalidOperationException("One or more requested items are invalid.");
        }

        var now = DateTime.UtcNow;

        var request = new SupplyRequest
        {
            TenantId = _currentUser.TenantId.Value,
            BranchId = branchId,
            RequestedBy_UserId = _currentUser.UserId.Value,
            Status = "Draft",
            RequestType = dto.RequestType,
            Priority = dto.Priority,
            DispatchWindow = dto.DispatchWindow,
            DispatchDate = dto.DispatchDate,
            Notes = dto.Notes,
            CreatedAt = now,
            UpdatedAt = now,
            Items = dto.Items.Select(i => new SupplyRequestItem
            {
                TenantId = _currentUser.TenantId.Value,
                ItemId = i.ItemId,
                QuantityRequested = i.QuantityRequested,
                QuantityApproved = null
            }).ToList()
        };

        _context.SupplyRequests.Add(request);
        await _context.SaveChangesAsync();

        var hydrated = await GetByIdAsync(request.RequestId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load created request.");
        }

        return hydrated;
    }

    public async Task<bool> SubmitAsync(int requestId, string? notes = null)
    {
        if (!_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated user is required.");
        }

        var request = await _context.SupplyRequests
            .Include(r => r.Branch)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (request == null)
        {
            return false;
        }

        if (_currentUser.BranchId.HasValue && request.BranchId != _currentUser.BranchId.Value)
        {
            return false;
        }

        if (request.Status is not ("Draft" or "Auto_Drafted"))
        {
            throw new InvalidOperationException("Only draft requests can be submitted.");
        }

        request.Status = "PendingApproval";
        request.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(notes))
        {
            request.Notes = notes;
        }

        await _context.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            ["TenantAdmin", "HqManager", "HqStaff"],
            "New Supply Request Submitted",
            $"Branch {request.Branch?.Name ?? request.BranchId.ToString()} submitted request #{request.RequestId}.",
            type: "SupplyRequestSubmitted",
            referenceType: nameof(SupplyRequest),
            referenceId: request.RequestId);

        return true;
    }

    private int ResolveBranchId(int? dtoBranchId)
    {
        if (_currentUser.BranchId.HasValue)
        {
            return _currentUser.BranchId.Value;
        }

        if (!dtoBranchId.HasValue)
        {
            throw new InvalidOperationException("BranchId is required for HQ users.");
        }

        return dtoBranchId.Value;
    }

    private static SupplyRequestDto MapToDto(SupplyRequest request)
    {
        return new SupplyRequestDto
        {
            RequestId = request.RequestId,
            BranchId = request.BranchId,
            BranchName = request.Branch?.Name ?? string.Empty,
            RequestedByUserId = request.RequestedBy_UserId,
            RequestedByName = request.RequestedBy_User == null
                ? string.Empty
                : $"{request.RequestedBy_User.FirstName} {request.RequestedBy_User.LastName}".Trim(),
            Status = request.Status,
            RequestType = request.RequestType,
            Priority = request.Priority,
            DispatchWindow = request.DispatchWindow,
            DispatchDate = request.DispatchDate,
            Notes = request.Notes,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt,
            Items = request.Items.Select(item => new SupplyRequestItemDto
            {
                RequestItemId = item.RequestItemId,
                ItemId = item.ItemId,
                ItemName = item.Item?.Name ?? string.Empty,
                ItemSku = item.Item?.SKU ?? string.Empty,
                QuantityRequested = item.QuantityRequested,
                QuantityApproved = item.QuantityApproved
            }).ToList()
        };
    }
}
