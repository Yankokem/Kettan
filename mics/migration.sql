IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [SubscriptionPlans] (
    [PlanId] int NOT NULL IDENTITY,
    [PlanCode] nvarchar(50) NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NULL,
    [PriceMonthly] decimal(18,2) NOT NULL,
    [PriceYearly] decimal(18,2) NULL,
    [BranchLimit] int NULL,
    [UserLimit] int NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_SubscriptionPlans] PRIMARY KEY ([PlanId])
);

CREATE TABLE [AuditLogs] (
    [AuditLogId] bigint NOT NULL IDENTITY,
    [TenantId] int NULL,
    [UserId] int NULL,
    [Action] nvarchar(80) NOT NULL,
    [EntityName] nvarchar(120) NOT NULL,
    [EntityId] nvarchar(120) NULL,
    [EventCategory] nvarchar(60) NOT NULL,
    [OldValues] nvarchar(max) NULL,
    [NewValues] nvarchar(max) NULL,
    [IpAddress] nvarchar(64) NULL,
    [UserAgent] nvarchar(512) NULL,
    [OccurredAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([AuditLogId])
);

CREATE TABLE [Batches] (
    [BatchId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [ItemId] int NOT NULL,
    [BranchId] int NULL,
    [BatchNumber] nvarchar(100) NOT NULL,
    [ExpiryDate] datetime2 NOT NULL,
    [CurrentQuantity] decimal(18,4) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Batches] PRIMARY KEY ([BatchId])
);

CREATE TABLE [Branches] (
    [BranchId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [Name] nvarchar(255) NOT NULL,
    [Address] nvarchar(500) NULL,
    [City] nvarchar(150) NULL,
    [ContactNumber] nvarchar(50) NULL,
    [OpenTime] time NULL,
    [CloseTime] time NULL,
    [OwnerUserId] int NULL,
    [ManagerUserId] int NULL,
    [Location] nvarchar(500) NULL,
    [CustomThresholds] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Branches] PRIMARY KEY ([BranchId])
);

CREATE TABLE [BundleItems] (
    [BundleItemId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [ParentItemId] int NOT NULL,
    [ChildItemId] int NOT NULL,
    [Quantity] decimal(18,4) NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_BundleItems] PRIMARY KEY ([BundleItemId])
);

CREATE TABLE [ConsumptionLogItems] (
    [ConsumptionLogItemId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [ConsumptionLogId] int NOT NULL,
    [MenuItemId] int NULL,
    [ItemId] int NULL,
    [Quantity] decimal(18,4) NOT NULL,
    [Reason] nvarchar(120) NULL,
    CONSTRAINT [PK_ConsumptionLogItems] PRIMARY KEY ([ConsumptionLogItemId])
);

CREATE TABLE [ConsumptionLogs] (
    [ConsumptionLogId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    [LoggedBy_UserId] int NOT NULL,
    [Method] nvarchar(30) NOT NULL,
    [Shift] nvarchar(30) NULL,
    [LogDate] datetime2 NOT NULL,
    [Remarks] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ConsumptionLogs] PRIMARY KEY ([ConsumptionLogId]),
    CONSTRAINT [FK_ConsumptionLogs_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([BranchId]) ON DELETE NO ACTION
);

CREATE TABLE [Couriers] (
    [CourierId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [Name] nvarchar(255) NOT NULL,
    [ContactNumber] nvarchar(50) NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Couriers] PRIMARY KEY ([CourierId])
);

CREATE TABLE [Employees] (
    [EmployeeId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [BranchId] int NULL,
    [FirstName] nvarchar(100) NOT NULL,
    [LastName] nvarchar(100) NOT NULL,
    [Position] nvarchar(100) NOT NULL,
    [ContactNumber] nvarchar(50) NULL,
    [DateHired] datetime2 NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Employees] PRIMARY KEY ([EmployeeId]),
    CONSTRAINT [FK_Employees_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([BranchId]) ON DELETE NO ACTION
);

CREATE TABLE [InventoryCategories] (
    [CategoryId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NULL,
    [DisplayOrder] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_InventoryCategories] PRIMARY KEY ([CategoryId])
);

CREATE TABLE [InventoryTransactions] (
    [TransactionId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [BatchId] int NOT NULL,
    [UserId] int NOT NULL,
    [QuantityChange] decimal(18,4) NOT NULL,
    [TransactionType] nvarchar(50) NOT NULL,
    [ReferenceType] nvarchar(50) NULL,
    [ReferenceId] int NULL,
    [Remarks] nvarchar(max) NULL,
    [Timestamp] datetime2 NOT NULL,
    CONSTRAINT [PK_InventoryTransactions] PRIMARY KEY ([TransactionId]),
    CONSTRAINT [FK_InventoryTransactions_Batches_BatchId] FOREIGN KEY ([BatchId]) REFERENCES [Batches] ([BatchId]) ON DELETE NO ACTION
);

CREATE TABLE [ItemCategories] (
    [ItemCategoryId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NULL,
    [DisplayOrder] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ItemCategories] PRIMARY KEY ([ItemCategoryId])
);

CREATE TABLE [Items] (
    [ItemId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [SKU] nvarchar(100) NOT NULL,
    [Name] nvarchar(255) NOT NULL,
    [UnitId] int NOT NULL,
    [InventoryCategoryId] int NULL,
    [ItemCategoryId] int NULL,
    [DefaultThreshold] decimal(18,4) NOT NULL,
    [UnitCost] decimal(18,2) NOT NULL,
    [PreviousUnitCost] decimal(18,2) NULL,
    [SellingPrice] decimal(18,2) NULL,
    [IsBundle] bit NOT NULL,
    [ImageUrl] nvarchar(500) NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Items] PRIMARY KEY ([ItemId]),
    CONSTRAINT [FK_Items_InventoryCategories_InventoryCategoryId] FOREIGN KEY ([InventoryCategoryId]) REFERENCES [InventoryCategories] ([CategoryId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Items_ItemCategories_ItemCategoryId] FOREIGN KEY ([ItemCategoryId]) REFERENCES [ItemCategories] ([ItemCategoryId]) ON DELETE NO ACTION
);

CREATE TABLE [MenuCategories] (
    [CategoryId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [DisplayOrder] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_MenuCategories] PRIMARY KEY ([CategoryId])
);

CREATE TABLE [MenuItemIngredients] (
    [MenuItemIngredientId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [MenuItemId] int NOT NULL,
    [ItemId] int NOT NULL,
    [QuantityPerUnit] decimal(18,4) NOT NULL,
    [UnitOfMeasure] nvarchar(50) NULL,
    CONSTRAINT [PK_MenuItemIngredients] PRIMARY KEY ([MenuItemIngredientId]),
    CONSTRAINT [FK_MenuItemIngredients_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([ItemId]) ON DELETE NO ACTION
);

CREATE TABLE [MenuItems] (
    [MenuItemId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [Name] nvarchar(255) NOT NULL,
    [CategoryId] int NOT NULL,
    [Description] nvarchar(max) NULL,
    [ImageUrl] nvarchar(500) NULL,
    [BasePrice] decimal(18,2) NOT NULL,
    [Status] nvarchar(20) NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_MenuItems] PRIMARY KEY ([MenuItemId]),
    CONSTRAINT [FK_MenuItems_MenuCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [MenuCategories] ([CategoryId]) ON DELETE NO ACTION
);

CREATE TABLE [MenuVariants] (
    [VariantId] int NOT NULL IDENTITY,
    [MenuItemId] int NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [PricingMode] nvarchar(10) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [DisplayOrder] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_MenuVariants] PRIMARY KEY ([VariantId]),
    CONSTRAINT [FK_MenuVariants_MenuItems_MenuItemId] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems] ([MenuItemId]) ON DELETE NO ACTION
);

CREATE TABLE [VariantIngredients] (
    [VariantIngredientId] int NOT NULL IDENTITY,
    [VariantId] int NOT NULL,
    [ItemId] int NOT NULL,
    [Quantity] decimal(18,4) NOT NULL,
    CONSTRAINT [PK_VariantIngredients] PRIMARY KEY ([VariantIngredientId]),
    CONSTRAINT [FK_VariantIngredients_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([ItemId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_VariantIngredients_MenuVariants_VariantId] FOREIGN KEY ([VariantId]) REFERENCES [MenuVariants] ([VariantId]) ON DELETE NO ACTION
);

CREATE TABLE [MenuItemTags] (
    [MenuItemId] int NOT NULL,
    [TagId] int NOT NULL,
    CONSTRAINT [PK_MenuItemTags] PRIMARY KEY ([MenuItemId], [TagId]),
    CONSTRAINT [FK_MenuItemTags_MenuItems_MenuItemId] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems] ([MenuItemId]) ON DELETE NO ACTION
);

CREATE TABLE [MenuTags] (
    [TagId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [Name] nvarchar(50) NOT NULL,
    [Color] nvarchar(7) NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_MenuTags] PRIMARY KEY ([TagId])
);

CREATE TABLE [Notifications] (
    [NotificationId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [UserId] int NOT NULL,
    [Title] nvarchar(120) NOT NULL,
    [Message] nvarchar(500) NOT NULL,
    [Type] nvarchar(50) NOT NULL,
    [ReferenceType] nvarchar(50) NULL,
    [ReferenceId] int NULL,
    [IsRead] bit NOT NULL,
    [ReadAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([NotificationId])
);

CREATE TABLE [OrderAllocations] (
    [AllocationId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [OrderId] int NOT NULL,
    [BatchId] int NOT NULL,
    [QuantityPicked] decimal(18,4) NOT NULL,
    CONSTRAINT [PK_OrderAllocations] PRIMARY KEY ([AllocationId]),
    CONSTRAINT [FK_OrderAllocations_Batches_BatchId] FOREIGN KEY ([BatchId]) REFERENCES [Batches] ([BatchId]) ON DELETE NO ACTION
);

CREATE TABLE [Orders] (
    [OrderId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [RequestId] int NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [PushedToFulfillmentAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [PK_Orders] PRIMARY KEY ([OrderId])
);

CREATE TABLE [OrderStatusHistories] (
    [HistoryId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [OrderId] int NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [ChangedBy_UserId] int NULL,
    [Remarks] nvarchar(max) NULL,
    [Timestamp] datetime2 NOT NULL,
    CONSTRAINT [PK_OrderStatusHistories] PRIMARY KEY ([HistoryId]),
    CONSTRAINT [FK_OrderStatusHistories_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]) ON DELETE NO ACTION
);

CREATE TABLE [ReturnItems] (
    [ReturnItemId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [ReturnId] int NOT NULL,
    [ItemId] int NOT NULL,
    [QuantityReturned] decimal(18,4) NOT NULL,
    [Reason] nvarchar(500) NULL,
    CONSTRAINT [PK_ReturnItems] PRIMARY KEY ([ReturnItemId]),
    CONSTRAINT [FK_ReturnItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([ItemId]) ON DELETE NO ACTION
);

CREATE TABLE [Returns] (
    [ReturnId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [OrderId] int NOT NULL,
    [BranchId] int NOT NULL,
    [Reason] nvarchar(max) NOT NULL,
    [PhotoUrls] nvarchar(max) NULL,
    [Resolution] nvarchar(50) NOT NULL,
    [ReviewedBy_UserId] int NULL,
    [ResolvedAt] datetime2 NULL,
    [CreditAmount] decimal(18,2) NULL,
    [LoggedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [PK_Returns] PRIMARY KEY ([ReturnId]),
    CONSTRAINT [FK_Returns_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([BranchId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Returns_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]) ON DELETE NO ACTION
);

CREATE TABLE [Shipments] (
    [ShipmentId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [OrderId] int NOT NULL,
    [TrackingNumber] nvarchar(100) NULL,
    [CourierAssignment] nvarchar(100) NULL,
    [DistanceMap] decimal(18,2) NULL,
    [DispatchDate] datetime2 NULL,
    [EstimatedArrival] datetime2 NULL,
    [CourierId] int NULL,
    [VehicleId] int NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [PK_Shipments] PRIMARY KEY ([ShipmentId]),
    CONSTRAINT [FK_Shipments_Couriers_CourierId] FOREIGN KEY ([CourierId]) REFERENCES [Couriers] ([CourierId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Shipments_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]) ON DELETE NO ACTION
);

CREATE TABLE [SubscriptionInvoices] (
    [InvoiceId] int NOT NULL IDENTITY,
    [TenantSubscriptionId] int NOT NULL,
    [InvoiceNumber] nvarchar(50) NOT NULL,
    [AmountDue] decimal(18,2) NOT NULL,
    [Currency] nvarchar(10) NOT NULL,
    [Status] nvarchar(30) NOT NULL,
    [IssuedAt] datetime2 NOT NULL,
    [DueAt] datetime2 NULL,
    [PaidAt] datetime2 NULL,
    [ProviderReference] nvarchar(120) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_SubscriptionInvoices] PRIMARY KEY ([InvoiceId])
);

CREATE TABLE [SubscriptionPayments] (
    [PaymentId] int NOT NULL IDENTITY,
    [InvoiceId] int NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Currency] nvarchar(10) NOT NULL,
    [PaymentMethod] nvarchar(40) NULL,
    [Provider] nvarchar(40) NULL,
    [ProviderPaymentId] nvarchar(120) NULL,
    [Status] nvarchar(30) NOT NULL,
    [PaidAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_SubscriptionPayments] PRIMARY KEY ([PaymentId]),
    CONSTRAINT [FK_SubscriptionPayments_SubscriptionInvoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [SubscriptionInvoices] ([InvoiceId]) ON DELETE NO ACTION
);

CREATE TABLE [SupplyRequestItems] (
    [RequestItemId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [RequestId] int NOT NULL,
    [ItemId] int NOT NULL,
    [QuantityRequested] decimal(18,4) NOT NULL,
    [QuantityApproved] decimal(18,4) NULL,
    CONSTRAINT [PK_SupplyRequestItems] PRIMARY KEY ([RequestItemId]),
    CONSTRAINT [FK_SupplyRequestItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([ItemId]) ON DELETE NO ACTION
);

CREATE TABLE [SupplyRequests] (
    [RequestId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    [RequestedBy_UserId] int NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [RequestType] nvarchar(30) NOT NULL,
    [Priority] nvarchar(30) NOT NULL,
    [DispatchWindow] nvarchar(30) NOT NULL,
    [DispatchDate] datetime2 NULL,
    [Notes] nvarchar(1000) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [PK_SupplyRequests] PRIMARY KEY ([RequestId]),
    CONSTRAINT [FK_SupplyRequests_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([BranchId]) ON DELETE NO ACTION
);

CREATE TABLE [Tenants] (
    [TenantId] int NOT NULL IDENTITY,
    [Name] nvarchar(255) NOT NULL,
    [SubscriptionTier] nvarchar(50) NOT NULL,
    [Email] nvarchar(255) NULL,
    [Phone] nvarchar(50) NULL,
    [Address] nvarchar(500) NULL,
    [LogoUrl] nvarchar(500) NULL,
    [IsActive] bit NOT NULL,
    [CurrentSubscriptionId] int NULL,
    [SubscriptionStatus] nvarchar(30) NOT NULL,
    [SubscriptionPeriodStart] datetime2 NULL,
    [SubscriptionPeriodEnd] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Tenants] PRIMARY KEY ([TenantId])
);

CREATE TABLE [TenantSubscriptions] (
    [TenantSubscriptionId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [PlanId] int NOT NULL,
    [Status] nvarchar(30) NOT NULL,
    [BillingCycle] nvarchar(20) NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [PeriodStart] datetime2 NOT NULL,
    [PeriodEnd] datetime2 NOT NULL,
    [AutoRenew] bit NOT NULL,
    [CanceledAt] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_TenantSubscriptions] PRIMARY KEY ([TenantSubscriptionId]),
    CONSTRAINT [FK_TenantSubscriptions_SubscriptionPlans_PlanId] FOREIGN KEY ([PlanId]) REFERENCES [SubscriptionPlans] ([PlanId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TenantSubscriptions_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION
);

CREATE TABLE [Units] (
    [UnitId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [Name] nvarchar(50) NOT NULL,
    [Symbol] nvarchar(10) NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Units] PRIMARY KEY ([UnitId]),
    CONSTRAINT [FK_Units_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION
);

CREATE TABLE [Users] (
    [UserId] int NOT NULL IDENTITY,
    [TenantId] int NULL,
    [BranchId] int NULL,
    [FirstName] nvarchar(100) NOT NULL,
    [LastName] nvarchar(100) NOT NULL,
    [Email] nvarchar(255) NOT NULL,
    [PasswordHash] nvarchar(255) NOT NULL,
    [Role] nvarchar(50) NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([UserId]),
    CONSTRAINT [FK_Users_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([BranchId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Users_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION
);

CREATE TABLE [Vehicles] (
    [VehicleId] int NOT NULL IDENTITY,
    [TenantId] int NOT NULL,
    [CourierId] int NOT NULL,
    [PlateNumber] nvarchar(50) NOT NULL,
    [VehicleType] nvarchar(50) NOT NULL,
    [Description] nvarchar(255) NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Vehicles] PRIMARY KEY ([VehicleId]),
    CONSTRAINT [FK_Vehicles_Couriers_CourierId] FOREIGN KEY ([CourierId]) REFERENCES [Couriers] ([CourierId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Vehicles_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION
);

CREATE INDEX [IX_AuditLogs_TenantId] ON [AuditLogs] ([TenantId]);

CREATE INDEX [IX_AuditLogs_UserId] ON [AuditLogs] ([UserId]);

CREATE INDEX [IX_Batches_BranchId] ON [Batches] ([BranchId]);

CREATE INDEX [IX_Batches_ItemId] ON [Batches] ([ItemId]);

CREATE INDEX [IX_Batches_TenantId] ON [Batches] ([TenantId]);

CREATE INDEX [IX_Branches_ManagerUserId] ON [Branches] ([ManagerUserId]);

CREATE INDEX [IX_Branches_OwnerUserId] ON [Branches] ([OwnerUserId]);

CREATE INDEX [IX_Branches_TenantId] ON [Branches] ([TenantId]);

CREATE INDEX [IX_BundleItems_ChildItemId] ON [BundleItems] ([ChildItemId]);

CREATE INDEX [IX_BundleItems_ParentItemId] ON [BundleItems] ([ParentItemId]);

CREATE INDEX [IX_BundleItems_TenantId] ON [BundleItems] ([TenantId]);

CREATE INDEX [IX_ConsumptionLogItems_ConsumptionLogId] ON [ConsumptionLogItems] ([ConsumptionLogId]);

CREATE INDEX [IX_ConsumptionLogItems_ItemId] ON [ConsumptionLogItems] ([ItemId]);

CREATE INDEX [IX_ConsumptionLogItems_MenuItemId] ON [ConsumptionLogItems] ([MenuItemId]);

CREATE INDEX [IX_ConsumptionLogItems_TenantId] ON [ConsumptionLogItems] ([TenantId]);

CREATE INDEX [IX_ConsumptionLogs_BranchId] ON [ConsumptionLogs] ([BranchId]);

CREATE INDEX [IX_ConsumptionLogs_LoggedBy_UserId] ON [ConsumptionLogs] ([LoggedBy_UserId]);

CREATE INDEX [IX_ConsumptionLogs_TenantId] ON [ConsumptionLogs] ([TenantId]);

CREATE INDEX [IX_Couriers_TenantId] ON [Couriers] ([TenantId]);

CREATE INDEX [IX_Employees_BranchId] ON [Employees] ([BranchId]);

CREATE INDEX [IX_Employees_TenantId] ON [Employees] ([TenantId]);

CREATE INDEX [IX_InventoryCategories_TenantId] ON [InventoryCategories] ([TenantId]);

CREATE INDEX [IX_InventoryTransactions_BatchId] ON [InventoryTransactions] ([BatchId]);

CREATE INDEX [IX_InventoryTransactions_TenantId] ON [InventoryTransactions] ([TenantId]);

CREATE INDEX [IX_InventoryTransactions_UserId] ON [InventoryTransactions] ([UserId]);

CREATE INDEX [IX_ItemCategories_TenantId] ON [ItemCategories] ([TenantId]);

CREATE INDEX [IX_Items_InventoryCategoryId] ON [Items] ([InventoryCategoryId]);

CREATE INDEX [IX_Items_ItemCategoryId] ON [Items] ([ItemCategoryId]);

CREATE INDEX [IX_Items_TenantId] ON [Items] ([TenantId]);

CREATE INDEX [IX_Items_UnitId] ON [Items] ([UnitId]);

CREATE INDEX [IX_MenuCategories_TenantId] ON [MenuCategories] ([TenantId]);

CREATE INDEX [IX_MenuItemIngredients_ItemId] ON [MenuItemIngredients] ([ItemId]);

CREATE INDEX [IX_MenuItemIngredients_MenuItemId] ON [MenuItemIngredients] ([MenuItemId]);

CREATE INDEX [IX_MenuItemIngredients_TenantId] ON [MenuItemIngredients] ([TenantId]);

CREATE INDEX [IX_MenuItems_CategoryId] ON [MenuItems] ([CategoryId]);

CREATE INDEX [IX_MenuItems_TenantId] ON [MenuItems] ([TenantId]);

CREATE INDEX [IX_MenuItemTags_TagId] ON [MenuItemTags] ([TagId]);

CREATE INDEX [IX_MenuTags_TenantId] ON [MenuTags] ([TenantId]);

CREATE INDEX [IX_MenuVariants_MenuItemId] ON [MenuVariants] ([MenuItemId]);

CREATE INDEX [IX_Notifications_TenantId] ON [Notifications] ([TenantId]);

CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);

CREATE INDEX [IX_OrderAllocations_BatchId] ON [OrderAllocations] ([BatchId]);

CREATE INDEX [IX_OrderAllocations_OrderId] ON [OrderAllocations] ([OrderId]);

CREATE INDEX [IX_OrderAllocations_TenantId] ON [OrderAllocations] ([TenantId]);

CREATE INDEX [IX_Orders_RequestId] ON [Orders] ([RequestId]);

CREATE INDEX [IX_Orders_TenantId] ON [Orders] ([TenantId]);

CREATE INDEX [IX_OrderStatusHistories_ChangedBy_UserId] ON [OrderStatusHistories] ([ChangedBy_UserId]);

CREATE INDEX [IX_OrderStatusHistories_OrderId] ON [OrderStatusHistories] ([OrderId]);

CREATE INDEX [IX_OrderStatusHistories_TenantId] ON [OrderStatusHistories] ([TenantId]);

CREATE INDEX [IX_ReturnItems_ItemId] ON [ReturnItems] ([ItemId]);

CREATE INDEX [IX_ReturnItems_ReturnId] ON [ReturnItems] ([ReturnId]);

CREATE INDEX [IX_ReturnItems_TenantId] ON [ReturnItems] ([TenantId]);

CREATE INDEX [IX_Returns_BranchId] ON [Returns] ([BranchId]);

CREATE INDEX [IX_Returns_OrderId] ON [Returns] ([OrderId]);

CREATE INDEX [IX_Returns_ReviewedBy_UserId] ON [Returns] ([ReviewedBy_UserId]);

CREATE INDEX [IX_Returns_TenantId] ON [Returns] ([TenantId]);

CREATE INDEX [IX_Shipments_CourierId] ON [Shipments] ([CourierId]);

CREATE UNIQUE INDEX [IX_Shipments_OrderId] ON [Shipments] ([OrderId]);

CREATE INDEX [IX_Shipments_TenantId] ON [Shipments] ([TenantId]);

CREATE INDEX [IX_Shipments_VehicleId] ON [Shipments] ([VehicleId]);

CREATE INDEX [IX_SubscriptionInvoices_TenantSubscriptionId] ON [SubscriptionInvoices] ([TenantSubscriptionId]);

CREATE INDEX [IX_SubscriptionPayments_InvoiceId] ON [SubscriptionPayments] ([InvoiceId]);

CREATE INDEX [IX_SupplyRequestItems_ItemId] ON [SupplyRequestItems] ([ItemId]);

CREATE INDEX [IX_SupplyRequestItems_RequestId] ON [SupplyRequestItems] ([RequestId]);

CREATE INDEX [IX_SupplyRequestItems_TenantId] ON [SupplyRequestItems] ([TenantId]);

CREATE INDEX [IX_SupplyRequests_BranchId] ON [SupplyRequests] ([BranchId]);

CREATE INDEX [IX_SupplyRequests_RequestedBy_UserId] ON [SupplyRequests] ([RequestedBy_UserId]);

CREATE INDEX [IX_SupplyRequests_TenantId] ON [SupplyRequests] ([TenantId]);

CREATE INDEX [IX_Tenants_CurrentSubscriptionId] ON [Tenants] ([CurrentSubscriptionId]);

CREATE INDEX [IX_TenantSubscriptions_PlanId] ON [TenantSubscriptions] ([PlanId]);

CREATE INDEX [IX_TenantSubscriptions_TenantId] ON [TenantSubscriptions] ([TenantId]);

CREATE INDEX [IX_Units_TenantId] ON [Units] ([TenantId]);

CREATE INDEX [IX_Users_BranchId] ON [Users] ([BranchId]);

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);

CREATE INDEX [IX_Users_TenantId] ON [Users] ([TenantId]);

CREATE INDEX [IX_VariantIngredients_ItemId] ON [VariantIngredients] ([ItemId]);

CREATE INDEX [IX_VariantIngredients_VariantId] ON [VariantIngredients] ([VariantId]);

CREATE INDEX [IX_Vehicles_CourierId] ON [Vehicles] ([CourierId]);

CREATE INDEX [IX_Vehicles_TenantId] ON [Vehicles] ([TenantId]);

ALTER TABLE [AuditLogs] ADD CONSTRAINT [FK_AuditLogs_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [AuditLogs] ADD CONSTRAINT [FK_AuditLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION;

ALTER TABLE [Batches] ADD CONSTRAINT [FK_Batches_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([BranchId]) ON DELETE NO ACTION;

ALTER TABLE [Batches] ADD CONSTRAINT [FK_Batches_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([ItemId]) ON DELETE NO ACTION;

ALTER TABLE [Batches] ADD CONSTRAINT [FK_Batches_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Branches] ADD CONSTRAINT [FK_Branches_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Branches] ADD CONSTRAINT [FK_Branches_Users_ManagerUserId] FOREIGN KEY ([ManagerUserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION;

ALTER TABLE [Branches] ADD CONSTRAINT [FK_Branches_Users_OwnerUserId] FOREIGN KEY ([OwnerUserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION;

ALTER TABLE [BundleItems] ADD CONSTRAINT [FK_BundleItems_Items_ChildItemId] FOREIGN KEY ([ChildItemId]) REFERENCES [Items] ([ItemId]) ON DELETE NO ACTION;

ALTER TABLE [BundleItems] ADD CONSTRAINT [FK_BundleItems_Items_ParentItemId] FOREIGN KEY ([ParentItemId]) REFERENCES [Items] ([ItemId]) ON DELETE NO ACTION;

ALTER TABLE [BundleItems] ADD CONSTRAINT [FK_BundleItems_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [ConsumptionLogItems] ADD CONSTRAINT [FK_ConsumptionLogItems_ConsumptionLogs_ConsumptionLogId] FOREIGN KEY ([ConsumptionLogId]) REFERENCES [ConsumptionLogs] ([ConsumptionLogId]) ON DELETE NO ACTION;

ALTER TABLE [ConsumptionLogItems] ADD CONSTRAINT [FK_ConsumptionLogItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([ItemId]) ON DELETE NO ACTION;

ALTER TABLE [ConsumptionLogItems] ADD CONSTRAINT [FK_ConsumptionLogItems_MenuItems_MenuItemId] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems] ([MenuItemId]) ON DELETE NO ACTION;

ALTER TABLE [ConsumptionLogItems] ADD CONSTRAINT [FK_ConsumptionLogItems_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [ConsumptionLogs] ADD CONSTRAINT [FK_ConsumptionLogs_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [ConsumptionLogs] ADD CONSTRAINT [FK_ConsumptionLogs_Users_LoggedBy_UserId] FOREIGN KEY ([LoggedBy_UserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION;

ALTER TABLE [Couriers] ADD CONSTRAINT [FK_Couriers_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [InventoryCategories] ADD CONSTRAINT [FK_InventoryCategories_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [InventoryTransactions] ADD CONSTRAINT [FK_InventoryTransactions_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [InventoryTransactions] ADD CONSTRAINT [FK_InventoryTransactions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION;

ALTER TABLE [ItemCategories] ADD CONSTRAINT [FK_ItemCategories_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Units_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [Units] ([UnitId]) ON DELETE NO ACTION;

ALTER TABLE [MenuCategories] ADD CONSTRAINT [FK_MenuCategories_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [MenuItemIngredients] ADD CONSTRAINT [FK_MenuItemIngredients_MenuItems_MenuItemId] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems] ([MenuItemId]) ON DELETE NO ACTION;

ALTER TABLE [MenuItemIngredients] ADD CONSTRAINT [FK_MenuItemIngredients_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [MenuItems] ADD CONSTRAINT [FK_MenuItems_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [MenuItemTags] ADD CONSTRAINT [FK_MenuItemTags_MenuTags_TagId] FOREIGN KEY ([TagId]) REFERENCES [MenuTags] ([TagId]) ON DELETE NO ACTION;

ALTER TABLE [MenuTags] ADD CONSTRAINT [FK_MenuTags_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Notifications] ADD CONSTRAINT [FK_Notifications_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Notifications] ADD CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION;

ALTER TABLE [OrderAllocations] ADD CONSTRAINT [FK_OrderAllocations_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]) ON DELETE NO ACTION;

ALTER TABLE [OrderAllocations] ADD CONSTRAINT [FK_OrderAllocations_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Orders] ADD CONSTRAINT [FK_Orders_SupplyRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [SupplyRequests] ([RequestId]) ON DELETE NO ACTION;

ALTER TABLE [Orders] ADD CONSTRAINT [FK_Orders_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [OrderStatusHistories] ADD CONSTRAINT [FK_OrderStatusHistories_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [OrderStatusHistories] ADD CONSTRAINT [FK_OrderStatusHistories_Users_ChangedBy_UserId] FOREIGN KEY ([ChangedBy_UserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION;

ALTER TABLE [ReturnItems] ADD CONSTRAINT [FK_ReturnItems_Returns_ReturnId] FOREIGN KEY ([ReturnId]) REFERENCES [Returns] ([ReturnId]) ON DELETE NO ACTION;

ALTER TABLE [ReturnItems] ADD CONSTRAINT [FK_ReturnItems_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Returns] ADD CONSTRAINT [FK_Returns_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Returns] ADD CONSTRAINT [FK_Returns_Users_ReviewedBy_UserId] FOREIGN KEY ([ReviewedBy_UserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION;

ALTER TABLE [Shipments] ADD CONSTRAINT [FK_Shipments_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [Shipments] ADD CONSTRAINT [FK_Shipments_Vehicles_VehicleId] FOREIGN KEY ([VehicleId]) REFERENCES [Vehicles] ([VehicleId]) ON DELETE NO ACTION;

ALTER TABLE [SubscriptionInvoices] ADD CONSTRAINT [FK_SubscriptionInvoices_TenantSubscriptions_TenantSubscriptionId] FOREIGN KEY ([TenantSubscriptionId]) REFERENCES [TenantSubscriptions] ([TenantSubscriptionId]) ON DELETE NO ACTION;

ALTER TABLE [SupplyRequestItems] ADD CONSTRAINT [FK_SupplyRequestItems_SupplyRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [SupplyRequests] ([RequestId]) ON DELETE NO ACTION;

ALTER TABLE [SupplyRequestItems] ADD CONSTRAINT [FK_SupplyRequestItems_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [SupplyRequests] ADD CONSTRAINT [FK_SupplyRequests_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;

ALTER TABLE [SupplyRequests] ADD CONSTRAINT [FK_SupplyRequests_Users_RequestedBy_UserId] FOREIGN KEY ([RequestedBy_UserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION;

ALTER TABLE [Tenants] ADD CONSTRAINT [FK_Tenants_TenantSubscriptions_CurrentSubscriptionId] FOREIGN KEY ([CurrentSubscriptionId]) REFERENCES [TenantSubscriptions] ([TenantSubscriptionId]) ON DELETE NO ACTION;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260420095723_InitialSchema_MultiTenantOperations', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
CREATE TABLE [RegistrationOtps] (
    [OtpId] int NOT NULL IDENTITY,
    [Email] nvarchar(255) NOT NULL,
    [OtpHash] nvarchar(255) NOT NULL,
    [ExpiresAtUtc] datetime2 NOT NULL,
    [CooldownUntilUtc] datetime2 NOT NULL,
    [AttemptCount] int NOT NULL,
    [ResendCount] int NOT NULL,
    [IsUsed] bit NOT NULL,
    [VerifiedAtUtc] datetime2 NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_RegistrationOtps] PRIMARY KEY ([OtpId])
);

CREATE TABLE [RegistrationVerificationSessions] (
    [SessionId] int NOT NULL IDENTITY,
    [VerificationToken] nvarchar(100) NOT NULL,
    [Email] nvarchar(255) NOT NULL,
    [ExpiresAtUtc] datetime2 NOT NULL,
    [IsUsed] bit NOT NULL,
    [UsedAtUtc] datetime2 NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_RegistrationVerificationSessions] PRIMARY KEY ([SessionId])
);

CREATE INDEX [IX_RegistrationOtps_Email_IsUsed_ExpiresAtUtc] ON [RegistrationOtps] ([Email], [IsUsed], [ExpiresAtUtc]);

CREATE UNIQUE INDEX [IX_RegistrationVerificationSessions_VerificationToken] ON [RegistrationVerificationSessions] ([VerificationToken]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260420095913_AddRegistrationOtpFlow', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [Items] ADD [AnnualDemand] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [Items] ADD [HoldingCost] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [Items] ADD [SetupCost] decimal(18,2) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260421110445_AddLogisticCosts', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260423125150_ExpandTenantProfile', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [Tenants] ADD [LegalName] nvarchar(255) NULL;

ALTER TABLE [Tenants] ADD [SupportEmail] nvarchar(255) NULL;

ALTER TABLE [Tenants] ADD [TaxId] nvarchar(100) NULL;

ALTER TABLE [Tenants] ADD [Website] nvarchar(255) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260423125736_ExpandTenantProfile_v2', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [Users] ADD [ImageUrl] nvarchar(max) NULL;

ALTER TABLE [Employees] ADD [ImageUrl] nvarchar(max) NULL;

ALTER TABLE [Branches] ADD [ImageUrl] nvarchar(max) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260425135515_AddImageUrlsToEntities', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [Employees] ADD [Email] nvarchar(150) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260425153512_AddEmailToEmployees_Final', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [Users] ADD [Birthday] date NULL;

ALTER TABLE [Users] ADD [ContactNo] nvarchar(50) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260426101415_AddUserBirthdayAndContact', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [Shipments] DROP CONSTRAINT [FK_Shipments_Couriers_CourierId];

ALTER TABLE [Vehicles] DROP CONSTRAINT [FK_Vehicles_Couriers_CourierId];

DROP TABLE [Couriers];

DROP INDEX [IX_Vehicles_CourierId] ON [Vehicles];

DROP INDEX [IX_Shipments_CourierId] ON [Shipments];

DECLARE @var nvarchar(max);
SELECT @var = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Vehicles]') AND [c].[name] = N'CourierId');
IF @var IS NOT NULL EXEC(N'ALTER TABLE [Vehicles] DROP CONSTRAINT ' + @var + ';');
ALTER TABLE [Vehicles] DROP COLUMN [CourierId];

DECLARE @var1 nvarchar(max);
SELECT @var1 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Shipments]') AND [c].[name] = N'CourierAssignment');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Shipments] DROP CONSTRAINT ' + @var1 + ';');
ALTER TABLE [Shipments] DROP COLUMN [CourierAssignment];

DECLARE @var2 nvarchar(max);
SELECT @var2 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Shipments]') AND [c].[name] = N'CourierId');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [Shipments] DROP CONSTRAINT ' + @var2 + ';');
ALTER TABLE [Shipments] DROP COLUMN [CourierId];

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260426131737_RemoveCourierCleanup', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [Items] DROP CONSTRAINT [FK_Items_Units_UnitId];

DROP TABLE [Units];

DROP INDEX [IX_Items_UnitId] ON [Items];

DECLARE @var3 nvarchar(max);
SELECT @var3 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'UnitId');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT ' + @var3 + ';');
ALTER TABLE [Items] DROP COLUMN [UnitId];

ALTER TABLE [Items] ADD [Unit] nvarchar(20) NOT NULL DEFAULT N'';

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260426152410_HardcodeInventoryUnits', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
DECLARE @var4 nvarchar(max);
SELECT @var4 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'ImageUrl');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT ' + @var4 + ';');
ALTER TABLE [Items] DROP COLUMN [ImageUrl];

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260427030104_RemoveImageUrlFromItem', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [SupplyRequests] ADD [ReferenceNumber] nvarchar(100) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260427114839_AddReferenceNumberToSupplyRequests', N'10.0.5');

COMMIT;
GO

BEGIN TRANSACTION;
DECLARE @var5 nvarchar(max);
SELECT @var5 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Vehicles]') AND [c].[name] = N'VehicleType');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [Vehicles] DROP CONSTRAINT ' + @var5 + ';');
ALTER TABLE [Vehicles] ALTER COLUMN [VehicleType] tinyint NOT NULL;

DECLARE @var6 nvarchar(max);
SELECT @var6 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Vehicles]') AND [c].[name] = N'Description');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Vehicles] DROP CONSTRAINT ' + @var6 + ';');
ALTER TABLE [Vehicles] ALTER COLUMN [Description] nvarchar(100) NULL;

DECLARE @var7 nvarchar(max);
SELECT @var7 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Vehicles]') AND [c].[name] = N'DeletedAt');
IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [Vehicles] DROP CONSTRAINT ' + @var7 + ';');
ALTER TABLE [Vehicles] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var8 nvarchar(max);
SELECT @var8 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Vehicles]') AND [c].[name] = N'CreatedAt');
IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [Vehicles] DROP CONSTRAINT ' + @var8 + ';');
ALTER TABLE [Vehicles] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var9 nvarchar(max);
SELECT @var9 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'Role');
IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT ' + @var9 + ';');
ALTER TABLE [Users] ALTER COLUMN [Role] tinyint NOT NULL;

DECLARE @var10 nvarchar(max);
SELECT @var10 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'PasswordHash');
IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT ' + @var10 + ';');
ALTER TABLE [Users] ALTER COLUMN [PasswordHash] nvarchar(60) NOT NULL;

DECLARE @var11 nvarchar(max);
SELECT @var11 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'LastName');
IF @var11 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT ' + @var11 + ';');
ALTER TABLE [Users] ALTER COLUMN [LastName] nvarchar(50) NOT NULL;

DECLARE @var12 nvarchar(max);
SELECT @var12 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'ImageUrl');
IF @var12 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT ' + @var12 + ';');
ALTER TABLE [Users] ALTER COLUMN [ImageUrl] nvarchar(300) NULL;

DECLARE @var13 nvarchar(max);
SELECT @var13 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'FirstName');
IF @var13 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT ' + @var13 + ';');
ALTER TABLE [Users] ALTER COLUMN [FirstName] nvarchar(50) NOT NULL;

DROP INDEX [IX_Users_Email] ON [Users];
DECLARE @var14 nvarchar(max);
SELECT @var14 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'Email');
IF @var14 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT ' + @var14 + ';');
ALTER TABLE [Users] ALTER COLUMN [Email] nvarchar(50) NOT NULL;
CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);

DECLARE @var15 nvarchar(max);
SELECT @var15 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'DeletedAt');
IF @var15 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT ' + @var15 + ';');
ALTER TABLE [Users] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var16 nvarchar(max);
SELECT @var16 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'CreatedAt');
IF @var16 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT ' + @var16 + ';');
ALTER TABLE [Users] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var17 nvarchar(max);
SELECT @var17 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TenantSubscriptions]') AND [c].[name] = N'UpdatedAt');
IF @var17 IS NOT NULL EXEC(N'ALTER TABLE [TenantSubscriptions] DROP CONSTRAINT ' + @var17 + ';');
ALTER TABLE [TenantSubscriptions] ALTER COLUMN [UpdatedAt] datetime2(3) NOT NULL;

DECLARE @var18 nvarchar(max);
SELECT @var18 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TenantSubscriptions]') AND [c].[name] = N'Status');
IF @var18 IS NOT NULL EXEC(N'ALTER TABLE [TenantSubscriptions] DROP CONSTRAINT ' + @var18 + ';');
ALTER TABLE [TenantSubscriptions] ALTER COLUMN [Status] tinyint NOT NULL;

DECLARE @var19 nvarchar(max);
SELECT @var19 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TenantSubscriptions]') AND [c].[name] = N'StartDate');
IF @var19 IS NOT NULL EXEC(N'ALTER TABLE [TenantSubscriptions] DROP CONSTRAINT ' + @var19 + ';');
ALTER TABLE [TenantSubscriptions] ALTER COLUMN [StartDate] datetime2(3) NOT NULL;

DECLARE @var20 nvarchar(max);
SELECT @var20 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TenantSubscriptions]') AND [c].[name] = N'PeriodStart');
IF @var20 IS NOT NULL EXEC(N'ALTER TABLE [TenantSubscriptions] DROP CONSTRAINT ' + @var20 + ';');
ALTER TABLE [TenantSubscriptions] ALTER COLUMN [PeriodStart] datetime2(3) NOT NULL;

DECLARE @var21 nvarchar(max);
SELECT @var21 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TenantSubscriptions]') AND [c].[name] = N'PeriodEnd');
IF @var21 IS NOT NULL EXEC(N'ALTER TABLE [TenantSubscriptions] DROP CONSTRAINT ' + @var21 + ';');
ALTER TABLE [TenantSubscriptions] ALTER COLUMN [PeriodEnd] datetime2(3) NOT NULL;

DECLARE @var22 nvarchar(max);
SELECT @var22 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TenantSubscriptions]') AND [c].[name] = N'DeletedAt');
IF @var22 IS NOT NULL EXEC(N'ALTER TABLE [TenantSubscriptions] DROP CONSTRAINT ' + @var22 + ';');
ALTER TABLE [TenantSubscriptions] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var23 nvarchar(max);
SELECT @var23 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TenantSubscriptions]') AND [c].[name] = N'CreatedAt');
IF @var23 IS NOT NULL EXEC(N'ALTER TABLE [TenantSubscriptions] DROP CONSTRAINT ' + @var23 + ';');
ALTER TABLE [TenantSubscriptions] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var24 nvarchar(max);
SELECT @var24 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TenantSubscriptions]') AND [c].[name] = N'CanceledAt');
IF @var24 IS NOT NULL EXEC(N'ALTER TABLE [TenantSubscriptions] DROP CONSTRAINT ' + @var24 + ';');
ALTER TABLE [TenantSubscriptions] ALTER COLUMN [CanceledAt] datetime2(3) NULL;

DECLARE @var25 nvarchar(max);
SELECT @var25 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TenantSubscriptions]') AND [c].[name] = N'BillingCycle');
IF @var25 IS NOT NULL EXEC(N'ALTER TABLE [TenantSubscriptions] DROP CONSTRAINT ' + @var25 + ';');
ALTER TABLE [TenantSubscriptions] ALTER COLUMN [BillingCycle] tinyint NOT NULL;

DECLARE @var26 nvarchar(max);
SELECT @var26 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'Website');
IF @var26 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var26 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [Website] nvarchar(100) NULL;

DECLARE @var27 nvarchar(max);
SELECT @var27 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'TaxId');
IF @var27 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var27 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [TaxId] nvarchar(30) NULL;

DECLARE @var28 nvarchar(max);
SELECT @var28 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'SupportEmail');
IF @var28 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var28 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [SupportEmail] nvarchar(50) NULL;

DECLARE @var29 nvarchar(max);
SELECT @var29 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'SubscriptionTier');
IF @var29 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var29 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [SubscriptionTier] tinyint NOT NULL;

DECLARE @var30 nvarchar(max);
SELECT @var30 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'SubscriptionStatus');
IF @var30 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var30 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [SubscriptionStatus] tinyint NOT NULL;

DECLARE @var31 nvarchar(max);
SELECT @var31 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'SubscriptionPeriodStart');
IF @var31 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var31 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [SubscriptionPeriodStart] datetime2(3) NULL;

DECLARE @var32 nvarchar(max);
SELECT @var32 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'SubscriptionPeriodEnd');
IF @var32 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var32 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [SubscriptionPeriodEnd] datetime2(3) NULL;

DECLARE @var33 nvarchar(max);
SELECT @var33 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'Name');
IF @var33 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var33 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [Name] nvarchar(50) NOT NULL;

DECLARE @var34 nvarchar(max);
SELECT @var34 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'LogoUrl');
IF @var34 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var34 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [LogoUrl] nvarchar(300) NULL;

DECLARE @var35 nvarchar(max);
SELECT @var35 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'LegalName');
IF @var35 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var35 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [LegalName] nvarchar(50) NULL;

DECLARE @var36 nvarchar(max);
SELECT @var36 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'Email');
IF @var36 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var36 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [Email] nvarchar(50) NULL;

DECLARE @var37 nvarchar(max);
SELECT @var37 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'DeletedAt');
IF @var37 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var37 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var38 nvarchar(max);
SELECT @var38 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tenants]') AND [c].[name] = N'CreatedAt');
IF @var38 IS NOT NULL EXEC(N'ALTER TABLE [Tenants] DROP CONSTRAINT ' + @var38 + ';');
ALTER TABLE [Tenants] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var39 nvarchar(max);
SELECT @var39 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SupplyRequests]') AND [c].[name] = N'UpdatedAt');
IF @var39 IS NOT NULL EXEC(N'ALTER TABLE [SupplyRequests] DROP CONSTRAINT ' + @var39 + ';');
ALTER TABLE [SupplyRequests] ALTER COLUMN [UpdatedAt] datetime2(3) NOT NULL;

DECLARE @var40 nvarchar(max);
SELECT @var40 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SupplyRequests]') AND [c].[name] = N'Status');
IF @var40 IS NOT NULL EXEC(N'ALTER TABLE [SupplyRequests] DROP CONSTRAINT ' + @var40 + ';');
ALTER TABLE [SupplyRequests] ALTER COLUMN [Status] tinyint NOT NULL;

DECLARE @var41 nvarchar(max);
SELECT @var41 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SupplyRequests]') AND [c].[name] = N'RequestType');
IF @var41 IS NOT NULL EXEC(N'ALTER TABLE [SupplyRequests] DROP CONSTRAINT ' + @var41 + ';');
ALTER TABLE [SupplyRequests] ALTER COLUMN [RequestType] tinyint NOT NULL;

DECLARE @var42 nvarchar(max);
SELECT @var42 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SupplyRequests]') AND [c].[name] = N'Priority');
IF @var42 IS NOT NULL EXEC(N'ALTER TABLE [SupplyRequests] DROP CONSTRAINT ' + @var42 + ';');
ALTER TABLE [SupplyRequests] ALTER COLUMN [Priority] tinyint NOT NULL;

DECLARE @var43 nvarchar(max);
SELECT @var43 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SupplyRequests]') AND [c].[name] = N'DispatchWindow');
IF @var43 IS NOT NULL EXEC(N'ALTER TABLE [SupplyRequests] DROP CONSTRAINT ' + @var43 + ';');
ALTER TABLE [SupplyRequests] ALTER COLUMN [DispatchWindow] tinyint NOT NULL;

DECLARE @var44 nvarchar(max);
SELECT @var44 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SupplyRequests]') AND [c].[name] = N'DispatchDate');
IF @var44 IS NOT NULL EXEC(N'ALTER TABLE [SupplyRequests] DROP CONSTRAINT ' + @var44 + ';');
ALTER TABLE [SupplyRequests] ALTER COLUMN [DispatchDate] datetime2(3) NULL;

DECLARE @var45 nvarchar(max);
SELECT @var45 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SupplyRequests]') AND [c].[name] = N'DeletedAt');
IF @var45 IS NOT NULL EXEC(N'ALTER TABLE [SupplyRequests] DROP CONSTRAINT ' + @var45 + ';');
ALTER TABLE [SupplyRequests] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var46 nvarchar(max);
SELECT @var46 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SupplyRequests]') AND [c].[name] = N'CreatedAt');
IF @var46 IS NOT NULL EXEC(N'ALTER TABLE [SupplyRequests] DROP CONSTRAINT ' + @var46 + ';');
ALTER TABLE [SupplyRequests] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var47 nvarchar(max);
SELECT @var47 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPlans]') AND [c].[name] = N'Name');
IF @var47 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPlans] DROP CONSTRAINT ' + @var47 + ';');
ALTER TABLE [SubscriptionPlans] ALTER COLUMN [Name] nvarchar(50) NOT NULL;

DECLARE @var48 nvarchar(max);
SELECT @var48 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPlans]') AND [c].[name] = N'Description');
IF @var48 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPlans] DROP CONSTRAINT ' + @var48 + ';');
ALTER TABLE [SubscriptionPlans] ALTER COLUMN [Description] nvarchar(100) NULL;

