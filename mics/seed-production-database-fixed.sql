-- =============================================
-- Kettan Production Database Seeding Script (FIXED)
-- =============================================
-- This script seeds the production database with initial data
-- Safe to run multiple times (includes cleanup)
-- Generated for MonsterASP shared hosting environment
-- =============================================

SET NOCOUNT ON;
GO

-- =============================================
-- SECTION 1: CLEANUP (Delete in reverse FK order)
-- =============================================
PRINT 'Starting cleanup...';

-- Menu-related cleanup
DELETE FROM [VariantIngredients];
DELETE FROM [MenuItemTags];
DELETE FROM [MenuVariants];
DELETE FROM [MenuItems];
DELETE FROM [MenuTags];
DELETE FROM [MenuCategories];

-- Inventory-related cleanup
DELETE FROM [Batches];
DELETE FROM [Items];
DELETE FROM [ItemCategories];
DELETE FROM [InventoryCategories];

-- Employee cleanup
DELETE FROM [Employees];

-- Logistics cleanup
DELETE FROM [Vehicles];

-- Branch cleanup (update leadership references first)
UPDATE [Branches] SET [OwnerUserId] = NULL, [ManagerUserId] = NULL;
DELETE FROM [Users];
DELETE FROM [Branches];

-- Tenant and subscription cleanup
UPDATE [Tenants] SET [CurrentSubscriptionId] = NULL;
DELETE FROM [TenantSubscriptions];
DELETE FROM [Tenants];
DELETE FROM [SubscriptionPlans];

PRINT 'Cleanup completed.';
GO

-- =============================================
-- SECTION 2: SUBSCRIPTION PLANS
-- =============================================
PRINT 'Seeding Subscription Plans...';

SET IDENTITY_INSERT [SubscriptionPlans] ON;

DECLARE @PlanCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [SubscriptionPlans] 
    ([PlanId], [PlanCode], [Name], [Description], [PriceMonthly], [PriceYearly], [BranchLimit], [UserLimit], [IsActive], [IsDeleted], [DeletedAt], [CreatedAt])
VALUES
    (1, 'STARTER', 'Starter', NULL, 999.00, NULL, 1, 5, 1, 0, NULL, @PlanCreatedAt),
    (2, 'GROWTH', 'Growth', NULL, 2499.00, NULL, 3, 15, 1, 0, NULL, @PlanCreatedAt),
    (3, 'ENTERPRISE', 'Enterprise', NULL, 4999.00, NULL, 10, 50, 1, 0, NULL, @PlanCreatedAt);

SET IDENTITY_INSERT [SubscriptionPlans] OFF;

PRINT 'Subscription Plans seeded.';
GO

-- =============================================
-- SECTION 3: TENANT
-- =============================================
PRINT 'Seeding Tenant...';

SET IDENTITY_INSERT [Tenants] ON;

DECLARE @TenantCreatedAt datetime2(3) = SYSUTCDATETIME();
DECLARE @TenantPeriodStart datetime2(3) = SYSUTCDATETIME();
DECLARE @TenantPeriodEnd datetime2(3) = DATEADD(MONTH, 1, SYSUTCDATETIME());

INSERT INTO [Tenants]
    ([TenantId], [Name], [SubscriptionTier], [Email], [Phone], [Address], [LegalName], [TaxId], [Website], [SupportEmail], [LogoUrl], 
     [IsActive], [CurrentSubscriptionId], [SubscriptionStatus], [SubscriptionPeriodStart], [SubscriptionPeriodEnd],
     [IsDeleted], [DeletedAt], [CreatedAt])
VALUES
    (1, 'Dummy Corporation Coffee', 2, 'admin@dummycorp.local', '+639171234567', 
     '123 Coffee Ave, Manila', NULL, NULL, NULL, NULL, 'https://example.com/dummycorp-logo.png',
     1, NULL, 0, @TenantPeriodStart, @TenantPeriodEnd,
     0, NULL, @TenantCreatedAt);

SET IDENTITY_INSERT [Tenants] OFF;

PRINT 'Tenant seeded.';
GO

-- =============================================
-- SECTION 4: TENANT SUBSCRIPTION
-- =============================================
PRINT 'Seeding Tenant Subscription...';

SET IDENTITY_INSERT [TenantSubscriptions] ON;

