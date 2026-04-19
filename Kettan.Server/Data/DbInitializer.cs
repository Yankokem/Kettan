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

        // 1. Setup Subscription Plans (idempotent in case of partial prior seed runs)
        var starterPlan = context.Set<SubscriptionPlan>().IgnoreQueryFilters().FirstOrDefault(p => p.PlanCode == "STARTER");
        if (starterPlan == null)
        {
            starterPlan = new SubscriptionPlan { PlanCode = "STARTER", Name = "Starter", PriceMonthly = 999m, BranchLimit = 1, UserLimit = 5 };
            context.Set<SubscriptionPlan>().Add(starterPlan);
        }

        var growthPlan = context.Set<SubscriptionPlan>().IgnoreQueryFilters().FirstOrDefault(p => p.PlanCode == "GROWTH");
        if (growthPlan == null)
        {
            growthPlan = new SubscriptionPlan { PlanCode = "GROWTH", Name = "Growth", PriceMonthly = 2499m, BranchLimit = 3, UserLimit = 15 };
            context.Set<SubscriptionPlan>().Add(growthPlan);
        }

        var enterprisePlan = context.Set<SubscriptionPlan>().IgnoreQueryFilters().FirstOrDefault(p => p.PlanCode == "ENTERPRISE");
        if (enterprisePlan == null)
        {
            enterprisePlan = new SubscriptionPlan { PlanCode = "ENTERPRISE", Name = "Enterprise", PriceMonthly = 4999m, BranchLimit = 10, UserLimit = 50 };
            context.Set<SubscriptionPlan>().Add(enterprisePlan);
        }

        context.SaveChanges();

        // 2. Add a dummy tenant
        var dummyTenant = new Tenant
        {
            Name = "Dummy Corporation Coffee",
            Email = "admin@dummycorp.local",
            Phone = "+639171234567",
            Address = "123 Coffee Ave, Manila",
            LogoUrl = "https://example.com/dummycorp-logo.png",
            SubscriptionStatus = "Active"
        };
        context.Set<Tenant>().Add(dummyTenant);
        context.SaveChanges();

        // 3. Add active subscription then link it to tenant
        var tenantSubscription = new TenantSubscription
        {
            TenantId = dummyTenant.TenantId,
            PlanId = growthPlan.PlanId,
            Status = "Active",
            BillingCycle = "Monthly",
            PeriodStart = DateTime.UtcNow,
            PeriodEnd = DateTime.UtcNow.AddMonths(1)
        };
        context.Set<TenantSubscription>().Add(tenantSubscription);
        context.SaveChanges();

        dummyTenant.CurrentSubscriptionId = tenantSubscription.TenantSubscriptionId;
        dummyTenant.SubscriptionPeriodStart = tenantSubscription.PeriodStart;
        dummyTenant.SubscriptionPeriodEnd = tenantSubscription.PeriodEnd;
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
        var unitKg = new Unit { TenantId = dummyTenant.TenantId, Name = "Kilograms", Symbol = "kg" };
        var unitL = new Unit { TenantId = dummyTenant.TenantId, Name = "Liters", Symbol = "L" };
        var unitBox = new Unit { TenantId = dummyTenant.TenantId, Name = "Box", Symbol = "box" };
        var unitBag = new Unit { TenantId = dummyTenant.TenantId, Name = "Bag", Symbol = "bag" };
        var unitBottle = new Unit { TenantId = dummyTenant.TenantId, Name = "Bottle", Symbol = "bottle" };
        context.Set<Unit>().AddRange(unitG, unitMl, unitPc, unitKg, unitL, unitBox, unitBag, unitBottle);
        context.SaveChanges();

        // 6. Add Inventory & Item Categories
        var invBeans = new InventoryCategory { TenantId = dummyTenant.TenantId, Name = "Beans" };
        var invDairy = new InventoryCategory { TenantId = dummyTenant.TenantId, Name = "Dairy" };
        var invSyrups = new InventoryCategory { TenantId = dummyTenant.TenantId, Name = "Syrups" };
        var invPackaging = new InventoryCategory { TenantId = dummyTenant.TenantId, Name = "Packaging" };
        var invDryGoods = new InventoryCategory { TenantId = dummyTenant.TenantId, Name = "Dry Goods" };
        context.Set<InventoryCategory>().AddRange(invBeans, invDairy, invSyrups, invPackaging, invDryGoods);
        context.SaveChanges();

        var itemCatArabica = new ItemCategory { Name = "Arabica", TenantId = dummyTenant.TenantId };
        var itemCatRobusta = new ItemCategory { Name = "Robusta", TenantId = dummyTenant.TenantId };
        context.Set<ItemCategory>().AddRange(itemCatArabica, itemCatRobusta);
        context.SaveChanges();

        // 7. Add Base Items (10 inventory items with SKUs)
        var itemEspressoBeans = new Item { TenantId = dummyTenant.TenantId, SKU = "BNS-ESP-01", Name = "House Espresso Blend", UnitId = unitG.UnitId, InventoryCategoryId = invBeans.CategoryId, ItemCategoryId = itemCatArabica.ItemCategoryId, DefaultThreshold = 5000, UnitCost = 1.20m };
        var itemRobustaBeans = new Item { TenantId = dummyTenant.TenantId, SKU = "BNS-ROB-01", Name = "Robusta Blend Beans", UnitId = unitG.UnitId, InventoryCategoryId = invBeans.CategoryId, ItemCategoryId = itemCatRobusta.ItemCategoryId, DefaultThreshold = 5000, UnitCost = 0.95m };
        var itemWholeMilk = new Item { TenantId = dummyTenant.TenantId, SKU = "MLK-WHL-01", Name = "Whole Milk", UnitId = unitMl.UnitId, InventoryCategoryId = invDairy.CategoryId, DefaultThreshold = 10000, UnitCost = 0.05m };
        var itemOatMilk = new Item { TenantId = dummyTenant.TenantId, SKU = "MLK-OAT-01", Name = "Barista Oat Milk", UnitId = unitMl.UnitId, InventoryCategoryId = invDairy.CategoryId, DefaultThreshold = 5000, UnitCost = 0.15m };
        var itemVanillaSyrup = new Item { TenantId = dummyTenant.TenantId, SKU = "SYR-VAN-01", Name = "Vanilla Syrup", UnitId = unitMl.UnitId, InventoryCategoryId = invSyrups.CategoryId, DefaultThreshold = 2000, UnitCost = 0.20m };
        var itemCaramelSyrup = new Item { TenantId = dummyTenant.TenantId, SKU = "SYR-CAR-01", Name = "Caramel Syrup", UnitId = unitMl.UnitId, InventoryCategoryId = invSyrups.CategoryId, DefaultThreshold = 2000, UnitCost = 0.22m };
        var itemCup12oz = new Item { TenantId = dummyTenant.TenantId, SKU = "CUP-12-HT", Name = "12oz Hot Cup", UnitId = unitPc.UnitId, InventoryCategoryId = invPackaging.CategoryId, DefaultThreshold = 500, UnitCost = 5.0m };
        var itemLid12oz = new Item { TenantId = dummyTenant.TenantId, SKU = "LID-12-HT", Name = "12oz Hot Cup Lid", UnitId = unitPc.UnitId, InventoryCategoryId = invPackaging.CategoryId, DefaultThreshold = 500, UnitCost = 2.0m };
        var itemBrownSugar = new Item { TenantId = dummyTenant.TenantId, SKU = "DRY-SGR-01", Name = "Brown Sugar", UnitId = unitG.UnitId, InventoryCategoryId = invDryGoods.CategoryId, DefaultThreshold = 4000, UnitCost = 0.07m };
        var itemMatchaPowder = new Item { TenantId = dummyTenant.TenantId, SKU = "DRY-MAT-01", Name = "Matcha Powder", UnitId = unitG.UnitId, InventoryCategoryId = invDryGoods.CategoryId, DefaultThreshold = 1500, UnitCost = 1.80m };
        context.Set<Item>().AddRange(
            itemEspressoBeans,
            itemRobustaBeans,
            itemWholeMilk,
            itemOatMilk,
            itemVanillaSyrup,
            itemCaramelSyrup,
            itemCup12oz,
            itemLid12oz,
            itemBrownSugar,
            itemMatchaPowder);
        context.SaveChanges();

        // 8. Add Batches to HQ (2+ per item for FIFO testing)
        var batches = new List<Batch>
        {
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemEspressoBeans.ItemId, BatchNumber = "B-ESP-2026-001", CurrentQuantity = 12000, ExpiryDate = DateTime.UtcNow.AddMonths(6) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemEspressoBeans.ItemId, BatchNumber = "B-ESP-2026-002", CurrentQuantity = 10000, ExpiryDate = DateTime.UtcNow.AddMonths(8) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemRobustaBeans.ItemId, BatchNumber = "B-ROB-2026-001", CurrentQuantity = 10000, ExpiryDate = DateTime.UtcNow.AddMonths(6) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemRobustaBeans.ItemId, BatchNumber = "B-ROB-2026-002", CurrentQuantity = 8000, ExpiryDate = DateTime.UtcNow.AddMonths(8) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemWholeMilk.ItemId, BatchNumber = "M-WHL-2026-001", CurrentQuantity = 35000, ExpiryDate = DateTime.UtcNow.AddDays(12) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemWholeMilk.ItemId, BatchNumber = "M-WHL-2026-002", CurrentQuantity = 30000, ExpiryDate = DateTime.UtcNow.AddDays(20) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemOatMilk.ItemId, BatchNumber = "M-OAT-2026-001", CurrentQuantity = 15000, ExpiryDate = DateTime.UtcNow.AddMonths(2) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemOatMilk.ItemId, BatchNumber = "M-OAT-2026-002", CurrentQuantity = 16000, ExpiryDate = DateTime.UtcNow.AddMonths(4) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemVanillaSyrup.ItemId, BatchNumber = "S-VAN-2026-001", CurrentQuantity = 8000, ExpiryDate = DateTime.UtcNow.AddYears(1) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemVanillaSyrup.ItemId, BatchNumber = "S-VAN-2026-002", CurrentQuantity = 7000, ExpiryDate = DateTime.UtcNow.AddYears(1).AddMonths(2) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemCaramelSyrup.ItemId, BatchNumber = "S-CAR-2026-001", CurrentQuantity = 7000, ExpiryDate = DateTime.UtcNow.AddYears(1) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemCaramelSyrup.ItemId, BatchNumber = "S-CAR-2026-002", CurrentQuantity = 6500, ExpiryDate = DateTime.UtcNow.AddYears(1).AddMonths(2) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemCup12oz.ItemId, BatchNumber = "P-CUP-2026-001", CurrentQuantity = 3000, ExpiryDate = DateTime.UtcNow.AddYears(3) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemCup12oz.ItemId, BatchNumber = "P-CUP-2026-002", CurrentQuantity = 3000, ExpiryDate = DateTime.UtcNow.AddYears(4) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemLid12oz.ItemId, BatchNumber = "P-LID-2026-001", CurrentQuantity = 3000, ExpiryDate = DateTime.UtcNow.AddYears(3) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemLid12oz.ItemId, BatchNumber = "P-LID-2026-002", CurrentQuantity = 3000, ExpiryDate = DateTime.UtcNow.AddYears(4) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemBrownSugar.ItemId, BatchNumber = "D-SGR-2026-001", CurrentQuantity = 6000, ExpiryDate = DateTime.UtcNow.AddYears(2) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemBrownSugar.ItemId, BatchNumber = "D-SGR-2026-002", CurrentQuantity = 5500, ExpiryDate = DateTime.UtcNow.AddYears(3) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemMatchaPowder.ItemId, BatchNumber = "D-MAT-2026-001", CurrentQuantity = 2500, ExpiryDate = DateTime.UtcNow.AddMonths(14) },
            new Batch { TenantId = dummyTenant.TenantId, BranchId = null, ItemId = itemMatchaPowder.ItemId, BatchNumber = "D-MAT-2026-002", CurrentQuantity = 2200, ExpiryDate = DateTime.UtcNow.AddMonths(18) }
        };
        context.Set<Batch>().AddRange(batches);
        context.SaveChanges();

        // 9. Add Menu System
        var menuCatCoffee = new MenuCategory { TenantId = dummyTenant.TenantId, Name = "Coffee", DisplayOrder = 1 };
        var menuCatNonCoffee = new MenuCategory { TenantId = dummyTenant.TenantId, Name = "Non-Coffee", DisplayOrder = 2 };
        var menuCatFood = new MenuCategory { TenantId = dummyTenant.TenantId, Name = "Food", DisplayOrder = 3 };
        var menuCatPastries = new MenuCategory { TenantId = dummyTenant.TenantId, Name = "Pastries", DisplayOrder = 4 };
        context.Set<MenuCategory>().AddRange(menuCatCoffee, menuCatNonCoffee, menuCatFood, menuCatPastries);
        context.SaveChanges();

        var tagBestSeller = new MenuTag { TenantId = dummyTenant.TenantId, Name = "Bestseller", Color = "#ffb300" };
        var tagHot = new MenuTag { TenantId = dummyTenant.TenantId, Name = "Hot", Color = "#e53935" };
        context.Set<MenuTag>().AddRange(tagBestSeller, tagHot);
        context.SaveChanges();

        var miLatte = new MenuItem { TenantId = dummyTenant.TenantId, Name = "Cafe Latte", CategoryId = menuCatCoffee.CategoryId, BasePrice = 140m, Status = "Active" };
        var miMatcha = new MenuItem { TenantId = dummyTenant.TenantId, Name = "Iced Matcha Latte", CategoryId = menuCatNonCoffee.CategoryId, BasePrice = 160m, Status = "Active" };
        context.Set<MenuItem>().AddRange(miLatte, miMatcha);
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
        var mvMatcha12oz = new MenuVariant { MenuItemId = miMatcha.MenuItemId, Name = "12oz (Iced)", PricingMode = "absolute", Price = 160m, DisplayOrder = 1 };
        var mvMatcha16oz = new MenuVariant { MenuItemId = miMatcha.MenuItemId, Name = "16oz (Iced)", PricingMode = "absolute", Price = 185m, DisplayOrder = 2 };
        context.Set<MenuVariant>().AddRange(mvLatte12oz, mvLatte16oz, mvMatcha12oz, mvMatcha16oz);
        context.SaveChanges();

        var viLatte12oz1 = new VariantIngredient { VariantId = mvLatte12oz.VariantId, ItemId = itemEspressoBeans.ItemId, Quantity = 18 }; // 18g coffee
        var viLatte12oz2 = new VariantIngredient { VariantId = mvLatte12oz.VariantId, ItemId = itemWholeMilk.ItemId, Quantity = 240 }; // 240ml milk
        var viLatte12oz3 = new VariantIngredient { VariantId = mvLatte12oz.VariantId, ItemId = itemCup12oz.ItemId, Quantity = 1 }; // 1 cup
        var viLatte12oz4 = new VariantIngredient { VariantId = mvLatte12oz.VariantId, ItemId = itemLid12oz.ItemId, Quantity = 1 }; // 1 lid
        var viMatcha12oz1 = new VariantIngredient { VariantId = mvMatcha12oz.VariantId, ItemId = itemMatchaPowder.ItemId, Quantity = 12 };
        var viMatcha12oz2 = new VariantIngredient { VariantId = mvMatcha12oz.VariantId, ItemId = itemOatMilk.ItemId, Quantity = 220 };
        var viMatcha12oz3 = new VariantIngredient { VariantId = mvMatcha12oz.VariantId, ItemId = itemBrownSugar.ItemId, Quantity = 8 };
        var viMatcha12oz4 = new VariantIngredient { VariantId = mvMatcha12oz.VariantId, ItemId = itemCup12oz.ItemId, Quantity = 1 };
        var viMatcha12oz5 = new VariantIngredient { VariantId = mvMatcha12oz.VariantId, ItemId = itemLid12oz.ItemId, Quantity = 1 };
        context.Set<VariantIngredient>().AddRange(
            viLatte12oz1,
            viLatte12oz2,
            viLatte12oz3,
            viLatte12oz4,
            viMatcha12oz1,
            viMatcha12oz2,
            viMatcha12oz3,
            viMatcha12oz4,
            viMatcha12oz5);
        context.SaveChanges();

        // 10. Add Employees (HQ + branch)
        var employees = new List<Employee>
        {
            new Employee { TenantId = dummyTenant.TenantId, BranchId = null, FirstName = "Miguel", LastName = "Santos", Position = "Warehouse Supervisor", ContactNumber = "09170000001", DateHired = DateTime.UtcNow.Date.AddYears(-2), IsActive = true },
            new Employee { TenantId = dummyTenant.TenantId, BranchId = null, FirstName = "Lara", LastName = "Reyes", Position = "Inventory Clerk", ContactNumber = "09170000002", DateHired = DateTime.UtcNow.Date.AddYears(-1), IsActive = true },
            new Employee { TenantId = dummyTenant.TenantId, BranchId = branch1.BranchId, FirstName = "Paolo", LastName = "Cruz", Position = "Barista", ContactNumber = "09170000003", DateHired = DateTime.UtcNow.Date.AddMonths(-10), IsActive = true },
            new Employee { TenantId = dummyTenant.TenantId, BranchId = branch1.BranchId, FirstName = "Nina", LastName = "Lopez", Position = "Cashier", ContactNumber = "09170000004", DateHired = DateTime.UtcNow.Date.AddMonths(-8), IsActive = true }
        };
        context.Set<Employee>().AddRange(employees);
        context.SaveChanges();

        // 11. Add Courier and Vehicle
        var courier = new Courier
        {
            TenantId = dummyTenant.TenantId,
            Name = "QuickRoute Courier",
            ContactNumber = "09170000005",
            IsActive = true
        };
        context.Set<Courier>().Add(courier);
        context.SaveChanges();

        var vehicle = new Vehicle
        {
            TenantId = dummyTenant.TenantId,
            CourierId = courier.CourierId,
            PlateNumber = "NCR-1234",
            VehicleType = "Motorcycle",
            Description = "Primary branch delivery unit",
            IsActive = true
        };
        context.Set<Vehicle>().Add(vehicle);
        context.SaveChanges();
    }
}