DECLARE @var49 nvarchar(max);
SELECT @var49 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPlans]') AND [c].[name] = N'DeletedAt');
IF @var49 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPlans] DROP CONSTRAINT ' + @var49 + ';');
ALTER TABLE [SubscriptionPlans] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var50 nvarchar(max);
SELECT @var50 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPlans]') AND [c].[name] = N'CreatedAt');
IF @var50 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPlans] DROP CONSTRAINT ' + @var50 + ';');
ALTER TABLE [SubscriptionPlans] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var51 nvarchar(max);
SELECT @var51 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPayments]') AND [c].[name] = N'Status');
IF @var51 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPayments] DROP CONSTRAINT ' + @var51 + ';');
ALTER TABLE [SubscriptionPayments] ALTER COLUMN [Status] tinyint NOT NULL;

DECLARE @var52 nvarchar(max);
SELECT @var52 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPayments]') AND [c].[name] = N'ProviderPaymentId');
IF @var52 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPayments] DROP CONSTRAINT ' + @var52 + ';');
ALTER TABLE [SubscriptionPayments] ALTER COLUMN [ProviderPaymentId] nvarchar(30) NULL;

DECLARE @var53 nvarchar(max);
SELECT @var53 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPayments]') AND [c].[name] = N'Provider');
IF @var53 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPayments] DROP CONSTRAINT ' + @var53 + ';');
ALTER TABLE [SubscriptionPayments] ALTER COLUMN [Provider] tinyint NULL;