DECLARE @SubCreatedAt datetime2(3) = SYSUTCDATETIME();
DECLARE @SubStartDate datetime2(3) = SYSUTCDATETIME();
DECLARE @SubPeriodStart datetime2(3) = SYSUTCDATETIME();
DECLARE @SubPeriodEnd datetime2(3) = DATEADD(MONTH, 1, SYSUTCDATETIME());

INSERT INTO [TenantSubscriptions]
    ([TenantSubscriptionId], [TenantId], [PlanId], [Status], [BillingCycle],
     [StartDate], [PeriodStart], [PeriodEnd], [AutoRenew], [CanceledAt],
     [IsDeleted], [DeletedAt], [CreatedAt], [UpdatedAt])
VALUES
    (1, 1, 2, 0, 0, @SubStartDate, @SubPeriodStart, @SubPeriodEnd, 1, NULL,
     0, NULL, @SubCreatedAt, @SubCreatedAt);

SET IDENTITY_INSERT [TenantSubscriptions] OFF;

-- Update Tenant with CurrentSubscriptionId
UPDATE [Tenants] 
SET [CurrentSubscriptionId] = 1,
    [SubscriptionPeriodStart] = @SubPeriodStart,
    [SubscriptionPeriodEnd] = @SubPeriodEnd
WHERE [TenantId] = 1;

PRINT 'Tenant Subscription seeded.';
GO

-- =============================================
-- SECTION 5: BRANCHES
-- =============================================
PRINT 'Seeding Branches...';

SET IDENTITY_INSERT [Branches] ON;

DECLARE @BranchCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [Branches]
    ([BranchId], [TenantId], [Name], [Address], [City], [ContactNumber], [OpenTime], [CloseTime], 
     [OwnerUserId], [ManagerUserId], [Location], [CustomThresholds], [IsActive], [IsDeleted], [DeletedAt], [ImageUrl], [CreatedAt])
VALUES
    (1, 1, 'HQ Warehouse', '123 Coffee Ave', 'Manila', NULL, NULL, NULL, 
     NULL, NULL, 'Headquarters', NULL, 1, 0, NULL, NULL, @BranchCreatedAt),
    (2, 1, 'Kettan Cafe - BGC', 'Bonifacio High Street', 'Taguig', NULL, '08:00:00', '22:00:00', 
     NULL, NULL, 'Downtown', NULL, 1, 0, NULL, NULL, @BranchCreatedAt);

SET IDENTITY_INSERT [Branches] OFF;

PRINT 'Branches seeded.';
GO

-- =============================================
-- SECTION 6: USERS
-- =============================================
PRINT 'Seeding Users...';

SET IDENTITY_INSERT [Users] ON;

DECLARE @UserCreatedAt datetime2(3) = SYSUTCDATETIME();
-- Default password hash for "password123"
-- NOTE: Replace this with actual BCrypt hash from your application
DECLARE @DefaultPasswordHash nvarchar(60) = '$2a$11$YourActualBCryptHashHere';

INSERT INTO [Users]
    ([UserId], [TenantId], [BranchId], [FirstName], [LastName], [Email], 
     [PasswordHash], [Role], [Birthday], [ContactNo], [IsActive], [IsDeleted], [DeletedAt], [ImageUrl], [CreatedAt])
VALUES
    (1, NULL, NULL, 'Super', 'Admin', 'superadmin@kettan.local',
     @DefaultPasswordHash, 0, NULL, NULL, 1, 0, NULL, NULL, @UserCreatedAt),
    (2, 1, NULL, 'Tenant', 'Admin', 'tenantadmin@dummycorp.local',
     @DefaultPasswordHash, 1, NULL, NULL, 1, 0, NULL, NULL, @UserCreatedAt),
    (3, 1, 1, 'HQ', 'Manager', 'hqmanager@dummycorp.local',
     @DefaultPasswordHash, 2, NULL, NULL, 1, 0, NULL, NULL, @UserCreatedAt),
    (4, 1, 1, 'HQ', 'Staff', 'hqstaff@dummycorp.local',
     @DefaultPasswordHash, 3, NULL, NULL, 1, 0, NULL, NULL, @UserCreatedAt),
    (5, 1, 2, 'Branch', 'Owner', 'owner_main@dummycorp.local',
     @DefaultPasswordHash, 4, NULL, NULL, 1, 0, NULL, NULL, @UserCreatedAt),
    (6, 1, 2, 'Branch', 'Manager', 'manager_main@dummycorp.local',
     @DefaultPasswordHash, 5, NULL, NULL, 1, 0, NULL, NULL, @UserCreatedAt);

