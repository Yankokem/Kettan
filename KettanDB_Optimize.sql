-- ============================================================
-- KettanDB Schema Optimization Migration
-- Run this against KettanDB AFTER backing up your database
-- ============================================================

USE [KettanDB]
GO

-- ============================================================
-- STEP 1: Convert status/type/role string columns to tinyint
-- Enum mappings based on actual data in the database
-- ============================================================

-- Users.Role
-- SuperAdmin=0, TenantAdmin=1, HqManager=2, HqStaff=3, BranchOwner=4, BranchManager=5
UPDATE [dbo].[Users] SET [Role] = CASE [Role]
    WHEN 'SuperAdmin'    THEN '0'
    WHEN 'TenantAdmin'   THEN '1'
    WHEN 'HqManager'     THEN '2'
    WHEN 'HqStaff'       THEN '3'
    WHEN 'BranchOwner'   THEN '4'
    WHEN 'BranchManager' THEN '5'
    ELSE '0' END
GO
ALTER TABLE [dbo].[Users] ALTER COLUMN [Role] tinyint NOT NULL
GO

-- MenuItems.Status
-- Active=0, Inactive=1, Archived=2
UPDATE [dbo].[MenuItems] SET [Status] = CASE [Status]
    WHEN 'Active'    THEN '0'
    WHEN 'Inactive'  THEN '1'
    WHEN 'Archived'  THEN '2'
    ELSE '0' END
GO
ALTER TABLE [dbo].[MenuItems] ALTER COLUMN [Status] tinyint NOT NULL
GO

-- MenuVariants.PricingMode
-- Fixed=0, Addon=1
-- Note: actual data uses 'absolute' — mapping to Fixed=0
UPDATE [dbo].[MenuVariants] SET [PricingMode] = CASE [PricingMode]
    WHEN 'absolute' THEN '0'
    WHEN 'addon'    THEN '1'
    WHEN 'Fixed'    THEN '0'
    WHEN 'Addon'    THEN '1'
    ELSE '0' END
GO
ALTER TABLE [dbo].[MenuVariants] ALTER COLUMN [PricingMode] tinyint NOT NULL
GO

-- Vehicles.VehicleType
-- Motorcycle=0, Van=1, Truck=2, Car=3
UPDATE [dbo].[Vehicles] SET [VehicleType] = CASE [VehicleType]
    WHEN 'Motorcycle' THEN '0'
    WHEN 'Van'        THEN '1'
    WHEN 'Truck'      THEN '2'
    WHEN 'Car'        THEN '3'
    ELSE '0' END
GO
ALTER TABLE [dbo].[Vehicles] ALTER COLUMN [VehicleType] tinyint NOT NULL
GO

-- ConsumptionLogs.Method
-- Sales=0, Spoilage=1, Manual=2, Adjustment=3
UPDATE [dbo].[ConsumptionLogs] SET [Method] = CASE [Method]
    WHEN 'Sales'       THEN '0'
    WHEN 'Spoilage'    THEN '1'
    WHEN 'Manual'      THEN '2'
    WHEN 'Adjustment'  THEN '3'
    ELSE '0' END
GO
ALTER TABLE [dbo].[ConsumptionLogs] ALTER COLUMN [Method] tinyint NOT NULL
GO

-- ConsumptionLogs.Shift (nullable)
-- Morning=0, Midday=1, Afternoon=2, Evening=3, Night=4
UPDATE [dbo].[ConsumptionLogs] SET [Shift] = CASE [Shift]
    WHEN 'Morning'   THEN '0'
    WHEN 'Midday'    THEN '1'
    WHEN 'Afternoon' THEN '2'
    WHEN 'Evening'   THEN '3'
    WHEN 'Night'     THEN '4'
    ELSE NULL END
GO
ALTER TABLE [dbo].[ConsumptionLogs] ALTER COLUMN [Shift] tinyint NULL
GO

-- Orders.Status
-- Pending=0, Allocated=1, Packed=2, Dispatched=3, InTransit=4, Delivered=5, Cancelled=6, Returned=7
UPDATE [dbo].[Orders] SET [Status] = CASE [Status]
    WHEN 'Pending'    THEN '0'
    WHEN 'Allocated'  THEN '1'
    WHEN 'Packed'     THEN '2'
    WHEN 'Dispatched' THEN '3'
    WHEN 'InTransit'  THEN '4'
    WHEN 'Delivered'  THEN '5'
    WHEN 'Cancelled'  THEN '6'
    WHEN 'Returned'   THEN '7'
    ELSE '0' END
