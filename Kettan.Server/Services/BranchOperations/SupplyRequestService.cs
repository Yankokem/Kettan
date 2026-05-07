using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Kettan.Server.Hubs;
using Kettan.Server.Data;
using Kettan.Server.DTOs.SupplyRequests;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Inventory;
using Kettan.Server.Enums;

namespace Kettan.Server.Services.BranchOperations;

public class SupplyRequestService : ISupplyRequestService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IInventoryService _inventoryService;

    private readonly IHubContext<WorkflowHub> _hubContext;

    public SupplyRequestService(
        ApplicationDbContext context,
        ICurrentUserService currentUser,
        INotificationService notificationService,
        IInventoryService inventoryService,
        IHubContext<WorkflowHub> hubContext)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _inventoryService = inventoryService;
        _hubContext = hubContext;
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
            .Include(r => r.Orders)
                .ThenInclude(o => o.ArrivedConfirmedByUser)
            .Include(r => r.Orders)
                .ThenInclude(o => o.CompletedByUser)
            .AsQueryable();

        if (IsBranchScopedUser())
        {
            var currentBranchId = _currentUser.BranchId ?? 0;
            query = query.Where(r => r.BranchId == currentBranchId);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<SupplyRequestStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(r => r.Status == parsedStatus);
            }
        }

        var requests = await query
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();

        return requests.Select(MapToDto).ToList();
    }

    public async Task<SupplyRequestDto?> GetByIdAsync(int requestId)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return null;
        }

        var tenantId = _currentUser.TenantId.Value;
        var request = await GetHydratedByIdAsync(requestId, tenantId);

        if (request == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return null;
        }

        var dto = MapToDto(request);
        await PopulateHqStockAsync(dto);
        return dto;
    }

    private async Task PopulateHqStockAsync(SupplyRequestDto dto)
    {
        var itemIds = dto.Items.Select(i => i.ItemId).ToList();
        var stockLookup = await _context.Batches
            .Where(b => b.BranchId == null && itemIds.Contains(b.ItemId))
            .GroupBy(b => b.ItemId)
            .Select(g => new { ItemId = g.Key, TotalStock = g.Sum(b => b.CurrentQuantity) })
            .ToDictionaryAsync(x => x.ItemId, x => x.TotalStock);

        foreach (var item in dto.Items)
        {
            item.HqStock = stockLookup.TryGetValue(item.ItemId, out var stock) ? stock : 0;
        }
    }

    public async Task<SupplyRequestDto> CreateDraftAsync(CreateSupplyRequestDto dto)
    {
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        var branchId = await ResolveBranchIdAsync(dto.BranchId, tenantId);
        await ValidateItemsAsync(dto.Items, tenantId);

        var now = DateTime.UtcNow;

        var request = new SupplyRequest
        {
            TenantId = _currentUser.TenantId.Value,
            BranchId = branchId,
            RequestedBy_UserId = userId,
            Status = SupplyRequestStatus.Draft,
            RequestType = Enum.TryParse<RequestType>(dto.RequestType, true, out var reqType) ? reqType : RequestType.Manual,
            Priority = Enum.TryParse<Priority>(dto.Priority, true, out var priority) ? priority : Priority.Normal,
            DispatchWindow = Enum.TryParse<DispatchWindow>(dto.DispatchWindow, true, out var dispatchWindow) ? dispatchWindow : DispatchWindow.Today,
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

        var hydrated = await GetHydratedByIdAsync(request.RequestId, tenantId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load created request.");
        }

        return MapToDto(hydrated);
    }

    public async Task<SupplyRequestDto?> UpdateDraftAsync(int requestId, UpdateSupplyRequestDto dto)
    {
        var tenantId = EnsureTenantContext();
        await ValidateItemsAsync(dto.Items, tenantId);

        var request = await _context.SupplyRequests
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.RequestId == requestId && r.TenantId == tenantId);

        if (request == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return null;
        }

        if (!IsDraftLike(request.Status))
        {
            throw new InvalidOperationException("Only draft requests can be updated.");
        }

        request.RequestType = Enum.TryParse<RequestType>(dto.RequestType, true, out var reqType) ? reqType : request.RequestType;
        request.Priority = Enum.TryParse<Priority>(dto.Priority, true, out var priority) ? priority : request.Priority;
        request.DispatchWindow = Enum.TryParse<DispatchWindow>(dto.DispatchWindow, true, out var dispatchWindow) ? dispatchWindow : request.DispatchWindow;
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

        var hydrated = await GetHydratedByIdAsync(request.RequestId, tenantId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load updated request.");
        }

        return MapToDto(hydrated);
    }

    public async Task<bool> SubmitAsync(int requestId, string? notes = null)
    {
        var tenantId = EnsureTenantContext();
        EnsureUserContext();

        var request = await _context.SupplyRequests
            .Include(r => r.Branch)
            .FirstOrDefaultAsync(r => r.RequestId == requestId && r.TenantId == tenantId);

        if (request == null)
        {
            return false;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return false;
        }

        if (!IsDraftLike(request.Status))
        {
            throw new InvalidOperationException("Only draft requests can be submitted.");
        }

        request.Status = SupplyRequestStatus.PendingApproval;
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
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        var request = await _context.SupplyRequests
            .Include(r => r.Branch)
            .Include(r => r.RequestedBy_User)
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.RequestId == requestId && r.TenantId == tenantId);

        if (request == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return null;
        }

        if (request.Status != SupplyRequestStatus.PendingApproval)
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

        var hasAnyPartialApproval = request.Items.Any(i => (i.QuantityApproved ?? 0) < i.QuantityRequested);
        request.Status = hasAnyPartialApproval
            ? SupplyRequestStatus.PartiallyApproved
            : SupplyRequestStatus.Approved;
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
            Status = OrderStatus.Picking,
            PushedToFulfillmentAt = now
        };

        _context.Orders.Add(order);
        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = request.TenantId,
            Order = order,
            Status = OrderStatus.Picking,
            ChangedBy_UserId = userId,
            Remarks = "Supply request approved and moved to picking.",
            Timestamp = now
        });

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        await BroadcastSupplyRequestUpdateAsync(request.RequestId);

        await _notificationService.CreateForUsersAsync(
            [request.RequestedBy_UserId],
            hasAnyPartialApproval ? "Supply Request Partially Approved" : "Supply Request Approved",
            hasAnyPartialApproval
                ? $"Your request #{request.RequestId} was partially approved and moved to order processing."
                : $"Your request #{request.RequestId} was approved and moved to order processing.",
            type: "SupplyRequestApproved",
            referenceType: nameof(SupplyRequest),
            referenceId: request.RequestId);

        var hydrated = await GetHydratedByIdAsync(request.RequestId, tenantId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load approved request.");
        }

        return MapToDto(hydrated);
    }

    public async Task<SupplyRequestDto?> RejectAsync(int requestId, RejectSupplyRequestDto dto)
    {
        var tenantId = EnsureTenantContext();

        var request = await _context.SupplyRequests
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.RequestId == requestId && r.TenantId == tenantId);

        if (request == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return null;
        }

        if (request.Status != SupplyRequestStatus.PendingApproval)
        {
            throw new InvalidOperationException("Only pending approval requests can be rejected.");
        }

        request.Status = SupplyRequestStatus.Rejected;
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

        var hydrated = await GetHydratedByIdAsync(request.RequestId, tenantId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load rejected request.");
        }

        return MapToDto(hydrated);
    }

    public async Task<SupplyRequestDto?> AutoDraftOnLowStockAsync(int branchId)
    {
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        var validatedBranchId = await ResolveBranchIdAsync(branchId, tenantId);

        var alerts = await _inventoryService.CheckThresholdsAsync(validatedBranchId);
        
        var validAlerts = alerts.Where(a => a.Threshold - a.StockLevel > 0).ToList();
        if (validAlerts.Count == 0)
        {
            return null;
        }

        var existingDraft = await _context.SupplyRequests
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.TenantId == tenantId &&
                                     r.BranchId == validatedBranchId && 
                                     (r.Status == SupplyRequestStatus.Draft || r.Status == SupplyRequestStatus.AutoDrafted));

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
            await BroadcastSupplyRequestUpdateAsync(existingDraft.RequestId);

            await _notificationService.CreateForRolesAsync(
                ["BranchManager", "BranchOwner"],
                "Auto-Draft Updated",
                $"Your pending draft #{existingDraft.RequestId} was automatically updated with low stock items.",
                type: "SupplyRequestAutoDrafted",
                branchId: validatedBranchId,
                referenceType: nameof(SupplyRequest),
                referenceId: existingDraft.RequestId);

            var updatedHydrated = await GetHydratedByIdAsync(existingDraft.RequestId, tenantId);
            return MapToDto(updatedHydrated!);
        }

        var newRequest = new SupplyRequest
        {
            TenantId = _currentUser.TenantId.Value,
            BranchId = validatedBranchId,
            RequestedBy_UserId = userId,
            Status = SupplyRequestStatus.AutoDrafted,
            RequestType = RequestType.Auto,
            Priority = Priority.Normal,
            DispatchWindow = DispatchWindow.Today,
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
        await BroadcastSupplyRequestUpdateAsync(newRequest.RequestId);

        await _notificationService.CreateForRolesAsync(
            ["BranchManager", "BranchOwner"],
                "Automated Low Stock Draft",
                $"A new draft #{newRequest.RequestId} was automatically created due to low stock.",
                type: "SupplyRequestAutoDrafted",
                branchId: validatedBranchId,
                referenceType: nameof(SupplyRequest),
                referenceId: newRequest.RequestId);

        var newHydrated = await GetHydratedByIdAsync(newRequest.RequestId, tenantId);
        return MapToDto(newHydrated!);
    }

    public async Task<SupplyRequestDto?> CancelAsync(int requestId, CancelSupplyRequestDto dto)
    {
        var tenantId = EnsureTenantContext();

        var request = await _context.SupplyRequests
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.RequestId == requestId && r.TenantId == tenantId);

        if (request == null)
        {
            return null;
        }

        var currentBranchId = _currentUser.BranchId ?? 0;
        if (IsBranchScopedUser() && request.BranchId != currentBranchId)
        {
            return null;
        }

        if (!IsDraftLike(request.Status) && request.Status != SupplyRequestStatus.PendingApproval)
        {
            throw new InvalidOperationException("Only draft, auto-drafted, or pending approval requests can be cancelled.");
        }

        request.Status = SupplyRequestStatus.Cancelled;
        request.UpdatedAt = DateTime.UtcNow;

        request.Notes = BuildRejectionNotes(request.Notes, dto.Reason, dto.Notes);

        await _context.SaveChangesAsync();

        var normalizedReason = NormalizeOptional(dto.Reason);
        var message = string.IsNullOrWhiteSpace(normalizedReason)
            ? $"Supply request #{request.RequestId} was cancelled."
            : $"Supply request #{request.RequestId} was cancelled: {normalizedReason}.";

        await _notificationService.CreateForUsersAsync(
            [request.RequestedBy_UserId],
            "Supply Request Cancelled",
            message,
            type: "SupplyRequestCancelled",
            referenceType: nameof(SupplyRequest),
            referenceId: request.RequestId);

        var hydrated = await GetHydratedByIdAsync(request.RequestId, tenantId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load cancelled request.");
        }

        return MapToDto(hydrated);
    }

    public async Task<SupplyRequestDto?> GetLatestOngoingAsync()
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.BranchId.HasValue)
        {
            return null;
        }

        var tenantId = _currentUser.TenantId.Value;
        var branchId = _currentUser.BranchId.Value;

        // "Ongoing" means not in a terminal state
        var terminalStatuses = new[] { SupplyRequestStatus.Fulfilled, SupplyRequestStatus.Rejected, SupplyRequestStatus.Cancelled };

        var latestRequest = await _context.SupplyRequests
            .Include(r => r.Branch)
            .Include(r => r.RequestedBy_User)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .Include(r => r.Orders)
            .Where(r => r.TenantId == tenantId 
                && r.BranchId == branchId 
                && !terminalStatuses.Contains(r.Status))
            .OrderByDescending(r => r.UpdatedAt)
            .FirstOrDefaultAsync();

        if (latestRequest == null)
        {
            return null;
        }

        return MapToDto(latestRequest);
    }

    private async Task<int> ResolveBranchIdAsync(int? dtoBranchId, int tenantId)
    {
        int branchId;
        if (IsBranchScopedUser())
        {
            branchId = _currentUser.BranchId ?? throw new InvalidOperationException("Branch context is required.");
        }
        else
        {
            if (!dtoBranchId.HasValue)
            {
                throw new InvalidOperationException("BranchId is required for HQ users.");
            }

            branchId = dtoBranchId.Value;
        }

        var branchExists = await _context.Branches.AnyAsync(b => b.BranchId == branchId && b.TenantId == tenantId && b.IsActive);
        if (!branchExists)
        {
            throw new InvalidOperationException("Branch was not found.");
        }

        return branchId;
    }

    private async Task ValidateItemsAsync(IEnumerable<CreateSupplyRequestItemDto> items, int tenantId)
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
            .Where(i => i.TenantId == tenantId && itemIds.Contains(i.ItemId))
            .Select(i => i.ItemId)
            .ToListAsync();

        if (validItems.Count != itemIds.Count)
        {
            throw new InvalidOperationException("One or more requested items are invalid.");
        }
    }

    private async Task<SupplyRequest?> GetHydratedByIdAsync(int requestId, int tenantId)
    {
        return await _context.SupplyRequests
            .Include(r => r.Branch)
            .Include(r => r.RequestedBy_User)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .Include(r => r.Orders)
                .ThenInclude(o => o.ArrivedConfirmedByUser)
            .Include(r => r.Orders)
                .ThenInclude(o => o.CompletedByUser)
            .FirstOrDefaultAsync(r => r.RequestId == requestId && r.TenantId == tenantId);
    }

    private int EnsureTenantContext()
    {
        if (!_currentUser.TenantId.HasValue)
        {
            throw new InvalidOperationException("Authenticated tenant user is required.");
        }

        return _currentUser.TenantId.Value;
    }

    private int EnsureUserContext()
    {
        if (!_currentUser.UserId.HasValue)
        {
            throw new InvalidOperationException("Authenticated user is required.");
        }

        return _currentUser.UserId.Value;
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
        var order = request.Orders?.OrderByDescending(o => o.PushedToFulfillmentAt).FirstOrDefault();

        return new SupplyRequestDto
        {
            RequestId = request.RequestId,
            BranchId = request.BranchId,
            BranchName = request.Branch?.Name ?? string.Empty,
            RequestedByUserId = request.RequestedBy_UserId,
            RequestedByName = request.RequestedBy_User == null
                ? string.Empty
                : $"{request.RequestedBy_User.FirstName} {request.RequestedBy_User.LastName}".Trim(),
            Status = request.Status.ToString(),
            RequestType = request.RequestType.ToString(),
            Priority = request.Priority.ToString(),
            DispatchWindow = request.DispatchWindow.ToString(),
            DispatchDate = request.DispatchDate,
            Notes = request.Notes,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt,

            OrderId = order?.OrderId,
            OrderStatus = order?.Status.ToString(),
            ArrivedAt = order?.ArrivedAt,
            ArrivedConfirmedByName = (order?.ArrivedConfirmedByUser != null)
                ? $"{order.ArrivedConfirmedByUser.FirstName} {order.ArrivedConfirmedByUser.LastName}".Trim() 
                : null,
            CompletedAt = order?.CompletedAt,
            CompletedByName = (order?.CompletedByUser != null)
                ? $"{order.CompletedByUser.FirstName} {order.CompletedByUser.LastName}".Trim() 
                : null,

            Items = request.Items.Select(item => new SupplyRequestItemDto
            {
                RequestItemId = item.RequestItemId,
                ItemId = item.ItemId,
                ItemName = item.Item?.Name ?? string.Empty,
                ItemSku = item.Item?.SKU ?? string.Empty,
                QuantityRequested = item.QuantityRequested,
                QuantityApproved = item.QuantityApproved,
                
                IsPicked = item.IsPicked,
                SendQuantity = item.SendQuantity,
                IsRejectedDuringPicking = item.IsRejectedDuringPicking,
                PickingRejectionReason = item.PickingRejectionReason,
                IsPacked = item.IsPacked,
                IsBranchChecked = item.IsBranchChecked
            }).ToList()
        };
    }

    private static bool IsDraftLike(SupplyRequestStatus status)
    {
        return status is SupplyRequestStatus.Draft or SupplyRequestStatus.AutoDrafted;
    }

    private static string NormalizeStatus(string? status)
    {
        if (string.Equals(status, "Auto_Drafted", StringComparison.OrdinalIgnoreCase))
        {
            return SupplyRequestStatuses.AutoDrafted;
        }

        return NormalizeOption(status, SupplyRequestStatuses.Draft);
    }

    private async Task BroadcastSupplyRequestUpdateAsync(int requestId)
    {
        // Detail
        await _hubContext.Clients.Group($"SupplyRequest_{requestId}").SendAsync("ReceiveStatusUpdate", requestId);
        
        // List
        await _hubContext.Clients.Group("SupplyRequests_All").SendAsync("ReceiveStatusUpdate", requestId);
    }
}
