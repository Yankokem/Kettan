using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.BranchOperations;
using Kettan.Server.Enums;

namespace Kettan.Server.Services.Inventory;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;
    private readonly IDocumentSequenceService _sequenceService;

    public InventoryService(
        ApplicationDbContext context, 
        ICurrentUserService currentUser,
        INotificationService notificationService,
        IDocumentSequenceService sequenceService)
    {
        _context = context;
        _currentUser = currentUser;
        _notificationService = notificationService;
        _sequenceService = sequenceService;
    }

    public async Task<StockInResult> StockInAsync(int itemId, decimal quantity, string batchNumber, DateTime expiryDate, decimal unitCost, int? supplierId = null, decimal? defaultThreshold = null, string? remarks = null)
    {
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        var transCode = await _sequenceService.GenerateNextCodeAsync(tenantId, "Inventory", "IV");

        if (quantity <= 0)
        {
            throw new InvalidOperationException("Stock-in quantity must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(batchNumber))
        {
            throw new InvalidOperationException("Batch number is required.");
        }

        var item = await GetTenantItemAsync(itemId, tenantId);

        var branchId = _currentUser.BranchId;

        // --- Weighted Average Costing (WAC) Logic ---
        var currentStock = await GetStockLevelAsync(itemId, branchId);
        
        item.PreviousUnitCost = item.UnitCost;
        if (currentStock > 0)
        {
            var totalValue = (currentStock * item.UnitCost) + (quantity * unitCost);
            item.UnitCost = totalValue / (currentStock + quantity);
        }
        else
        {
            item.UnitCost = unitCost;
        }

        // Update other metadata if provided
        var now = DateTime.UtcNow;

        if (supplierId.HasValue)
        {
            await EnsureTenantSupplierAsync(supplierId.Value, tenantId);

            // Append supplier to the many-to-many list (ignore if already linked)
            var alreadyLinked = await _context.ItemSuppliers
                .AnyAsync(s => s.ItemId == itemId && s.SupplierId == supplierId.Value);

            if (!alreadyLinked)
            {
                _context.ItemSuppliers.Add(new ItemSupplier
                {
                    ItemId = itemId,
                    SupplierId = supplierId.Value,
                    LinkedAt = now
                });
            }
        }

        // Always overwrite threshold when a new one is explicitly provided
        if (defaultThreshold.HasValue) item.DefaultThreshold = defaultThreshold.Value;

        item.UpdatedAt = DateTime.UtcNow;
        // --------------------------------------------

        var batch = new Batch
        {
            TenantId = tenantId,
            ItemId = itemId,
            BranchId = branchId,
            BatchNumber = batchNumber.Trim(),
            ExpiryDate = expiryDate.Date,
            CurrentQuantity = quantity,
            CreatedAt = now
        };

        _context.Batches.Add(batch);
        await _context.SaveChangesAsync();

        _context.InventoryTransactions.Add(new InventoryTransaction
        {
            TenantId = tenantId,
            TransactionCode = transCode,
            BatchId = batch.BatchId,
            UserId = userId,
            QuantityChange = quantity,
            TransactionType = TransactionType.Restock,
            ReferenceType = ReferenceType.StockIn,
            ReferenceId = itemId,
            Remarks = remarks,
            Timestamp = now
        });

        await _context.SaveChangesAsync();

        return new StockInResult
        {
            BatchId = batch.BatchId,
            ItemId = batch.ItemId,
            BranchId = batch.BranchId,
            BatchNumber = batch.BatchNumber,
            ExpiryDate = batch.ExpiryDate,
            QuantityAdded = quantity,
            CurrentQuantity = batch.CurrentQuantity,
            CreatedAt = batch.CreatedAt
        };
    }

    public Task<List<StockDeductionResult>> StockOutAsync(int itemId, decimal quantity, string reason, string? remarks = null)
    {
        var note = string.IsNullOrWhiteSpace(remarks)
            ? reason
            : $"{reason}: {remarks}";

        return DeductStockAsync(
            itemId,
            branchId: _currentUser.BranchId,
            quantity,
            transactionType: TransactionType.PhysicalCount,
            remarks: note,
            referenceType: ReferenceType.StockOut,
            referenceId: itemId);
    }

    public async Task<List<StockDeductionResult>> DeductStockAsync(
        int itemId,
        int? branchId,
        decimal quantity,
        TransactionType transactionType,
        string? remarks = null,
        ReferenceType? referenceType = null,
        int? referenceId = null)
    {
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        var transCode = await _sequenceService.GenerateNextCodeAsync(tenantId, "Inventory", "IV");

        if (quantity <= 0)
        {
            throw new InvalidOperationException("Deduction quantity must be greater than zero.");
        }

        if (branchId.HasValue)
        {
            await EnsureTenantBranchAsync(branchId.Value, tenantId);
        }

        await GetTenantItemAsync(itemId, tenantId);

        var batchesQuery = _context.Batches
            .Where(b => b.ItemId == itemId && b.CurrentQuantity > 0);

        batchesQuery = branchId.HasValue
            ? batchesQuery.Where(b => b.BranchId == branchId.Value)
            : batchesQuery.Where(b => b.BranchId == null);

        var batches = await batchesQuery
            .OrderBy(b => b.ExpiryDate)
            .ThenBy(b => b.CreatedAt)
            .ThenBy(b => b.BatchId)
            .ToListAsync();

        var available = batches.Sum(b => b.CurrentQuantity);
        if (available < quantity)
        {
            throw new InvalidOperationException($"Insufficient stock for item {itemId}. Needed {quantity}, available {available}.");
        }

        var now = DateTime.UtcNow;
        var remaining = quantity;
        var deductions = new List<StockDeductionResult>();

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
                TenantId = tenantId,
                TransactionCode = transCode,
                BatchId = batch.BatchId,
                UserId = userId,
                QuantityChange = -consume,
                TransactionType = transactionType,
                ReferenceType = referenceType,
                ReferenceId = referenceId,
                Remarks = remarks,
                Timestamp = now
            });

            deductions.Add(new StockDeductionResult
            {
                BatchId = batch.BatchId,
                BatchNumber = batch.BatchNumber,
                QuantityDeducted = consume,
                RemainingBatchQuantity = batch.CurrentQuantity
            });
        }

        await _context.SaveChangesAsync();
        await CheckThresholdAndNotifyAsync(itemId, branchId);

        return deductions;
    }

    public async Task<decimal> GetStockLevelAsync(int itemId, int? branchId = null)
    {
        var tenantId = EnsureTenantContext();
        await GetTenantItemAsync(itemId, tenantId);

        if (branchId.HasValue)
        {
            await EnsureTenantBranchAsync(branchId.Value, tenantId, requireActive: false);
        }

        var query = _context.Batches
            .Where(b => b.ItemId == itemId);

        query = branchId.HasValue
            ? query.Where(b => b.BranchId == branchId.Value)
            : query.Where(b => b.BranchId == null);

        var level = await query
            .SumAsync(b => (decimal?)b.CurrentQuantity) ?? 0;

        return level;
    }

    public async Task<List<ThresholdAlertResult>> CheckThresholdsAsync(int? branchId = null)
    {
        var tenantId = EnsureTenantContext();

        if (branchId.HasValue)
        {
            var branchExists = await _context.Branches.AnyAsync(b => b.BranchId == branchId.Value && b.TenantId == tenantId && b.IsActive);
            if (!branchExists)
            {
                throw new InvalidOperationException("Branch was not found.");
            }
        }

        var stockQuery = _context.Batches.AsQueryable();

        stockQuery = branchId.HasValue
            ? stockQuery.Where(b => b.BranchId == branchId.Value)
            : stockQuery.Where(b => b.BranchId == null);

        var stockLookup = await stockQuery
            .GroupBy(b => b.ItemId)
            .Select(g => new
            {
                ItemId = g.Key,
                StockLevel = g.Sum(x => x.CurrentQuantity)
            })
            .ToDictionaryAsync(x => x.ItemId, x => x.StockLevel);

        var items = await _context.Items
            .Where(i => i.DefaultThreshold > 0)
            .OrderBy(i => i.Name)
            .Select(i => new
            {
                i.ItemId,
                i.Name,
                i.SKU,
                i.DefaultThreshold
            })
            .ToListAsync();

        var alerts = items
            .Select(i =>
            {
                var stock = stockLookup.TryGetValue(i.ItemId, out var value) ? value : 0;
                return new ThresholdAlertResult
                {
                    ItemId = i.ItemId,
                    ItemName = i.Name,
                    ItemSku = i.SKU,
                    BranchId = branchId,
                    StockLevel = stock,
                    Threshold = i.DefaultThreshold
                };
            })
            .Where(a => a.StockLevel <= a.Threshold)
            .ToList();

        return alerts;
    }

    public async Task<StockTransferResult> TransferToBranchAsync(int batchId, int branchId, decimal quantity, string? remarks = null)
    {
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        var transCode = await _sequenceService.GenerateNextCodeAsync(tenantId, "Inventory", "IV");

        if (quantity <= 0)
        {
            throw new InvalidOperationException("Transfer quantity must be greater than zero.");
        }

        var sourceBatch = await GetTenantBatchAsync(batchId, tenantId);

        if (sourceBatch.BranchId.HasValue)
        {
            throw new InvalidOperationException("Only HQ batches can be transferred using this method.");
        }

        if (sourceBatch.CurrentQuantity < quantity)
        {
            throw new InvalidOperationException("Transfer quantity exceeds source batch stock.");
        }

        await EnsureTenantBranchAsync(branchId, tenantId);

        var targetBatch = await _context.Batches
            .FirstOrDefaultAsync(b =>
                b.TenantId == tenantId &&
                b.ItemId == sourceBatch.ItemId &&
                b.BranchId == branchId &&
                b.BatchNumber == sourceBatch.BatchNumber &&
                b.ExpiryDate == sourceBatch.ExpiryDate);

        var now = DateTime.UtcNow;

        sourceBatch.CurrentQuantity -= quantity;

        if (targetBatch == null)
        {
            targetBatch = new Batch
            {
                TenantId = tenantId,
                ItemId = sourceBatch.ItemId,
                BranchId = branchId,
                BatchNumber = sourceBatch.BatchNumber,
                ExpiryDate = sourceBatch.ExpiryDate,
                CurrentQuantity = quantity,
                CreatedAt = now
            };

            _context.Batches.Add(targetBatch);
            await _context.SaveChangesAsync();
        }
        else
        {
            targetBatch.CurrentQuantity += quantity;
        }

        _context.InventoryTransactions.Add(new InventoryTransaction
        {
            TenantId = tenantId,
            TransactionCode = transCode,
            BatchId = sourceBatch.BatchId,
            UserId = userId,
            QuantityChange = -quantity,
            TransactionType = TransactionType.Transfer,
            ReferenceType = ReferenceType.Branch,
            ReferenceId = branchId,
            Remarks = remarks,
            Timestamp = now
        });

        _context.InventoryTransactions.Add(new InventoryTransaction
        {
            TenantId = tenantId,
            TransactionCode = transCode,
            BatchId = targetBatch.BatchId,
            UserId = userId,
            QuantityChange = quantity,
            TransactionType = TransactionType.Transfer,
            ReferenceType = ReferenceType.Batch,
            ReferenceId = sourceBatch.BatchId,
            Remarks = remarks,
            Timestamp = now
        });

        await _context.SaveChangesAsync();
        await CheckThresholdAndNotifyAsync(sourceBatch.ItemId, null);

        return new StockTransferResult
        {
            SourceBatchId = sourceBatch.BatchId,
            TargetBatchId = targetBatch.BatchId,
            ItemId = sourceBatch.ItemId,
            FromBranchId = sourceBatch.BranchId,
            ToBranchId = branchId,
            QuantityTransferred = quantity
        };
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

    private async Task<Item> GetTenantItemAsync(int itemId, int tenantId)
    {
        var item = await _context.Items.FirstOrDefaultAsync(i => i.ItemId == itemId && i.TenantId == tenantId);
        if (item == null)
        {
            throw new InvalidOperationException("Item was not found.");
        }

        return item;
    }

    private async Task<Batch> GetTenantBatchAsync(int batchId, int tenantId)
    {
        var batch = await _context.Batches.FirstOrDefaultAsync(b => b.BatchId == batchId && b.TenantId == tenantId);
        if (batch == null)
        {
            throw new InvalidOperationException("Source batch was not found.");
        }

        return batch;
    }

    private async Task EnsureTenantSupplierAsync(int supplierId, int tenantId)
    {
        var supplierExists = await _context.Suppliers.AnyAsync(s => s.SupplierId == supplierId && s.TenantId == tenantId && s.IsActive);
        if (!supplierExists)
        {
            throw new InvalidOperationException("Supplier was not found.");
        }
    }

    private async Task EnsureTenantBranchAsync(int branchId, int tenantId, bool requireActive = true)
    {
        var branchExists = requireActive
            ? await _context.Branches.AnyAsync(b => b.BranchId == branchId && b.TenantId == tenantId && b.IsActive)
            : await _context.Branches.AnyAsync(b => b.BranchId == branchId && b.TenantId == tenantId);

        if (!branchExists)
        {
            throw new InvalidOperationException("Branch was not found.");
        }
    }

    private async Task CheckThresholdAndNotifyAsync(int itemId, int? branchId)
    {
        var item = await _context.Items.AsNoTracking().FirstOrDefaultAsync(i => i.ItemId == itemId);
        if (item == null) return;

        var threshold = item.DefaultThreshold;
        if (branchId.HasValue)
        {
            var custom = await _context.BranchItemSettings
                .Where(s => s.BranchId == branchId.Value && s.ItemId == itemId)
                .Select(s => (decimal?)s.LowStockThreshold)
                .FirstOrDefaultAsync();
            if (custom.HasValue) threshold = custom.Value;
        }

        if (threshold <= 0) return;

        var currentStock = await GetStockLevelAsync(itemId, branchId);
        if (currentStock <= threshold)
        {
            if (branchId.HasValue)
            {
                await _notificationService.CreateForRolesAsync(
                    ["BranchManager", "BranchOwner"],
                    "Low Stock Alert",
                    $"Stock for {item.Name} has dropped to {currentStock:G29} (below threshold of {threshold:G29}).",
                    type: "LowStock",
                    branchId: branchId.Value);
            }
            else
            {
                await _notificationService.CreateForRolesAsync(
                    ["HqManager", "TenantAdmin"],
                    "Low Stock Alert (HQ)",
                    $"HQ Stock for {item.Name} has dropped to {currentStock:G29} (below threshold of {threshold:G29}).",
                    type: "LowStock");
            }
        }
    }
}
