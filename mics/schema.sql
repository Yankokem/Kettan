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
    Address NVARCHAR(500) NULL,
    City NVARCHAR(150) NULL,
    ContactNumber NVARCHAR(50) NULL,
    OpenTime TIME(0) NULL,
    CloseTime TIME(0) NULL,
    OwnerUserId INT NULL,
    ManagerUserId INT NULL,
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

CREATE INDEX IX_Branches_OwnerUserId ON Branches(OwnerUserId);
CREATE INDEX IX_Branches_ManagerUserId ON Branches(ManagerUserId);

ALTER TABLE Branches
ADD CONSTRAINT FK_Branches_OwnerUsers FOREIGN KEY (OwnerUserId) REFERENCES Users(UserId);

ALTER TABLE Branches
ADD CONSTRAINT FK_Branches_ManagerUsers FOREIGN KEY (ManagerUserId) REFERENCES Users(UserId);

CREATE TABLE Employees (
    EmployeeId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    BranchId INT NULL, -- Null means HQ employee
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Position NVARCHAR(100) NOT NULL,
    ContactNumber NVARCHAR(50) NULL,
    DateHired DATE NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Employees_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Employees_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId)
);

CREATE INDEX IX_Employees_TenantId ON Employees(TenantId);
CREATE INDEX IX_Employees_BranchId ON Employees(BranchId);

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

-- =====================================================================
-- 6. Domain Extensions (Plan Alignment)
-- =====================================================================