DECLARE @var54 nvarchar(max);
SELECT @var54 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPayments]') AND [c].[name] = N'PaymentMethod');
IF @var54 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPayments] DROP CONSTRAINT ' + @var54 + ';');
ALTER TABLE [SubscriptionPayments] ALTER COLUMN [PaymentMethod] tinyint NULL;

DECLARE @var55 nvarchar(max);
SELECT @var55 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPayments]') AND [c].[name] = N'PaidAt');
IF @var55 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPayments] DROP CONSTRAINT ' + @var55 + ';');
ALTER TABLE [SubscriptionPayments] ALTER COLUMN [PaidAt] datetime2(3) NULL;

DECLARE @var56 nvarchar(max);
SELECT @var56 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPayments]') AND [c].[name] = N'Currency');
IF @var56 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPayments] DROP CONSTRAINT ' + @var56 + ';');
ALTER TABLE [SubscriptionPayments] ALTER COLUMN [Currency] nvarchar(5) NOT NULL;

DECLARE @var57 nvarchar(max);
SELECT @var57 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionPayments]') AND [c].[name] = N'CreatedAt');
IF @var57 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionPayments] DROP CONSTRAINT ' + @var57 + ';');
ALTER TABLE [SubscriptionPayments] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var58 nvarchar(max);
SELECT @var58 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionInvoices]') AND [c].[name] = N'Status');
IF @var58 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionInvoices] DROP CONSTRAINT ' + @var58 + ';');
ALTER TABLE [SubscriptionInvoices] ALTER COLUMN [Status] tinyint NOT NULL;