SET IDENTITY_INSERT [Users] OFF;

-- Update Branch leadership
UPDATE [Branches] 
SET [OwnerUserId] = 5, [ManagerUserId] = 6
WHERE [BranchId] = 2;

PRINT 'Users seeded.';
GO

-- =============================================
-- SECTION 7: INVENTORY CATEGORIES
-- =============================================
PRINT 'Seeding Inventory Categories...';

SET IDENTITY_INSERT [InventoryCategories] ON;

DECLARE @InvCatCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [InventoryCategories]
    ([CategoryId], [TenantId], [Name], [Description], [DisplayOrder],
     [IsActive], [IsDeleted], [DeletedAt], [CreatedAt])
VALUES
    (1, 1, 'Beans', NULL, 1, 1, 0, NULL, @InvCatCreatedAt),
    (2, 1, 'Dairy', NULL, 2, 1, 0, NULL, @InvCatCreatedAt),
    (3, 1, 'Syrups', NULL, 3, 1, 0, NULL, @InvCatCreatedAt),
    (4, 1, 'Packaging', NULL, 4, 1, 0, NULL, @InvCatCreatedAt),
    (5, 1, 'Dry Goods', NULL, 5, 1, 0, NULL, @InvCatCreatedAt);

SET IDENTITY_INSERT [InventoryCategories] OFF;

PRINT 'Inventory Categories seeded.';
GO

-- =============================================
-- SECTION 8: ITEM CATEGORIES
-- =============================================
PRINT 'Seeding Item Categories...';

SET IDENTITY_INSERT [ItemCategories] ON;

DECLARE @ItemCatCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [ItemCategories]
    ([ItemCategoryId], [TenantId], [Name], [Description], [DisplayOrder],
     [IsActive], [IsDeleted], [DeletedAt], [CreatedAt])
VALUES
    (1, 1, 'Arabica', NULL, 1, 1, 0, NULL, @ItemCatCreatedAt),
    (2, 1, 'Robusta', NULL, 2, 1, 0, NULL, @ItemCatCreatedAt);

SET IDENTITY_INSERT [ItemCategories] OFF;

PRINT 'Item Categories seeded.';
GO

-- =============================================
-- SECTION 9: ITEMS
-- =============================================
PRINT 'Seeding Items...';

SET IDENTITY_INSERT [Items] ON;

DECLARE @ItemCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [Items]
    ([ItemId], [TenantId], [SKU], [Name], [Unit], [InventoryCategoryId], [ItemCategoryId], 
     [DefaultThreshold], [UnitCost], [HoldingCost], [SetupCost], [AnnualDemand], [PreviousUnitCost], [SellingPrice],
     [IsBundle], [IsDeleted], [DeletedAt], [CreatedAt], [UpdatedAt])
VALUES
    (1, 1, 'BNS-ESP-01', 'House Espresso Blend', 'g', 1, 1, 5000, 1.20, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt),
    (2, 1, 'BNS-ROB-01', 'Robusta Blend Beans', 'g', 1, 2, 5000, 0.95, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt),
    (3, 1, 'MLK-WHL-01', 'Whole Milk', 'ml', 2, NULL, 10000, 0.05, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt),
    (4, 1, 'MLK-OAT-01', 'Barista Oat Milk', 'ml', 2, NULL, 5000, 0.15, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt),
    (5, 1, 'SYR-VAN-01', 'Vanilla Syrup', 'ml', 3, NULL, 2000, 0.20, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt),
    (6, 1, 'SYR-CAR-01', 'Caramel Syrup', 'ml', 3, NULL, 2000, 0.22, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt),
    (7, 1, 'CUP-12-HT', '12oz Hot Cup', 'pc', 4, NULL, 500, 5.0, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt),
    (8, 1, 'LID-12-HT', '12oz Hot Cup Lid', 'pc', 4, NULL, 500, 2.0, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt),
    (9, 1, 'DRY-SGR-01', 'Brown Sugar', 'g', 5, NULL, 4000, 0.07, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt),
    (10, 1, 'DRY-MAT-01', 'Matcha Powder', 'g', 5, NULL, 1500, 1.80, 0, 0, 0, NULL, NULL, 0, 0, NULL, @ItemCreatedAt, @ItemCreatedAt);

