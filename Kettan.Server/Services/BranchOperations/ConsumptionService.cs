using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Consumption;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Services.BranchOperations;

public class ConsumptionService : IConsumptionService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ConsumptionService(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ConsumptionLogDto> LogSalesAsync(LogSalesConsumptionDto dto)
    {
        EnsureBranchUserContext();

        if (dto.Sales.Count == 0)
        {
            throw new InvalidOperationException("At least one sales line is required.");
        }

        var menuItemIds = dto.Sales.Select(s => s.MenuItemId).Distinct().ToList();
        var ingredients = await _context.MenuItemIngredients
            .Include(i => i.MenuItem)
            .Include(i => i.Item)
            .Where(i => menuItemIds.Contains(i.MenuItemId))
            .ToListAsync();

        var log = new ConsumptionLog
        {
            TenantId = _currentUser.TenantId!.Value,
            BranchId = _currentUser.BranchId!.Value,
            LoggedBy_UserId = _currentUser.UserId!.Value,
            Method = "Sales",
            Shift = dto.Shift,
            LogDate = dto.LogDate,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow,
            Items = []
        };

        _context.ConsumptionLogs.Add(log);
        await _context.SaveChangesAsync();

        foreach (var salesLine in dto.Sales)
        {
            if (salesLine.QuantitySold <= 0)
            {
                continue;
            }

            var ingredientRows = ingredients.Where(i => i.MenuItemId == salesLine.MenuItemId).ToList();
            if (ingredientRows.Count == 0)
            {
                throw new InvalidOperationException($"Menu item {salesLine.MenuItemId} has no ingredient mapping.");
            }

            foreach (var ingredient in ingredientRows)
            {
                var requiredQty = ingredient.QuantityPerUnit * salesLine.QuantitySold;

                if (requiredQty <= 0)
                {
                    continue;
                }

                await DeductFromBranchBatchesAsync(
                    branchId: _currentUser.BranchId.Value,
                    itemId: ingredient.ItemId,
                    quantityToDeduct: requiredQty,
                    transactionType: "Sales_Auto",
                    referenceType: nameof(ConsumptionLog),
                    referenceId: log.ConsumptionLogId,
                    remarks: $"Auto deduction from menu item {ingredient.MenuItem?.Name ?? ingredient.MenuItemId.ToString()}");

                log.Items.Add(new ConsumptionLogItem
                {
                    TenantId = _currentUser.TenantId.Value,
                    ConsumptionLogId = log.ConsumptionLogId,
                    MenuItemId = salesLine.MenuItemId,
                    ItemId = ingredient.ItemId,
                    Quantity = requiredQty,
                    Reason = "Sales_Auto"
                });
            }
        }

        await _context.SaveChangesAsync();

        return new ConsumptionLogDto
        {
            ConsumptionLogId = log.ConsumptionLogId,
            BranchId = log.BranchId,
            Method = log.Method,
            Shift = log.Shift,
            LogDate = log.LogDate,
            Remarks = log.Remarks,
            CreatedAt = log.CreatedAt
        };
    }

    public async Task<ConsumptionLogDto> LogDirectAsync(LogDirectConsumptionDto dto)
    {
        EnsureBranchUserContext();

        if (dto.Items.Count == 0)
        {
            throw new InvalidOperationException("At least one direct-consumption line is required.");
        }

        var log = new ConsumptionLog
        {
            TenantId = _currentUser.TenantId!.Value,
            BranchId = _currentUser.BranchId!.Value,
            LoggedBy_UserId = _currentUser.UserId!.Value,
            Method = "Direct",
            Shift = dto.Shift,
            LogDate = dto.LogDate,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow,
            Items = []
        };

        _context.ConsumptionLogs.Add(log);
        await _context.SaveChangesAsync();

        foreach (var line in dto.Items)
        {
            if (line.Quantity <= 0)
            {
                continue;
            }

            await DeductFromBranchBatchesAsync(
                branchId: _currentUser.BranchId.Value,
                itemId: line.ItemId,
                quantityToDeduct: line.Quantity,
                transactionType: "Consumption",
                referenceType: nameof(ConsumptionLog),
                referenceId: log.ConsumptionLogId,
                remarks: line.Reason);

            log.Items.Add(new ConsumptionLogItem
            {
                TenantId = _currentUser.TenantId.Value,
                ConsumptionLogId = log.ConsumptionLogId,
                ItemId = line.ItemId,
                Quantity = line.Quantity,
                Reason = line.Reason
            });
        }

        await _context.SaveChangesAsync();

        return new ConsumptionLogDto
        {
            ConsumptionLogId = log.ConsumptionLogId,
            BranchId = log.BranchId,
            Method = log.Method,
            Shift = log.Shift,
            LogDate = log.LogDate,
            Remarks = log.Remarks,
            CreatedAt = log.CreatedAt
        };
    }

    public async Task<List<ConsumptionLogDto>> ListAsync(DateTime? from = null, DateTime? to = null, string? method = null)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return [];
        }

        var query = _context.ConsumptionLogs.AsQueryable();

        if (_currentUser.BranchId.HasValue)
        {
            query = query.Where(c => c.BranchId == _currentUser.BranchId.Value);
        }

        if (from.HasValue)
        {
            query = query.Where(c => c.LogDate >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(c => c.LogDate <= to.Value);
        }

        if (!string.IsNullOrWhiteSpace(method))
        {
            query = query.Where(c => c.Method == method);
        }

        return await query
            .OrderByDescending(c => c.LogDate)
            .Select(c => new ConsumptionLogDto
            {
                ConsumptionLogId = c.ConsumptionLogId,
                BranchId = c.BranchId,
                Method = c.Method,
                Shift = c.Shift,
                LogDate = c.LogDate,
                Remarks = c.Remarks,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();
    }

    private async Task DeductFromBranchBatchesAsync(
        int branchId,
        int itemId,
        decimal quantityToDeduct,
        string transactionType,
        string? referenceType,
        int? referenceId,
        string? remarks)
    {
        var batches = await _context.Batches
            .Where(b => b.BranchId == branchId && b.ItemId == itemId && b.CurrentQuantity > 0)
            .OrderBy(b => b.ExpiryDate)
            .ThenBy(b => b.CreatedAt)
            .ToListAsync();

        var available = batches.Sum(b => b.CurrentQuantity);
        if (available < quantityToDeduct)
        {
            throw new InvalidOperationException($"Insufficient stock for item {itemId}. Needed {quantityToDeduct}, available {available}.");
        }

        var remaining = quantityToDeduct;

        foreach (var batch in batches)
        {
            if (remaining <= 0)
            {
                break;
            }

            var consume = Math.Min(batch.CurrentQuantity, remaining);
            if (consume <= 0)
            {
                continue;
            }

            batch.CurrentQuantity -= consume;
            remaining -= consume;

            _context.InventoryTransactions.Add(new InventoryTransaction
            {
                TenantId = _currentUser.TenantId!.Value,
                BatchId = batch.BatchId,
                UserId = _currentUser.UserId!.Value,
                QuantityChange = -consume,
                TransactionType = transactionType,
                ReferenceType = referenceType,
                ReferenceId = referenceId,
                Remarks = remarks,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    private void EnsureBranchUserContext()
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue || !_currentUser.BranchId.HasValue)
        {
            throw new InvalidOperationException("Authenticated branch user context is required.");
        }
    }
}
