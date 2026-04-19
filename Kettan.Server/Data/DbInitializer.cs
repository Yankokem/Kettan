using Microsoft.EntityFrameworkCore;
using Kettan.Server.Entities;

namespace Kettan.Server.Data;

public static class DbInitializer
{
    public static void Initialize(ApplicationDbContext context)
    {
        // For development, EnsureCreated handles migrations easily if it doesn't exist, but typically we want migrations.
        // If there are migrations, we should use context.Database.Migrate();
        try {
            context.Database.Migrate();
        } catch {
            // Already created or pending
        }

        // Check if database is already seeded (must ignore filters since HttpContext is null here)
        if (context.Set<Tenant>().IgnoreQueryFilters().Any())
        {
            return;
        }

        // 1. Setup Subscription Plans
        var starterPlan = new SubscriptionPlan { PlanCode = "STARTER", Name = "Starter", PriceMonthly = 999m, BranchLimit = 1, UserLimit = 5 };
        var growthPlan = new SubscriptionPlan { PlanCode = "GROWTH", Name = "Growth", PriceMonthly = 2499m, BranchLimit = 3, UserLimit = 15 };
        var enterprisePlan = new SubscriptionPlan { PlanCode = "ENTERPRISE", Name = "Enterprise", PriceMonthly = 4999m, BranchLimit = 10, UserLimit = 50 };
        context.Set<SubscriptionPlan>().AddRange(starterPlan, growthPlan, enterprisePlan);
        context.SaveChanges();

        // 2. Add a dummy tenant and active subscription
        var tenantSubscription = new TenantSubscription
        {
            PlanId = growthPlan.PlanId,
            Status = "Active",
            BillingCycle = "Monthly",
            PeriodStart = DateTime.UtcNow,
            PeriodEnd = DateTime.UtcNow.AddMonths(1)
        };
        context.Set<TenantSubscription>().Add(tenantSubscription);
        context.SaveChanges();

        var dummyTenant = new Tenant
        {
            Name = "Dummy Corporation Coffee",
            CurrentSubscriptionId = tenantSubscription.TenantSubscriptionId,
            SubscriptionStatus = "Active"
        };
        context.Set<Tenant>().Add(dummyTenant);
        context.SaveChanges();

        // Assign TenantId to Subscription
        tenantSubscription.TenantId = dummyTenant.TenantId;
        context.SaveChanges();

        // 3. Add a few branches
        var hqBranch = new Branch
        {
            TenantId = dummyTenant.TenantId,
            Name = "HQ Warehouse",
            Location = "Headquarters",
            Address = "123 Coffee Ave",
            City = "Manila"
        };
        var branch1 = new Branch
        {
            TenantId = dummyTenant.TenantId,
            Name = "Kettan Cafe - BGC",
            Location = "Downtown",
            Address = "Bonifacio High Street",
            City = "Taguig",
            OpenTime = new TimeOnly(8, 0),
            CloseTime = new TimeOnly(22, 0)
        };
        context.Set<Branch>().AddRange(hqBranch, branch1);
        context.SaveChanges();

        var defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("password123");

        // 4. Add Users
        var users = new List<User>
        {
            new User { FirstName = "Super", LastName = "Admin", Email = "superadmin@kettan.local", PasswordHash = defaultPasswordHash, Role = "SuperAdmin", TenantId = null, BranchId = null },
            new User { TenantId = dummyTenant.TenantId, FirstName = "Tenant", LastName = "Admin", Email = "tenantadmin@dummycorp.local", PasswordHash = defaultPasswordHash, Role = "TenantAdmin", BranchId = null },
            new User { TenantId = dummyTenant.TenantId, BranchId = hqBranch.BranchId, FirstName = "HQ", LastName = "Manager", Email = "hqmanager@dummycorp.local", PasswordHash = defaultPasswordHash, Role = "HqManager" },
            new User { TenantId = dummyTenant.TenantId, BranchId = hqBranch.BranchId, FirstName = "HQ", LastName = "Staff", Email = "hqstaff@dummycorp.local", PasswordHash = defaultPasswordHash, Role = "HqStaff" },
            new User { TenantId = dummyTenant.TenantId, BranchId = branch1.BranchId, FirstName = "Branch", LastName = "Owner", Email = "owner_main@dummycorp.local", PasswordHash = defaultPasswordHash, Role = "BranchOwner" },
            new User { TenantId = dummyTenant.TenantId, BranchId = branch1.BranchId, FirstName = "Branch", LastName = "Manager", Email = "manager_main@dummycorp.local", PasswordHash = defaultPasswordHash, Role = "BranchManager" }
        };
        context.Set<User>().AddRange(users);
        context.SaveChanges();

        // Branch Manager & Owner Assignments
        branch1.OwnerUserId = users.First(u => u.Role == "BranchOwner").UserId;
        branch1.ManagerUserId = users.First(u => u.Role == "BranchManager").UserId;
        context.SaveChanges();

        // 5. Add Units
        var unitG = new Unit { TenantId = dummyTenant.TenantId, Name = "Grams", Symbol = "g" };
        var unitMl = new Unit { TenantId = dummyTenant.TenantId, Name = "Milliliters", Symbol = "ml" };
        var unitPc = new Unit { TenantId = dummyTenant.TenantId, Name = "Piece", Symbol = "pc" };
        context.Set<Unit>().AddRange(unitG, unitMl, unitPc);
        context.SaveChanges();

        // 6. Add Inventory & Item Categories
        var invBeans = new InventoryCategory { TenantId = dummyTenant.TenantId, Name = "Coffee Beans" };
        var invDairy = new InventoryCategory { TenantId = dummyTenant.TenantId, Name = "Dairy & Milks" };
        var invSyrups = new InventoryCategory { TenantId = dummyTenant.TenantId, Name = "Syrups" };
        var invCups = new InventoryCategory { TenantId = dummyTenant.TenantId, Name = "Packaging" };
        context.Set<InventoryCategory>().AddRange(invBeans, invDairy, invSyrups, invCups);
        context.SaveChanges();

        var itemCatArabica = new ItemCategory { Name = "Arabica", TenantId = dummyTenant.TenantId };
        var itemCatRobusta = new ItemCategory { Name = "Robusta", TenantId = dummyTenant.TenantId };
        context.Set<ItemCategory>().AddRange(itemCatArabica, itemCatRobusta);
        context.SaveChanges();

        // 7. Add Base Items
        var itemEspressoBeans = new Item { TenantId = dummyTenant.TenantId, SKU = "BNS-ESP-01", Name = "House Espresso Blend", UnitId = unitG.UnitId, InventoryCategoryId = invBeans.CategoryId, ItemCategoryId = itemCatArabica.ItemCategoryId, DefaultThreshold = 5000, UnitCost = 1.2m };
        var itemWholeMilk = new Item { TenantId = dummyTenant.TenantId, SKU = "MLK-WHL-01", Name = "Whole Milk", UnitId = unitMl.UnitId, InventoryCategoryId = invDairy.CategoryId, DefaultThreshold = 10000, UnitCost = 0.05m };
        var itemOatMilk = new Item { TenantId = dummyTenant.TenantId, SKU = "MLK-OAT-01", Name = "Barista Oat Milk", UnitId = unitMl.UnitId, InventoryCategoryId = invDairy.CategoryId, DefaultThreshold = 5000, UnitCost = 0.15m };
        var itemVanillaSyrup = new Item { TenantId = dummyTenant.TenantId, SKU = "SYR-VAN-01", Name = "Vanilla Syrup", UnitId = unitMl.UnitId, InventoryCategoryId = invSyrups.CategoryId, DefaultThreshold = 2000, UnitCost = 0.20m };
        var itemCup12oz = new Item { TenantId = dummyTenant.TenantId, SKU = "CUP-12-HT", Name = "12oz Hot Cup", UnitId = unitPc.UnitId, InventoryCategoryId = invCups.CategoryId, DefaultThreshold = 500, UnitCost = 5.0m };
        var itemLid12oz = new Item { TenantId = dummyTenant.TenantId, SKU = "LID-12-HT", Name = "12oz Hot Cup Lid", UnitId = unitPc.UnitId, InventoryCategoryId = invCups.CategoryId, DefaultThreshold = 500, UnitCost = 2.0m };
        context.Set<Item>().AddRange(itemEspressoBeans, itemWholeMilk, itemOatMilk, itemVanillaSyrup, itemCup12oz, itemLid12oz);
        context.SaveChanges();

        // 8. Add Batches to HQ
        var batches = new List<Batch>
        {
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemEspressoBeans.ItemId, BatchNumber = "B-2026-001", CurrentQuantity = 20000, ExpiryDate = DateTime.UtcNow.AddMonths(6) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemWholeMilk.ItemId, BatchNumber = "M-2026-001", CurrentQuantity = 50000, ExpiryDate = DateTime.UtcNow.AddDays(14) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemOatMilk.ItemId, BatchNumber = "M-2026-002", CurrentQuantity = 20000, ExpiryDate = DateTime.UtcNow.AddMonths(3) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemVanillaSyrup.ItemId, BatchNumber = "S-2026-001", CurrentQuantity = 10000, ExpiryDate = DateTime.UtcNow.AddYears(1) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemCup12oz.ItemId, BatchNumber = "C-2026-001", CurrentQuantity = 5000 },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemLid12oz.ItemId, BatchNumber = "L-2026-001", CurrentQuantity = 5000 }
        };
        context.Set<Batch>().AddRange(batches);
        context.SaveChanges();

        // 9. Add Menu System
        var menuCatCoffee = new MenuCategory { TenantId = dummyTenant.TenantId, Name = "Coffee", DisplayOrder = 1 };
        context.Set<MenuCategory>().Add(menuCatCoffee);
        context.SaveChanges();

        var tagBestSeller = new MenuTag { TenantId = dummyTenant.TenantId, Name = "Bestseller", Color = "#ffb300" };
        var tagHot = new MenuTag { TenantId = dummyTenant.TenantId, Name = "Hot", Color = "#e53935" };
        context.Set<MenuTag>().AddRange(tagBestSeller, tagHot);
        context.SaveChanges();

        var miLatte = new MenuItem { TenantId = dummyTenant.TenantId, Name = "Cafe Latte", CategoryId = menuCatCoffee.CategoryId, BasePrice = 140m, Status = "Active" };
        context.Set<MenuItem>().Add(miLatte);
        context.SaveChanges();

        var miLatteTags = new List<MenuItemTag>
        {
            new MenuItemTag { MenuItemId = miLatte.MenuItemId, TagId = tagHot.TagId },
            new MenuItemTag { MenuItemId = miLatte.MenuItemId, TagId = tagBestSeller.TagId }
        };
        context.Set<MenuItemTag>().AddRange(miLatteTags);
        context.SaveChanges();

        var mvLatte12oz = new MenuVariant { MenuItemId = miLatte.MenuItemId, Name = "12oz (Hot)", PricingMode = "absolute", Price = 140m, DisplayOrder = 1 };
        var mvLatte16oz = new MenuVariant { MenuItemId = miLatte.MenuItemId, Name = "16oz (Hot)", PricingMode = "absolute", Price = 165m, DisplayOrder = 2 };
        context.Set<MenuVariant>().AddRange(mvLatte12oz, mvLatte16oz);
        context.SaveChanges();

        var viLatte12oz1 = new VariantIngredient { VariantId = mvLatte12oz.VariantId, ItemId = itemEspressoBeans.ItemId, Quantity = 18 }; // 18g coffee
        var viLatte12oz2 = new VariantIngredient { VariantId = mvLatte12oz.VariantId, ItemId = itemWholeMilk.ItemId, Quantity = 240 }; // 240ml milk
        var viLatte12oz3 = new VariantIngredient { VariantId = mvLatte12oz.VariantId, ItemId = itemCup12oz.ItemId, Quantity = 1 }; // 1 cup
        var viLatte12oz4 = new VariantIngredient { VariantId = mvLatte12oz.VariantId, ItemId = itemLid12oz.ItemId, Quantity = 1 }; // 1 lid
        context.Set<VariantIngredient>().AddRange(viLatte12oz1, viLatte12oz2, viLatte12oz3, viLatte12oz4);
        context.SaveChanges();
    }
}