DECLARE @var59 nvarchar(max);
SELECT @var59 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionInvoices]') AND [c].[name] = N'ProviderReference');
IF @var59 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionInvoices] DROP CONSTRAINT ' + @var59 + ';');
ALTER TABLE [SubscriptionInvoices] ALTER COLUMN [ProviderReference] nvarchar(50) NULL;

DECLARE @var60 nvarchar(max);
SELECT @var60 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionInvoices]') AND [c].[name] = N'PaidAt');
IF @var60 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionInvoices] DROP CONSTRAINT ' + @var60 + ';');
ALTER TABLE [SubscriptionInvoices] ALTER COLUMN [PaidAt] datetime2(3) NULL;

DECLARE @var61 nvarchar(max);
SELECT @var61 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionInvoices]') AND [c].[name] = N'IssuedAt');
IF @var61 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionInvoices] DROP CONSTRAINT ' + @var61 + ';');
ALTER TABLE [SubscriptionInvoices] ALTER COLUMN [IssuedAt] datetime2(3) NOT NULL;

DECLARE @var62 nvarchar(max);
SELECT @var62 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionInvoices]') AND [c].[name] = N'DueAt');
IF @var62 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionInvoices] DROP CONSTRAINT ' + @var62 + ';');
ALTER TABLE [SubscriptionInvoices] ALTER COLUMN [DueAt] datetime2(3) NULL;