GO
ALTER TABLE [dbo].[Orders] ALTER COLUMN [Status] tinyint NOT NULL
GO

-- OrderStatusHistories.Status (same enum as Orders.Status)
UPDATE [dbo].[OrderStatusHistories] SET [Status] = CASE [Status]
    WHEN 'Pending'    THEN '0'
    WHEN 'Allocated'  THEN '1'
    WHEN 'Packed'     THEN '2'
    WHEN 'Dispatched' THEN '3'
    WHEN 'InTransit'  THEN '4'
    WHEN 'Delivered'  THEN '5'
    WHEN 'Cancelled'  THEN '6'
    WHEN 'Returned'   THEN '7'
    ELSE '0' END
GO
ALTER TABLE [dbo].[OrderStatusHistories] ALTER COLUMN [Status] tinyint NOT NULL
GO

-- SupplyRequests.Status
-- Pending=0, Approved=1, Rejected=2, Cancelled=3, Fulfilled=4
UPDATE [dbo].[SupplyRequests] SET [Status] = CASE [Status]
    WHEN 'Pending'   THEN '0'
    WHEN 'Approved'  THEN '1'
    WHEN 'Rejected'  THEN '2'
    WHEN 'Cancelled' THEN '3'
    WHEN 'Fulfilled' THEN '4'
    ELSE '0' END
GO
ALTER TABLE [dbo].[SupplyRequests] ALTER COLUMN [Status] tinyint NOT NULL
GO

-- SupplyRequests.RequestType
-- Regular=0, Emergency=1, Scheduled=2
UPDATE [dbo].[SupplyRequests] SET [RequestType] = CASE [RequestType]
    WHEN 'Regular'   THEN '0'
    WHEN 'Emergency' THEN '1'
    WHEN 'Scheduled' THEN '2'
    ELSE '0' END
GO
ALTER TABLE [dbo].[SupplyRequests] ALTER COLUMN [RequestType] tinyint NOT NULL
GO

-- SupplyRequests.Priority
-- Low=0, Normal=1, High=2, Critical=3
UPDATE [dbo].[SupplyRequests] SET [Priority] = CASE [Priority]
    WHEN 'Low'      THEN '0'
    WHEN 'Normal'   THEN '1'
    WHEN 'High'     THEN '2'
    WHEN 'Critical' THEN '3'
    ELSE '1' END
GO
ALTER TABLE [dbo].[SupplyRequests] ALTER COLUMN [Priority] tinyint NOT NULL
GO

-- SupplyRequests.DispatchWindow
-- Morning=0, Afternoon=1, Evening=2, Anytime=3
UPDATE [dbo].[SupplyRequests] SET [DispatchWindow] = CASE [DispatchWindow]
    WHEN 'Morning'   THEN '0'
    WHEN 'Afternoon' THEN '1'
    WHEN 'Evening'   THEN '2'
    WHEN 'Anytime'   THEN '3'
    ELSE '3' END
GO
ALTER TABLE [dbo].[SupplyRequests] ALTER COLUMN [DispatchWindow] tinyint NOT NULL
GO

-- Returns.Resolution
-- Pending=0, Replaced=1, Credited=2, Rejected=3, Returned=4
UPDATE [dbo].[Returns] SET [Resolution] = CASE [Resolution]
    WHEN 'Pending'  THEN '0'
    WHEN 'Replaced' THEN '1'
    WHEN 'Credited' THEN '2'
    WHEN 'Rejected' THEN '3'
    WHEN 'Returned' THEN '4'
    ELSE '0' END
GO
ALTER TABLE [dbo].[Returns] ALTER COLUMN [Resolution] tinyint NOT NULL
GO

-- InventoryTransactions.TransactionType
-- StockIn=0, StockOut=1, Adjustment=2, Spoilage=3, Transfer=4, Return=5
-- Note: actual data uses 'Restock' — mapping to StockIn=0
UPDATE [dbo].[InventoryTransactions] SET [TransactionType] = CASE [TransactionType]
    WHEN 'StockIn'     THEN '0'
    WHEN 'Restock'     THEN '0'
    WHEN 'StockOut'    THEN '1'
    WHEN 'Adjustment'  THEN '2'
    WHEN 'Spoilage'    THEN '3'
    WHEN 'Transfer'    THEN '4'
    WHEN 'Return'      THEN '5'
    ELSE '0' END