SET IDENTITY_INSERT [Items] OFF;

PRINT 'Items seeded.';
GO

-- =============================================
-- SECTION 10: BATCHES
-- =============================================
PRINT 'Seeding Batches...';

SET IDENTITY_INSERT [Batches] ON;

DECLARE @BatchCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [Batches]
    ([BatchId], [TenantId], [ItemId], [BranchId], [BatchNumber], [ExpiryDate], [CurrentQuantity], [CreatedAt])
VALUES
    -- Espresso Beans
    (1, 1, 1, NULL, 'B-ESP-2026-001', DATEADD(MONTH, 6, @BatchCreatedAt), 12000, @BatchCreatedAt),
    (2, 1, 1, NULL, 'B-ESP-2026-002', DATEADD(MONTH, 8, @BatchCreatedAt), 10000, @BatchCreatedAt),
    -- Robusta Beans
    (3, 1, 2, NULL, 'B-ROB-2026-001', DATEADD(MONTH, 6, @BatchCreatedAt), 10000, @BatchCreatedAt),
    (4, 1, 2, NULL, 'B-ROB-2026-002', DATEADD(MONTH, 8, @BatchCreatedAt), 8000, @BatchCreatedAt),
    -- Whole Milk
    (5, 1, 3, NULL, 'M-WHL-2026-001', DATEADD(DAY, 12, @BatchCreatedAt), 35000, @BatchCreatedAt),
    (6, 1, 3, NULL, 'M-WHL-2026-002', DATEADD(DAY, 20, @BatchCreatedAt), 30000, @BatchCreatedAt),
    -- Oat Milk
    (7, 1, 4, NULL, 'M-OAT-2026-001', DATEADD(MONTH, 2, @BatchCreatedAt), 15000, @BatchCreatedAt),
    (8, 1, 4, NULL, 'M-OAT-2026-002', DATEADD(MONTH, 4, @BatchCreatedAt), 16000, @BatchCreatedAt),
    -- Vanilla Syrup
    (9, 1, 5, NULL, 'S-VAN-2026-001', DATEADD(YEAR, 1, @BatchCreatedAt), 8000, @BatchCreatedAt),
    (10, 1, 5, NULL, 'S-VAN-2026-002', DATEADD(MONTH, 14, @BatchCreatedAt), 7000, @BatchCreatedAt),
    -- Caramel Syrup
    (11, 1, 6, NULL, 'S-CAR-2026-001', DATEADD(YEAR, 1, @BatchCreatedAt), 7000, @BatchCreatedAt),
    (12, 1, 6, NULL, 'S-CAR-2026-002', DATEADD(MONTH, 14, @BatchCreatedAt), 6500, @BatchCreatedAt),
    -- Cups
    (13, 1, 7, NULL, 'P-CUP-2026-001', DATEADD(YEAR, 3, @BatchCreatedAt), 3000, @BatchCreatedAt),
    (14, 1, 7, NULL, 'P-CUP-2026-002', DATEADD(YEAR, 4, @BatchCreatedAt), 3000, @BatchCreatedAt),
    -- Lids
    (15, 1, 8, NULL, 'P-LID-2026-001', DATEADD(YEAR, 3, @BatchCreatedAt), 3000, @BatchCreatedAt),
    (16, 1, 8, NULL, 'P-LID-2026-002', DATEADD(YEAR, 4, @BatchCreatedAt), 3000, @BatchCreatedAt),
    -- Brown Sugar
    (17, 1, 9, NULL, 'D-SGR-2026-001', DATEADD(YEAR, 2, @BatchCreatedAt), 6000, @BatchCreatedAt),
    (18, 1, 9, NULL, 'D-SGR-2026-002', DATEADD(YEAR, 3, @BatchCreatedAt), 5500, @BatchCreatedAt),
    -- Matcha Powder
    (19, 1, 10, NULL, 'D-MAT-2026-001', DATEADD(MONTH, 14, @BatchCreatedAt), 2500, @BatchCreatedAt),
    (20, 1, 10, NULL, 'D-MAT-2026-002', DATEADD(MONTH, 18, @BatchCreatedAt), 2200, @BatchCreatedAt);

SET IDENTITY_INSERT [Batches] OFF;