DECLARE @var63 nvarchar(max);
SELECT @var63 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionInvoices]') AND [c].[name] = N'Currency');
IF @var63 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionInvoices] DROP CONSTRAINT ' + @var63 + ';');
ALTER TABLE [SubscriptionInvoices] ALTER COLUMN [Currency] nvarchar(5) NOT NULL;

DECLARE @var64 nvarchar(max);
SELECT @var64 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SubscriptionInvoices]') AND [c].[name] = N'CreatedAt');
IF @var64 IS NOT NULL EXEC(N'ALTER TABLE [SubscriptionInvoices] DROP CONSTRAINT ' + @var64 + ';');
ALTER TABLE [SubscriptionInvoices] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var65 nvarchar(max);
SELECT @var65 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Shipments]') AND [c].[name] = N'TrackingNumber');
IF @var65 IS NOT NULL EXEC(N'ALTER TABLE [Shipments] DROP CONSTRAINT ' + @var65 + ';');
ALTER TABLE [Shipments] ALTER COLUMN [TrackingNumber] nvarchar(30) NULL;

DECLARE @var66 nvarchar(max);
SELECT @var66 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Shipments]') AND [c].[name] = N'EstimatedArrival');
IF @var66 IS NOT NULL EXEC(N'ALTER TABLE [Shipments] DROP CONSTRAINT ' + @var66 + ';');
ALTER TABLE [Shipments] ALTER COLUMN [EstimatedArrival] datetime2(3) NULL;

