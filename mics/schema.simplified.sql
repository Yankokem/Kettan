-- =====================================================================
-- Kettan SaaS Platform - Simplified Database Schema
-- Target: Microsoft SQL Server (T-SQL)
-- Based on: Kettan.Server/schema.sql
-- Purpose: Leaner model with fewer tables and flattened lookups
-- =====================================================================

-- Simplification highlights:
-- 1. Inventory category + unit are now fields on InventoryItems.
-- 2. Batches and allocation tables are replaced by a single InventoryLedger.
-- 3. Menu category/tags/variants are flattened into MenuItems.
-- 4. Subscription billing is reduced to one TenantSubscriptions table.

-- =====================================================================
-- 1. SaaS & Multi-Tenancy
-- =====================================================================
CREATE TABLE Tenants (
    TenantId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    SubscriptionTier NVARCHAR(50) NOT NULL DEFAULT 'Starter',
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
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
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Branches_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NULL, -- NULL for platform-level users
    BranchId INT NULL, -- NULL for HQ users
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Users_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Users_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId)
);

CREATE INDEX IX_Branches_TenantId ON Branches(TenantId);
CREATE INDEX IX_Users_TenantId ON Users(TenantId);
CREATE INDEX IX_Users_BranchId ON Users(BranchId);

-- =====================================================================
-- 2. Inventory (Simplified)
-- =====================================================================
CREATE TABLE InventoryItems (
    InventoryItemId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    SKU NVARCHAR(100) NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Category NVARCHAR(100) NOT NULL,         -- Flattened: no separate category table
    UnitOfMeasure NVARCHAR(30) NOT NULL,     -- Flattened: no separate units table
    UnitCost DECIMAL(18,2) NOT NULL DEFAULT 0,
    SellingPrice DECIMAL(18,2) NULL,
    StockOnHand DECIMAL(18,4) NOT NULL DEFAULT 0,
    ReorderThreshold DECIMAL(18,4) NOT NULL DEFAULT 0,
    ImageUrl NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_InventoryItems_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT UQ_InventoryItems_Tenant_Sku UNIQUE (TenantId, SKU)
);

CREATE TABLE InventoryLedger (
    LedgerEntryId BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    BranchId INT NULL,
    InventoryItemId INT NOT NULL,
    UserId INT NULL,
    MovementType NVARCHAR(40) NOT NULL, -- Receive, Consume, Adjust, TransferIn, TransferOut, Return
    QuantityChange DECIMAL(18,4) NOT NULL,
    UnitCost DECIMAL(18,2) NULL,
    ReferenceType NVARCHAR(50) NULL,
    ReferenceId INT NULL,
    Remarks NVARCHAR(MAX) NULL,
    OccurredAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_InventoryLedger_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_InventoryLedger_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId),
    CONSTRAINT FK_InventoryLedger_Items FOREIGN KEY (InventoryItemId) REFERENCES InventoryItems(InventoryItemId),
    CONSTRAINT FK_InventoryLedger_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE INDEX IX_InventoryItems_Tenant_Category ON InventoryItems(TenantId, Category);
CREATE INDEX IX_InventoryLedger_Item_OccurredAt ON InventoryLedger(InventoryItemId, OccurredAt DESC);

-- =====================================================================
-- 3. Requests, Orders, Fulfillment
-- =====================================================================
CREATE TABLE SupplyRequests (
    RequestId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    BranchId INT NOT NULL,
    RequestedBy_UserId INT NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
    Notes NVARCHAR(MAX) NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_SupplyRequests_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_SupplyRequests_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId),
    CONSTRAINT FK_SupplyRequests_Users FOREIGN KEY (RequestedBy_UserId) REFERENCES Users(UserId)
);

CREATE TABLE SupplyRequestItems (
    RequestItemId INT IDENTITY(1,1) PRIMARY KEY,
    RequestId INT NOT NULL,
    InventoryItemId INT NOT NULL,
    QuantityRequested DECIMAL(18,4) NOT NULL,
    QuantityApproved DECIMAL(18,4) NULL,
    Remarks NVARCHAR(500) NULL,
    CONSTRAINT FK_SupplyRequestItems_Requests FOREIGN KEY (RequestId) REFERENCES SupplyRequests(RequestId),
    CONSTRAINT FK_SupplyRequestItems_Items FOREIGN KEY (InventoryItemId) REFERENCES InventoryItems(InventoryItemId)
);