PRINT 'Batches seeded.';
GO

-- =============================================
-- SECTION 11: MENU CATEGORIES
-- =============================================
PRINT 'Seeding Menu Categories...';

SET IDENTITY_INSERT [MenuCategories] ON;

DECLARE @MenuCatCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [MenuCategories]
    ([CategoryId], [TenantId], [Name], [DisplayOrder], [IsActive], [IsDeleted], [DeletedAt], [CreatedAt])
VALUES
    (1, 1, 'Coffee', 1, 1, 0, NULL, @MenuCatCreatedAt),
    (2, 1, 'Non-Coffee', 2, 1, 0, NULL, @MenuCatCreatedAt),
    (3, 1, 'Food', 3, 1, 0, NULL, @MenuCatCreatedAt),
    (4, 1, 'Pastries', 4, 1, 0, NULL, @MenuCatCreatedAt);

SET IDENTITY_INSERT [MenuCategories] OFF;

PRINT 'Menu Categories seeded.';
GO

-- =============================================
-- SECTION 12: MENU TAGS
-- =============================================
PRINT 'Seeding Menu Tags...';

SET IDENTITY_INSERT [MenuTags] ON;

DECLARE @MenuTagCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [MenuTags]
    ([TagId], [TenantId], [Name], [Color], [IsActive], [IsDeleted], [DeletedAt], [CreatedAt])
VALUES
    (1, 1, 'Bestseller', '#ffb300', 1, 0, NULL, @MenuTagCreatedAt),
    (2, 1, 'Hot', '#e53935', 1, 0, NULL, @MenuTagCreatedAt);

SET IDENTITY_INSERT [MenuTags] OFF;

PRINT 'Menu Tags seeded.';
GO

-- =============================================
-- SECTION 13: MENU ITEMS
-- =============================================
PRINT 'Seeding Menu Items...';

SET IDENTITY_INSERT [MenuItems] ON;

DECLARE @MenuItemCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [MenuItems]
    ([MenuItemId], [TenantId], [Name], [Description], [CategoryId], [BasePrice], [Status], [ImageUrl], [IsDeleted], [DeletedAt], [CreatedAt], [UpdatedAt])
VALUES
    (1, 1, 'Cafe Latte', NULL, 1, 140.00, 0, NULL, 0, NULL, @MenuItemCreatedAt, @MenuItemCreatedAt),
    (2, 1, 'Iced Matcha Latte', NULL, 2, 160.00, 0, NULL, 0, NULL, @MenuItemCreatedAt, @MenuItemCreatedAt);

SET IDENTITY_INSERT [MenuItems] OFF;

PRINT 'Menu Items seeded.';
GO

-- =============================================
-- SECTION 14: MENU ITEM TAGS
-- =============================================
PRINT 'Seeding Menu Item Tags...';

INSERT INTO [MenuItemTags] ([MenuItemId], [TagId])
VALUES
    (1, 2), -- Cafe Latte -> Hot
    (1, 1); -- Cafe Latte -> Bestseller

PRINT 'Menu Item Tags seeded.';
GO

-- =============================================
-- SECTION 15: MENU VARIANTS
-- =============================================
PRINT 'Seeding Menu Variants...';

SET IDENTITY_INSERT [MenuVariants] ON;

DECLARE @MenuVariantCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [MenuVariants]
    ([VariantId], [MenuItemId], [Name], [PricingMode], [Price], [DisplayOrder], [IsActive], [IsDeleted], [DeletedAt], [CreatedAt])
VALUES
    (1, 1, '12oz (Hot)', 0, 140.00, 1, 1, 0, NULL, @MenuVariantCreatedAt),
    (2, 1, '16oz (Hot)', 0, 165.00, 2, 1, 0, NULL, @MenuVariantCreatedAt),
    (3, 2, '12oz (Iced)', 0, 160.00, 1, 1, 0, NULL, @MenuVariantCreatedAt),
    (4, 2, '16oz (Iced)', 0, 185.00, 2, 1, 0, NULL, @MenuVariantCreatedAt);

SET IDENTITY_INSERT [MenuVariants] OFF;

PRINT 'Menu Variants seeded.';
GO

-- =============================================
-- SECTION 16: VARIANT INGREDIENTS
-- =============================================
PRINT 'Seeding Variant Ingredients...';