DECLARE @var67 nvarchar(max);
SELECT @var67 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Shipments]') AND [c].[name] = N'DispatchDate');
IF @var67 IS NOT NULL EXEC(N'ALTER TABLE [Shipments] DROP CONSTRAINT ' + @var67 + ';');
ALTER TABLE [Shipments] ALTER COLUMN [DispatchDate] datetime2(3) NULL;

DECLARE @var68 nvarchar(max);
SELECT @var68 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Shipments]') AND [c].[name] = N'DeletedAt');
IF @var68 IS NOT NULL EXEC(N'ALTER TABLE [Shipments] DROP CONSTRAINT ' + @var68 + ';');
ALTER TABLE [Shipments] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var69 nvarchar(max);
SELECT @var69 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Returns]') AND [c].[name] = N'ResolvedAt');
IF @var69 IS NOT NULL EXEC(N'ALTER TABLE [Returns] DROP CONSTRAINT ' + @var69 + ';');
ALTER TABLE [Returns] ALTER COLUMN [ResolvedAt] datetime2(3) NULL;

DECLARE @var70 nvarchar(max);
SELECT @var70 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Returns]') AND [c].[name] = N'Resolution');
IF @var70 IS NOT NULL EXEC(N'ALTER TABLE [Returns] DROP CONSTRAINT ' + @var70 + ';');
ALTER TABLE [Returns] ALTER COLUMN [Resolution] tinyint NOT NULL;

DECLARE @var71 nvarchar(max);
SELECT @var71 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Returns]') AND [c].[name] = N'Reason');
IF @var71 IS NOT NULL EXEC(N'ALTER TABLE [Returns] DROP CONSTRAINT ' + @var71 + ';');
ALTER TABLE [Returns] ALTER COLUMN [Reason] nvarchar(100) NULL;

DECLARE @var72 nvarchar(max);
SELECT @var72 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Returns]') AND [c].[name] = N'LoggedAt');
IF @var72 IS NOT NULL EXEC(N'ALTER TABLE [Returns] DROP CONSTRAINT ' + @var72 + ';');
ALTER TABLE [Returns] ALTER COLUMN [LoggedAt] datetime2(3) NOT NULL;

DECLARE @var73 nvarchar(max);
SELECT @var73 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Returns]') AND [c].[name] = N'DeletedAt');
IF @var73 IS NOT NULL EXEC(N'ALTER TABLE [Returns] DROP CONSTRAINT ' + @var73 + ';');
ALTER TABLE [Returns] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var74 nvarchar(max);
SELECT @var74 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ReturnItems]') AND [c].[name] = N'Reason');
IF @var74 IS NOT NULL EXEC(N'ALTER TABLE [ReturnItems] DROP CONSTRAINT ' + @var74 + ';');
ALTER TABLE [ReturnItems] ALTER COLUMN [Reason] nvarchar(100) NULL;

DECLARE @var75 nvarchar(max);
SELECT @var75 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationVerificationSessions]') AND [c].[name] = N'UsedAtUtc');
IF @var75 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationVerificationSessions] DROP CONSTRAINT ' + @var75 + ';');
ALTER TABLE [RegistrationVerificationSessions] ALTER COLUMN [UsedAtUtc] datetime2(3) NULL;

DECLARE @var76 nvarchar(max);
SELECT @var76 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationVerificationSessions]') AND [c].[name] = N'ExpiresAtUtc');
IF @var76 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationVerificationSessions] DROP CONSTRAINT ' + @var76 + ';');
ALTER TABLE [RegistrationVerificationSessions] ALTER COLUMN [ExpiresAtUtc] datetime2(3) NOT NULL;

DECLARE @var77 nvarchar(max);
SELECT @var77 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationVerificationSessions]') AND [c].[name] = N'Email');
IF @var77 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationVerificationSessions] DROP CONSTRAINT ' + @var77 + ';');
ALTER TABLE [RegistrationVerificationSessions] ALTER COLUMN [Email] nvarchar(50) NOT NULL;

DECLARE @var78 nvarchar(max);
SELECT @var78 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationVerificationSessions]') AND [c].[name] = N'CreatedAtUtc');
IF @var78 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationVerificationSessions] DROP CONSTRAINT ' + @var78 + ';');
ALTER TABLE [RegistrationVerificationSessions] ALTER COLUMN [CreatedAtUtc] datetime2(3) NOT NULL;

DECLARE @var79 nvarchar(max);
SELECT @var79 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationOtps]') AND [c].[name] = N'VerifiedAtUtc');
IF @var79 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationOtps] DROP CONSTRAINT ' + @var79 + ';');
ALTER TABLE [RegistrationOtps] ALTER COLUMN [VerifiedAtUtc] datetime2(3) NULL;

DECLARE @var80 nvarchar(max);
SELECT @var80 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationOtps]') AND [c].[name] = N'UpdatedAtUtc');
IF @var80 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationOtps] DROP CONSTRAINT ' + @var80 + ';');
ALTER TABLE [RegistrationOtps] ALTER COLUMN [UpdatedAtUtc] datetime2(3) NOT NULL;

DECLARE @var81 nvarchar(max);
SELECT @var81 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationOtps]') AND [c].[name] = N'OtpHash');
IF @var81 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationOtps] DROP CONSTRAINT ' + @var81 + ';');
ALTER TABLE [RegistrationOtps] ALTER COLUMN [OtpHash] nvarchar(100) NOT NULL;

DROP INDEX [IX_RegistrationOtps_Email_IsUsed_ExpiresAtUtc] ON [RegistrationOtps];
DECLARE @var82 nvarchar(max);
SELECT @var82 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationOtps]') AND [c].[name] = N'ExpiresAtUtc');
IF @var82 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationOtps] DROP CONSTRAINT ' + @var82 + ';');
ALTER TABLE [RegistrationOtps] ALTER COLUMN [ExpiresAtUtc] datetime2(3) NOT NULL;
CREATE INDEX [IX_RegistrationOtps_Email_IsUsed_ExpiresAtUtc] ON [RegistrationOtps] ([Email], [IsUsed], [ExpiresAtUtc]);

DROP INDEX [IX_RegistrationOtps_Email_IsUsed_ExpiresAtUtc] ON [RegistrationOtps];
DECLARE @var83 nvarchar(max);
SELECT @var83 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationOtps]') AND [c].[name] = N'Email');
IF @var83 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationOtps] DROP CONSTRAINT ' + @var83 + ';');
ALTER TABLE [RegistrationOtps] ALTER COLUMN [Email] nvarchar(50) NOT NULL;
CREATE INDEX [IX_RegistrationOtps_Email_IsUsed_ExpiresAtUtc] ON [RegistrationOtps] ([Email], [IsUsed], [ExpiresAtUtc]);

DECLARE @var84 nvarchar(max);
SELECT @var84 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationOtps]') AND [c].[name] = N'CreatedAtUtc');
IF @var84 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationOtps] DROP CONSTRAINT ' + @var84 + ';');
ALTER TABLE [RegistrationOtps] ALTER COLUMN [CreatedAtUtc] datetime2(3) NOT NULL;

DECLARE @var85 nvarchar(max);
SELECT @var85 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RegistrationOtps]') AND [c].[name] = N'CooldownUntilUtc');
IF @var85 IS NOT NULL EXEC(N'ALTER TABLE [RegistrationOtps] DROP CONSTRAINT ' + @var85 + ';');
ALTER TABLE [RegistrationOtps] ALTER COLUMN [CooldownUntilUtc] datetime2(3) NOT NULL;

