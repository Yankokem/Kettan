using Kettan.Server.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Data.Seeders;

public static class InventorySeeder
{

    public static async Task<Dictionary<string, InventoryCategory>> EnsureInventoryCategoriesAsync(
        ApplicationDbContext context,
        Tenant tenant,
        CancellationToken cancellationToken)
    {
        var seeds = new[]
        {
            new InventoryCategorySeed("Beans", 1),
            new InventoryCategorySeed("Dairy", 2),
            new InventoryCategorySeed("Syrups", 3),
            new InventoryCategorySeed("Packaging", 4),
            new InventoryCategorySeed("Dry Goods", 5)
        };

        var names = seeds.Select(s => s.Name).ToList();

        var existingCategories = await context.Set<InventoryCategory>()
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == tenant.TenantId && names.Contains(c.Name))
            .ToListAsync(cancellationToken);

        var categoriesByName = new Dictionary<string, InventoryCategory>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in seeds)
        {
            var category = existingCategories.FirstOrDefault(c => c.Name == seed.Name);

            if (category is null)
            {
                category = new InventoryCategory
                {
                    TenantId = tenant.TenantId,
                    Name = seed.Name,
                    DisplayOrder = seed.DisplayOrder,
                    IsActive = true
                };

                context.Set<InventoryCategory>().Add(category);
            }
            else
            {
                category.TenantId = tenant.TenantId;
                category.Name = seed.Name;
                category.DisplayOrder = seed.DisplayOrder;
                category.IsActive = true;
                category.IsDeleted = false;
                category.DeletedAt = null;
            }

            categoriesByName[seed.Name] = category;
        }

        await context.SaveChangesAsync(cancellationToken);

        return categoriesByName;
    }

    public static async Task<Dictionary<string, ItemCategory>> EnsureItemCategoriesAsync(
        ApplicationDbContext context,
        Tenant tenant,
        CancellationToken cancellationToken)
    {
        var seeds = new[]
        {
            new ItemCategorySeed("Arabica", 1),
            new ItemCategorySeed("Robusta", 2)
        };

        var names = seeds.Select(s => s.Name).ToList();

        var existingCategories = await context.Set<ItemCategory>()
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == tenant.TenantId && names.Contains(c.Name))
            .ToListAsync(cancellationToken);

        var categoriesByName = new Dictionary<string, ItemCategory>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in seeds)
        {
            var category = existingCategories.FirstOrDefault(c => c.Name == seed.Name);

            if (category is null)
            {
                category = new ItemCategory
                {
                    TenantId = tenant.TenantId,
                    Name = seed.Name,
                    DisplayOrder = seed.DisplayOrder,
                    IsActive = true
                };

                context.Set<ItemCategory>().Add(category);
            }
            else
            {
                category.TenantId = tenant.TenantId;
                category.Name = seed.Name;
                category.DisplayOrder = seed.DisplayOrder;
                category.IsActive = true;
                category.IsDeleted = false;
                category.DeletedAt = null;
            }

            categoriesByName[seed.Name] = category;
        }

        await context.SaveChangesAsync(cancellationToken);

        return categoriesByName;
    }

    public static async Task<Dictionary<string, Item>> EnsureItemsAsync(
        ApplicationDbContext context,
        Tenant tenant,
        Dictionary<string, InventoryCategory> inventoryCategoriesByName,
        Dictionary<string, ItemCategory> itemCategoriesByName,
        CancellationToken cancellationToken)
    {
        var seeds = new[]
        {
            new ItemSeed("BNS-ESP-01", "House Espresso Blend", "g", "Beans", "Arabica", 5000, 1.20m),
            new ItemSeed("BNS-ROB-01", "Robusta Blend Beans", "g", "Beans", "Robusta", 5000, 0.95m),
            new ItemSeed("MLK-WHL-01", "Whole Milk", "ml", "Dairy", null, 10000, 0.05m),
            new ItemSeed("MLK-OAT-01", "Barista Oat Milk", "ml", "Dairy", null, 5000, 0.15m),
            new ItemSeed("SYR-VAN-01", "Vanilla Syrup", "ml", "Syrups", null, 2000, 0.20m),
            new ItemSeed("SYR-CAR-01", "Caramel Syrup", "ml", "Syrups", null, 2000, 0.22m),
            new ItemSeed("CUP-12-HT", "12oz Hot Cup", "pc", "Packaging", null, 500, 5.0m),
            new ItemSeed("LID-12-HT", "12oz Hot Cup Lid", "pc", "Packaging", null, 500, 2.0m),
            new ItemSeed("DRY-SGR-01", "Brown Sugar", "g", "Dry Goods", null, 4000, 0.07m),
            new ItemSeed("DRY-MAT-01", "Matcha Powder", "g", "Dry Goods", null, 1500, 1.80m)
        };

        var skus = seeds.Select(s => s.Sku).ToList();

        var existingItems = await context.Set<Item>()
            .IgnoreQueryFilters()
            .Where(i => i.TenantId == tenant.TenantId && skus.Contains(i.SKU))
            .ToListAsync(cancellationToken);

        var itemsBySku = new Dictionary<string, Item>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in seeds)
        {

            var inventoryCategory = inventoryCategoriesByName[seed.InventoryCategoryName];

            ItemCategory? itemCategory = null;
            if (!string.IsNullOrWhiteSpace(seed.ItemCategoryName))
            {
                itemCategory = itemCategoriesByName[seed.ItemCategoryName];
            }

            var item = existingItems.FirstOrDefault(i => i.SKU == seed.Sku);

            if (item is null)
            {
                item = new Item
                {
                    TenantId = tenant.TenantId,
                    SKU = seed.Sku,
                    Name = seed.Name,
                    Unit = seed.UnitSymbol,
                    InventoryCategoryId = inventoryCategory.CategoryId,
                    ItemCategoryId = itemCategory?.ItemCategoryId,
                    DefaultThreshold = seed.DefaultThreshold,
                    UnitCost = seed.UnitCost
                };

                context.Set<Item>().Add(item);
            }
            else
            {
                item.TenantId = tenant.TenantId;
                item.SKU = seed.Sku;
                item.Name = seed.Name;
                item.Unit = seed.UnitSymbol;
                item.InventoryCategoryId = inventoryCategory.CategoryId;
                item.ItemCategoryId = itemCategory?.ItemCategoryId;
                item.DefaultThreshold = seed.DefaultThreshold;
                item.UnitCost = seed.UnitCost;
                item.IsDeleted = false;
                item.DeletedAt = null;
                item.UpdatedAt = DateTime.UtcNow;
            }

            itemsBySku[seed.Sku] = item;
        }

        await context.SaveChangesAsync(cancellationToken);

        return itemsBySku;
    }

    public static async Task EnsureBatchesAsync(
        ApplicationDbContext context,
        Tenant tenant,
        Dictionary<string, Item> itemsBySku,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var seeds = new[]
        {
            new BatchSeed("BNS-ESP-01", "B-ESP-2026-001", 12000, now.AddMonths(6)),
            new BatchSeed("BNS-ESP-01", "B-ESP-2026-002", 10000, now.AddMonths(8)),
            new BatchSeed("BNS-ROB-01", "B-ROB-2026-001", 10000, now.AddMonths(6)),
            new BatchSeed("BNS-ROB-01", "B-ROB-2026-002", 8000, now.AddMonths(8)),
            new BatchSeed("MLK-WHL-01", "M-WHL-2026-001", 35000, now.AddDays(12)),
            new BatchSeed("MLK-WHL-01", "M-WHL-2026-002", 30000, now.AddDays(20)),
            new BatchSeed("MLK-OAT-01", "M-OAT-2026-001", 15000, now.AddMonths(2)),
            new BatchSeed("MLK-OAT-01", "M-OAT-2026-002", 16000, now.AddMonths(4)),
            new BatchSeed("SYR-VAN-01", "S-VAN-2026-001", 8000, now.AddYears(1)),
            new BatchSeed("SYR-VAN-01", "S-VAN-2026-002", 7000, now.AddYears(1).AddMonths(2)),
            new BatchSeed("SYR-CAR-01", "S-CAR-2026-001", 7000, now.AddYears(1)),
            new BatchSeed("SYR-CAR-01", "S-CAR-2026-002", 6500, now.AddYears(1).AddMonths(2)),
            new BatchSeed("CUP-12-HT", "P-CUP-2026-001", 3000, now.AddYears(3)),
            new BatchSeed("CUP-12-HT", "P-CUP-2026-002", 3000, now.AddYears(4)),
            new BatchSeed("LID-12-HT", "P-LID-2026-001", 3000, now.AddYears(3)),
            new BatchSeed("LID-12-HT", "P-LID-2026-002", 3000, now.AddYears(4)),
            new BatchSeed("DRY-SGR-01", "D-SGR-2026-001", 6000, now.AddYears(2)),
            new BatchSeed("DRY-SGR-01", "D-SGR-2026-002", 5500, now.AddYears(3)),
            new BatchSeed("DRY-MAT-01", "D-MAT-2026-001", 2500, now.AddMonths(14)),
            new BatchSeed("DRY-MAT-01", "D-MAT-2026-002", 2200, now.AddMonths(18))
        };

        var batchNumbers = seeds.Select(s => s.BatchNumber).ToList();

        var existingBatches = await context.Set<Batch>()
            .IgnoreQueryFilters()
            .Where(b => b.TenantId == tenant.TenantId && batchNumbers.Contains(b.BatchNumber))
            .ToListAsync(cancellationToken);

        var added = false;

        foreach (var seed in seeds)
        {
            if (!itemsBySku.TryGetValue(seed.ItemSku, out var item))
            {
                throw new InvalidOperationException($"Missing seeded item for batch: {seed.ItemSku}");
            }

            var batch = existingBatches.FirstOrDefault(b => b.ItemId == item.ItemId && b.BatchNumber == seed.BatchNumber);
            if (batch is not null)
            {
                continue;
            }

            context.Set<Batch>().Add(new Batch
            {
                TenantId = tenant.TenantId,
                BranchId = null,
                ItemId = item.ItemId,
                BatchNumber = seed.BatchNumber,
                CurrentQuantity = seed.CurrentQuantity,
                ExpiryDate = seed.ExpiryDateUtc
            });

            added = true;
        }

        if (added)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }


    private sealed record InventoryCategorySeed(
        string Name,
        int DisplayOrder);

    private sealed record ItemCategorySeed(
        string Name,
        int DisplayOrder);

    private sealed record ItemSeed(
        string Sku,
        string Name,
        string UnitSymbol,
        string InventoryCategoryName,
        string? ItemCategoryName,
        decimal DefaultThreshold,
        decimal UnitCost);

    private sealed record BatchSeed(
        string ItemSku,
        string BatchNumber,
        decimal CurrentQuantity,
        DateTime ExpiryDateUtc);
}