GO
ALTER TABLE [dbo].[InventoryTransactions] ALTER COLUMN [TransactionType] tinyint NOT NULL
GO

-- InventoryTransactions.ReferenceType (nullable)
-- Order=0, SupplyRequest=1, ConsumptionLog=2, Manual=3, Return=4
-- Note: actual data uses 'StockIn' as ReferenceType — mapping to Manual=3
UPDATE [dbo].[InventoryTransactions] SET [ReferenceType] = CASE [ReferenceType]
    WHEN 'Order'          THEN '0'
    WHEN 'SupplyRequest'  THEN '1'
    WHEN 'ConsumptionLog' THEN '2'
    WHEN 'Manual'         THEN '3'
    WHEN 'Return'         THEN '4'
    WHEN 'StockIn'        THEN '3'
    ELSE NULL END
GO
ALTER TABLE [dbo].[InventoryTransactions] ALTER COLUMN [ReferenceType] tinyint NULL
GO

-- Notifications.Type
-- Info=0, Warning=1, Alert=2, Success=3
UPDATE [dbo].[Notifications] SET [Type] = CASE [Type]
    WHEN 'Info'    THEN '0'
    WHEN 'Warning' THEN '1'
    WHEN 'Alert'   THEN '2'
    WHEN 'Success' THEN '3'
    ELSE '0' END
GO
ALTER TABLE [dbo].[Notifications] ALTER COLUMN [Type] tinyint NOT NULL
GO

-- Notifications.ReferenceType (nullable)
-- Order=0, SupplyRequest=1, Shipment=2, Return=3, Invoice=4
UPDATE [dbo].[Notifications] SET [ReferenceType] = CASE [ReferenceType]
    WHEN 'Order'          THEN '0'
    WHEN 'SupplyRequest'  THEN '1'
    WHEN 'Shipment'       THEN '2'
    WHEN 'Return'         THEN '3'
    WHEN 'Invoice'        THEN '4'
    ELSE NULL END
GO
ALTER TABLE [dbo].[Notifications] ALTER COLUMN [ReferenceType] tinyint NULL
GO

-- TenantSubscriptions.Status
-- Active=0, Trialing=1, PastDue=2, Cancelled=3, Expired=4, Suspended=5, PendingPayment=6
UPDATE [dbo].[TenantSubscriptions] SET [Status] = CASE [Status]
    WHEN 'Active'         THEN '0'
    WHEN 'Trialing'       THEN '1'
    WHEN 'PastDue'        THEN '2'
    WHEN 'Cancelled'      THEN '3'
    WHEN 'Expired'        THEN '4'
    WHEN 'Suspended'      THEN '5'
    WHEN 'PendingPayment' THEN '6'
    ELSE '0' END
GO
ALTER TABLE [dbo].[TenantSubscriptions] ALTER COLUMN [Status] tinyint NOT NULL
GO

-- TenantSubscriptions.BillingCycle
-- Monthly=0, Yearly=1
UPDATE [dbo].[TenantSubscriptions] SET [BillingCycle] = CASE [BillingCycle]
    WHEN 'Monthly' THEN '0'
    WHEN 'Yearly'  THEN '1'
    ELSE '0' END
GO
ALTER TABLE [dbo].[TenantSubscriptions] ALTER COLUMN [BillingCycle] tinyint NOT NULL
GO

-- Tenants.SubscriptionStatus (same enum as TenantSubscriptions.Status)
UPDATE [dbo].[Tenants] SET [SubscriptionStatus] = CASE [SubscriptionStatus]
    WHEN 'Active'         THEN '0'
    WHEN 'Trialing'       THEN '1'
    WHEN 'PastDue'        THEN '2'
    WHEN 'Cancelled'      THEN '3'
    WHEN 'Expired'        THEN '4'
    WHEN 'Suspended'      THEN '5'
    WHEN 'PendingPayment' THEN '6'
    ELSE '0' END
