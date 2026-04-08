-- =====================================================================
-- Kettan SaaS Platform - Database Schema
-- Target: Microsoft SQL Server (T-SQL)
-- Objective: Multi-tenant, strict FIFO batch tracking, complete OFMS
-- =====================================================================

-- =====================================================================
-- 1. SaaS & Multi-Tenancy Level
-- =====================================================================
CREATE TABLE Tenants (
    TenantId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    SubscriptionTier NVARCHAR(50) NOT NULL DEFAULT 'Starter', -- Starter, Growth, Enterprise
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE Branches (
    BranchId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Location NVARCHAR(500),
    CustomThresholds NVARCHAR(MAX), -- JSON for overriding default item thresholds
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Branches_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NULL, -- Nullable for SuperAdmins (Platform level)
    BranchId INT NULL, -- Nullable for HQ Roles (TenantAdmin, HqManager, HqStaff)
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL, -- SuperAdmin, TenantAdmin, HqManager, HqStaff, BranchOwner, BranchManager
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Users_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Users_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId)
);

-- =====================================================================
-- 2. Inventory & Batching Level
-- =====================================================================

-- Units of Measure: Standardized units (prevents typos, enables future conversions)
CREATE TABLE Units (
    UnitId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    Name NVARCHAR(50) NOT NULL,       -- Gram, Milliliter, Piece, Kilogram
    Symbol NVARCHAR(10) NOT NULL,     -- g, ml, pc, kg
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Units_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

-- Inventory Categories: Organize raw materials (Dry Goods, Dairy, Syrups, Packaging)
CREATE TABLE InventoryCategories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_InvCategories_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

CREATE TABLE Items (
    ItemId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    SKU NVARCHAR(100) NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    UnitId INT NOT NULL,              -- FK to Units (replaces string UnitOfMeasure)
    InventoryCategoryId INT NULL,     -- FK to InventoryCategories (optional grouping)
    DefaultThreshold DECIMAL(18,4) NOT NULL DEFAULT 0,
    UnitCost DECIMAL(18,2) NOT NULL DEFAULT 0,
    PreviousUnitCost DECIMAL(18,2) NULL, -- Track cost changes
    IsDeleted BIT NOT NULL DEFAULT 0, -- Soft delete for history preservation
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Items_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Items_Units FOREIGN KEY (UnitId) REFERENCES Units(UnitId),
    CONSTRAINT FK_Items_InvCategories FOREIGN KEY (InventoryCategoryId) REFERENCES InventoryCategories(CategoryId)
);

CREATE TABLE Batches (
    BatchId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    ItemId INT NOT NULL,
    BranchId INT NULL, -- Null = Sitting in HQ Inventory, Not Null = Sitting in Branch Inventory
    BatchNumber NVARCHAR(100) NOT NULL,
    ExpiryDate DATETIME2 NOT NULL,
    CurrentQuantity DECIMAL(18,4) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Batches_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Batches_Items FOREIGN KEY (ItemId) REFERENCES Items(ItemId),
    CONSTRAINT FK_Batches_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId)
);

CREATE TABLE InventoryTransactions (
    TransactionId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    BatchId INT NOT NULL,
    UserId INT NOT NULL,
    QuantityChange DECIMAL(18,4) NOT NULL, -- positive (receive) or negative (consume)
    TransactionType NVARCHAR(50) NOT NULL, -- Consumption, Sales_Auto, Physical_Count, Transfer, Restock
    ReferenceType NVARCHAR(50) NULL, -- Receipt, Order, Adjustment
    ReferenceId INT NULL,
    Remarks NVARCHAR(MAX) NULL,
    Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_InvTrans_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_InvTrans_Batches FOREIGN KEY (BatchId) REFERENCES Batches(BatchId),
    CONSTRAINT FK_InvTrans_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- =====================================================================
-- 3. Core OFMS Level (Requests, Orders, Allocation)
-- =====================================================================
CREATE TABLE SupplyRequests (
    RequestId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    BranchId INT NOT NULL,
    RequestedBy_UserId INT NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Auto_Drafted, PendingApproval, Approved, Rejected
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_SupplyRequests_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_SupplyRequests_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId),
    CONSTRAINT FK_SupplyRequests_Users FOREIGN KEY (RequestedBy_UserId) REFERENCES Users(UserId)
);

CREATE TABLE SupplyRequestItems (
    RequestItemId INT IDENTITY(1,1) PRIMARY KEY,
    RequestId INT NOT NULL,
    ItemId INT NOT NULL,
    QuantityRequested DECIMAL(18,4) NOT NULL,
    QuantityApproved DECIMAL(18,4) NULL, -- Set during HQ review if partial fulfillment needed
    CONSTRAINT FK_ReqItems_Requests FOREIGN KEY (RequestId) REFERENCES SupplyRequests(RequestId),
    CONSTRAINT FK_ReqItems_Items FOREIGN KEY (ItemId) REFERENCES Items(ItemId)
);

