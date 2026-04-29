using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Consumption;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Inventory;
using Kettan.Server.Enums;

namespace Kettan.Server.Services.BranchOperations;

public class ConsumptionService : IConsumptionService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IInventoryService _inventoryService;

    public ConsumptionService(
        ApplicationDbContext context, 
        ICurrentUserService currentUser,
        IInventoryService inventoryService)
    {
        _context = context;
        _currentUser = currentUser;
        _inventoryService = inventoryService;
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
            Method = ConsumptionMethod.Sales,
            Shift = Enum.TryParse<Shift>(dto.Shift, true, out var shift) ? shift : (Shift?)null,
            LogDate = dto.LogDate,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow,
            Items = []
        };

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.ConsumptionLogs.Add(log);
            await _context.SaveChangesAsync();

            foreach (var salesLine in dto.Sales)
            {
                if (salesLine.QuantitySold <= 0) continue;

                var ingredientRows = ingredients.Where(i => i.MenuItemId == salesLine.MenuItemId).ToList();
                if (ingredientRows.Count == 0)
                {
                    throw new InvalidOperationException($"Menu item {salesLine.MenuItemId} has no ingredient mapping.");
                }

                foreach (var ingredient in ingredientRows)
                {
                    var requiredQty = ingredient.QuantityPerUnit * salesLine.QuantitySold;

                    if (requiredQty <= 0) continue;

                    await _inventoryService.DeductFifoAsync(
                        itemId: ingredient.ItemId,
                        branchId: _currentUser.BranchId.Value,
                        quantity: requiredQty,
                        transactionType: TransactionType.SalesAuto,
                        remarks: $"Auto deduction from menu item {ingredient.MenuItem?.Name ?? ingredient.MenuItemId.ToString()}",
                        referenceType: ReferenceType.ConsumptionLog,
                        referenceId: log.ConsumptionLogId);

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
            await transaction.CommitAsync();

            return new ConsumptionLogDto
            {
                ConsumptionLogId = log.ConsumptionLogId,
                BranchId = log.BranchId,
                Method = log.Method.ToString(),
                Shift = log.Shift?.ToString(),
                LogDate = log.LogDate,
                Remarks = log.Remarks,
                CreatedAt = log.CreatedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
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
            Method = ConsumptionMethod.Direct,
            Shift = Enum.TryParse<Shift>(dto.Shift, true, out var shift) ? shift : (Shift?)null,
            LogDate = dto.LogDate,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow,
            Items = []
        };

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.ConsumptionLogs.Add(log);
            await _context.SaveChangesAsync();

            foreach (var line in dto.Items)
            {
                if (line.Quantity <= 0) continue;

                await _inventoryService.DeductFifoAsync(
                    itemId: line.ItemId,
                    branchId: _currentUser.BranchId.Value,
                    quantity: line.Quantity,
                    transactionType: TransactionType.Consumption,
                    remarks: line.Reason,
                    referenceType: ReferenceType.ConsumptionLog,
                    referenceId: log.ConsumptionLogId);

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
            await transaction.CommitAsync();

            return new ConsumptionLogDto
            {
                ConsumptionLogId = log.ConsumptionLogId,
                BranchId = log.BranchId,
                Method = log.Method.ToString(),
                Shift = log.Shift?.ToString(),
                LogDate = log.LogDate,
                Remarks = log.Remarks,
                CreatedAt = log.CreatedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<ConsumptionLogDto>> ListAsync(DateTime? from = null, DateTime? to = null, string? method = null, int? branchId = null)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return [];
        }

        var query = _context.ConsumptionLogs.AsQueryable();

        if (branchId.HasValue)
        {
            query = query.Where(c => c.BranchId == branchId.Value);
        }
        else if (_currentUser.BranchId.HasValue)
        {
            query = query.Where(c => c.BranchId == _currentUser.BranchId.Value);
        }

        if (from.HasValue) query = query.Where(c => c.LogDate >= from.Value);
        if (to.HasValue) query = query.Where(c => c.LogDate <= to.Value);
        if (!string.IsNullOrWhiteSpace(method))
        {
            if (Enum.TryParse<ConsumptionMethod>(method, true, out var parsedMethod))
            {
                query = query.Where(c => c.Method == parsedMethod);
            }
        }

        return await query
            .OrderByDescending(c => c.LogDate)
            .Select(c => new ConsumptionLogDto
            {
                ConsumptionLogId = c.ConsumptionLogId,
                BranchId = c.BranchId,
                Method = c.Method.ToString(),
                Shift = c.Shift.HasValue ? c.Shift.Value.ToString() : null,
                LogDate = c.LogDate,
                Remarks = c.Remarks,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<PreviewDeductionDto>> PreviewDeductionsAsync(List<SalesConsumptionLineDto> sales)
    {
        EnsureBranchUserContext();

        var menuItemIds = sales.Select(s => s.MenuItemId).Distinct().ToList();
        var ingredients = await _context.MenuItemIngredients
            .Include(i => i.Item)
            .Where(i => menuItemIds.Contains(i.MenuItemId))
            .ToListAsync();

        var consolidated = new Dictionary<int, PreviewDeductionDto>();

        foreach (var salesLine in sales)
        {
            if (salesLine.QuantitySold <= 0) continue;

            var itemIngredients = ingredients.Where(i => i.MenuItemId == salesLine.MenuItemId).ToList();

            foreach (var ingredient in itemIngredients)
            {
                var requiredQty = ingredient.QuantityPerUnit * salesLine.QuantitySold;
                
                if (consolidated.TryGetValue(ingredient.ItemId, out var existing))
                {
                    existing.RequiredQuantity += requiredQty;
                }
                else
                {
                    consolidated[ingredient.ItemId] = new PreviewDeductionDto
                    {
                        ItemId = ingredient.ItemId,
                        ItemName = ingredient.Item?.Name ?? "Unknown Item",
                        RequiredQuantity = requiredQty,
                        CurrentStock = 0 // Will populate next
                    };
                }
            }
        }

        var itemIds = consolidated.Keys.ToList();
        var stocks = await _inventoryService.CheckThresholdsAsync(_currentUser.BranchId!.Value);
        // Wait, CheckThresholdsAsync only returns below threshold stock! I need GetStockLevelAsync!
        
        foreach (var previewItem in consolidated.Values)
        {
            previewItem.CurrentStock = await _inventoryService.GetStockLevelAsync(previewItem.ItemId, _currentUser.BranchId.Value);
        }

        return consolidated.Values.ToList();
    }

    private void EnsureBranchUserContext()
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.TenantId.HasValue || !_currentUser.UserId.HasValue || !_currentUser.BranchId.HasValue)
        {
            throw new InvalidOperationException("Authenticated branch user context is required.");
        }
    }
}
