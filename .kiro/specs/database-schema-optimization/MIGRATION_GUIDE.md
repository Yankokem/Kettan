# Database Schema Optimization Migration Guide

## Overview

This migration converts 25+ string columns to tinyint enum types, resizes nvarchar columns, and reduces datetime precision from datetime2(7) to datetime2(3).

## ✅ Completed Steps

### 1. Created Enum Types (24 enums)
All enum files created in `Kettan.Server/Enums/`:
- `UserRole.cs` - SuperAdmin=0, TenantAdmin=1, HqManager=2, HqStaff=3, BranchOwner=4, BranchManager=5
- `MenuItemStatus.cs` - Active=0, Inactive=1, Archived=2
- `PricingMode.cs` - Fixed=0, Addon=1
- `VehicleType.cs` - Motorcycle=0, Van=1, Truck=2, Car=3
- `ConsumptionMethod.cs` - Sales=0, Spoilage=1, Manual=2, Adjustment=3
- `Shift.cs` - Morning=0, Midday=1, Afternoon=2, Evening=3, Night=4
- `OrderStatus.cs` - Pending=0, Allocated=1, Packed=2, Dispatched=3, InTransit=4, Delivered=5, Cancelled=6, Returned=7
- `SupplyRequestStatus.cs` - Pending=0, Approved=1, Rejected=2, Cancelled=3, Fulfilled=4
- `RequestType.cs` - Regular=0, Emergency=1, Scheduled=2
- `Priority.cs` - Low=0, Normal=1, High=2, Critical=3
- `DispatchWindow.cs` - Morning=0, Afternoon=1, Evening=2, Anytime=3
- `ReturnResolution.cs` - Pending=0, Replaced=1, Credited=2, Rejected=3, Returned=4
- `TransactionType.cs` - StockIn=0, StockOut=1, Adjustment=2, Spoilage=3, Transfer=4, Return=5
- `ReferenceType.cs` - Order=0, SupplyRequest=1, ConsumptionLog=2, Manual=3, Return=4
- `NotificationType.cs` - Info=0, Warning=1, Alert=2, Success=3
- `NotificationReferenceType.cs` - Order=0, SupplyRequest=1, Shipment=2, Return=3, Invoice=4
- `SubscriptionStatus.cs` - Active=0, Trialing=1, PastDue=2, Cancelled=3, Expired=4, Suspended=5, PendingPayment=6
- `BillingCycle.cs` - Monthly=0, Yearly=1
- `SubscriptionTier.cs` - Free=0, Starter=1, Growth=2, Enterprise=3
- `InvoiceStatus.cs` - Draft=0, Issued=1, Paid=2, Overdue=3, Void=4, Pending=5
- `PaymentStatus.cs` - Pending=0, Paid=1, Failed=2, Refunded=3
- `PaymentMethod.cs` - Card=0, GCash=1, Maya=2, BankTransfer=3, Cash=4
- `PaymentProvider.cs` - PayMongo=0, Manual=1

### 2. Updated Entity Classes
Updated 15+ entity classes with enum properties and column size constraints:
- `User.cs` - Role → UserRole enum, Email/PasswordHash/ImageUrl size constraints
- `MenuItem.cs` - Status → MenuItemStatus enum, Name/ImageUrl size constraints
- `MenuVariant.cs` - PricingMode → PricingMode enum, Name size constraint
- `Vehicle.cs` - VehicleType → VehicleType enum, Description size constraint
- `ConsumptionLog.cs` - Method → ConsumptionMethod enum, Shift → Shift? enum
- `Order.cs` - Status → OrderStatus enum
- `OrderStatusHistory.cs` - Status → OrderStatus enum
- `SupplyRequest.cs` - Status/RequestType/Priority/DispatchWindow → enums
- `Return.cs` - Resolution → ReturnResolution enum, Reason size constraint
- `InventoryTransaction.cs` - TransactionType/ReferenceType → enums
- `Notification.cs` - Type/ReferenceType → enums, Title size constraint
- `TenantSubscription.cs` - Status/BillingCycle → enums
- `Tenant.cs` - SubscriptionStatus/SubscriptionTier → enums, multiple size constraints
- `SubscriptionInvoice.cs` - Status → InvoiceStatus enum, Currency/ProviderReference size constraints
- `SubscriptionPayment.cs` - Status/PaymentMethod/Provider → enums, Currency/ProviderPaymentId size constraints
- `Branch.cs`, `Employee.cs`, `Item.cs`, `MenuCategory.cs`, `InventoryCategory.cs`, `ItemCategory.cs`, `SubscriptionPlan.cs`, `RegistrationOtp.cs`, `RegistrationVerificationSession.cs`, `Shipment.cs`, `ReturnItem.cs`, `MenuItemIngredient.cs` - Various size constraints

### 3. Updated ApplicationDbContext.cs
- Added `using Kettan.Server.Enums;`
- Added Fluent API configurations for all enum-to-tinyint conversions (25+ properties)
- Added automatic datetime2(3) precision configuration for all DateTime properties

