using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Returns;
using Kettan.Server.Entities;
using Kettan.Server.Enums;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Inventory;

using Kettan.Server.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Kettan.Server.Services.BranchOperations;

public class ReturnService : IReturnService
{
    private static readonly ReturnStatus[] ActivePickupStatuses =
    [
        ReturnStatus.Acknowledged,
        ReturnStatus.Dispatched,
        ReturnStatus.Arrived,
        ReturnStatus.Inspecting
    ];

    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IInventoryService _inventoryService;
    private readonly IDocumentSequenceService _sequenceService;
    private readonly IHubContext<ReturnHub> _hubContext;
    private readonly IHubContext<WorkflowHub> _workflowHub;

    public ReturnService(
        ApplicationDbContext context,
        ICurrentUserService currentUser,
        INotificationService notificationService,
        IInventoryService inventoryService,
        IDocumentSequenceService sequenceService,
        IHubContext<ReturnHub> hubContext,
        IHubContext<WorkflowHub> workflowHub)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _inventoryService = inventoryService;
        _sequenceService = sequenceService;
        _hubContext = hubContext;
        _workflowHub = workflowHub;
    }

    public async Task<List<ReturnDto>> ListAsync(string? status = null, string? resolution = null)
    {
        var query = _context.Returns
            .Include(r => r.Branch)
            .Include(r => r.Order)
            .Include(r => r.SubmittedBy_User)
            .Include(r => r.PickupVehicle)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .AsQueryable();

        if (IsBranchScopedUser())
        {
            query = query.Where(r => r.BranchId == (_currentUser.BranchId ?? 0));
        }

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<ReturnStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(r => r.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(resolution) &&
            Enum.TryParse<ReturnResolution>(resolution, true, out var parsedResolution))
        {
            query = query.Where(r => r.Resolution == parsedResolution);
        }

        var rows = await query
            .OrderByDescending(r => r.LoggedAt)
            .ToListAsync();

        var returnCodes = rows.Where(r => r.Resolution == ReturnResolution.Replaced).Select(r => r.TransactionCode).ToList();
        var replacements = await _context.Orders
            .Include(o => o.SupplyRequest)
            .Where(o => o.SupplyRequest!.RequestType == RequestType.Replacement && 
                        o.SupplyRequest.ReferenceNumber != null &&
                        returnCodes.Contains(o.SupplyRequest.ReferenceNumber))
            .ToDictionaryAsync(o => o.SupplyRequest!.ReferenceNumber!);
        
        return rows.Select(r => 
        {
            replacements.TryGetValue(r.TransactionCode, out var replacement);
            return MapToDto(r, replacement);
        }).ToList();
    }

    public async Task<ReturnDto?> GetByIdAsync(int returnId)
    {
        var row = await GetReturnForReadAsync(returnId);
        if (row == null || !CanAccessReturn(row))
        {
            return null;
        }

        Order? replacementOrder = null;
        if (row.Resolution == ReturnResolution.Replaced)
        {
            replacementOrder = await _context.Orders
                .FirstOrDefaultAsync(o => o.SupplyRequest!.ReferenceNumber == row.TransactionCode && 
                                          o.SupplyRequest.RequestType == RequestType.Replacement);
        }

        return MapToDto(row, replacementOrder);
    }

    public async Task<List<ReturnEligibleOrderDto>> GetEligibleOrdersAsync()
    {
        var tenantId = EnsureTenantContext();
        var branchId = _currentUser.BranchId;
        bool isManager = _currentUser.Role == "TenantAdmin" || _currentUser.Role == "HqManager";

        if (!branchId.HasValue && !isManager)
        {
            throw new InvalidOperationException("Authenticated branch context is required.");
        }

        var query = _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(sr => sr!.Branch)
            .Include(o => o.SupplyRequest)
                .ThenInclude(sr => sr!.Items)
                    .ThenInclude(i => i.Item)
            .Where(o => o.TenantId == tenantId)
            .Where(o => o.SupplyRequest != null)
            .Where(o => o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Completed);

        if (branchId.HasValue)
        {
            query = query.Where(o => o.SupplyRequest!.BranchId == branchId.Value);
        }

        // Native filtering: exclude orders that already have an active return
        var ordersWithReturns = await _context.Returns
            .Where(r => r.TenantId == tenantId)
            .Where(r => r.Status != ReturnStatus.Rejected)
            .Select(r => r.OrderId)
            .ToListAsync();

        var rows = await query
            .Where(o => !ordersWithReturns.Contains(o.OrderId))
            .OrderByDescending(o => o.CompletedAt ?? o.ArrivedAt ?? o.PushedToFulfillmentAt)
            .ToListAsync();

        return rows.Select(MapToEligibleOrderDto).ToList();
    }

    public async Task<ReturnEligibleOrderDto?> GetEligibleOrderDetailAsync(int orderId)
    {
        var order = await LoadOrderForReturnAsync(orderId);
        if (order == null) return null;

        var dto = MapToEligibleOrderDto(order);
        var branchId = order.SupplyRequest?.BranchId;

        if (branchId.HasValue)
        {
            foreach (var item in dto.Items)
            {
                item.BranchStock = await _inventoryService.GetStockLevelAsync(item.ItemId, branchId.Value);
            }
        }

        return dto;
    }

    public async Task<ReturnDto> CreateDraftAsync(CreateReturnDraftDto dto)
    {
        var tenantId = EnsureTenantContext();
        EnsureUserContext();

        if (!_currentUser.BranchId.HasValue)
        {
            throw new InvalidOperationException("Authenticated branch context is required.");
        }

        var order = await LoadOrderForReturnAsync(dto.OrderId);
        if (order?.SupplyRequest == null)
        {
            throw new InvalidOperationException("Order was not found.");
        }

        if (order.SupplyRequest.BranchId != _currentUser.BranchId.Value)
        {
            throw new InvalidOperationException("Order does not belong to your branch.");
        }

        var parsedResolution = ParseResolution(dto.Resolution);

        var returnEntry = new Return
        {
            TenantId = tenantId,
            TransactionCode = await _sequenceService.GenerateNextCodeAsync(tenantId, "Return", "RT"),
            OrderId = dto.OrderId,
            BranchId = _currentUser.BranchId.Value,
            Subject = NormalizeSubject(dto.Subject),
            Reason = NormalizeOptional(dto.Reason),
            PhotoUrls = NormalizeOptional(dto.PhotoUrls),
            Status = ReturnStatus.Draft,
            Resolution = parsedResolution,
            LoggedAt = DateTime.UtcNow,
            Items = BuildReturnItems(tenantId, order, dto.Items)
        };

        RecalculateReturnValues(returnEntry);

        _context.Returns.Add(returnEntry);
        await _context.SaveChangesAsync();

        var hydrated = await GetByIdAsync(returnEntry.ReturnId);
        if (hydrated == null)
        {
            throw new InvalidOperationException("Unable to load created draft return.");
        }

        return hydrated;
    }

    public async Task<ReturnDto?> UpdateDraftAsync(int returnId, UpdateReturnDraftDto dto)
    {
        var tenantId = EnsureTenantContext();

        var returnEntry = await _context.Returns
            .Include(r => r.Order)
                .ThenInclude(o => o!.SupplyRequest)
                    .ThenInclude(sr => sr!.Items)
                        .ThenInclude(i => i.Item)
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.ReturnId == returnId);

        if (returnEntry == null)
        {
            return null;
        }

        if (!CanAccessReturn(returnEntry))
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Draft)
        {
            throw new InvalidOperationException("Only draft returns can be edited.");
        }

        if (returnEntry.Order?.SupplyRequest == null)
        {
            throw new InvalidOperationException("Return order context is missing.");
        }

        returnEntry.Reason = NormalizeOptional(dto.Reason);
        returnEntry.Subject = NormalizeSubject(dto.Subject);
        returnEntry.PhotoUrls = NormalizeOptional(dto.PhotoUrls);
        returnEntry.Resolution = ParseResolution(dto.Resolution);

        _context.ReturnItems.RemoveRange(returnEntry.Items);
        returnEntry.Items = BuildReturnItems(tenantId, returnEntry.Order, dto.Items);
        RecalculateReturnValues(returnEntry);

        await _context.SaveChangesAsync();
        return await GetByIdAsync(returnId);
    }

    public async Task<ReturnDto?> SubmitAsync(int returnId, SubmitReturnDto dto)
    {
        var userId = EnsureUserContext();

        var returnEntry = await GetReturnForWorkflowAsync(returnId);
        if (returnEntry == null)
        {
            return null;
        }

        if (!CanAccessReturn(returnEntry))
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Draft)
        {
            throw new InvalidOperationException("Only draft returns can be submitted.");
        }

        if (returnEntry.Items.Count == 0)
        {
            throw new InvalidOperationException("At least one return line is required before submission.");
        }

        if (returnEntry.Resolution is not (ReturnResolution.Credited or ReturnResolution.Replaced))
        {
            throw new InvalidOperationException("Expected resolution must be Credit or Replacement before submission.");
        }

        var now = DateTime.UtcNow;
        returnEntry.Status = ReturnStatus.Submitted;
        returnEntry.SubmittedAt = now;
        returnEntry.SubmittedBy_UserId = userId;

        // Consolidate notes and photos into the initial message
        var messageLines = new List<string>();
        // Also save photos on the return record from payload when submitting
        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            messageLines.Add(dto.Note.Trim());
        }

        // We should check the existing PhotoUrls and compare it to the payload if it were there.
        // Wait, dto is SubmitReturnDto. Does SubmitReturnDto have PhotoUrls? 
        // No, in previous code, the draft has the photos. 
        // Legacy global photos are no longer added to messages upon submit


        if (messageLines.Count > 0)
        {
            var msg = new ReturnMessage
            {
                TenantId = returnEntry.TenantId,
                ReturnId = returnEntry.ReturnId,
                SenderUserId = userId,
                Content = string.Join("\n", messageLines),
                SentAt = now
            };
            _context.ReturnMessages.Add(msg);
            await _context.SaveChangesAsync();

            // Broadcast it
            var hydrated = await _context.ReturnMessages
                .Include(m => m.SenderUser)
                .FirstAsync(m => m.MessageId == msg.MessageId);
            
            await _hubContext.Clients.Group($"Return_{returnEntry.ReturnId}").SendAsync("ReceiveMessage", returnEntry.ReturnId, MapMessage(hydrated));
        }
        else
        {
             await _context.SaveChangesAsync();
        }

        await _notificationService.CreateForRolesAsync(
            ["TenantAdmin", "HqManager", "HqStaff"],
            "Return Submitted",
            $"Return RT-{returnEntry.ReturnId} was submitted and is awaiting HQ review.",
            type: "ReturnSubmitted",
            referenceType: nameof(Return),
            referenceId: returnEntry.ReturnId);

        await BroadcastReturnUpdateAsync(returnId);
        return await GetByIdAsync(returnId);
    }

    public async Task<ReturnDto?> AcknowledgeAsync(int returnId, AcknowledgeReturnDto dto)
    {
        var userId = EnsureUserContext();
        EnsureHqRole();

        var returnEntry = await GetReturnForWorkflowAsync(returnId);
        if (returnEntry == null)
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Submitted)
        {
            throw new InvalidOperationException("Only submitted returns can be acknowledged.");
        }

        var resolution = string.IsNullOrWhiteSpace(dto.Resolution)
            ? returnEntry.Resolution
            : ParseResolution(dto.Resolution);

        if (resolution is not (ReturnResolution.Credited or ReturnResolution.Replaced))
        {
            throw new InvalidOperationException("Acknowledgment requires Credit or Replacement resolution.");
        }

        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == dto.VehicleId && v.TenantId == returnEntry.TenantId && v.IsActive);
        if (vehicle == null)
        {
            throw new InvalidOperationException("Selected vehicle was not found or inactive.");
        }

        var conflicts = await GetVehicleScheduleConflictsAsync(returnEntry.ReturnId, returnEntry.TenantId, dto.VehicleId, dto.PickupScheduledAt);
        if (conflicts.Count > 0 && !dto.AllowConflicts)
        {
            throw new InvalidOperationException("Selected vehicle already has a pickup schedule for that date.");
        }

        var now = DateTime.UtcNow;
        returnEntry.Status = ReturnStatus.Acknowledged;
        returnEntry.Resolution = resolution;
        returnEntry.AcknowledgedAt = now;
        returnEntry.AcknowledgedBy_UserId = userId;
        returnEntry.PickupVehicleId = dto.VehicleId;
        returnEntry.PickupScheduledAt = dto.PickupScheduledAt;
        returnEntry.PickupLastUpdatedAt = now;
        returnEntry.ResolvedAt = null;
        returnEntry.RejectionReason = null;
        returnEntry.RejectedAt = null;
        returnEntry.RejectedBy_UserId = null;

        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            _context.ReturnMessages.Add(new ReturnMessage
            {
                TenantId = returnEntry.TenantId,
                ReturnId = returnEntry.ReturnId,
                SenderUserId = userId,
                Content = dto.Note.Trim(),
                SentAt = now
            });
        }

        await _context.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            ["BranchManager", "BranchOwner"],
            "Return Pickup Scheduled",
            $"Vehicle {vehicle.PlateNumber} arriving {dto.PickupScheduledAt:MMM d, h:mm tt} - have items ready.",
            type: "ReturnPickupScheduled",
            branchId: returnEntry.BranchId,
            referenceType: nameof(Return),
            referenceId: returnEntry.ReturnId);

        var updated = await GetByIdAsync(returnId);
        if (updated == null)
        {
            return null;
        }

        updated.HasVehicleScheduleConflict = conflicts.Count > 0;
        updated.VehicleScheduleConflicts = conflicts;
        await BroadcastReturnUpdateAsync(returnId);
        return updated;
    }

    public async Task<ReturnDto?> RejectAsync(int returnId, RejectReturnDto dto)
    {
        var userId = EnsureUserContext();
        EnsureHqRole();

        var returnEntry = await GetReturnForWorkflowAsync(returnId);
        if (returnEntry == null)
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Submitted)
        {
            throw new InvalidOperationException("Only submitted returns can be rejected.");
        }

        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            throw new InvalidOperationException("Rejection reason is required.");
        }

        var now = DateTime.UtcNow;
        returnEntry.Status = ReturnStatus.Rejected;
        returnEntry.Resolution = ReturnResolution.Rejected;
        returnEntry.RejectionReason = dto.Reason.Trim();
        returnEntry.RejectedAt = now;
        returnEntry.RejectedBy_UserId = userId;
        returnEntry.ResolvedAt = now;

        _context.ReturnMessages.Add(new ReturnMessage
        {
            TenantId = returnEntry.TenantId,
            ReturnId = returnEntry.ReturnId,
            SenderUserId = userId,
            Content = $"Return rejected: {dto.Reason.Trim()}",
            SentAt = now
        });

        await _context.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            ["BranchManager", "BranchOwner"],
            "Return Rejected",
            $"Return RT-{returnEntry.ReturnId} was rejected. Reason: {dto.Reason.Trim()}",
            type: "ReturnRejected",
            branchId: returnEntry.BranchId,
            referenceType: nameof(Return),
            referenceId: returnEntry.ReturnId);

        await BroadcastReturnUpdateAsync(returnId);
        return await GetByIdAsync(returnId);
    }

    public async Task<ReturnDto?> ReschedulePickupAsync(int returnId, RescheduleReturnPickupDto dto)
    {
        var userId = EnsureUserContext();
        EnsureHqRole();

        var returnEntry = await GetReturnForWorkflowAsync(returnId);
        if (returnEntry == null)
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Acknowledged)
        {
            throw new InvalidOperationException("Pickup can only be rescheduled while return is Acknowledged.");
        }

        if (string.IsNullOrWhiteSpace(dto.Note))
        {
            throw new InvalidOperationException("A reschedule note is required.");
        }

        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == dto.VehicleId && v.TenantId == returnEntry.TenantId && v.IsActive);
        if (vehicle == null)
        {
            throw new InvalidOperationException("Selected vehicle was not found or inactive.");
        }

        var conflicts = await GetVehicleScheduleConflictsAsync(returnEntry.ReturnId, returnEntry.TenantId, dto.VehicleId, dto.PickupScheduledAt);
        if (conflicts.Count > 0 && !dto.AllowConflicts)
        {
            throw new InvalidOperationException("Selected vehicle already has a pickup schedule for that date.");
        }

        var now = DateTime.UtcNow;
        returnEntry.PickupVehicleId = dto.VehicleId;
        returnEntry.PickupScheduledAt = dto.PickupScheduledAt;
        returnEntry.PickupLastUpdatedAt = now;

        _context.ReturnMessages.Add(new ReturnMessage
        {
            TenantId = returnEntry.TenantId,
            ReturnId = returnEntry.ReturnId,
            SenderUserId = userId,
            Content = dto.Note.Trim(),
            SentAt = now
        });

        await _context.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            ["BranchManager", "BranchOwner"],
            "Return Pickup Rescheduled",
            $"Pickup updated: Vehicle {vehicle.PlateNumber} arriving {dto.PickupScheduledAt:MMM d, h:mm tt}.",
            type: "ReturnPickupRescheduled",
            branchId: returnEntry.BranchId,
            referenceType: nameof(Return),
            referenceId: returnEntry.ReturnId);

        var updated = await GetByIdAsync(returnId);
        if (updated == null)
        {
            return null;
        }

        updated.HasVehicleScheduleConflict = conflicts.Count > 0;
        updated.VehicleScheduleConflicts = conflicts;
        await BroadcastReturnUpdateAsync(returnId);
        return updated;
    }

    public async Task<ReturnDto?> ConfirmDispatchAsync(int returnId, ConfirmReturnDispatchDto dto)
    {
        var userId = EnsureUserContext();

        var returnEntry = await GetReturnForWorkflowAsync(returnId);
        if (returnEntry == null)
        {
            return null;
        }

        if (!CanAccessReturn(returnEntry))
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Acknowledged)
        {
            throw new InvalidOperationException("Only acknowledged returns can be dispatched.");
        }

        if (!returnEntry.PickupScheduledAt.HasValue || !returnEntry.PickupVehicleId.HasValue)
        {
            throw new InvalidOperationException("Pickup vehicle and schedule must be set before dispatch.");
        }

        var branchId = returnEntry.BranchId;
        foreach (var item in returnEntry.Items)
        {
            await _inventoryService.DeductStockAsync(
                item.ItemId,
                branchId,
                item.QuantityReturned,
                TransactionType.ReturnDispatch,
                remarks: $"Return RT-{returnEntry.ReturnId} dispatched from branch.",
                referenceType: ReferenceType.Return,
                referenceId: returnEntry.ReturnId);
        }

        var now = DateTime.UtcNow;
        returnEntry.Status = ReturnStatus.Dispatched;
        returnEntry.DispatchedAt = now;
        returnEntry.DispatchedBy_UserId = userId;

        if (!string.IsNullOrWhiteSpace(dto.Remarks))
        {
            _context.ReturnMessages.Add(new ReturnMessage
            {
                TenantId = returnEntry.TenantId,
                ReturnId = returnEntry.ReturnId,
                SenderUserId = userId,
                Content = dto.Remarks.Trim(),
                SentAt = now
            });
        }

        await _context.SaveChangesAsync();

        await _notificationService.CreateForRolesAsync(
            ["TenantAdmin", "HqManager", "HqStaff"],
            "Return Dispatched",
            $"Return RT-{returnEntry.ReturnId} has been handed off by branch.",
            type: "ReturnDispatched",
            referenceType: nameof(Return),
            referenceId: returnEntry.ReturnId);

        await BroadcastReturnUpdateAsync(returnId);
        return await GetByIdAsync(returnId);
    }

    public async Task<ReturnDto?> ConfirmArrivalAsync(int returnId, ConfirmReturnArrivalDto dto)
    {
        var userId = EnsureUserContext();
        EnsureHqRole();

        var returnEntry = await GetReturnForWorkflowAsync(returnId);
        if (returnEntry == null)
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Dispatched)
        {
            throw new InvalidOperationException("Only dispatched returns can be marked as arrived.");
        }

        var now = DateTime.UtcNow;
        returnEntry.Status = ReturnStatus.Arrived;
        returnEntry.ArrivedAt = now;
        returnEntry.ArrivedBy_UserId = userId;

        if (!string.IsNullOrWhiteSpace(dto.Remarks))
        {
            _context.ReturnMessages.Add(new ReturnMessage
            {
                TenantId = returnEntry.TenantId,
                ReturnId = returnEntry.ReturnId,
                SenderUserId = userId,
                Content = dto.Remarks.Trim(),
                SentAt = now
            });
        }

        await _context.SaveChangesAsync();
        await BroadcastReturnUpdateAsync(returnId);
        return await GetByIdAsync(returnId);
    }

    public async Task<ReturnDto?> StartInspectionAsync(int returnId, StartReturnInspectionDto dto)
    {
        var userId = EnsureUserContext();
        EnsureHqRole();

        var returnEntry = await GetReturnForWorkflowAsync(returnId);
        if (returnEntry == null)
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Arrived)
        {
            throw new InvalidOperationException("Only arrived returns can move to Inspecting.");
        }

        var now = DateTime.UtcNow;
        returnEntry.Status = ReturnStatus.Inspecting;
        returnEntry.InspectingAt = now;
        returnEntry.InspectedBy_UserId = userId;

        if (!string.IsNullOrWhiteSpace(dto.Remarks))
        {
            _context.ReturnMessages.Add(new ReturnMessage
            {
                TenantId = returnEntry.TenantId,
                ReturnId = returnEntry.ReturnId,
                SenderUserId = userId,
                Content = dto.Remarks.Trim(),
                SentAt = now
            });
        }

        await _context.SaveChangesAsync();
        await BroadcastReturnUpdateAsync(returnId);
        return await GetByIdAsync(returnId);
    }

    public async Task<ReturnDto?> SaveInspectionAsync(int returnId, SaveReturnInspectionDto dto)
    {
        EnsureUserContext();
        EnsureHqRole();

        var returnEntry = await GetReturnForWorkflowAsync(returnId);
        if (returnEntry == null)
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Inspecting)
        {
            throw new InvalidOperationException("Inspection details can only be updated while status is Inspecting.");
        }

        if (dto.Items.Count == 0)
        {
            throw new InvalidOperationException("At least one inspection line is required.");
        }

        var byItemId = dto.Items.ToDictionary(i => i.ReturnItemId);

        foreach (var returnItem in returnEntry.Items)
        {
            if (!byItemId.TryGetValue(returnItem.ReturnItemId, out var payload))
            {
                continue;
            }

            if (!Enum.TryParse<ReturnItemDisposition>(payload.Disposition, true, out var parsedDisposition))
            {
                throw new InvalidOperationException($"Invalid disposition for return item {returnItem.ReturnItemId}.");
            }

            var inspectedQty = payload.QuantityInspected ?? returnItem.QuantityReturned;
            if (inspectedQty <= 0)
            {
                throw new InvalidOperationException($"Inspected quantity must be greater than zero for return item {returnItem.ReturnItemId}.");
            }


            if (parsedDisposition == ReturnItemDisposition.Restock && payload.RestockBatchId.HasValue)
            {
                var restockBatchExists = await _context.Batches.AnyAsync(b =>
                    b.BatchId == payload.RestockBatchId.Value &&
                    b.TenantId == returnEntry.TenantId &&
                    b.ItemId == returnItem.ItemId &&
                    b.BranchId == null);

                if (!restockBatchExists)
                {
                    throw new InvalidOperationException($"Restock batch {payload.RestockBatchId.Value} is invalid for item {returnItem.ItemId}.");
                }
            }

            returnItem.Disposition = parsedDisposition;
            returnItem.QuantityInspected = inspectedQty;
            returnItem.RestockBatchId = parsedDisposition == ReturnItemDisposition.Restock
                ? payload.RestockBatchId
                : null;
            returnItem.InspectionRemarks = NormalizeOptional(payload.InspectionRemarks);
        }

        RecalculateReturnValues(returnEntry);
        await _context.SaveChangesAsync();
        await BroadcastReturnUpdateAsync(returnId);
        return await GetByIdAsync(returnId);
    }

    public async Task<ReturnDto?> CompleteAsync(int returnId, CompleteReturnDto dto)
    {
        var userId = EnsureUserContext();
        EnsureHqRole();

        var returnEntry = await GetReturnForWorkflowAsync(returnId);
        if (returnEntry == null)
        {
            return null;
        }

        if (returnEntry.Status != ReturnStatus.Inspecting)
        {
            throw new InvalidOperationException("Only inspecting returns can be completed.");
        }

        if (returnEntry.Items.Any(i => i.Disposition == ReturnItemDisposition.Pending))
        {
            throw new InvalidOperationException("All return items must be dispositioned before completing.");
        }

        if (returnEntry.Resolution is not (ReturnResolution.Credited or ReturnResolution.Replaced))
        {
            throw new InvalidOperationException("Return resolution must be Credit or Replacement before completing.");
        }

        var now = DateTime.UtcNow;

        await using var tx = await _context.Database.BeginTransactionAsync();
        foreach (var returnItem in returnEntry.Items)
        {
            var quantity = returnItem.QuantityInspected ?? returnItem.QuantityReturned;

            if (returnItem.Disposition == ReturnItemDisposition.Restock)
            {
                await ApplyRestockAsync(returnEntry, returnItem, quantity, userId, now);
                continue;
            }

            await ApplyWriteOffLogAsync(returnEntry, returnItem, quantity, userId, now);
        }

        if (returnEntry.Resolution == ReturnResolution.Credited)
        {
            returnEntry.CreditAmount = returnEntry.Items.Sum(i =>
            {
                var qty = i.QuantityInspected ?? i.QuantityReturned;
                var unitCost = ResolveUnitCost(i);
                return qty * unitCost;
            });
        }
        else
        {
            returnEntry.CreditAmount = null;
            await CreateReplacementOrderAsync(returnEntry, userId, now);
        }

        RecalculateReturnValues(returnEntry);

        returnEntry.Status = ReturnStatus.Completed;
        returnEntry.CompletedAt = now;
        returnEntry.CompletedBy_UserId = userId;
        returnEntry.ResolvedAt = now;

        if (!string.IsNullOrWhiteSpace(dto.Remarks))
        {
            _context.ReturnMessages.Add(new ReturnMessage
            {
                TenantId = returnEntry.TenantId,
                ReturnId = returnEntry.ReturnId,
                SenderUserId = userId,
                Content = dto.Remarks.Trim(),
                SentAt = now
            });
        }

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        await _notificationService.CreateForRolesAsync(
            ["BranchManager", "BranchOwner"],
            "Return Completed",
            $"Return RT-{returnEntry.ReturnId} has been completed as {returnEntry.Resolution}.",
            type: "ReturnCompleted",
            branchId: returnEntry.BranchId,
            referenceType: nameof(Return),
            referenceId: returnEntry.ReturnId);

        await BroadcastReturnUpdateAsync(returnId);
        return await GetByIdAsync(returnId);
    }

    public async Task<List<ReturnMessageDto>> GetMessagesAsync(int returnId)
    {
        var tenantId = EnsureTenantContext();
        var returnEntry = await _context.Returns.FirstOrDefaultAsync(r => r.ReturnId == returnId && r.TenantId == tenantId);
        if (returnEntry == null || !CanAccessReturn(returnEntry))
        {
            return [];
        }

        var messages = await _context.ReturnMessages
            .Include(m => m.SenderUser)
            .Where(m => m.ReturnId == returnId)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return messages.Select(MapMessage).ToList();
    }

    public async Task<ReturnMessageDto?> SendMessageAsync(int returnId, SendReturnMessageDto dto)
    {
        var userId = EnsureUserContext();
        var tenantId = EnsureTenantContext();
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            throw new InvalidOperationException("Message content cannot be empty.");
        }

        var returnEntry = await _context.Returns.FirstOrDefaultAsync(r => r.ReturnId == returnId && r.TenantId == tenantId);
        if (returnEntry == null || !CanAccessReturn(returnEntry))
        {
            return null;
        }

        var message = new ReturnMessage
        {
            TenantId = returnEntry.TenantId,
            ReturnId = returnId,
            SenderUserId = userId,
            Content = dto.Content.Trim(),
            SentAt = DateTime.UtcNow
        };

        _context.ReturnMessages.Add(message);
        await _context.SaveChangesAsync();

        var hydrated = await _context.ReturnMessages
            .Include(m => m.SenderUser)
            .FirstAsync(m => m.MessageId == message.MessageId);

        var dtoResult = MapMessage(hydrated);

        await _hubContext.Clients.Group($"Return_{returnId}").SendAsync("ReceiveMessage", returnId, dtoResult);

        return dtoResult;
    }

    private async Task<Order?> LoadOrderForReturnAsync(int orderId)
    {
        var tenantId = EnsureTenantContext();

        return await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(sr => sr!.Items)
                    .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(o => o.OrderId == orderId && o.TenantId == tenantId);
    }

    private List<ReturnItem> BuildReturnItems(int tenantId, Order order, List<CreateReturnDraftItemDto> items)
    {
        if (items.Count == 0)
        {
            return [];
        }

        var orderItems = order.SupplyRequest?.Items ?? [];
        var quantityByItem = orderItems
            .GroupBy(i => i.ItemId)
            .ToDictionary(
                g => g.Key,
                g => g.Sum(i => i.SendQuantity ?? i.QuantityApproved ?? i.QuantityRequested));
        var unitCostByItem = orderItems
            .GroupBy(i => i.ItemId)
            .ToDictionary(
                g => g.Key,
                g => g
                    .Select(ResolveUnitCost)
                    .DefaultIfEmpty(0)
                    .Average());

        var dedupedIds = new HashSet<int>();
        var rows = new List<ReturnItem>(items.Count);

        foreach (var line in items)
        {
            if (!dedupedIds.Add(line.ItemId))
            {
                throw new InvalidOperationException($"Duplicate item line detected for item {line.ItemId}.");
            }

            if (!quantityByItem.TryGetValue(line.ItemId, out var deliveredQty))
            {
                throw new InvalidOperationException($"Item {line.ItemId} does not belong to the selected order.");
            }

            if (line.QuantityReturned <= 0)
            {
                throw new InvalidOperationException("Returned quantity must be greater than zero.");
            }

            if (line.QuantityReturned > deliveredQty)
            {
                throw new InvalidOperationException($"Item {line.ItemId} return quantity exceeds delivered quantity.");
            }

            if (!Enum.TryParse<ReturnItemReason>(line.ReasonCode, true, out var reasonCode))
            {
                throw new InvalidOperationException($"Invalid return reason for item {line.ItemId}.");
            }

            rows.Add(new ReturnItem
            {
                TenantId = tenantId,
                ItemId = line.ItemId,
                QuantityReturned = line.QuantityReturned,
                UnitCostSnapshot = unitCostByItem.TryGetValue(line.ItemId, out var unitCost) ? unitCost : 0,
                ReasonCode = reasonCode,
                Disposition = ReturnItemDisposition.Pending,
                Notes = NormalizeOptional(line.Notes),
                PhotoUrls = NormalizeOptional(line.PhotoUrls)
            });
        }

        return rows;
    }

    private static ReturnEligibleOrderDto MapToEligibleOrderDto(Order row)
    {
        var request = row.SupplyRequest;
        var deliveredAt = row.CompletedAt ?? row.ArrivedAt ?? row.PushedToFulfillmentAt;

        return new ReturnEligibleOrderDto
        {
            OrderId = row.OrderId,
            BranchId = request?.BranchId ?? 0,
            BranchName = request?.Branch?.Name ?? string.Empty,
            ReferenceNumber = request?.ReferenceNumber,
            TransactionCode = row.TransactionCode,
            DeliveredAt = deliveredAt,
            Items = (request?.Items ?? [])
                .Select(i => new ReturnEligibleOrderItemDto
                {
                    ItemId = i.ItemId,
                    ItemName = i.Item?.Name ?? string.Empty,
                    ItemSku = i.Item?.SKU ?? string.Empty,
                    QuantityDelivered = i.SendQuantity ?? i.QuantityApproved ?? i.QuantityRequested
                })
                .Where(i => i.QuantityDelivered > 0)
                .ToList()
        };
    }

    private async Task<Return> GetReturnForReadAsync(int returnId)
    {
        var tenantId = EnsureTenantContext();

        var row = await _context.Returns
            .Include(r => r.Branch)
            .Include(r => r.Order)
            .Include(r => r.PickupVehicle)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(r => r.ReturnId == returnId && r.TenantId == tenantId);

        if (row == null)
        {
            throw new InvalidOperationException("Return was not found.");
        }

        return row;
    }

    private async Task<Return?> GetReturnForWorkflowAsync(int returnId)
    {
        var tenantId = EnsureTenantContext();

        return await _context.Returns
            .Include(r => r.Branch)
            .Include(r => r.PickupVehicle)
            .Include(r => r.Items)
                .ThenInclude(i => i.Item)
            .Include(r => r.Order)
                .ThenInclude(o => o!.SupplyRequest)
            .FirstOrDefaultAsync(r => r.ReturnId == returnId && r.TenantId == tenantId);
    }

    private async Task<List<ReturnScheduleConflictDto>> GetVehicleScheduleConflictsAsync(int returnId, int tenantId, int vehicleId, DateTime pickupScheduledAt)
    {
        var scheduleDate = pickupScheduledAt.Date;

        return await _context.Returns
            .Include(r => r.Branch)
            .Where(r => r.ReturnId != returnId)
            .Where(r => r.TenantId == tenantId)
            .Where(r => r.PickupVehicleId == vehicleId)
            .Where(r => r.PickupScheduledAt.HasValue && r.PickupScheduledAt.Value.Date == scheduleDate)
            .Where(r => ActivePickupStatuses.Contains(r.Status))
            .OrderBy(r => r.PickupScheduledAt)
            .Select(r => new ReturnScheduleConflictDto
            {
                ReturnId = r.ReturnId,
                BranchId = r.BranchId,
                BranchName = r.Branch != null ? r.Branch.Name : string.Empty,
                Status = r.Status.ToString(),
                PickupScheduledAt = r.PickupScheduledAt!.Value
            })
            .ToListAsync();
    }

    private async Task ApplyRestockAsync(Return returnEntry, ReturnItem item, decimal quantity, int userId, DateTime now)
    {
        Batch? targetBatch = null;
        if (item.RestockBatchId.HasValue)
        {
            targetBatch = await _context.Batches.FirstOrDefaultAsync(b =>
                b.BatchId == item.RestockBatchId.Value &&
                b.TenantId == returnEntry.TenantId &&
                b.ItemId == item.ItemId &&
                b.BranchId == null);
        }

        if (targetBatch == null)
        {
            targetBatch = await _context.Batches
                .Where(b => b.TenantId == returnEntry.TenantId && b.ItemId == item.ItemId && b.BranchId == null)
                .OrderBy(b => b.ExpiryDate)
                .ThenBy(b => b.BatchId)
                .FirstOrDefaultAsync();
        }

        if (targetBatch == null)
        {
            targetBatch = new Batch
            {
                TenantId = returnEntry.TenantId,
                ItemId = item.ItemId,
                BranchId = null,
                BatchNumber = $"RET-{returnEntry.ReturnId}-{item.ItemId}-{now:yyyyMMddHHmmss}",
                ExpiryDate = now.Date.AddYears(1),
                CurrentQuantity = 0,
                CreatedAt = now
            };

            _context.Batches.Add(targetBatch);
        }

        targetBatch.CurrentQuantity += quantity;

        _context.InventoryTransactions.Add(new InventoryTransaction
        {
            TenantId = returnEntry.TenantId,
            Batch = targetBatch,
            UserId = userId,
            QuantityChange = quantity,
            TransactionType = TransactionType.Restock,
            ReferenceType = ReferenceType.Return,
            ReferenceId = returnEntry.ReturnId,
            Remarks = $"Return RT-{returnEntry.ReturnId} restocked after inspection.",
            Timestamp = now
        });
    }

    private async Task ApplyWriteOffLogAsync(Return returnEntry, ReturnItem item, decimal quantity, int userId, DateTime now)
    {
        // Write-off lines should never increase HQ stock. We log against a zero-quantity ledger batch.
        var ledgerBatchNumber = $"RET-WO-{returnEntry.ReturnId}-{item.ItemId}";
        var ledgerBatch = await _context.Batches.FirstOrDefaultAsync(b =>
            b.TenantId == returnEntry.TenantId &&
            b.ItemId == item.ItemId &&
            b.BranchId == null &&
            b.BatchNumber == ledgerBatchNumber);

        if (ledgerBatch == null)
        {
            ledgerBatch = new Batch
            {
                TenantId = returnEntry.TenantId,
                ItemId = item.ItemId,
                BranchId = null,
                BatchNumber = ledgerBatchNumber,
                ExpiryDate = now.Date.AddYears(1),
                CurrentQuantity = 0,
                CreatedAt = now
            };
            _context.Batches.Add(ledgerBatch);
        }

        _context.InventoryTransactions.Add(new InventoryTransaction
        {
            TenantId = returnEntry.TenantId,
            Batch = ledgerBatch,
            UserId = userId,
            QuantityChange = 0,
            TransactionType = TransactionType.WriteOff,
            ReferenceType = ReferenceType.Return,
            ReferenceId = returnEntry.ReturnId,
            Remarks = $"Return RT-{returnEntry.ReturnId} write-off quantity {quantity:G29}.",
            Timestamp = now
        });
    }

    private async Task CreateReplacementOrderAsync(Return returnEntry, int userId, DateTime now)
    {
        var replacementRequest = new SupplyRequest
        {
            TenantId = returnEntry.TenantId,
            TransactionCode = await _sequenceService.GenerateNextCodeAsync(returnEntry.TenantId, "SupplyRequest", "SR"),
            ReferenceNumber = returnEntry.TransactionCode,
            BranchId = returnEntry.BranchId,
            RequestedBy_UserId = userId,
            Status = SupplyRequestStatus.Approved,
            RequestType = RequestType.Replacement,
            Priority = Priority.High,
            DispatchWindow = DispatchWindow.Today,
            Subject = NormalizeReplacementSubject(returnEntry.Subject, returnEntry.ReturnId),
            Notes = $"Auto-generated replacement for return RT-{returnEntry.ReturnId}.",
            CreatedAt = now,
            UpdatedAt = now,
            Items = returnEntry.Items.Select(i => new SupplyRequestItem
            {
                TenantId = returnEntry.TenantId,
                ItemId = i.ItemId,
                QuantityRequested = i.QuantityInspected ?? i.QuantityReturned,
                QuantityApproved = i.QuantityInspected ?? i.QuantityReturned,
                UnitCostSnapshot = ResolveUnitCost(i)
            }).ToList()
        };

        RecalculateSupplyRequestTotals(replacementRequest);

        _context.SupplyRequests.Add(replacementRequest);
        await _context.SaveChangesAsync();

        var replacementOrder = new Order
        {
            TenantId = returnEntry.TenantId,
            TransactionCode = await _sequenceService.GenerateNextCodeAsync(returnEntry.TenantId, "Order", "ORD"),
            RequestId = replacementRequest.RequestId,
            Status = OrderStatus.Processing,
            PushedToFulfillmentAt = now
        };
        _context.Orders.Add(replacementOrder);

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            TenantId = returnEntry.TenantId,
            Order = replacementOrder,
            Status = OrderStatus.Processing,
            ChangedBy_UserId = userId,
            Remarks = $"Auto-generated replacement order for return RT-{returnEntry.ReturnId}.",
            Timestamp = now
        });
    }

    private static ReturnMessageDto MapMessage(ReturnMessage message)
    {
        return new ReturnMessageDto
        {
            MessageId = message.MessageId,
            ReturnId = message.ReturnId,
            SenderUserId = message.SenderUserId,
            SenderName = message.SenderUser == null
                ? string.Empty
                : $"{message.SenderUser.FirstName} {message.SenderUser.LastName}".Trim(),
            SenderRole = message.SenderUser?.Role.ToString() ?? string.Empty,
            Content = message.Content,
            SentAt = message.SentAt
        };
    }

    private static ReturnDto MapToDto(Return row, Order? replacementOrder = null)
    {
        var dto = new ReturnDto
        {
            TransactionCode = row.TransactionCode,
            ReturnId = row.ReturnId,
            OrderId = row.OrderId,
            OrderTransactionCode = row.Order?.TransactionCode ?? string.Empty,
            IsOrderHqInitiated = row.Order?.IsHqInitiated ?? false,
            Subject = row.Subject,
            BranchId = row.BranchId,
            BranchName = row.Branch?.Name ?? string.Empty,
            Status = row.Status.ToString(),
            Resolution = row.Resolution.ToString(),
            Reason = row.Reason,
            RejectionReason = row.RejectionReason,
            PhotoUrls = row.PhotoUrls,
            CreditAmount = row.CreditAmount,
            TotalReturnedValue = row.TotalReturnedValue,
            TotalLossValue = row.TotalLossValue,
            PickupScheduleStatus = TransactionScheduleStatus.Resolve(row.PickupScheduledAt, row.DispatchedAt),
            SubmittedByName = row.SubmittedBy_User != null ? $"{row.SubmittedBy_User.FirstName} {row.SubmittedBy_User.LastName}".Trim() : null,
            LoggedAt = row.LoggedAt,
            SubmittedAt = row.SubmittedAt,
            AcknowledgedAt = row.AcknowledgedAt,
            DispatchedAt = row.DispatchedAt,
            ArrivedAt = row.ArrivedAt,
            InspectingAt = row.InspectingAt,
            CompletedAt = row.CompletedAt,
            RejectedAt = row.RejectedAt,
            ResolvedAt = row.ResolvedAt,
            PickupVehicleId = row.PickupVehicleId,
            PickupVehiclePlateNumber = row.PickupVehicle?.PlateNumber,
            PickupScheduledAt = row.PickupScheduledAt,
            PickupLastUpdatedAt = row.PickupLastUpdatedAt,
            ReplacementOrderId = replacementOrder?.OrderId,
            ReplacementOrderCode = replacementOrder?.TransactionCode,
            ReplacementOrderStatus = replacementOrder?.Status.ToString(),
            Items = row.Items.Select(i => new ReturnItemDto
            {
                ReturnItemId = i.ReturnItemId,
                ItemId = i.ItemId,
                ItemName = i.Item?.Name ?? string.Empty,
                ItemSku = i.Item?.SKU ?? string.Empty,
                QuantityReturned = i.QuantityReturned,
                UnitCostSnapshot = i.UnitCostSnapshot,
                QuantityInspected = i.QuantityInspected,
                ReasonCode = i.ReasonCode.ToString(),
                Disposition = i.Disposition.ToString(),
                RestockBatchId = i.RestockBatchId,
                InspectionRemarks = i.InspectionRemarks,
                Notes = i.Notes,
                PhotoUrls = i.PhotoUrls
            }).ToList()
        };

        return dto;
    }

    private static void RecalculateReturnValues(Return row)
    {
        var items = row.Items ?? [];

        row.TotalReturnedValue = Math.Round(
            items.Sum(i => i.QuantityReturned * ResolveUnitCost(i)),
            2,
            MidpointRounding.AwayFromZero);

        row.TotalLossValue = Math.Round(
            items.Sum(i => ResolveLossQuantity(i) * ResolveUnitCost(i)),
            2,
            MidpointRounding.AwayFromZero);
    }

    private static void RecalculateSupplyRequestTotals(SupplyRequest request)
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

    private static decimal ResolveLossQuantity(ReturnItem row)
    {
        return row.Disposition == ReturnItemDisposition.WriteOff
            ? (row.QuantityInspected ?? row.QuantityReturned)
            : 0;
    }

    private static decimal ResolveFulfilledQuantity(SupplyRequestItem row)
    {
        if (row.IsRejectedDuringPicking)
        {
            return 0;
        }

        return row.SendQuantity ?? row.QuantityApproved ?? 0;
    }

    private static decimal ResolveUnitCost(ReturnItem row)
    {
        if (row.UnitCostSnapshot > 0)
        {
            return row.UnitCostSnapshot;
        }

        return row.Item?.UnitCost ?? 0;
    }

    private static decimal ResolveUnitCost(SupplyRequestItem row)
    {
        if (row.UnitCostSnapshot > 0)
        {
            return row.UnitCostSnapshot;
        }

        return row.Item?.UnitCost ?? 0;
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

    private static string NormalizeReplacementSubject(string? sourceSubject, int returnId)
    {
        var baseSubject = NormalizeOptional(sourceSubject);
        var fallback = $"Replacement for RT-{returnId}";
        if (string.IsNullOrWhiteSpace(baseSubject))
        {
            return fallback;
        }

        var combined = $"Replacement: {baseSubject}";
        return combined.Length <= 80 ? combined : combined[..80];
    }

    private static ReturnResolution ParseResolution(string? value)
    {
        if (!Enum.TryParse<ReturnResolution>(value, true, out var parsed))
        {
            throw new InvalidOperationException("Invalid return resolution.");
        }

        return parsed;
    }

    private bool CanAccessReturn(Return row)
    {
        if (!IsBranchScopedUser())
        {
            return true;
        }

        return row.BranchId == (_currentUser.BranchId ?? 0);
    }

    private bool IsBranchScopedUser()
    {
        return _currentUser.BranchId.HasValue && !IsHqRole();
    }

    private bool IsHqRole()
    {
        return _currentUser.Role is "TenantAdmin" or "HqManager" or "HqStaff";
    }

    private void EnsureHqRole()
    {
        if (!IsHqRole())
        {
            throw new InvalidOperationException("Only HQ roles can perform this action.");
        }
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

    private static string? NormalizeOptional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private async Task BroadcastReturnUpdateAsync(int returnId)
    {
        // Notify both detail and list subscribers via WorkflowHub
        await _workflowHub.Clients.Group($"Return_{returnId}").SendAsync("ReceiveStatusUpdate", returnId);
        await _workflowHub.Clients.Group("Returns_All").SendAsync("ReceiveStatusUpdate", returnId);
    }
}