GO
ALTER TABLE [dbo].[Tenants] ALTER COLUMN [SubscriptionStatus] tinyint NOT NULL
GO

-- Tenants.SubscriptionTier
-- Free=0, Starter=1, Growth=2, Enterprise=3
UPDATE [dbo].[Tenants] SET [SubscriptionTier] = CASE [SubscriptionTier]
    WHEN 'Free'       THEN '0'
    WHEN 'Starter'    THEN '1'
    WHEN 'Growth'     THEN '2'
    WHEN 'Enterprise' THEN '3'
    ELSE '1' END
GO
ALTER TABLE [dbo].[Tenants] ALTER COLUMN [SubscriptionTier] tinyint NOT NULL
GO

-- SubscriptionInvoices.Status
-- Draft=0, Issued=1, Paid=2, Overdue=3, Void=4, Pending=5
UPDATE [dbo].[SubscriptionInvoices] SET [Status] = CASE [Status]
    WHEN 'Draft'   THEN '0'
    WHEN 'Issued'  THEN '1'
    WHEN 'Paid'    THEN '2'
    WHEN 'Overdue' THEN '3'
    WHEN 'Void'    THEN '4'
    WHEN 'Pending' THEN '5'
    ELSE '5' END
GO
ALTER TABLE [dbo].[SubscriptionInvoices] ALTER COLUMN [Status] tinyint NOT NULL
GO

-- SubscriptionPayments.Status
-- Pending=0, Paid=1, Failed=2, Refunded=3
UPDATE [dbo].[SubscriptionPayments] SET [Status] = CASE [Status]
    WHEN 'Pending'  THEN '0'
    WHEN 'Paid'     THEN '1'
    WHEN 'Failed'   THEN '2'
    WHEN 'Refunded' THEN '3'
    ELSE '0' END
GO
ALTER TABLE [dbo].[SubscriptionPayments] ALTER COLUMN [Status] tinyint NOT NULL
GO

-- SubscriptionPayments.PaymentMethod (nullable)
-- Card=0, GCash=1, Maya=2, BankTransfer=3, Cash=4
UPDATE [dbo].[SubscriptionPayments] SET [PaymentMethod] = CASE [PaymentMethod]
    WHEN 'Card'         THEN '0'
    WHEN 'GCash'        THEN '1'
    WHEN 'Maya'         THEN '2'
    WHEN 'BankTransfer' THEN '3'
    WHEN 'Cash'         THEN '4'
    ELSE NULL END
GO
ALTER TABLE [dbo].[SubscriptionPayments] ALTER COLUMN [PaymentMethod] tinyint NULL
GO

-- SubscriptionPayments.Provider (nullable)
-- PayMongo=0, Manual=1
UPDATE [dbo].[SubscriptionPayments] SET [Provider] = CASE [Provider]
    WHEN 'PayMongo' THEN '0'
    WHEN 'Manual'   THEN '1'
    ELSE NULL END
GO
ALTER TABLE [dbo].[SubscriptionPayments] ALTER COLUMN [Provider] tinyint NULL
GO


-- ============================================================
-- STEP 2: Resize oversized nvarchar columns
-- ============================================================