CREATE TABLE Orders (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    RequestId INT NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Processing', -- Processing, Picking, Packed, Dispatched, Delivered, Returned
    PushedToFulfillmentAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Orders_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Orders_Requests FOREIGN KEY (RequestId) REFERENCES SupplyRequests(RequestId)
);

CREATE TABLE OrderAllocations (
    -- The core logic enforcer. Orders don't pull blindly from "Items". They pull exactly from batches.
    AllocationId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    BatchId INT NOT NULL,
    QuantityPicked DECIMAL(18,4) NOT NULL, -- Exact amount removed from specific batch
    CONSTRAINT FK_Allocations_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    CONSTRAINT FK_Allocations_Batches FOREIGN KEY (BatchId) REFERENCES Batches(BatchId)
);

-- =====================================================================
-- 4. Shipping and Returns
-- =====================================================================
CREATE TABLE Shipments (
    ShipmentId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    OrderId INT NOT NULL UNIQUE,
    TrackingNumber NVARCHAR(100) NULL,
    CourierAssignment NVARCHAR(100) NULL,
    DistanceMap DECIMAL(18,2) NULL, -- In kilometers/miles
    DispatchDate DATETIME2 NULL,
    EstimatedArrival DATETIME2 NULL,
    CONSTRAINT FK_Shipments_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Shipments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId)
);

CREATE TABLE Returns (
    ReturnId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    OrderId INT NOT NULL,
    BranchId INT NOT NULL,
    Reason NVARCHAR(MAX) NOT NULL,
    Resolution NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Replaced, Credited
    LoggedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Returns_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Returns_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    CONSTRAINT FK_Returns_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId)
);

-- =====================================================================
-- 5. Menu Management Level
-- =====================================================================

-- Categories: User-managed groupings (e.g., Coffee, Non-Coffee, Food, Pastries)
CREATE TABLE MenuCategories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_MenuCategories_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

-- Tags: User-managed labels/badges (e.g., Bestseller, New, Vegan, Spicy)
CREATE TABLE MenuTags (
    TagId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    Name NVARCHAR(50) NOT NULL,
    Color NVARCHAR(7) NULL, -- Hex color for badge (e.g., #FF5733)
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_MenuTags_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

-- Menu Items: The actual products (e.g., Vanilla Latte, Chicken Sandwich)
CREATE TABLE MenuItems (
    MenuItemId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    CategoryId INT NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ImageUrl NVARCHAR(500) NULL,
    BasePrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active', -- Active, Inactive
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_MenuItems_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_MenuItems_Categories FOREIGN KEY (CategoryId) REFERENCES MenuCategories(CategoryId)
);

-- Junction: Menu Item ↔ Tags (many-to-many)
CREATE TABLE MenuItemTags (
    MenuItemId INT NOT NULL,
    TagId INT NOT NULL,
    PRIMARY KEY (MenuItemId, TagId),
    CONSTRAINT FK_MenuItemTags_MenuItems FOREIGN KEY (MenuItemId) REFERENCES MenuItems(MenuItemId),
    CONSTRAINT FK_MenuItemTags_Tags FOREIGN KEY (TagId) REFERENCES MenuTags(TagId)
);

-- Variants: Sizes/portions with flexible pricing (e.g., Small, Medium, Large)
CREATE TABLE MenuVariants (
    VariantId INT IDENTITY(1,1) PRIMARY KEY,
    MenuItemId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL, -- Small, Medium, Large, Solo, Regular
    PricingMode NVARCHAR(10) NOT NULL DEFAULT 'absolute', -- 'absolute' or 'relative'
    Price DECIMAL(18,2) NOT NULL, -- If absolute: exact price (₱150), if relative: modifier (+₱20)
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_MenuVariants_MenuItems FOREIGN KEY (MenuItemId) REFERENCES MenuItems(MenuItemId)
);

-- Variant Ingredients: Recipe per variant linking to inventory
CREATE TABLE VariantIngredients (
    VariantIngredientId INT IDENTITY(1,1) PRIMARY KEY,
    VariantId INT NOT NULL,
    ItemId INT NOT NULL, -- References Items (inventory)
    Quantity DECIMAL(18,4) NOT NULL, -- Amount to deduct per sale (e.g., 18g espresso)
    CONSTRAINT FK_VariantIngredients_Variants FOREIGN KEY (VariantId) REFERENCES MenuVariants(VariantId),
    CONSTRAINT FK_VariantIngredients_Items FOREIGN KEY (ItemId) REFERENCES Items(ItemId)
);