## ⚠️ Remaining Work - Code Updates Required

The build currently fails with 164 errors because existing code uses string literals instead of enum values. Here's what needs to be updated:

### Files Requiring Updates (by category):

#### Controllers (8 files)
1. **AdminController.cs** - 14 errors
   - Compare enums using enum values, not strings
   - Example: `tenant.SubscriptionStatus == SubscriptionStatus.Active` not `== "Active"`

2. **UsersController.cs** - 5 errors
   - Convert string assignments to enum values
   - Example: `Role = UserRole.TenantAdmin` not `"TenantAdmin"`

3. **TenantsController.cs** - 3 errors
   - Convert SubscriptionTier and SubscriptionStatus assignments

4. **VehiclesController.cs** - 3 errors
   - Convert VehicleType string assignments to enum

5. **MenuItemsController.cs** - 6 errors
   - Convert MenuItemStatus and PricingMode assignments

6. **ItemsController.cs** - 2 errors
   - Convert TransactionType and ReferenceType assignments

7. **AuditLogsController.cs** - 1 error
   - Fix conditional expression with UserRole

#### Services (10 files)
1. **SubscriptionService.cs** - 24 errors
   - Convert all subscription-related string assignments to enums
   - Update comparisons to use enum values

2. **SupplyRequestService.cs** - 28 errors
   - Convert SupplyRequestStatus, RequestType, Priority, DispatchWindow
   - Update all string comparisons to enum comparisons

3. **InventoryService.cs** - 6 errors
   - Convert TransactionType and ReferenceType assignments

4. **ReturnService.cs** - 11 errors
   - Convert ReturnResolution assignments and comparisons

5. **OrderWorkflowService.cs** - 28 errors
   - Convert OrderStatus assignments and comparisons

6. **ConsumptionService.cs** - 12 errors
   - Convert ConsumptionMethod and Shift assignments

7. **NotificationService.cs** - 4 errors
   - Convert NotificationType and NotificationReferenceType

8. **AnalyticsService.cs** - 4 errors
   - Update enum comparisons

9. **AuthService.cs** - 2 errors
   - Fix method call with UserRole parameter

#### Data Seeders (4 files)
1. **UserAccountSeeder.cs** - 2 errors
   - Convert Role assignments to UserRole enum

2. **SubscriptionTenantSeeder.cs** - 7 errors
   - Convert SubscriptionTier, SubscriptionStatus, BillingCycle

3. **LogisticsSeeder.cs** - 2 errors
   - Convert VehicleType assignments

4. **MenuSeeder.cs** - 3 errors
   - Convert MenuItemStatus and PricingMode assignments

#### Middleware (1 file)
1. **SubscriptionCheckMiddleware.cs** - 2 errors
   - Update SubscriptionStatus comparisons

## 🔧 Code Update Patterns

### Pattern 1: String Assignment → Enum Assignment
```csharp
// BEFORE
user.Role = "TenantAdmin";
vehicle.VehicleType = "Van";
order.Status = "Pending";

// AFTER
user.Role = UserRole.TenantAdmin;
vehicle.VehicleType = VehicleType.Van;
order.Status = OrderStatus.Pending;
```

### Pattern 2: String Comparison → Enum Comparison
```csharp
// BEFORE
if (tenant.SubscriptionStatus == "Active")
if (order.Status != "Cancelled")

// AFTER
if (tenant.SubscriptionStatus == SubscriptionStatus.Active)
if (order.Status != OrderStatus.Cancelled)
```

### Pattern 3: String Default Values → Enum Default Values
```csharp
// BEFORE
Status = "Draft",
Priority = "normal",

// AFTER
Status = SupplyRequestStatus.Pending,
Priority = Priority.Normal,
```

### Pattern 4: Nullable Enum Handling
```csharp
// BEFORE
consumptionLog.Shift = "Morning";
consumptionLog.Shift = null;

// AFTER
consumptionLog.Shift = Shift.Morning;
consumptionLog.Shift = null; // Still valid for nullable enums
```

### Pattern 5: Enum to String Conversion (for DTOs/APIs)
```csharp
// When you need string representation
var statusString = order.Status.ToString(); // "Pending"
var statusValue = (byte)order.Status; // 0

// Parsing from string
if (Enum.TryParse<OrderStatus>(statusString, out var status))
{
    order.Status = status;
}
```

## 📋 Next Steps

1. **Update all Controllers** - Replace string literals with enum values
2. **Update all Services** - Replace string assignments and comparisons
3. **Update all Seeders** - Use enum values in seed data
4. **Update Middleware** - Fix enum comparisons
5. **Run build** - Verify all 164 errors are resolved
6. **Create EF Core Migration** - Generate migration from updated entities
7. **Test Migration** - Test on development database
8. **Run SQL Migration** - Apply KettanDB_Optimize.sql to production

## ⚠️ Important Notes

### Backward Compatibility
- The SQL migration converts existing string data to integer values
- EF Core will automatically serialize enums as integers
- API responses will need to handle enum serialization (configure JSON options if needed)