ALTER TABLE [dbo].[Branches]               ALTER COLUMN [Name]              nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[Branches]               ALTER COLUMN [ImageUrl]          nvarchar(300) NULL
ALTER TABLE [dbo].[Employees]              ALTER COLUMN [ImageUrl]          nvarchar(300) NULL
ALTER TABLE [dbo].[Employees]              ALTER COLUMN [Email]             nvarchar(50)  NULL
ALTER TABLE [dbo].[InventoryCategories]    ALTER COLUMN [Name]              nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[InventoryCategories]    ALTER COLUMN [Description]       nvarchar(100) NULL
ALTER TABLE [dbo].[ItemCategories]         ALTER COLUMN [Name]              nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[ItemCategories]         ALTER COLUMN [Description]       nvarchar(100) NULL
ALTER TABLE [dbo].[Items]                  ALTER COLUMN [Name]              nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[Items]                  ALTER COLUMN [ImageUrl]          nvarchar(300) NULL
ALTER TABLE [dbo].[MenuCategories]         ALTER COLUMN [Name]              nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[MenuItems]              ALTER COLUMN [Name]              nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[MenuItems]              ALTER COLUMN [ImageUrl]          nvarchar(300) NULL
ALTER TABLE [dbo].[MenuItemIngredients]    ALTER COLUMN [UnitOfMeasure]     nvarchar(20)  NULL
ALTER TABLE [dbo].[MenuVariants]           ALTER COLUMN [Name]              nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[Notifications]          ALTER COLUMN [Title]             nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[RegistrationOtps]       ALTER COLUMN [Email]             nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[RegistrationOtps]       ALTER COLUMN [OtpHash]           nvarchar(100) NOT NULL
ALTER TABLE [dbo].[RegistrationVerificationSessions] ALTER COLUMN [Email]   nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[ReturnItems]            ALTER COLUMN [Reason]            nvarchar(100) NULL
ALTER TABLE [dbo].[Shipments]              ALTER COLUMN [TrackingNumber]    nvarchar(30)  NULL
ALTER TABLE [dbo].[SubscriptionInvoices]   ALTER COLUMN [Currency]          nvarchar(5)   NOT NULL
ALTER TABLE [dbo].[SubscriptionInvoices]   ALTER COLUMN [ProviderReference] nvarchar(50)  NULL
ALTER TABLE [dbo].[SubscriptionPayments]   ALTER COLUMN [Currency]          nvarchar(5)   NOT NULL
ALTER TABLE [dbo].[SubscriptionPayments]   ALTER COLUMN [ProviderPaymentId] nvarchar(30)  NULL
ALTER TABLE [dbo].[SubscriptionPlans]      ALTER COLUMN [Name]              nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[SubscriptionPlans]      ALTER COLUMN [Description]       nvarchar(100) NULL
ALTER TABLE [dbo].[Tenants]                ALTER COLUMN [Name]              nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[Tenants]                ALTER COLUMN [LegalName]         nvarchar(50)  NULL
ALTER TABLE [dbo].[Tenants]                ALTER COLUMN [Email]             nvarchar(50)  NULL
ALTER TABLE [dbo].[Tenants]                ALTER COLUMN [SupportEmail]      nvarchar(50)  NULL
ALTER TABLE [dbo].[Tenants]                ALTER COLUMN [Website]           nvarchar(100) NULL
ALTER TABLE [dbo].[Tenants]                ALTER COLUMN [TaxId]             nvarchar(30)  NULL
ALTER TABLE [dbo].[Tenants]                ALTER COLUMN [LogoUrl]           nvarchar(300) NULL
ALTER TABLE [dbo].[Users]                  ALTER COLUMN [Email]             nvarchar(50)  NOT NULL
ALTER TABLE [dbo].[Users]                  ALTER COLUMN [PasswordHash]      nvarchar(60)  NOT NULL
ALTER TABLE [dbo].[Users]                  ALTER COLUMN [ImageUrl]          nvarchar(300) NULL
ALTER TABLE [dbo].[Vehicles]               ALTER COLUMN [Description]       nvarchar(100) NULL
GO


-- ============================================================
-- STEP 3: Reduce datetime2(7) to datetime2(3) across all tables
-- ============================================================

-- AuditLogs
ALTER TABLE [dbo].[AuditLogs] ALTER COLUMN [OccurredAt] datetime2(3) NOT NULL
GO

-- Batches
ALTER TABLE [dbo].[Batches] ALTER COLUMN [ExpiryDate]  datetime2(3) NOT NULL
ALTER TABLE [dbo].[Batches] ALTER COLUMN [CreatedAt]   datetime2(3) NOT NULL
GO

-- Branches
ALTER TABLE [dbo].[Branches] ALTER COLUMN [DeletedAt]  datetime2(3) NULL
ALTER TABLE [dbo].[Branches] ALTER COLUMN [CreatedAt]  datetime2(3) NOT NULL
GO

-- BundleItems
ALTER TABLE [dbo].[BundleItems] ALTER COLUMN [DeletedAt] datetime2(3) NULL
ALTER TABLE [dbo].[BundleItems] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- ConsumptionLogs
ALTER TABLE [dbo].[ConsumptionLogs] ALTER COLUMN [LogDate]   datetime2(3) NOT NULL
ALTER TABLE [dbo].[ConsumptionLogs] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- Employees
ALTER TABLE [dbo].[Employees] ALTER COLUMN [DateHired]  datetime2(3) NULL
ALTER TABLE [dbo].[Employees] ALTER COLUMN [DeletedAt]  datetime2(3) NULL
ALTER TABLE [dbo].[Employees] ALTER COLUMN [CreatedAt]  datetime2(3) NOT NULL
GO

