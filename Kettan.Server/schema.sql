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
CREATE TABLE Items (
    ItemId INT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL,
    SKU NVARCHAR(100) NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    UnitOfMeasure NVARCHAR(50) NOT NULL, -- kg, ml, pcs
    DefaultThreshold DECIMAL(18,4) NOT NULL DEFAULT 0,
    UnitCost DECIMAL(18,2) NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Items_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
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