### Default Values
Some default values changed to match enum semantics:
- `SupplyRequest.Status`: "Draft" → `SupplyRequestStatus.Pending`
- `Order.Status`: "Processing" → `OrderStatus.Pending`
- `SubscriptionInvoice.Status`: "Open" → `InvoiceStatus.Pending`
- `MenuVariant.PricingMode`: "absolute" → `PricingMode.Fixed`

### Testing Checklist
- [ ] All controllers compile
- [ ] All services compile
- [ ] All seeders compile
- [ ] EF Core migration generates successfully
- [ ] Migration applies to test database
- [ ] Existing data converts correctly
- [ ] API endpoints return correct enum values
- [ ] Frontend handles enum values (may need updates)

## 🎯 Impact Assessment

### Database Size Reduction
- **tinyint**: 1 byte vs nvarchar (2+ bytes per character)
- **datetime2(3)**: 7 bytes vs datetime2(7) (8 bytes)
- **nvarchar size constraints**: Reduced from MAX/255 to 50/100/300

### Performance Improvements
- Smaller indexes on enum columns
- Better cache utilization
- Faster query execution on status/type filters

### Breaking Changes
- **None for database** - SQL migration handles data conversion
- **Potential for API** - If clients expect string values, configure JSON serialization
- **Minimal runtime impact** - Enums serialize to same integer values

## 📝 SQL Migration Mapping

The SQL migration (`KettanDB_Optimize.sql`) maps string values to integers:

| Entity | Property | String → Integer Mapping |
|--------|----------|-------------------------|
| Users | Role | SuperAdmin→0, TenantAdmin→1, HqManager→2, HqStaff→3, BranchOwner→4, BranchManager→5 |
| MenuItems | Status | Active→0, Inactive→1, Archived→2 |
| MenuVariants | PricingMode | absolute/Fixed→0, addon/Addon→1 |
| Vehicles | VehicleType | Motorcycle→0, Van→1, Truck→2, Car→3 |
| ConsumptionLogs | Method | Sales→0, Spoilage→1, Manual→2, Adjustment→3 |
| ConsumptionLogs | Shift | Morning→0, Midday→1, Afternoon→2, Evening→3, Night→4 |
| Orders | Status | Pending→0, Allocated→1, Packed→2, Dispatched→3, InTransit→4, Delivered→5, Cancelled→6, Returned→7 |
| SupplyRequests | Status | Pending→0, Approved→1, Rejected→2, Cancelled→3, Fulfilled→4 |
| SupplyRequests | RequestType | Regular→0, Emergency→1, Scheduled→2 |
| SupplyRequests | Priority | Low→0, Normal→1, High→2, Critical→3 |
| SupplyRequests | DispatchWindow | Morning→0, Afternoon→1, Evening→2, Anytime→3 |
| Returns | Resolution | Pending→0, Replaced→1, Credited→2, Rejected→3, Returned→4 |
| InventoryTransactions | TransactionType | StockIn/Restock→0, StockOut→1, Adjustment→2, Spoilage→3, Transfer→4, Return→5 |
| InventoryTransactions | ReferenceType | Order→0, SupplyRequest→1, ConsumptionLog→2, Manual/StockIn→3, Return→4 |
| Notifications | Type | Info→0, Warning→1, Alert→2, Success→3 |
| Notifications | ReferenceType | Order→0, SupplyRequest→1, Shipment→2, Return→3, Invoice→4 |
| TenantSubscriptions | Status | Active→0, Trialing→1, PastDue→2, Cancelled→3, Expired→4, Suspended→5, PendingPayment→6 |
| TenantSubscriptions | BillingCycle | Monthly→0, Yearly→1 |
| Tenants | SubscriptionStatus | (same as TenantSubscriptions.Status) |
| Tenants | SubscriptionTier | Free→0, Starter→1, Growth→2, Enterprise→3 |
| SubscriptionInvoices | Status | Draft→0, Issued→1, Paid→2, Overdue→3, Void→4, Pending→5 |
| SubscriptionPayments | Status | Pending→0, Paid→1, Failed→2, Refunded→3 |
| SubscriptionPayments | PaymentMethod | Card→0, GCash→1, Maya→2, BankTransfer→3, Cash→4 |
| SubscriptionPayments | Provider | PayMongo→0, Manual→1 |

## 🚀 Deployment Strategy

1. **Backup database** - Critical step before any migration
2. **Apply code changes** - Deploy updated application code
3. **Run SQL migration** - Execute KettanDB_Optimize.sql
4. **Verify data** - Check that all conversions are correct
5. **Monitor performance** - Measure query performance improvements
6. **Rollback plan** - Keep backup and reverse migration script ready

## ✅ Success Criteria

- [ ] All 164 compilation errors resolved
- [ ] EF Core migration generated successfully
- [ ] SQL migration executes without errors
- [ ] All existing data converts correctly
- [ ] No data loss during migration
- [ ] Application runs without runtime errors
- [ ] API responses maintain compatibility
- [ ] Performance improvements measurable