-- InventoryCategories
ALTER TABLE [dbo].[InventoryCategories] ALTER COLUMN [DeletedAt] datetime2(3) NULL
ALTER TABLE [dbo].[InventoryCategories] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- InventoryTransactions
ALTER TABLE [dbo].[InventoryTransactions] ALTER COLUMN [Timestamp] datetime2(3) NOT NULL
GO

-- ItemCategories
ALTER TABLE [dbo].[ItemCategories] ALTER COLUMN [DeletedAt] datetime2(3) NULL
ALTER TABLE [dbo].[ItemCategories] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- Items
ALTER TABLE [dbo].[Items] ALTER COLUMN [DeletedAt]  datetime2(3) NULL
ALTER TABLE [dbo].[Items] ALTER COLUMN [CreatedAt]  datetime2(3) NOT NULL
ALTER TABLE [dbo].[Items] ALTER COLUMN [UpdatedAt]  datetime2(3) NOT NULL
GO

-- MenuCategories
ALTER TABLE [dbo].[MenuCategories] ALTER COLUMN [DeletedAt] datetime2(3) NULL
ALTER TABLE [dbo].[MenuCategories] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- MenuItems
ALTER TABLE [dbo].[MenuItems] ALTER COLUMN [DeletedAt]  datetime2(3) NULL
ALTER TABLE [dbo].[MenuItems] ALTER COLUMN [CreatedAt]  datetime2(3) NOT NULL
ALTER TABLE [dbo].[MenuItems] ALTER COLUMN [UpdatedAt]  datetime2(3) NOT NULL
GO

-- MenuTags
ALTER TABLE [dbo].[MenuTags] ALTER COLUMN [DeletedAt] datetime2(3) NULL
ALTER TABLE [dbo].[MenuTags] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- MenuVariants
ALTER TABLE [dbo].[MenuVariants] ALTER COLUMN [DeletedAt] datetime2(3) NULL
ALTER TABLE [dbo].[MenuVariants] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- Notifications
ALTER TABLE [dbo].[Notifications] ALTER COLUMN [ReadAt]    datetime2(3) NULL
ALTER TABLE [dbo].[Notifications] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- Orders
ALTER TABLE [dbo].[Orders] ALTER COLUMN [PushedToFulfillmentAt] datetime2(3) NOT NULL
ALTER TABLE [dbo].[Orders] ALTER COLUMN [DeletedAt]              datetime2(3) NULL
GO

-- OrderStatusHistories
ALTER TABLE [dbo].[OrderStatusHistories] ALTER COLUMN [Timestamp] datetime2(3) NOT NULL
GO

-- RegistrationOtps
ALTER TABLE [dbo].[RegistrationOtps] ALTER COLUMN [ExpiresAtUtc]    datetime2(3) NOT NULL
ALTER TABLE [dbo].[RegistrationOtps] ALTER COLUMN [CooldownUntilUtc] datetime2(3) NOT NULL
ALTER TABLE [dbo].[RegistrationOtps] ALTER COLUMN [VerifiedAtUtc]   datetime2(3) NULL
ALTER TABLE [dbo].[RegistrationOtps] ALTER COLUMN [CreatedAtUtc]    datetime2(3) NOT NULL
ALTER TABLE [dbo].[RegistrationOtps] ALTER COLUMN [UpdatedAtUtc]    datetime2(3) NOT NULL
GO

-- RegistrationVerificationSessions
ALTER TABLE [dbo].[RegistrationVerificationSessions] ALTER COLUMN [ExpiresAtUtc] datetime2(3) NOT NULL
ALTER TABLE [dbo].[RegistrationVerificationSessions] ALTER COLUMN [UsedAtUtc]    datetime2(3) NULL
ALTER TABLE [dbo].[RegistrationVerificationSessions] ALTER COLUMN [CreatedAtUtc] datetime2(3) NOT NULL
GO

