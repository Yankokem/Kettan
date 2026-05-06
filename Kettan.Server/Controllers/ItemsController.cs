using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Items;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Inventory;
using Kettan.Server.Enums;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/items")]
[Authorize]
public class ItemsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IInventoryService _inventoryService;

    public ItemsController(
        ApplicationDbContext context,
        ICurrentUserService currentUser,
        IInventoryService inventoryService)
    {
        _context = context;
        _currentUser = currentUser;
        _inventoryService = inventoryService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ItemDto>>> GetItems(
        [FromQuery] int? inventoryCategoryId = null,
        [FromQuery] int? itemCategoryId = null,
        [FromQuery] string? search = null,
        [FromQuery] int? branchId = null,
        [FromQuery] bool hqOnly = false)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        // Determine effective filters based on user role
        bool isBranchUser = _currentUser.BranchId.HasValue;
        
        // If they explicitly ask for HQ Only (e.g. Supply Requests), allow it.
        // Otherwise, if they are a branch user, restrict to their branch.
        int? effectiveBranchId = (isBranchUser && !hqOnly) ? _currentUser.BranchId : branchId;
        bool effectiveHqOnly = hqOnly;

        var query = _context.Items
            .Include(i => i.InventoryCategory)
            .Include(i => i.ItemCategory)
            .Include(i => i.ItemSuppliers).ThenInclude(isup => isup.Supplier)
            .AsQueryable();

        // If branch user and NOT viewing HQ catalog, only show items they have stock for
        if (isBranchUser && !effectiveHqOnly)
        {
            query = query.Where(i => _context.Batches.Any(b => b.ItemId == i.ItemId && b.BranchId == effectiveBranchId));
        }

        if (inventoryCategoryId.HasValue)
        {
            query = query.Where(i => i.InventoryCategoryId == inventoryCategoryId.Value);
        }

        if (itemCategoryId.HasValue)
        {
            query = query.Where(i => i.ItemCategoryId == itemCategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(i => i.Name.Contains(term) || i.SKU.Contains(term));
        }

        var items = await query
            .OrderBy(i => i.Name)
            .ToListAsync();

        var itemIds = items.Select(i => i.ItemId).ToList();
        var batchQuery = _context.Batches.Where(b => itemIds.Contains(b.ItemId));

        if (effectiveBranchId.HasValue)
        {
            batchQuery = batchQuery.Where(b => b.BranchId == effectiveBranchId.Value);
        }
        else
        {
            // Default to HQ only if no branch is specified
            batchQuery = batchQuery.Where(b => b.BranchId == null);
        }

        var stockByItem = await batchQuery
            .GroupBy(b => b.ItemId)
            .Select(g => new { ItemId = g.Key, Quantity = g.Sum(x => x.CurrentQuantity) })
            .ToDictionaryAsync(x => x.ItemId, x => x.Quantity);

        // Get custom thresholds for branch users
        Dictionary<int, decimal> branchThresholds = new();
        if (effectiveBranchId.HasValue)
        {
            branchThresholds = await _context.BranchItemSettings
                .Where(s => s.BranchId == effectiveBranchId.Value)
                .ToDictionaryAsync(s => s.ItemId, s => s.LowStockThreshold);
        }

        var rows = items.Select(item =>
        {
            var stockLevel = stockByItem.TryGetValue(item.ItemId, out var qty) ? qty : 0;
            var isOverride = branchThresholds.TryGetValue(item.ItemId, out var custom);
            var threshold = isOverride ? branchThresholds[item.ItemId] : item.DefaultThreshold;
            
            var dto = MapItem(item, stockLevel);
            dto.DefaultThreshold = threshold; 
            dto.IsLowStock = stockLevel <= threshold;
            dto.IsBranchThreshold = isOverride;
            return dto;
        }).ToList();

        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ItemDetailDto>> GetItem(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var row = await BuildItemDetailAsync(id);
        if (row == null)
        {
            return NotFound();
        }

        return Ok(row);
    }

    [HttpPost]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ItemDetailDto>> CreateItem([FromBody] CreateItemDto dto)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        try
        {
            ValidateItemPayload(dto.SKU, dto.Name, dto.DefaultThreshold, dto.UnitCost, dto.SellingPrice);
            await ValidateLookupReferencesAsync(dto.InventoryCategoryId, dto.ItemCategoryId, dto.SupplierId);
            await EnsureSkuIsUniqueAsync(dto.SKU);

            var now = DateTime.UtcNow;

            var item = new Item
            {
                TenantId = _currentUser.TenantId.Value,
                SKU = dto.SKU.Trim(),
                Name = dto.Name.Trim(),
                Unit = dto.Unit,
                InventoryCategoryId = dto.InventoryCategoryId,
                ItemCategoryId = dto.ItemCategoryId,
                DefaultThreshold = dto.DefaultThreshold,
                UnitCost = dto.UnitCost,
                SellingPrice = dto.SellingPrice,
                IsBundle = dto.IsBundle,

                CreatedAt = now,
                UpdatedAt = now
            };

            if (dto.SupplierId.HasValue)
            {
                item.ItemSuppliers.Add(new ItemSupplier { SupplierId = dto.SupplierId.Value });
            }

            _context.Items.Add(item);
            await _context.SaveChangesAsync();

            var created = await BuildItemDetailAsync(item.ItemId);
            if (created == null)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Item was created but could not be loaded." });
            }

            return CreatedAtAction(nameof(GetItem), new { id = item.ItemId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] UpdateItemDto dto)
    {
        var item = await _context.Items.FirstOrDefaultAsync(i => i.ItemId == id);
        if (item == null)
        {
            return NotFound();
        }

        try
        {
            ValidateItemPayload(dto.SKU, dto.Name, dto.DefaultThreshold, dto.UnitCost, dto.SellingPrice);
            await ValidateLookupReferencesAsync(dto.InventoryCategoryId, dto.ItemCategoryId, dto.SupplierId);
            await EnsureSkuIsUniqueAsync(dto.SKU, id);

            if (item.UnitCost != dto.UnitCost)
            {
                item.PreviousUnitCost = item.UnitCost;
            }

            item.SKU = dto.SKU.Trim();
            item.Name = dto.Name.Trim();
            item.Unit = dto.Unit;
            item.InventoryCategoryId = dto.InventoryCategoryId;
            item.ItemCategoryId = dto.ItemCategoryId;
            item.DefaultThreshold = dto.DefaultThreshold;
            item.UnitCost = dto.UnitCost;
            item.SellingPrice = dto.SellingPrice;
            item.IsBundle = dto.IsBundle;

            if (dto.SupplierId.HasValue)
            {
                var currentSupplierId = item.ItemSuppliers.OrderByDescending(s => s.LinkedAt).FirstOrDefault()?.SupplierId;
                if (currentSupplierId != dto.SupplierId.Value)
                {
                    item.ItemSuppliers.Add(new ItemSupplier { SupplierId = dto.SupplierId.Value });
                }
            }

            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/stock-in")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<BatchDto>> StockIn(int id, [FromBody] StockInDto dto)
    {
        var item = await _context.Items.FirstOrDefaultAsync(i => i.ItemId == id);
        if (item == null)
        {
            return NotFound();
        }

        try
        {
            var created = await _inventoryService.StockInAsync(
                itemId: id,
                quantity: dto.Quantity,
                batchNumber: dto.BatchNumber,
                expiryDate: dto.ExpiryDate,
                unitCost: dto.UnitCost ?? 0,
                supplierId: dto.SupplierId,
                defaultThreshold: dto.DefaultThreshold,
                remarks: dto.Remarks);

            var batch = await _context.Batches
                .Include(b => b.Item)
                .Include(b => b.Branch)
                .FirstOrDefaultAsync(b => b.BatchId == created.BatchId);

            if (batch == null)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Stock was received but the new batch could not be loaded." });
            }

            return Ok(MapBatch(batch));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/stock-out")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<StockOutResultDto>> StockOut(int id, [FromBody] StockOutDto dto)
    {
        var itemExists = await _context.Items.AnyAsync(i => i.ItemId == id);
        if (!itemExists)
        {
            return NotFound();
        }

        try
        {
            var deductions = await _inventoryService.StockOutAsync(id, dto.Quantity, dto.Reason, dto.Remarks);
            var remainingStock = await _inventoryService.GetStockLevelAsync(id);

            return Ok(new StockOutResultDto
            {
                StockLevel = remainingStock,
                Deductions = deductions.Select(d => new FifoBatchDeductionDto
                {
                    BatchId = d.BatchId,
                    BatchNumber = d.BatchNumber,
                    QuantityDeducted = d.QuantityDeducted,
                    RemainingBatchQuantity = d.RemainingBatchQuantity
                }).ToList()
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("branch/threshold")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult> SetBranchThreshold([FromBody] SetBranchThresholdRequest request)
    {
        if (!_currentUser.TenantId.HasValue || !_currentUser.BranchId.HasValue)
        {
            return Forbid();
        }

        var branchId = _currentUser.BranchId.Value;
        var tenantId = _currentUser.TenantId.Value;

        var setting = await _context.BranchItemSettings
            .FirstOrDefaultAsync(s => s.BranchId == branchId && s.ItemId == request.ItemId);

        if (setting == null)
        {
            setting = new BranchItemSetting
            {
                TenantId = tenantId,
                BranchId = branchId,
                ItemId = request.ItemId,
                LowStockThreshold = request.Threshold,
                UpdatedAt = DateTime.UtcNow
            };
            _context.BranchItemSettings.Add(setting);
        }
        else
        {
            setting.LowStockThreshold = request.Threshold;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("global/threshold")]
    [Authorize(Roles = "TenantAdmin,HqManager")]
    public async Task<ActionResult> SetGlobalThreshold([FromBody] SetBranchThresholdRequest request)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUser.TenantId.Value;

        var item = await _context.Items
            .FirstOrDefaultAsync(i => i.ItemId == request.ItemId && i.TenantId == tenantId);

        if (item == null)
        {
            return NotFound();
        }

        item.DefaultThreshold = request.Threshold;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("{id:int}/batches")]
    public async Task<ActionResult<List<BatchDto>>> GetItemBatches(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var itemExists = await _context.Items.AnyAsync(i => i.ItemId == id);
        if (!itemExists)
        {
            return NotFound();
        }

        var batches = await _context.Batches
            .Include(b => b.Item)
            .Include(b => b.Branch)
            .Where(b => b.ItemId == id)
            .OrderBy(b => b.ExpiryDate)
            .ThenBy(b => b.CreatedAt)
            .ToListAsync();

        return Ok(batches.Select(MapBatch).ToList());
    }

    [HttpGet("{id:int}/transactions")]
    public async Task<ActionResult<List<TransactionDto>>> GetItemTransactions(int id)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var itemExists = await _context.Items.AnyAsync(i => i.ItemId == id);
        if (!itemExists)
        {
            return NotFound();
        }

        var transactions = await _context.InventoryTransactions
            .Include(t => t.Batch)
            .Include(t => t.User)
            .Where(t => t.Batch != null && t.Batch.ItemId == id)
            .OrderByDescending(t => t.Timestamp)
            .ToListAsync();

        var rows = transactions.Select(t => new TransactionDto
        {
            TransactionId = t.TransactionId,
            BatchId = t.BatchId,
            BatchNumber = t.Batch?.BatchNumber ?? string.Empty,
            UserId = t.UserId,
            UserName = t.User == null
                ? string.Empty
                : $"{t.User.FirstName} {t.User.LastName}".Trim(),
            QuantityChange = t.QuantityChange,
            TransactionType = t.TransactionType.ToString(),
            ReferenceType = t.ReferenceType?.ToString(),
            ReferenceId = t.ReferenceId,
            Remarks = t.Remarks,
            Timestamp = t.Timestamp
        }).ToList();

        return Ok(rows);
    }

    private async Task<ItemDetailDto?> BuildItemDetailAsync(int id)
    {
        var item = await _context.Items
            .Include(i => i.InventoryCategory)
            .Include(i => i.ItemCategory)
            .Include(i => i.ItemSuppliers).ThenInclude(isup => isup.Supplier)
            .FirstOrDefaultAsync(i => i.ItemId == id);

        if (item == null)
        {
            return null;
        }

        var totalStock = await _inventoryService.GetStockLevelAsync(item.ItemId, _currentUser.BranchId);

        var batchesQuery = _context.Batches
            .Include(b => b.Item)
            .Include(b => b.Branch)
            .Where(b => b.ItemId == item.ItemId);

        // Standardize detail view to match the stock level of the current branch/HQ context
        if (_currentUser.BranchId.HasValue)
        {
            batchesQuery = batchesQuery.Where(b => b.BranchId == _currentUser.BranchId.Value);
        }
        else
        {
            batchesQuery = batchesQuery.Where(b => b.BranchId == null);
        }

        var batches = await batchesQuery
            .OrderBy(b => b.ExpiryDate)
            .ThenBy(b => b.CreatedAt)
            .ToListAsync();

        var threshold = item.DefaultThreshold;
        if (_currentUser.BranchId.HasValue)
        {
            var custom = await _context.BranchItemSettings
                .Where(s => s.BranchId == _currentUser.BranchId.Value && s.ItemId == item.ItemId)
                .Select(s => (decimal?)s.LowStockThreshold)
                .FirstOrDefaultAsync();
            if (custom.HasValue) threshold = custom.Value;
        }

        var dto = MapItem(item, totalStock);
        dto.DefaultThreshold = threshold;
        dto.IsLowStock = totalStock <= threshold;

        return new ItemDetailDto
        {
            ItemId = dto.ItemId,
            TenantId = dto.TenantId,
            SKU = dto.SKU,
            Name = dto.Name,
            Unit = dto.Unit,
            InventoryCategoryId = dto.InventoryCategoryId,
            InventoryCategoryName = dto.InventoryCategoryName,
            ItemCategoryId = dto.ItemCategoryId,
            ItemCategoryName = dto.ItemCategoryName,
            DefaultThreshold = dto.DefaultThreshold,
            UnitCost = dto.UnitCost,
            PreviousUnitCost = dto.PreviousUnitCost,
            SellingPrice = dto.SellingPrice,
            IsBundle = dto.IsBundle,

            TotalStock = dto.TotalStock,
            IsLowStock = dto.IsLowStock,
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt,
            Batches = batches.Select(MapBatch).ToList()
        };
    }

    private async Task ValidateLookupReferencesAsync(int? inventoryCategoryId, int? itemCategoryId, int? supplierId = null)
    {

        if (inventoryCategoryId.HasValue)
        {
            var categoryExists = await _context.InventoryCategories
                .AnyAsync(c => c.CategoryId == inventoryCategoryId.Value && c.IsActive);

            if (!categoryExists)
            {
                throw new InvalidOperationException("Inventory category was not found.");
            }
        }

        if (itemCategoryId.HasValue)
        {
            var itemCategoryExists = await _context.ItemCategories
                .AnyAsync(c => c.ItemCategoryId == itemCategoryId.Value && c.IsActive);

            if (!itemCategoryExists)
            {
                throw new InvalidOperationException("Item category was not found.");
            }
        }

        if (supplierId.HasValue)
        {
            var supplierExists = await _context.Suppliers
                .AnyAsync(s => s.SupplierId == supplierId.Value && s.IsActive);

            if (!supplierExists)
            {
                throw new InvalidOperationException("Supplier was not found.");
            }
        }
    }

    private async Task EnsureSkuIsUniqueAsync(string sku, int? ignoreItemId = null)
    {
        var normalized = sku.Trim();

        var exists = await _context.Items.AnyAsync(i => i.SKU == normalized && (!ignoreItemId.HasValue || i.ItemId != ignoreItemId.Value));
        if (exists)
        {
            throw new InvalidOperationException("SKU already exists.");
        }
    }

    private static void ValidateItemPayload(string sku, string name, decimal threshold, decimal unitCost, decimal? sellingPrice)
    {
        if (string.IsNullOrWhiteSpace(sku))
        {
            throw new InvalidOperationException("SKU is required.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("Name is required.");
        }

        if (threshold < 0)
        {
            throw new InvalidOperationException("Default threshold cannot be negative.");
        }

        if (unitCost < 0)
        {
            throw new InvalidOperationException("Unit cost cannot be negative.");
        }

        if (sellingPrice.HasValue && sellingPrice.Value < 0)
        {
            throw new InvalidOperationException("Selling price cannot be negative.");
        }
    }

    private static ItemDto MapItem(Item item, decimal stockLevel)
    {
        var latestSupplier = item.ItemSuppliers.OrderByDescending(s => s.LinkedAt).FirstOrDefault();

        return new ItemDto
        {
            ItemId = item.ItemId,
            TenantId = item.TenantId,
            SKU = item.SKU,
            Name = item.Name,
            Unit = item.Unit,
            InventoryCategoryId = item.InventoryCategoryId,
            InventoryCategoryName = item.InventoryCategory?.Name,
            ItemCategoryId = item.ItemCategoryId,
            ItemCategoryName = item.ItemCategory?.Name,
            SupplierId = latestSupplier?.SupplierId,
            SupplierName = latestSupplier?.Supplier?.Name,
            SupplierIds = item.ItemSuppliers.Select(s => s.SupplierId).Distinct().ToList(),
            DefaultThreshold = item.DefaultThreshold,
            UnitCost = item.UnitCost,
            PreviousUnitCost = item.PreviousUnitCost,
            SellingPrice = item.SellingPrice,
            IsBundle = item.IsBundle,

            TotalStock = stockLevel,
            IsLowStock = stockLevel <= item.DefaultThreshold,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }

    private static BatchDto MapBatch(Batch batch)
    {
        return new BatchDto
        {
            BatchId = batch.BatchId,
            ItemId = batch.ItemId,
            ItemName = batch.Item?.Name ?? string.Empty,
            BranchId = batch.BranchId,
            BranchName = batch.Branch?.Name,
            BatchNumber = batch.BatchNumber,
            ExpiryDate = batch.ExpiryDate,
            CurrentQuantity = batch.CurrentQuantity,
            CreatedAt = batch.CreatedAt
        };
    }
}