CREATE TABLE Orders (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    BranchId INT NOT NULL,
    RequestId INT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Processing',
    Notes NVARCHAR(MAX) NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Orders_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Orders_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId),
    CONSTRAINT FK_Orders_Requests FOREIGN KEY (RequestId) REFERENCES SupplyRequests(RequestId)
);

CREATE TABLE OrderItems (
    OrderItemId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    InventoryItemId INT NOT NULL,
    Quantity DECIMAL(18,4) NOT NULL,
    UnitCost DECIMAL(18,2) NULL,
    LineAmount DECIMAL(18,2) NULL,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    CONSTRAINT FK_OrderItems_Items FOREIGN KEY (InventoryItemId) REFERENCES InventoryItems(InventoryItemId)
);

CREATE INDEX IX_Orders_Tenant_Status ON Orders(TenantId, Status);
CREATE INDEX IX_OrderItems_OrderId ON OrderItems(OrderId);

-- =====================================================================
-- 4. Shipping & Returns (Simplified)
-- =====================================================================
CREATE TABLE Shipments (
    ShipmentId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    OrderId INT NOT NULL UNIQUE,
    CourierName NVARCHAR(100) NULL,
    TrackingNumber NVARCHAR(100) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Preparing',
    DispatchDate DATETIME2 NULL,
    EstimatedArrival DATETIME2 NULL,
    DeliveredAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Shipments_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Shipments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId)
);

CREATE TABLE Returns (
    ReturnId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    OrderId INT NOT NULL,
    BranchId INT NOT NULL,
    InventoryItemId INT NULL,
    QuantityReturned DECIMAL(18,4) NULL,
    Reason NVARCHAR(MAX) NOT NULL,
    Resolution NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    CreditAmount DECIMAL(18,2) NULL,
    LoggedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ResolvedAt DATETIME2 NULL,
    CONSTRAINT FK_Returns_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Returns_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    CONSTRAINT FK_Returns_Branches FOREIGN KEY (BranchId) REFERENCES Branches(BranchId),
    CONSTRAINT FK_Returns_Items FOREIGN KEY (InventoryItemId) REFERENCES InventoryItems(InventoryItemId)
);

-- =====================================================================
-- 5. Menu (Simplified)
-- =====================================================================
CREATE TABLE MenuItems (
    MenuItemId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Category NVARCHAR(100) NOT NULL, -- Flattened: no separate menu category table
    Description NVARCHAR(MAX) NULL,
    BasePrice DECIMAL(18,2) NOT NULL DEFAULT 0,
    RecipeJson NVARCHAR(MAX) NULL, -- Flattened recipe/variants representation
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_MenuItems_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

CREATE INDEX IX_MenuItems_Tenant_Category ON MenuItems(TenantId, Category);

-- =====================================================================
-- 6. Subscription (Simplified)
-- =====================================================================
CREATE TABLE TenantSubscriptions (
    TenantSubscriptionId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    PlanCode NVARCHAR(50) NOT NULL,
    PlanName NVARCHAR(100) NOT NULL,
    Status NVARCHAR(30) NOT NULL DEFAULT 'Active',
    BillingCycle NVARCHAR(20) NOT NULL DEFAULT 'Monthly',
    Price DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(10) NOT NULL DEFAULT 'PHP',
    PeriodStart DATETIME2 NOT NULL,
    PeriodEnd DATETIME2 NOT NULL,
    AutoRenew BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_TenantSubscriptions_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT UQ_TenantSubscriptions_Tenant UNIQUE (TenantId)
);

-- =====================================================================
-- 7. Notifications & Audit
-- =====================================================================
CREATE TABLE Notifications (
    NotificationId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    UserId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    ReadAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Notifications_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE AuditLogs (
    AuditLogId BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NULL,
    UserId INT NULL,
    Action NVARCHAR(80) NOT NULL,
    EntityName NVARCHAR(120) NOT NULL,
    EntityId NVARCHAR(120) NULL,
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    OccurredAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_AuditLogs_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE INDEX IX_Notifications_User_IsRead ON Notifications(UserId, IsRead, CreatedAt DESC);
CREATE INDEX IX_AuditLogs_Tenant_OccurredAt ON AuditLogs(TenantId, OccurredAt DESC);
