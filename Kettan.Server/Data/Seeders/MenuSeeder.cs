using Kettan.Server.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Data.Seeders;

public static class MenuSeeder
{
    public static async Task EnsureMenuAsync(
        ApplicationDbContext context,
        Tenant tenant,
        Dictionary<string, Item> itemsBySku,
        CancellationToken cancellationToken)
    {
        var categorySeeds = new[]
        {
            new MenuCategorySeed("Coffee", 1),
            new MenuCategorySeed("Non-Coffee", 2),
            new MenuCategorySeed("Food", 3),
            new MenuCategorySeed("Pastries", 4)
        };

        var categoryNames = categorySeeds.Select(s => s.Name).ToList();
        var existingMenuCategories = await context.Set<MenuCategory>()
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == tenant.TenantId && categoryNames.Contains(c.Name))
            .ToListAsync(cancellationToken);

        var menuCategoriesByName = new Dictionary<string, MenuCategory>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in categorySeeds)
        {
            var category = existingMenuCategories.FirstOrDefault(c => c.Name == seed.Name);

            if (category is null)
            {
                category = new MenuCategory
                {
                    TenantId = tenant.TenantId,
                    Name = seed.Name,
                    DisplayOrder = seed.DisplayOrder,
                    IsActive = true
                };

                context.Set<MenuCategory>().Add(category);
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

            menuCategoriesByName[seed.Name] = category;
        }

        await context.SaveChangesAsync(cancellationToken);

        var tagSeeds = new[]
        {
            new MenuTagSeed("Bestseller", "#ffb300"),
            new MenuTagSeed("Hot", "#e53935")
        };

        var tagNames = tagSeeds.Select(s => s.Name).ToList();
        var existingTags = await context.Set<MenuTag>()
            .IgnoreQueryFilters()
            .Where(t => t.TenantId == tenant.TenantId && tagNames.Contains(t.Name))
            .ToListAsync(cancellationToken);

        var tagsByName = new Dictionary<string, MenuTag>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in tagSeeds)
        {
            var tag = existingTags.FirstOrDefault(t => t.Name == seed.Name);

            if (tag is null)
            {
                tag = new MenuTag
                {
                    TenantId = tenant.TenantId,
                    Name = seed.Name,
                    Color = seed.Color,
                    IsActive = true
                };

                context.Set<MenuTag>().Add(tag);
            }
            else
            {
                tag.TenantId = tenant.TenantId;
                tag.Name = seed.Name;
                tag.Color = seed.Color;
                tag.IsActive = true;
                tag.IsDeleted = false;
                tag.DeletedAt = null;
            }

            tagsByName[seed.Name] = tag;
        }

        await context.SaveChangesAsync(cancellationToken);

        var menuItemSeeds = new[]
        {
            new MenuItemSeed("Cafe Latte", "Coffee", 140m, "Active"),
            new MenuItemSeed("Iced Matcha Latte", "Non-Coffee", 160m, "Active")
        };

        var menuItemNames = menuItemSeeds.Select(s => s.Name).ToList();
        var existingMenuItems = await context.Set<MenuItem>()
            .IgnoreQueryFilters()
            .Where(mi => mi.TenantId == tenant.TenantId && menuItemNames.Contains(mi.Name))
            .ToListAsync(cancellationToken);

        var menuItemsByName = new Dictionary<string, MenuItem>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in menuItemSeeds)
        {
            var category = menuCategoriesByName[seed.CategoryName];
            var menuItem = existingMenuItems.FirstOrDefault(mi => mi.Name == seed.Name);

            if (menuItem is null)
            {
                menuItem = new MenuItem
                {
                    TenantId = tenant.TenantId,
                    Name = seed.Name,
                    CategoryId = category.CategoryId,
                    BasePrice = seed.BasePrice,
                    Status = seed.Status,
                    UpdatedAt = DateTime.UtcNow
                };

                context.Set<MenuItem>().Add(menuItem);
            }
            else
            {
                menuItem.TenantId = tenant.TenantId;
                menuItem.Name = seed.Name;
                menuItem.CategoryId = category.CategoryId;
                menuItem.BasePrice = seed.BasePrice;
                menuItem.Status = seed.Status;
                menuItem.IsDeleted = false;
                menuItem.DeletedAt = null;
                menuItem.UpdatedAt = DateTime.UtcNow;
            }

            menuItemsByName[seed.Name] = menuItem;
        }

        await context.SaveChangesAsync(cancellationToken);

        var menuItemTagSeeds = new[]
        {
            (MenuItemName: "Cafe Latte", TagName: "Hot"),
            (MenuItemName: "Cafe Latte", TagName: "Bestseller")
        };

        var menuItemIds = menuItemsByName.Values.Select(mi => mi.MenuItemId).ToList();
        var tagIds = tagsByName.Values.Select(t => t.TagId).ToList();

        var existingMenuItemTags = await context.Set<MenuItemTag>()
            .Where(mt => menuItemIds.Contains(mt.MenuItemId) && tagIds.Contains(mt.TagId))
            .ToListAsync(cancellationToken);

        var addedMenuItemTag = false;

        foreach (var seed in menuItemTagSeeds)
        {
            var menuItem = menuItemsByName[seed.MenuItemName];
            var tag = tagsByName[seed.TagName];

            var existing = existingMenuItemTags
                .FirstOrDefault(mt => mt.MenuItemId == menuItem.MenuItemId && mt.TagId == tag.TagId);

            if (existing is not null)
            {
                continue;
            }

            context.Set<MenuItemTag>().Add(new MenuItemTag
            {
                MenuItemId = menuItem.MenuItemId,
                TagId = tag.TagId
            });

            addedMenuItemTag = true;
        }

        if (addedMenuItemTag)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        var variantSeeds = new[]
        {
            new MenuVariantSeed("Cafe Latte", "12oz (Hot)", "absolute", 140m, 1),
            new MenuVariantSeed("Cafe Latte", "16oz (Hot)", "absolute", 165m, 2),
            new MenuVariantSeed("Iced Matcha Latte", "12oz (Iced)", "absolute", 160m, 1),
            new MenuVariantSeed("Iced Matcha Latte", "16oz (Iced)", "absolute", 185m, 2)
        };

        var existingVariants = await context.Set<MenuVariant>()
            .IgnoreQueryFilters()
            .Where(v => menuItemIds.Contains(v.MenuItemId))
            .ToListAsync(cancellationToken);

        var variantsByKey = new Dictionary<string, MenuVariant>(StringComparer.OrdinalIgnoreCase);

        foreach (var seed in variantSeeds)
        {
            var menuItem = menuItemsByName[seed.MenuItemName];

            var variant = existingVariants
                .FirstOrDefault(v => v.MenuItemId == menuItem.MenuItemId && v.Name == seed.Name);

            if (variant is null)
            {
                variant = new MenuVariant
                {
                    MenuItemId = menuItem.MenuItemId,
                    Name = seed.Name,
                    PricingMode = seed.PricingMode,
                    Price = seed.Price,
                    DisplayOrder = seed.DisplayOrder,
                    IsActive = true
                };

                context.Set<MenuVariant>().Add(variant);
            }
            else
            {
                variant.MenuItemId = menuItem.MenuItemId;
                variant.Name = seed.Name;
                variant.PricingMode = seed.PricingMode;
                variant.Price = seed.Price;
                variant.DisplayOrder = seed.DisplayOrder;
                variant.IsActive = true;
                variant.IsDeleted = false;
                variant.DeletedAt = null;
            }

            variantsByKey[BuildMenuVariantKey(seed.MenuItemName, seed.Name)] = variant;
        }

        await context.SaveChangesAsync(cancellationToken);

        var variantIngredientSeeds = new[]
        {
            new VariantIngredientSeed("Cafe Latte", "12oz (Hot)", "BNS-ESP-01", 18),
            new VariantIngredientSeed("Cafe Latte", "12oz (Hot)", "MLK-WHL-01", 240),
            new VariantIngredientSeed("Cafe Latte", "12oz (Hot)", "CUP-12-HT", 1),
            new VariantIngredientSeed("Cafe Latte", "12oz (Hot)", "LID-12-HT", 1),
            new VariantIngredientSeed("Iced Matcha Latte", "12oz (Iced)", "DRY-MAT-01", 12),
            new VariantIngredientSeed("Iced Matcha Latte", "12oz (Iced)", "MLK-OAT-01", 220),
            new VariantIngredientSeed("Iced Matcha Latte", "12oz (Iced)", "DRY-SGR-01", 8),
            new VariantIngredientSeed("Iced Matcha Latte", "12oz (Iced)", "CUP-12-HT", 1),
            new VariantIngredientSeed("Iced Matcha Latte", "12oz (Iced)", "LID-12-HT", 1)
        };

        var variantIds = variantsByKey.Values.Select(v => v.VariantId).ToList();
        var itemIds = itemsBySku.Values.Select(i => i.ItemId).ToList();

        var existingVariantIngredients = await context.Set<VariantIngredient>()
            .Where(vi => variantIds.Contains(vi.VariantId) && itemIds.Contains(vi.ItemId))
            .ToListAsync(cancellationToken);

        var hasVariantIngredientChanges = false;

        foreach (var seed in variantIngredientSeeds)
        {
            var variantKey = BuildMenuVariantKey(seed.MenuItemName, seed.VariantName);
            var variant = variantsByKey[variantKey];
            var item = itemsBySku[seed.ItemSku];

            var existing = existingVariantIngredients
                .FirstOrDefault(vi => vi.VariantId == variant.VariantId && vi.ItemId == item.ItemId);

            if (existing is null)
            {
                context.Set<VariantIngredient>().Add(new VariantIngredient
                {
                    VariantId = variant.VariantId,
                    ItemId = item.ItemId,
                    Quantity = seed.Quantity
                });

                hasVariantIngredientChanges = true;
            }
            else if (existing.Quantity != seed.Quantity)
            {
                existing.Quantity = seed.Quantity;
                hasVariantIngredientChanges = true;
            }
        }

        if (hasVariantIngredientChanges)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private static string BuildMenuVariantKey(string menuItemName, string variantName)
    {
        return $"{menuItemName}::{variantName}";
    }

    private sealed record MenuCategorySeed(
        string Name,
        int DisplayOrder);

    private sealed record MenuTagSeed(
        string Name,
        string Color);

    private sealed record MenuItemSeed(
        string Name,
        string CategoryName,
        decimal BasePrice,
        string Status);

    private sealed record MenuVariantSeed(
        string MenuItemName,
        string Name,
        string PricingMode,
        decimal Price,
        int DisplayOrder);

    private sealed record VariantIngredientSeed(
        string MenuItemName,
        string VariantName,
        string ItemSku,
        decimal Quantity);
}