-- Item categories (category-only model)
CREATE TABLE ItemCategories (
    ItemCategoryId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ItemCategories_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

-- Extend items to support category, bundling, and product image/sellable use-cases
ALTER TABLE Items ADD
    ItemCategoryId INT NULL,
    SellingPrice DECIMAL(18,2) NULL,
    IsBundle BIT NOT NULL DEFAULT 0,
    ImageUrl NVARCHAR(500) NULL,
    DeletedAt DATETIME2 NULL;

ALTER TABLE Items
ADD CONSTRAINT FK_Items_ItemCategories FOREIGN KEY (ItemCategoryId) REFERENCES ItemCategories(ItemCategoryId);

-- Bundle composition (Parent bundle item -> child inventory items)
CREATE TABLE BundleItems (
    BundleItemId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    ParentItemId INT NOT NULL,
    ChildItemId INT NOT NULL,
    Quantity DECIMAL(18,4) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_BundleItems_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_BundleItems_ParentItem FOREIGN KEY (ParentItemId) REFERENCES Items(ItemId),
    CONSTRAINT FK_BundleItems_ChildItem FOREIGN KEY (ChildItemId) REFERENCES Items(ItemId),
    CONSTRAINT CHK_BundleItems_NoSelfReference CHECK (ParentItemId <> ChildItemId)
);

-- Registered couriers (entities, not login users)
CREATE TABLE Couriers (
    CourierId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    ContactNumber NVARCHAR(50) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Couriers_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

-- Vehicles assigned to couriers
CREATE TABLE Vehicles (
    VehicleId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    CourierId INT NOT NULL,
    PlateNumber NVARCHAR(50) NOT NULL,
    VehicleType NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Vehicles_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Vehicles_Couriers FOREIGN KEY (CourierId) REFERENCES Couriers(CourierId)
);

-- Extend shipments to link normalized courier + vehicle entities
ALTER TABLE Shipments ADD
    CourierId INT NULL,
    VehicleId INT NULL;

ALTER TABLE Shipments
ADD CONSTRAINT FK_Shipments_Couriers FOREIGN KEY (CourierId) REFERENCES Couriers(CourierId);

ALTER TABLE Shipments
ADD CONSTRAINT FK_Shipments_Vehicles FOREIGN KEY (VehicleId) REFERENCES Vehicles(VehicleId);

-- Order timeline history for status-based tracking
CREATE TABLE OrderStatusHistory (
    HistoryId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    OrderId INT NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    ChangedBy_UserId INT NULL,
    Remarks NVARCHAR(MAX) NULL,
    Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_OrderStatusHistory_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_OrderStatusHistory_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    CONSTRAINT FK_OrderStatusHistory_Users FOREIGN KEY (ChangedBy_UserId) REFERENCES Users(UserId)
);

-- Return line items per return request
CREATE TABLE ReturnItems (
    ReturnItemId INT IDENTITY(1,1) PRIMARY KEY,
    ReturnId INT NOT NULL,
    ItemId INT NOT NULL,
    QuantityReturned DECIMAL(18,4) NOT NULL,
    Reason NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ReturnItems_Returns FOREIGN KEY (ReturnId) REFERENCES Returns(ReturnId),
    CONSTRAINT FK_ReturnItems_Items FOREIGN KEY (ItemId) REFERENCES Items(ItemId)
);

-- Extend returns with review metadata and optional evidence/credit fields
ALTER TABLE Returns ADD
    ReviewedBy_UserId INT NULL,
    ResolvedAt DATETIME2 NULL,
    CreditAmount DECIMAL(18,2) NULL,
    PhotoUrls NVARCHAR(MAX) NULL;

ALTER TABLE Returns
ADD CONSTRAINT FK_Returns_ReviewedByUsers FOREIGN KEY (ReviewedBy_UserId) REFERENCES Users(UserId);

-- Persistent in-app notifications
CREATE TABLE Notifications (
    NotificationId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    UserId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    ReferenceType NVARCHAR(50) NULL,
    ReferenceId INT NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    ReadAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Notifications_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- =====================================================================
-- 7. Subscription & Billing (Standard Depth)
-- =====================================================================

CREATE TABLE SubscriptionPlans (
    PlanId INT IDENTITY(1,1) PRIMARY KEY,
    PlanCode NVARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    PriceMonthly DECIMAL(18,2) NOT NULL,
    PriceYearly DECIMAL(18,2) NULL,
    BranchLimit INT NULL,
    UserLimit INT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE TenantSubscriptions (
    TenantSubscriptionId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    PlanId INT NOT NULL,
    Status NVARCHAR(30) NOT NULL DEFAULT 'Active', -- Trialing, Active, PastDue, Canceled, Expired
    BillingCycle NVARCHAR(20) NOT NULL DEFAULT 'Monthly', -- Monthly, Yearly
    StartDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    PeriodStart DATETIME2 NOT NULL,
    PeriodEnd DATETIME2 NOT NULL,
    AutoRenew BIT NOT NULL DEFAULT 1,
    CanceledAt DATETIME2 NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_TenantSubscriptions_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_TenantSubscriptions_Plans FOREIGN KEY (PlanId) REFERENCES SubscriptionPlans(PlanId)
);

CREATE TABLE SubscriptionInvoices (
    InvoiceId INT IDENTITY(1,1) PRIMARY KEY,
    TenantSubscriptionId INT NOT NULL,
    InvoiceNumber NVARCHAR(50) NOT NULL UNIQUE,
    AmountDue DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(10) NOT NULL DEFAULT 'PHP',
    Status NVARCHAR(30) NOT NULL DEFAULT 'Open', -- Draft, Open, Paid, Void, Uncollectible
    IssuedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    DueAt DATETIME2 NULL,
    PaidAt DATETIME2 NULL,
    ProviderReference NVARCHAR(120) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_SubscriptionInvoices_TenantSubscriptions FOREIGN KEY (TenantSubscriptionId) REFERENCES TenantSubscriptions(TenantSubscriptionId)
);

CREATE TABLE SubscriptionPayments (
    PaymentId INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceId INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(10) NOT NULL DEFAULT 'PHP',
    PaymentMethod NVARCHAR(40) NULL,
    Provider NVARCHAR(40) NULL,
    ProviderPaymentId NVARCHAR(120) NULL,
    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending', -- Pending, Succeeded, Failed, Refunded
    PaidAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_SubscriptionPayments_Invoices FOREIGN KEY (InvoiceId) REFERENCES SubscriptionInvoices(InvoiceId)
);

ALTER TABLE Tenants ADD
    CurrentSubscriptionId INT NULL,
    SubscriptionStatus NVARCHAR(30) NOT NULL DEFAULT 'Active',
    SubscriptionPeriodStart DATETIME2 NULL,
    SubscriptionPeriodEnd DATETIME2 NULL;

ALTER TABLE Tenants
ADD CONSTRAINT FK_Tenants_CurrentSubscription FOREIGN KEY (CurrentSubscriptionId) REFERENCES TenantSubscriptions(TenantSubscriptionId);

-- =====================================================================
-- 8. Soft Delete Standardization
-- =====================================================================

ALTER TABLE Tenants ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE Branches ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE Users ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE Employees ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE Units ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE InventoryCategories ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE MenuCategories ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE MenuTags ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE MenuItems ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE MenuVariants ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE SupplyRequests ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE Orders ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE Shipments ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

ALTER TABLE Returns ADD
    IsDeleted BIT NOT NULL DEFAULT 0,
    DeletedAt DATETIME2 NULL;

-- =====================================================================
-- 9. Audit Logging
-- =====================================================================

CREATE TABLE AuditLogs (
    AuditLogId BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NULL,
    UserId INT NULL,
    Action NVARCHAR(80) NOT NULL,
    EntityName NVARCHAR(120) NOT NULL,
    EntityId NVARCHAR(120) NULL,
    EventCategory NVARCHAR(60) NOT NULL DEFAULT 'Application', -- Application, TriggerFallback, System
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    IpAddress NVARCHAR(64) NULL,
    UserAgent NVARCHAR(512) NULL,
    OccurredAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_AuditLogs_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE INDEX IX_AuditLogs_Tenant_OccurredAt ON AuditLogs(TenantId, OccurredAt DESC);
CREATE INDEX IX_AuditLogs_User_OccurredAt ON AuditLogs(UserId, OccurredAt DESC);
CREATE INDEX IX_AuditLogs_Entity ON AuditLogs(EntityName, EntityId, OccurredAt DESC);