DECLARE @var86 nvarchar(max);
SELECT @var86 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[OrderStatusHistories]') AND [c].[name] = N'Timestamp');
IF @var86 IS NOT NULL EXEC(N'ALTER TABLE [OrderStatusHistories] DROP CONSTRAINT ' + @var86 + ';');
ALTER TABLE [OrderStatusHistories] ALTER COLUMN [Timestamp] datetime2(3) NOT NULL;

DECLARE @var87 nvarchar(max);
SELECT @var87 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[OrderStatusHistories]') AND [c].[name] = N'Status');
IF @var87 IS NOT NULL EXEC(N'ALTER TABLE [OrderStatusHistories] DROP CONSTRAINT ' + @var87 + ';');
ALTER TABLE [OrderStatusHistories] ALTER COLUMN [Status] tinyint NOT NULL;

DECLARE @var88 nvarchar(max);
SELECT @var88 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Orders]') AND [c].[name] = N'Status');
IF @var88 IS NOT NULL EXEC(N'ALTER TABLE [Orders] DROP CONSTRAINT ' + @var88 + ';');
ALTER TABLE [Orders] ALTER COLUMN [Status] tinyint NOT NULL;

DECLARE @var89 nvarchar(max);
SELECT @var89 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Orders]') AND [c].[name] = N'PushedToFulfillmentAt');
IF @var89 IS NOT NULL EXEC(N'ALTER TABLE [Orders] DROP CONSTRAINT ' + @var89 + ';');
ALTER TABLE [Orders] ALTER COLUMN [PushedToFulfillmentAt] datetime2(3) NOT NULL;

DECLARE @var90 nvarchar(max);
SELECT @var90 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Orders]') AND [c].[name] = N'DeletedAt');
IF @var90 IS NOT NULL EXEC(N'ALTER TABLE [Orders] DROP CONSTRAINT ' + @var90 + ';');
ALTER TABLE [Orders] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var91 nvarchar(max);
SELECT @var91 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Notifications]') AND [c].[name] = N'Type');
IF @var91 IS NOT NULL EXEC(N'ALTER TABLE [Notifications] DROP CONSTRAINT ' + @var91 + ';');
ALTER TABLE [Notifications] ALTER COLUMN [Type] tinyint NOT NULL;

DECLARE @var92 nvarchar(max);
SELECT @var92 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Notifications]') AND [c].[name] = N'Title');
IF @var92 IS NOT NULL EXEC(N'ALTER TABLE [Notifications] DROP CONSTRAINT ' + @var92 + ';');
ALTER TABLE [Notifications] ALTER COLUMN [Title] nvarchar(50) NOT NULL;

DECLARE @var93 nvarchar(max);
SELECT @var93 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Notifications]') AND [c].[name] = N'ReferenceType');
IF @var93 IS NOT NULL EXEC(N'ALTER TABLE [Notifications] DROP CONSTRAINT ' + @var93 + ';');
ALTER TABLE [Notifications] ALTER COLUMN [ReferenceType] tinyint NULL;

DECLARE @var94 nvarchar(max);
SELECT @var94 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Notifications]') AND [c].[name] = N'ReadAt');
IF @var94 IS NOT NULL EXEC(N'ALTER TABLE [Notifications] DROP CONSTRAINT ' + @var94 + ';');
ALTER TABLE [Notifications] ALTER COLUMN [ReadAt] datetime2(3) NULL;

DECLARE @var95 nvarchar(max);
SELECT @var95 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Notifications]') AND [c].[name] = N'CreatedAt');
IF @var95 IS NOT NULL EXEC(N'ALTER TABLE [Notifications] DROP CONSTRAINT ' + @var95 + ';');
ALTER TABLE [Notifications] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var96 nvarchar(max);
SELECT @var96 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuVariants]') AND [c].[name] = N'PricingMode');
IF @var96 IS NOT NULL EXEC(N'ALTER TABLE [MenuVariants] DROP CONSTRAINT ' + @var96 + ';');
ALTER TABLE [MenuVariants] ALTER COLUMN [PricingMode] tinyint NOT NULL;

DECLARE @var97 nvarchar(max);
SELECT @var97 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuVariants]') AND [c].[name] = N'Name');
IF @var97 IS NOT NULL EXEC(N'ALTER TABLE [MenuVariants] DROP CONSTRAINT ' + @var97 + ';');
ALTER TABLE [MenuVariants] ALTER COLUMN [Name] nvarchar(50) NOT NULL;

DECLARE @var98 nvarchar(max);
SELECT @var98 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuVariants]') AND [c].[name] = N'DeletedAt');
IF @var98 IS NOT NULL EXEC(N'ALTER TABLE [MenuVariants] DROP CONSTRAINT ' + @var98 + ';');
ALTER TABLE [MenuVariants] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var99 nvarchar(max);
SELECT @var99 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuVariants]') AND [c].[name] = N'CreatedAt');
IF @var99 IS NOT NULL EXEC(N'ALTER TABLE [MenuVariants] DROP CONSTRAINT ' + @var99 + ';');
ALTER TABLE [MenuVariants] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var100 nvarchar(max);
SELECT @var100 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuTags]') AND [c].[name] = N'DeletedAt');
IF @var100 IS NOT NULL EXEC(N'ALTER TABLE [MenuTags] DROP CONSTRAINT ' + @var100 + ';');
ALTER TABLE [MenuTags] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var101 nvarchar(max);
SELECT @var101 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuTags]') AND [c].[name] = N'CreatedAt');
IF @var101 IS NOT NULL EXEC(N'ALTER TABLE [MenuTags] DROP CONSTRAINT ' + @var101 + ';');
ALTER TABLE [MenuTags] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var102 nvarchar(max);
SELECT @var102 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuItems]') AND [c].[name] = N'UpdatedAt');
IF @var102 IS NOT NULL EXEC(N'ALTER TABLE [MenuItems] DROP CONSTRAINT ' + @var102 + ';');
ALTER TABLE [MenuItems] ALTER COLUMN [UpdatedAt] datetime2(3) NOT NULL;

DECLARE @var103 nvarchar(max);
SELECT @var103 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuItems]') AND [c].[name] = N'Status');
IF @var103 IS NOT NULL EXEC(N'ALTER TABLE [MenuItems] DROP CONSTRAINT ' + @var103 + ';');
ALTER TABLE [MenuItems] ALTER COLUMN [Status] tinyint NOT NULL;

DECLARE @var104 nvarchar(max);
SELECT @var104 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuItems]') AND [c].[name] = N'Name');
IF @var104 IS NOT NULL EXEC(N'ALTER TABLE [MenuItems] DROP CONSTRAINT ' + @var104 + ';');
ALTER TABLE [MenuItems] ALTER COLUMN [Name] nvarchar(50) NOT NULL;

DECLARE @var105 nvarchar(max);
SELECT @var105 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuItems]') AND [c].[name] = N'ImageUrl');
IF @var105 IS NOT NULL EXEC(N'ALTER TABLE [MenuItems] DROP CONSTRAINT ' + @var105 + ';');
ALTER TABLE [MenuItems] ALTER COLUMN [ImageUrl] nvarchar(300) NULL;

DECLARE @var106 nvarchar(max);
SELECT @var106 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuItems]') AND [c].[name] = N'DeletedAt');
IF @var106 IS NOT NULL EXEC(N'ALTER TABLE [MenuItems] DROP CONSTRAINT ' + @var106 + ';');
ALTER TABLE [MenuItems] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var107 nvarchar(max);
SELECT @var107 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuItems]') AND [c].[name] = N'CreatedAt');
IF @var107 IS NOT NULL EXEC(N'ALTER TABLE [MenuItems] DROP CONSTRAINT ' + @var107 + ';');
ALTER TABLE [MenuItems] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var108 nvarchar(max);
SELECT @var108 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuItemIngredients]') AND [c].[name] = N'UnitOfMeasure');
IF @var108 IS NOT NULL EXEC(N'ALTER TABLE [MenuItemIngredients] DROP CONSTRAINT ' + @var108 + ';');
ALTER TABLE [MenuItemIngredients] ALTER COLUMN [UnitOfMeasure] nvarchar(20) NULL;

DECLARE @var109 nvarchar(max);
SELECT @var109 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuCategories]') AND [c].[name] = N'Name');
IF @var109 IS NOT NULL EXEC(N'ALTER TABLE [MenuCategories] DROP CONSTRAINT ' + @var109 + ';');
ALTER TABLE [MenuCategories] ALTER COLUMN [Name] nvarchar(50) NOT NULL;

DECLARE @var110 nvarchar(max);
SELECT @var110 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuCategories]') AND [c].[name] = N'DeletedAt');
IF @var110 IS NOT NULL EXEC(N'ALTER TABLE [MenuCategories] DROP CONSTRAINT ' + @var110 + ';');
ALTER TABLE [MenuCategories] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var111 nvarchar(max);
SELECT @var111 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[MenuCategories]') AND [c].[name] = N'CreatedAt');
IF @var111 IS NOT NULL EXEC(N'ALTER TABLE [MenuCategories] DROP CONSTRAINT ' + @var111 + ';');
ALTER TABLE [MenuCategories] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var112 nvarchar(max);
SELECT @var112 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'UpdatedAt');
IF @var112 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT ' + @var112 + ';');
ALTER TABLE [Items] ALTER COLUMN [UpdatedAt] datetime2(3) NOT NULL;

DECLARE @var113 nvarchar(max);
SELECT @var113 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'Name');
IF @var113 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT ' + @var113 + ';');
ALTER TABLE [Items] ALTER COLUMN [Name] nvarchar(50) NOT NULL;

DECLARE @var114 nvarchar(max);
SELECT @var114 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'DeletedAt');
IF @var114 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT ' + @var114 + ';');
ALTER TABLE [Items] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var115 nvarchar(max);
SELECT @var115 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'CreatedAt');
IF @var115 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT ' + @var115 + ';');
ALTER TABLE [Items] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var116 nvarchar(max);
SELECT @var116 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ItemCategories]') AND [c].[name] = N'Name');
IF @var116 IS NOT NULL EXEC(N'ALTER TABLE [ItemCategories] DROP CONSTRAINT ' + @var116 + ';');
ALTER TABLE [ItemCategories] ALTER COLUMN [Name] nvarchar(50) NOT NULL;