INSERT INTO [VariantIngredients] ([VariantId], [ItemId], [Quantity])
VALUES
    -- Cafe Latte 12oz
    (1, 1, 18),    -- Espresso beans
    (1, 3, 240),   -- Whole milk
    (1, 7, 1),     -- Cup
    (1, 8, 1),     -- Lid
    -- Iced Matcha Latte 12oz
    (3, 10, 12),   -- Matcha powder
    (3, 4, 220),   -- Oat milk
    (3, 9, 8),     -- Brown sugar
    (3, 7, 1),     -- Cup
    (3, 8, 1);     -- Lid

PRINT 'Variant Ingredients seeded.';
GO

-- =============================================
-- SECTION 17: EMPLOYEES
-- =============================================
PRINT 'Seeding Employees...';

SET IDENTITY_INSERT [Employees] ON;

DECLARE @EmpCreatedAt datetime2(3) = SYSUTCDATETIME();
DECLARE @Today datetime2(3) = CAST(CAST(SYSUTCDATETIME() AS date) AS datetime2(3));

INSERT INTO [Employees]
    ([EmployeeId], [TenantId], [BranchId], [FirstName], [LastName], [Position], [ContactNumber], [DateHired], 
     [IsActive], [IsDeleted], [DeletedAt], [Email], [ImageUrl], [CreatedAt])
VALUES
    (1, 1, NULL, 'Miguel', 'Santos', 'Warehouse Supervisor', '09170000001', DATEADD(YEAR, -2, @Today), 
     1, 0, NULL, NULL, NULL, @EmpCreatedAt),
    (2, 1, NULL, 'Lara', 'Reyes', 'Inventory Clerk', '09170000002', DATEADD(YEAR, -1, @Today), 
     1, 0, NULL, NULL, NULL, @EmpCreatedAt),
    (3, 1, 2, 'Paolo', 'Cruz', 'Barista', '09170000003', DATEADD(MONTH, -10, @Today), 
     1, 0, NULL, NULL, NULL, @EmpCreatedAt),
    (4, 1, 2, 'Nina', 'Lopez', 'Cashier', '09170000004', DATEADD(MONTH, -8, @Today), 
     1, 0, NULL, NULL, NULL, @EmpCreatedAt);

SET IDENTITY_INSERT [Employees] OFF;

PRINT 'Employees seeded.';
GO

-- =============================================
-- SECTION 18: VEHICLES
-- =============================================
PRINT 'Seeding Vehicles...';

SET IDENTITY_INSERT [Vehicles] ON;

DECLARE @VehicleCreatedAt datetime2(3) = SYSUTCDATETIME();

INSERT INTO [Vehicles]
    ([VehicleId], [TenantId], [PlateNumber], [VehicleType], [Description], [IsActive], [IsDeleted], [DeletedAt], [CreatedAt])
VALUES
    (1, 1, 'NCR-1234', 0, 'Primary branch delivery unit', 1, 0, NULL, @VehicleCreatedAt);

SET IDENTITY_INSERT [Vehicles] OFF;

PRINT 'Vehicles seeded.';
GO

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
PRINT '';
PRINT '=============================================';
PRINT 'Database seeding completed successfully!';
PRINT '=============================================';
PRINT '';
PRINT 'Summary:';
PRINT '  - 3 Subscription Plans';
PRINT '  - 1 Tenant (Dummy Corporation Coffee)';
PRINT '  - 1 Tenant Subscription';
PRINT '  - 2 Branches (HQ Warehouse, Kettan Cafe - BGC)';
PRINT '  - 6 Users (SuperAdmin, TenantAdmin, HqManager, HqStaff, BranchOwner, BranchManager)';
PRINT '  - 5 Inventory Categories';
PRINT '  - 2 Item Categories';
PRINT '  - 10 Items';
PRINT '  - 20 Batches';
PRINT '  - 4 Menu Categories';
PRINT '  - 2 Menu Tags';
PRINT '  - 2 Menu Items';
PRINT '  - 2 Menu Item Tags';
PRINT '  - 4 Menu Variants';
PRINT '  - 9 Variant Ingredients';
PRINT '  - 4 Employees';
PRINT '  - 1 Vehicle';
PRINT '';
PRINT 'IMPORTANT: Update the @DefaultPasswordHash variable with your actual BCrypt hash!';
PRINT 'Default password for all users: password123';
PRINT '';
GO