-- Returns
ALTER TABLE [dbo].[Returns] ALTER COLUMN [ResolvedAt] datetime2(3) NULL
ALTER TABLE [dbo].[Returns] ALTER COLUMN [LoggedAt]   datetime2(3) NOT NULL
ALTER TABLE [dbo].[Returns] ALTER COLUMN [DeletedAt]  datetime2(3) NULL
GO

-- Shipments
ALTER TABLE [dbo].[Shipments] ALTER COLUMN [DispatchDate]      datetime2(3) NULL
ALTER TABLE [dbo].[Shipments] ALTER COLUMN [EstimatedArrival]  datetime2(3) NULL
ALTER TABLE [dbo].[Shipments] ALTER COLUMN [DeletedAt]         datetime2(3) NULL
GO

-- SubscriptionInvoices
ALTER TABLE [dbo].[SubscriptionInvoices] ALTER COLUMN [IssuedAt]  datetime2(3) NOT NULL
ALTER TABLE [dbo].[SubscriptionInvoices] ALTER COLUMN [DueAt]     datetime2(3) NULL
ALTER TABLE [dbo].[SubscriptionInvoices] ALTER COLUMN [PaidAt]    datetime2(3) NULL
ALTER TABLE [dbo].[SubscriptionInvoices] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- SubscriptionPayments
ALTER TABLE [dbo].[SubscriptionPayments] ALTER COLUMN [PaidAt]    datetime2(3) NULL
ALTER TABLE [dbo].[SubscriptionPayments] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- SubscriptionPlans
ALTER TABLE [dbo].[SubscriptionPlans] ALTER COLUMN [DeletedAt] datetime2(3) NULL
ALTER TABLE [dbo].[SubscriptionPlans] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

-- SupplyRequests
ALTER TABLE [dbo].[SupplyRequests] ALTER COLUMN [DispatchDate] datetime2(3) NULL
ALTER TABLE [dbo].[SupplyRequests] ALTER COLUMN [CreatedAt]    datetime2(3) NOT NULL
ALTER TABLE [dbo].[SupplyRequests] ALTER COLUMN [UpdatedAt]    datetime2(3) NOT NULL
ALTER TABLE [dbo].[SupplyRequests] ALTER COLUMN [DeletedAt]    datetime2(3) NULL
GO

-- TenantSubscriptions
ALTER TABLE [dbo].[TenantSubscriptions] ALTER COLUMN [StartDate]   datetime2(3) NOT NULL
ALTER TABLE [dbo].[TenantSubscriptions] ALTER COLUMN [PeriodStart] datetime2(3) NOT NULL
ALTER TABLE [dbo].[TenantSubscriptions] ALTER COLUMN [PeriodEnd]   datetime2(3) NOT NULL
ALTER TABLE [dbo].[TenantSubscriptions] ALTER COLUMN [CanceledAt]  datetime2(3) NULL
ALTER TABLE [dbo].[TenantSubscriptions] ALTER COLUMN [DeletedAt]   datetime2(3) NULL
ALTER TABLE [dbo].[TenantSubscriptions] ALTER COLUMN [CreatedAt]   datetime2(3) NOT NULL
ALTER TABLE [dbo].[TenantSubscriptions] ALTER COLUMN [UpdatedAt]   datetime2(3) NOT NULL
GO

-- Tenants
ALTER TABLE [dbo].[Tenants] ALTER COLUMN [SubscriptionPeriodStart] datetime2(3) NULL
ALTER TABLE [dbo].[Tenants] ALTER COLUMN [SubscriptionPeriodEnd]   datetime2(3) NULL
ALTER TABLE [dbo].[Tenants] ALTER COLUMN [DeletedAt]               datetime2(3) NULL
ALTER TABLE [dbo].[Tenants] ALTER COLUMN [CreatedAt]               datetime2(3) NOT NULL
GO

-- Users
ALTER TABLE [dbo].[Users] ALTER COLUMN [DeletedAt]  datetime2(3) NULL
ALTER TABLE [dbo].[Users] ALTER COLUMN [CreatedAt]  datetime2(3) NOT NULL
GO

-- Vehicles
ALTER TABLE [dbo].[Vehicles] ALTER COLUMN [DeletedAt] datetime2(3) NULL
ALTER TABLE [dbo].[Vehicles] ALTER COLUMN [CreatedAt] datetime2(3) NOT NULL
GO

PRINT 'KettanDB optimization complete.'
