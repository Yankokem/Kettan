using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Items;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Inventory;

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
        [FromQuery] string? search = null)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            return Forbid();
        }

        var query = _context.Items
            .Include(i => i.Unit)
            .Include(i => i.InventoryCategory)
            .Include(i => i.ItemCategory)
            .AsQueryable();

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
        var stockByItem = await _context.Batches
            .Where(b => itemIds.Contains(b.ItemId))
            .GroupBy(b => b.ItemId)
            .Select(g => new { ItemId = g.Key, Quantity = g.Sum(x => x.CurrentQuantity) })
            .ToDictionaryAsync(x => x.ItemId, x => x.Quantity);

        var rows = items.Select(item =>
        {
            var stockLevel = stockByItem.TryGetValue(item.ItemId, out var qty) ? qty : 0;
            return MapItem(item, stockLevel);
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
            await ValidateLookupReferencesAsync(dto.UnitId, dto.InventoryCategoryId, dto.ItemCategoryId);
            await EnsureSkuIsUniqueAsync(dto.SKU);

            var now = DateTime.UtcNow;

            var item = new Item
            {
                TenantId = _currentUser.TenantId.Value,
                SKU = dto.SKU.Trim(),
                Name = dto.Name.Trim(),
                UnitId = dto.UnitId,
                InventoryCategoryId = dto.InventoryCategoryId,
                ItemCategoryId = dto.ItemCategoryId,
                DefaultThreshold = dto.DefaultThreshold,
                UnitCost = dto.UnitCost,
                SellingPrice = dto.SellingPrice,
                IsBundle = dto.IsBundle,
                ImageUrl = dto.ImageUrl,
                CreatedAt = now,
                UpdatedAt = now
            };

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
            await ValidateLookupReferencesAsync(dto.UnitId, dto.InventoryCategoryId, dto.ItemCategoryId);
            await EnsureSkuIsUniqueAsync(dto.SKU, id);

            if (item.UnitCost != dto.UnitCost)
            {
                item.PreviousUnitCost = item.UnitCost;
            }

            item.SKU = dto.SKU.Trim();
            item.Name = dto.Name.Trim();
            item.UnitId = dto.UnitId;
            item.InventoryCategoryId = dto.InventoryCategoryId;
            item.ItemCategoryId = dto.ItemCategoryId;
            item.DefaultThreshold = dto.DefaultThreshold;
            item.UnitCost = dto.UnitCost;
            item.SellingPrice = dto.SellingPrice;
            item.IsBundle = dto.IsBundle;
            item.ImageUrl = dto.ImageUrl;
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
            if (dto.UnitCost.HasValue)
            {
                if (dto.UnitCost.Value < 0)
                {
                    throw new InvalidOperationException("Unit cost cannot be negative.");
                }

                if (item.UnitCost != dto.UnitCost.Value)
                {
                    item.PreviousUnitCost = item.UnitCost;
                    item.UnitCost = dto.UnitCost.Value;
                    item.UpdatedAt = DateTime.UtcNow;
                }
            }

            var created = await _inventoryService.StockInAsync(
                itemId: id,
                quantity: dto.Quantity,
                batchNumber: dto.BatchNumber,
                expiryDate: dto.ExpiryDate,
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
            TransactionType = t.TransactionType,
            ReferenceType = t.ReferenceType,
            ReferenceId = t.ReferenceId,
            Remarks = t.Remarks,
            Timestamp = t.Timestamp
        }).ToList();

        return Ok(rows);
    }

    private async Task<ItemDetailDto?> BuildItemDetailAsync(int id)
    {
        var item = await _context.Items
            .Include(i => i.Unit)
            .Include(i => i.InventoryCategory)
            .Include(i => i.ItemCategory)
            .FirstOrDefaultAsync(i => i.ItemId == id);

        if (item == null)
        {
            return null;
        }

        var totalStock = await _inventoryService.GetStockLevelAsync(item.ItemId);

        var batches = await _context.Batches
            .Include(b => b.Item)
            .Include(b => b.Branch)
            .Where(b => b.ItemId == item.ItemId)
            .OrderBy(b => b.ExpiryDate)
            .ThenBy(b => b.CreatedAt)
            .ToListAsync();

        var dto = MapItem(item, totalStock);

        return new ItemDetailDto
        {
            ItemId = dto.ItemId,
            TenantId = dto.TenantId,
            SKU = dto.SKU,
            Name = dto.Name,
            UnitId = dto.UnitId,
            UnitName = dto.UnitName,
            UnitSymbol = dto.UnitSymbol,
            InventoryCategoryId = dto.InventoryCategoryId,
            InventoryCategoryName = dto.InventoryCategoryName,
            ItemCategoryId = dto.ItemCategoryId,
            ItemCategoryName = dto.ItemCategoryName,
            DefaultThreshold = dto.DefaultThreshold,
            UnitCost = dto.UnitCost,
            PreviousUnitCost = dto.PreviousUnitCost,
            SellingPrice = dto.SellingPrice,
            IsBundle = dto.IsBundle,
            ImageUrl = dto.ImageUrl,
            TotalStock = dto.TotalStock,
            IsLowStock = dto.IsLowStock,
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt,
            Batches = batches.Select(MapBatch).ToList()
        };
    }

    private async Task ValidateLookupReferencesAsync(int unitId, int? inventoryCategoryId, int? itemCategoryId)
    {
        var unitExists = await _context.Units.AnyAsync(u => u.UnitId == unitId);
        if (!unitExists)
        {
            throw new InvalidOperationException("Unit was not found.");
        }

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
        return new ItemDto
        {
            ItemId = item.ItemId,
            TenantId = item.TenantId,
            SKU = item.SKU,
            Name = item.Name,
            UnitId = item.UnitId,
            UnitName = item.Unit?.Name ?? string.Empty,
            UnitSymbol = item.Unit?.Symbol ?? string.Empty,
            InventoryCategoryId = item.InventoryCategoryId,
            InventoryCategoryName = item.InventoryCategory?.Name,
            ItemCategoryId = item.ItemCategoryId,
            ItemCategoryName = item.ItemCategory?.Name,
            DefaultThreshold = item.DefaultThreshold,
            UnitCost = item.UnitCost,
            PreviousUnitCost = item.PreviousUnitCost,
            SellingPrice = item.SellingPrice,
            IsBundle = item.IsBundle,
            ImageUrl = item.ImageUrl,
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
