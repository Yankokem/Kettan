using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Services.Inventory;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public InventoryService(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<StockInResult> StockInAsync(int itemId, decimal quantity, string batchNumber, DateTime expiryDate, string? remarks = null)
    {
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        if (quantity <= 0)
        {
            throw new InvalidOperationException("Stock-in quantity must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(batchNumber))
        {
            throw new InvalidOperationException("Batch number is required.");
        }

        var itemExists = await _context.Items.AnyAsync(i => i.ItemId == itemId);
        if (!itemExists)
        {
            throw new InvalidOperationException("Item was not found.");
        }

        var now = DateTime.UtcNow;

        var batch = new Batch
        {
            TenantId = tenantId,
            ItemId = itemId,
            BranchId = null,
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
            BatchId = batch.BatchId,
            UserId = userId,
            QuantityChange = quantity,
            TransactionType = "Restock",
            ReferenceType = "StockIn",
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

    public Task<List<FifoDeductionResult>> StockOutAsync(int itemId, decimal quantity, string reason, string? remarks = null)
    {
        var note = string.IsNullOrWhiteSpace(remarks)
            ? reason
            : $"{reason}: {remarks}";

        return DeductFifoAsync(
            itemId,
            branchId: null,
            quantity,
            transactionType: "Physical_Count",
            remarks: note,
            referenceType: "StockOut",
            referenceId: itemId);
    }

    public async Task<List<FifoDeductionResult>> DeductFifoAsync(
        int itemId,
        int? branchId,
        decimal quantity,
        string transactionType,
        string? remarks = null,
        string? referenceType = null,
        int? referenceId = null)
    {
        var tenantId = EnsureTenantContext();
        var userId = EnsureUserContext();

        if (quantity <= 0)
        {
            throw new InvalidOperationException("Deduction quantity must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(transactionType))
        {
            throw new InvalidOperationException("Transaction type is required.");
        }

        var itemExists = await _context.Items.AnyAsync(i => i.ItemId == itemId);
        if (!itemExists)
        {
            throw new InvalidOperationException("Item was not found.");
        }

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
        var deductions = new List<FifoDeductionResult>();

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
                BatchId = batch.BatchId,
                UserId = userId,
                QuantityChange = -consume,
                TransactionType = transactionType,
                ReferenceType = referenceType,
                ReferenceId = referenceId,
                Remarks = remarks,
                Timestamp = now
            });

            deductions.Add(new FifoDeductionResult
            {
                BatchId = batch.BatchId,
                BatchNumber = batch.BatchNumber,
                QuantityDeducted = consume,
                RemainingBatchQuantity = batch.CurrentQuantity
            });
        }

        await _context.SaveChangesAsync();

        return deductions;
    }

    public async Task<decimal> GetStockLevelAsync(int itemId, int? branchId = null)
    {
        EnsureTenantContext();

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
        EnsureTenantContext();

        if (branchId.HasValue)
        {
            var branchExists = await _context.Branches.AnyAsync(b => b.BranchId == branchId.Value && b.IsActive);
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

        if (quantity <= 0)
        {
            throw new InvalidOperationException("Transfer quantity must be greater than zero.");
        }

        var sourceBatch = await _context.Batches.FirstOrDefaultAsync(b => b.BatchId == batchId);
        if (sourceBatch == null)
        {
            throw new InvalidOperationException("Source batch was not found.");
        }

        if (sourceBatch.BranchId.HasValue)
        {
            throw new InvalidOperationException("Only HQ batches can be transferred using this method.");
        }

        if (sourceBatch.CurrentQuantity < quantity)
        {
            throw new InvalidOperationException("Transfer quantity exceeds source batch stock.");
        }

        var branchExists = await _context.Branches.AnyAsync(b => b.BranchId == branchId && b.IsActive);
        if (!branchExists)
        {
            throw new InvalidOperationException("Target branch was not found.");
        }

        var targetBatch = await _context.Batches
            .FirstOrDefaultAsync(b =>
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
            BatchId = sourceBatch.BatchId,
            UserId = userId,
            QuantityChange = -quantity,
            TransactionType = "Transfer",
            ReferenceType = "Branch",
            ReferenceId = branchId,
            Remarks = remarks,
            Timestamp = now
        });

        _context.InventoryTransactions.Add(new InventoryTransaction
        {
            TenantId = tenantId,
            BatchId = targetBatch.BatchId,
            UserId = userId,
            QuantityChange = quantity,
            TransactionType = "Transfer",
            ReferenceType = "Batch",
            ReferenceId = sourceBatch.BatchId,
            Remarks = remarks,
            Timestamp = now
        });

        await _context.SaveChangesAsync();

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
}
