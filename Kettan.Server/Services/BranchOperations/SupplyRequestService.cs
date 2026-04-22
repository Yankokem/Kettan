using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.SupplyRequests;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Inventory;

namespace Kettan.Server.Services.BranchOperations;

public class SupplyRequestService : ISupplyRequestService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IInventoryService _inventoryService;

    public SupplyRequestService(
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

        if (IsBranchScopedUser())
        {
            var currentBranchId = _currentUser.BranchId ?? 0;
            query = query.Where(r => r.BranchId == currentBranchId);
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
        var request = await GetHydratedByIdAsync(requestId);

        if (request == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
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

        var branchId = ResolveBranchId(dto.BranchId);
        await ValidateItemsAsync(dto.Items);

        var now = DateTime.UtcNow;

        var request = new SupplyRequest
        {
            TenantId = _currentUser.TenantId.Value,
            BranchId = branchId,
            RequestedBy_UserId = _currentUser.UserId.Value,
            Status = SupplyRequestStatuses.Draft,
            RequestType = NormalizeOption(dto.RequestType, "manual"),
            Priority = NormalizeOption(dto.Priority, "normal"),
            DispatchWindow = NormalizeOption(dto.DispatchWindow, "today"),
            DispatchDate = dto.DispatchDate,
            Notes = NormalizeOptional(dto.Notes),
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

        var hydrated = await GetHydratedByIdAsync(request.RequestId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load created request.");
        }

        return MapToDto(hydrated);
    }

    public async Task<SupplyRequestDto?> UpdateDraftAsync(int requestId, UpdateSupplyRequestDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

        await ValidateItemsAsync(dto.Items);

        var request = await _context.SupplyRequests
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (request == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return null;
        }

        if (request.Status is not (SupplyRequestStatuses.Draft or SupplyRequestStatuses.AutoDrafted))
        {
            throw new InvalidOperationException("Only draft requests can be updated.");
        }

        request.RequestType = NormalizeOption(dto.RequestType, request.RequestType);
        request.Priority = NormalizeOption(dto.Priority, request.Priority);
        request.DispatchWindow = NormalizeOption(dto.DispatchWindow, request.DispatchWindow);
        request.DispatchDate = dto.DispatchDate;
        request.Notes = NormalizeOptional(dto.Notes);
        request.UpdatedAt = DateTime.UtcNow;

        if (request.Items.Count > 0)
        {
            _context.SupplyRequestItems.RemoveRange(request.Items);
        }

        request.Items = dto.Items.Select(i => new SupplyRequestItem
        {
            TenantId = request.TenantId,
            RequestId = request.RequestId,
            ItemId = i.ItemId,
            QuantityRequested = i.QuantityRequested,
            QuantityApproved = null
        }).ToList();

        await _context.SaveChangesAsync();

        var hydrated = await GetHydratedByIdAsync(request.RequestId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load updated request.");
        }

        return MapToDto(hydrated);
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

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return false;
        }

        if (request.Status is not (SupplyRequestStatuses.Draft or SupplyRequestStatuses.AutoDrafted))
        {
            throw new InvalidOperationException("Only draft requests can be submitted.");
        }

        request.Status = SupplyRequestStatuses.PendingApproval;
        request.UpdatedAt = DateTime.UtcNow;

        var normalizedNotes = NormalizeOptional(notes);
        if (!string.IsNullOrWhiteSpace(normalizedNotes))
        {
            request.Notes = normalizedNotes;
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

    public async Task<SupplyRequestDto?> ApproveAsync(int requestId, ApproveSupplyRequestDto dto)
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

        var request = await _context.SupplyRequests
            .Include(r => r.Branch)
            .Include(r => r.RequestedBy_User)
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (request == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return null;
        }

        if (request.Status != SupplyRequestStatuses.PendingApproval)
        {
            throw new InvalidOperationException("Only pending approval requests can be approved.");
        }

        if (request.Items.Count == 0)
        {
            throw new InvalidOperationException("Cannot approve a request without items.");
        }

        if (dto.Items.GroupBy(i => i.RequestItemId).Any(g => g.Count() > 1))
        {
            throw new InvalidOperationException("Duplicate approval lines are not allowed.");
        }

        var requestItemIds = request.Items.Select(i => i.RequestItemId).ToHashSet();
        foreach (var line in dto.Items)
        {
            if (!requestItemIds.Contains(line.RequestItemId))
            {
                throw new InvalidOperationException("One or more approval lines are invalid.");
            }
        }

        var approvedLookup = dto.Items.ToDictionary(i => i.RequestItemId, i => i.QuantityApproved);

        foreach (var requestItem in request.Items)
        {
            var approvedQty = approvedLookup.TryGetValue(requestItem.RequestItemId, out var lineQty)
                ? lineQty
                : requestItem.QuantityRequested;

            if (approvedQty < 0)
            {
                throw new InvalidOperationException("Approved quantity cannot be negative.");
            }

            if (approvedQty > requestItem.QuantityRequested)
            {
                throw new InvalidOperationException("Approved quantity cannot exceed requested quantity.");
            }

            requestItem.QuantityApproved = approvedQty;
        }

        if (await _context.Orders.AnyAsync(o => o.RequestId == request.RequestId))
        {
            throw new InvalidOperationException("An order already exists for this supply request.");
        }

        var now = DateTime.UtcNow;

        await using var transaction = await _context.Database.BeginTransactionAsync();

        request.Status = SupplyRequestStatuses.Approved;
        request.UpdatedAt = now;

        var normalizedNotes = NormalizeOptional(dto.Notes);
        if (!string.IsNullOrWhiteSpace(normalizedNotes))
        {
            request.Notes = normalizedNotes;
        }

        var order = new Order
        {
            TenantId = request.TenantId,
            RequestId = request.RequestId,
            Status = OrderStatuses.Processing,
            PushedToFulfillmentAt = now
        };

        _context.Orders.Add(order);
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = request.TenantId,
            Order = order,
            Status = OrderStatuses.Processing,
            ChangedBy_UserId = _currentUser.UserId.Value,
            Remarks = "Supply request approved and moved to processing.",
            Timestamp = now
        });

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        await _notificationService.CreateForUsersAsync(
            [request.RequestedBy_UserId],
            "Supply Request Approved",
            $"Your request #{request.RequestId} was approved and moved to order processing.",
            type: "SupplyRequestApproved",
            referenceType: nameof(SupplyRequest),
            referenceId: request.RequestId);

        var hydrated = await GetHydratedByIdAsync(request.RequestId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load approved request.");
        }

        return MapToDto(hydrated);
    }

    public async Task<SupplyRequestDto?> RejectAsync(int requestId, RejectSupplyRequestDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

        var request = await _context.SupplyRequests
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (request == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return null;
        }

        if (request.Status != SupplyRequestStatuses.PendingApproval)
        {
            throw new InvalidOperationException("Only pending approval requests can be rejected.");
        }

        request.Status = SupplyRequestStatuses.Rejected;
        request.UpdatedAt = DateTime.UtcNow;

        foreach (var requestItem in request.Items)
        {
            requestItem.QuantityApproved = 0;
        }

        request.Notes = BuildRejectionNotes(request.Notes, dto.Reason, dto.Notes);

        await _context.SaveChangesAsync();

        var normalizedReason = NormalizeOptional(dto.Reason);
        var message = string.IsNullOrWhiteSpace(normalizedReason)
            ? $"Your request #{request.RequestId} was rejected."
            : $"Your request #{request.RequestId} was rejected: {normalizedReason}.";

        await _notificationService.CreateForUsersAsync(
            [request.RequestedBy_UserId],
            "Supply Request Rejected",
            message,
            type: "SupplyRequestRejected",
            referenceType: nameof(SupplyRequest),
            referenceId: request.RequestId);

        var hydrated = await GetHydratedByIdAsync(request.RequestId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load rejected request.");
        }

        return MapToDto(hydrated);
    }

    public async Task<SupplyRequestDto?> AutoDraftOnLowStockAsync(int branchId)
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

        var alerts = await _inventoryService.CheckThresholdsAsync(branchId);
        
        var validAlerts = alerts.Where(a => a.Threshold - a.StockLevel > 0).ToList();
        if (validAlerts.Count == 0)
        {
            return null;
        }

        var existingDraft = await _context.SupplyRequests
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.BranchId == branchId && 
                                     (r.Status == SupplyRequestStatuses.Draft || r.Status == SupplyRequestStatuses.AutoDrafted));

        var now = DateTime.UtcNow;

        if (existingDraft != null)
        {
            foreach (var alert in validAlerts)
            {
                var neededQty = alert.Threshold - alert.StockLevel;
                var existingItem = existingDraft.Items.FirstOrDefault(i => i.ItemId == alert.ItemId);

                if (existingItem != null)
                {
                    if (existingItem.QuantityRequested < neededQty)
                    {
                        existingItem.QuantityRequested = neededQty;
                    }
                }
                else
                {
                    existingDraft.Items.Add(new SupplyRequestItem
                    {
                        TenantId = existingDraft.TenantId,
                        RequestId = existingDraft.RequestId,
                        ItemId = alert.ItemId,
                        QuantityRequested = neededQty
                    });
                }
            }

            existingDraft.UpdatedAt = now;
            await _context.SaveChangesAsync();

            await _notificationService.CreateForRolesAsync(
                ["BranchManager", "BranchOwner"],
                "Auto-Draft Updated",
                $"Your pending draft #{existingDraft.RequestId} was automatically updated with low stock items.",
                type: "SupplyRequestAutoDrafted",
                branchId: branchId,
                referenceType: nameof(SupplyRequest),
                referenceId: existingDraft.RequestId);

            var updatedHydrated = await GetHydratedByIdAsync(existingDraft.RequestId);
            return MapToDto(updatedHydrated!);
        }

        var newRequest = new SupplyRequest
        {
            TenantId = _currentUser.TenantId.Value,
            BranchId = branchId,
            RequestedBy_UserId = _currentUser.UserId.Value,
            Status = SupplyRequestStatuses.AutoDrafted,
            RequestType = "auto",
            Priority = "normal",
            DispatchWindow = "today",
            CreatedAt = now,
            UpdatedAt = now,
            Items = validAlerts.Select(a => new SupplyRequestItem
            {
                TenantId = _currentUser.TenantId.Value,
                ItemId = a.ItemId,
                QuantityRequested = a.Threshold - a.StockLevel
            }).ToList()
        };

        _context.SupplyRequests.Add(newRequest);
        await _context.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            ["BranchManager", "BranchOwner"],
            "Automated Low Stock Draft",
            $"A new draft #{newRequest.RequestId} was automatically created due to low stock.",
            type: "SupplyRequestAutoDrafted",
            branchId: branchId,
            referenceType: nameof(SupplyRequest),
            referenceId: newRequest.RequestId);

        var newHydrated = await GetHydratedByIdAsync(newRequest.RequestId);
        return MapToDto(newHydrated!);
    }

    private int ResolveBranchId(int? dtoBranchId)
    {
        if (IsBranchScopedUser())
        {
            return _currentUser.BranchId ?? throw new InvalidOperationException("Branch context is required.");
        }

        if (!dtoBranchId.HasValue)
        {
            throw new InvalidOperationException("BranchId is required for HQ users.");
        }

        return dtoBranchId.Value;
    }

    private async Task ValidateItemsAsync(IEnumerable<CreateSupplyRequestItemDto> items)
    {
        var itemRows = items.ToList();

        if (itemRows.Count == 0)
        {
            throw new InvalidOperationException("At least one item is required.");
        }

        if (itemRows.Any(i => i.QuantityRequested <= 0))
        {
            throw new InvalidOperationException("Requested quantities must be greater than zero.");
        }

        var itemIds = itemRows.Select(i => i.ItemId).ToList();

        if (itemIds.Count != itemIds.Distinct().Count())
        {
            throw new InvalidOperationException("Duplicate item lines are not allowed.");
        }

        var validItems = await _context.Items
            .Where(i => itemIds.Contains(i.ItemId))
            .Select(i => i.ItemId)
            .ToListAsync();

        if (validItems.Count != itemIds.Count)
        {
            throw new InvalidOperationException("One or more requested items are invalid.");
        }
    }

    private async Task<SupplyRequest?> GetHydratedByIdAsync(int requestId)
    {
        return await _context.SupplyRequests
            .Include(r => r.Branch)
            .Include(r => r.RequestedBy_User)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);
    }

    private static string NormalizeOption(string? value, string fallback)
    {
        var normalized = NormalizeOptional(value);
        return string.IsNullOrWhiteSpace(normalized) ? fallback : normalized;
    }

    private static string? NormalizeOptional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static string? BuildRejectionNotes(string? existing, string? reason, string? notes)
    {
        var entries = new List<string>();

        var normalizedExisting = NormalizeOptional(existing);
        if (!string.IsNullOrWhiteSpace(normalizedExisting))
        {
            entries.Add(normalizedExisting);
        }

        var normalizedReason = NormalizeOptional(reason);
        if (!string.IsNullOrWhiteSpace(normalizedReason))
        {
            entries.Add($"Rejected: {normalizedReason}");
        }

        var normalizedNotes = NormalizeOptional(notes);
        if (!string.IsNullOrWhiteSpace(normalizedNotes))
        {
            entries.Add(normalizedNotes);
        }

        return entries.Count == 0 ? null : string.Join(Environment.NewLine, entries);
    }

    private bool IsBranchScopedUser()
    {
        return _currentUser.BranchId.HasValue && !IsHqRole();
    }

    private bool IsHqRole()
    {
        return _currentUser.Role is "TenantAdmin" or "HqManager" or "HqStaff";
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