DECLARE @var117 nvarchar(max);
SELECT @var117 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ItemCategories]') AND [c].[name] = N'Description');
IF @var117 IS NOT NULL EXEC(N'ALTER TABLE [ItemCategories] DROP CONSTRAINT ' + @var117 + ';');
ALTER TABLE [ItemCategories] ALTER COLUMN [Description] nvarchar(100) NULL;

DECLARE @var118 nvarchar(max);
SELECT @var118 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ItemCategories]') AND [c].[name] = N'DeletedAt');
IF @var118 IS NOT NULL EXEC(N'ALTER TABLE [ItemCategories] DROP CONSTRAINT ' + @var118 + ';');
ALTER TABLE [ItemCategories] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var119 nvarchar(max);
SELECT @var119 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ItemCategories]') AND [c].[name] = N'CreatedAt');
IF @var119 IS NOT NULL EXEC(N'ALTER TABLE [ItemCategories] DROP CONSTRAINT ' + @var119 + ';');
ALTER TABLE [ItemCategories] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var120 nvarchar(max);
SELECT @var120 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InventoryTransactions]') AND [c].[name] = N'TransactionType');
IF @var120 IS NOT NULL EXEC(N'ALTER TABLE [InventoryTransactions] DROP CONSTRAINT ' + @var120 + ';');
ALTER TABLE [InventoryTransactions] ALTER COLUMN [TransactionType] tinyint NOT NULL;

DECLARE @var121 nvarchar(max);
SELECT @var121 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InventoryTransactions]') AND [c].[name] = N'Timestamp');
IF @var121 IS NOT NULL EXEC(N'ALTER TABLE [InventoryTransactions] DROP CONSTRAINT ' + @var121 + ';');
ALTER TABLE [InventoryTransactions] ALTER COLUMN [Timestamp] datetime2(3) NOT NULL;

DECLARE @var122 nvarchar(max);
SELECT @var122 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InventoryTransactions]') AND [c].[name] = N'ReferenceType');
IF @var122 IS NOT NULL EXEC(N'ALTER TABLE [InventoryTransactions] DROP CONSTRAINT ' + @var122 + ';');
ALTER TABLE [InventoryTransactions] ALTER COLUMN [ReferenceType] tinyint NULL;

DECLARE @var123 nvarchar(max);
SELECT @var123 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InventoryCategories]') AND [c].[name] = N'Name');
IF @var123 IS NOT NULL EXEC(N'ALTER TABLE [InventoryCategories] DROP CONSTRAINT ' + @var123 + ';');
ALTER TABLE [InventoryCategories] ALTER COLUMN [Name] nvarchar(50) NOT NULL;

DECLARE @var124 nvarchar(max);
SELECT @var124 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InventoryCategories]') AND [c].[name] = N'Description');
IF @var124 IS NOT NULL EXEC(N'ALTER TABLE [InventoryCategories] DROP CONSTRAINT ' + @var124 + ';');
ALTER TABLE [InventoryCategories] ALTER COLUMN [Description] nvarchar(100) NULL;

DECLARE @var125 nvarchar(max);
SELECT @var125 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InventoryCategories]') AND [c].[name] = N'DeletedAt');
IF @var125 IS NOT NULL EXEC(N'ALTER TABLE [InventoryCategories] DROP CONSTRAINT ' + @var125 + ';');
ALTER TABLE [InventoryCategories] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var126 nvarchar(max);
SELECT @var126 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InventoryCategories]') AND [c].[name] = N'CreatedAt');
IF @var126 IS NOT NULL EXEC(N'ALTER TABLE [InventoryCategories] DROP CONSTRAINT ' + @var126 + ';');
ALTER TABLE [InventoryCategories] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var127 nvarchar(max);
SELECT @var127 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Employees]') AND [c].[name] = N'LastName');
IF @var127 IS NOT NULL EXEC(N'ALTER TABLE [Employees] DROP CONSTRAINT ' + @var127 + ';');
ALTER TABLE [Employees] ALTER COLUMN [LastName] nvarchar(50) NOT NULL;

DECLARE @var128 nvarchar(max);
SELECT @var128 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Employees]') AND [c].[name] = N'ImageUrl');
IF @var128 IS NOT NULL EXEC(N'ALTER TABLE [Employees] DROP CONSTRAINT ' + @var128 + ';');
ALTER TABLE [Employees] ALTER COLUMN [ImageUrl] nvarchar(300) NULL;

DECLARE @var129 nvarchar(max);
SELECT @var129 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Employees]') AND [c].[name] = N'FirstName');
IF @var129 IS NOT NULL EXEC(N'ALTER TABLE [Employees] DROP CONSTRAINT ' + @var129 + ';');
ALTER TABLE [Employees] ALTER COLUMN [FirstName] nvarchar(50) NOT NULL;

DECLARE @var130 nvarchar(max);
SELECT @var130 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Employees]') AND [c].[name] = N'Email');
IF @var130 IS NOT NULL EXEC(N'ALTER TABLE [Employees] DROP CONSTRAINT ' + @var130 + ';');
ALTER TABLE [Employees] ALTER COLUMN [Email] nvarchar(50) NULL;

DECLARE @var131 nvarchar(max);
SELECT @var131 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Employees]') AND [c].[name] = N'DeletedAt');
IF @var131 IS NOT NULL EXEC(N'ALTER TABLE [Employees] DROP CONSTRAINT ' + @var131 + ';');
ALTER TABLE [Employees] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var132 nvarchar(max);
SELECT @var132 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Employees]') AND [c].[name] = N'DateHired');
IF @var132 IS NOT NULL EXEC(N'ALTER TABLE [Employees] DROP CONSTRAINT ' + @var132 + ';');
ALTER TABLE [Employees] ALTER COLUMN [DateHired] datetime2(3) NULL;

DECLARE @var133 nvarchar(max);
SELECT @var133 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Employees]') AND [c].[name] = N'CreatedAt');
IF @var133 IS NOT NULL EXEC(N'ALTER TABLE [Employees] DROP CONSTRAINT ' + @var133 + ';');
ALTER TABLE [Employees] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var134 nvarchar(max);
SELECT @var134 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ConsumptionLogs]') AND [c].[name] = N'Shift');
IF @var134 IS NOT NULL EXEC(N'ALTER TABLE [ConsumptionLogs] DROP CONSTRAINT ' + @var134 + ';');
ALTER TABLE [ConsumptionLogs] ALTER COLUMN [Shift] tinyint NULL;

DECLARE @var135 nvarchar(max);
SELECT @var135 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ConsumptionLogs]') AND [c].[name] = N'Method');
IF @var135 IS NOT NULL EXEC(N'ALTER TABLE [ConsumptionLogs] DROP CONSTRAINT ' + @var135 + ';');
ALTER TABLE [ConsumptionLogs] ALTER COLUMN [Method] tinyint NOT NULL;

DECLARE @var136 nvarchar(max);
SELECT @var136 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ConsumptionLogs]') AND [c].[name] = N'LogDate');
IF @var136 IS NOT NULL EXEC(N'ALTER TABLE [ConsumptionLogs] DROP CONSTRAINT ' + @var136 + ';');
ALTER TABLE [ConsumptionLogs] ALTER COLUMN [LogDate] datetime2(3) NOT NULL;

DECLARE @var137 nvarchar(max);
SELECT @var137 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ConsumptionLogs]') AND [c].[name] = N'CreatedAt');
IF @var137 IS NOT NULL EXEC(N'ALTER TABLE [ConsumptionLogs] DROP CONSTRAINT ' + @var137 + ';');
ALTER TABLE [ConsumptionLogs] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var138 nvarchar(max);
SELECT @var138 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BundleItems]') AND [c].[name] = N'DeletedAt');
IF @var138 IS NOT NULL EXEC(N'ALTER TABLE [BundleItems] DROP CONSTRAINT ' + @var138 + ';');
ALTER TABLE [BundleItems] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var139 nvarchar(max);
SELECT @var139 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BundleItems]') AND [c].[name] = N'CreatedAt');
IF @var139 IS NOT NULL EXEC(N'ALTER TABLE [BundleItems] DROP CONSTRAINT ' + @var139 + ';');
ALTER TABLE [BundleItems] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var140 nvarchar(max);
SELECT @var140 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Branches]') AND [c].[name] = N'Name');
IF @var140 IS NOT NULL EXEC(N'ALTER TABLE [Branches] DROP CONSTRAINT ' + @var140 + ';');
ALTER TABLE [Branches] ALTER COLUMN [Name] nvarchar(50) NOT NULL;

DECLARE @var141 nvarchar(max);
SELECT @var141 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Branches]') AND [c].[name] = N'ImageUrl');
IF @var141 IS NOT NULL EXEC(N'ALTER TABLE [Branches] DROP CONSTRAINT ' + @var141 + ';');
ALTER TABLE [Branches] ALTER COLUMN [ImageUrl] nvarchar(300) NULL;

DECLARE @var142 nvarchar(max);
SELECT @var142 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Branches]') AND [c].[name] = N'DeletedAt');
IF @var142 IS NOT NULL EXEC(N'ALTER TABLE [Branches] DROP CONSTRAINT ' + @var142 + ';');
ALTER TABLE [Branches] ALTER COLUMN [DeletedAt] datetime2(3) NULL;

DECLARE @var143 nvarchar(max);
SELECT @var143 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Branches]') AND [c].[name] = N'CreatedAt');
IF @var143 IS NOT NULL EXEC(N'ALTER TABLE [Branches] DROP CONSTRAINT ' + @var143 + ';');
ALTER TABLE [Branches] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var144 nvarchar(max);
SELECT @var144 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Batches]') AND [c].[name] = N'ExpiryDate');
IF @var144 IS NOT NULL EXEC(N'ALTER TABLE [Batches] DROP CONSTRAINT ' + @var144 + ';');
ALTER TABLE [Batches] ALTER COLUMN [ExpiryDate] datetime2(3) NOT NULL;

DECLARE @var145 nvarchar(max);
SELECT @var145 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Batches]') AND [c].[name] = N'CreatedAt');
IF @var145 IS NOT NULL EXEC(N'ALTER TABLE [Batches] DROP CONSTRAINT ' + @var145 + ';');
ALTER TABLE [Batches] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL;

DECLARE @var146 nvarchar(max);
SELECT @var146 = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[AuditLogs]') AND [c].[name] = N'OccurredAt');
IF @var146 IS NOT NULL EXEC(N'ALTER TABLE [AuditLogs] DROP CONSTRAINT ' + @var146 + ';');
ALTER TABLE [AuditLogs] ALTER COLUMN [OccurredAt] datetime2(3) NOT NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260427144557_ConvertTenantEnumsToStrings', N'10.0.5');

COMMIT;
GO

