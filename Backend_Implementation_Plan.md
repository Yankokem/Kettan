# Kettan: Backend Implementation Plan (Revised)

> Aligned with the finalized system blueprint. Solo developer, ~4 weeks remaining.

---

## 0. Current State — What's Already Built ✅

| Layer | What Exists |
|---|---|
| **Program.cs** | JWT Auth (cookie-based), EF Core + SQL Server, DbInitializer seeder, OpenAPI |
| **Entities** | Tenant, Branch, User, Item, Batch, InventoryTransaction, SupplyRequest, SupplyRequestItem, Order, OrderAllocation, Shipment, Return, ITenantEntity |
| **DbContext** | Global query filters (multi-tenant isolation), cascading delete prevention, unique email index |
| **Services** | `Auth/AuthService` (login, JWT), `Common/CurrentUserService` (tenant/user from token) |
| **Controllers** | AuthController, BranchesController, TenantsController, UsersController |
| **DTOs** | Auth, Branches, Tenants, Users |
| **Seeder** | SuperAdmin + Dummy Tenant + 6 role users seeded with BCrypt |

**Assessment**: Phase 1 and Phase 2 from the old plan are ~80% complete. The foundation is solid. What's missing is the expanded entity set and all the business logic services.

---

## 0.1 Project Architecture & Folder Structure

```
Kettan.Server/
├── Controllers/          ← API endpoints (thin, delegate to services)
│   ├── AuthController.cs            ✅ exists
│   ├── BranchesController.cs        ✅ exists
│   ├── TenantsController.cs         ✅ exists
│   ├── UsersController.cs           ✅ exists
│   ├── ItemsController.cs           ← NEW
│   ├── MenuItemsController.cs       ← NEW
│   ├── OrdersController.cs          ← NEW
│   ├── ReturnsController.cs         ← NEW
│   ├── ConsumptionController.cs     ← NEW
│   ├── EmployeesController.cs       ← NEW
│   ├── CouriersController.cs        ← NEW
│   ├── NotificationsController.cs   ← NEW
│   ├── SettingsController.cs        ← NEW
│   ├── ReportsController.cs         ← NEW
│   └── SubscriptionController.cs    ← NEW (for marketing site)
│
├── Services/             ← Business logic
│   ├── Auth/             ✅ exists (AuthService, IAuthService)
│   ├── Common/           ✅ exists (CurrentUserService)
│   ├── Inventory/        ← NEW (FIFO logic, stock-in, stock-out, threshold checks)
│   ├── Orders/           ← NEW (supply request → order → fulfillment pipeline)
│   ├── Consumption/      ← NEW (recipe deduction, direct entry, physical count)
│   ├── Returns/          ← NEW
│   ├── Notifications/    ← NEW (create alerts, mark read)
│   ├── Analytics/        ← NEW (EOQ, Weighted Scoring)
│   ├── Email/            ← NEW (SendGrid integration)
│   └── Subscription/     ← NEW (PayMongo, tenant onboarding)
│
├── Entities/             ← EF Core domain models
├── DTOs/                 ← Request/Response payloads
├── Data/                 ← DbContext + Seeder
├── Constants/            ← Role strings, enums, defaults
└── Middleware/           ← NEW (e.g., subscription check middleware)
```

---

## 1. New Entities to Add

### 1.1 Lookup Tables (Tenant-Configurable)

```csharp
// Entities/ItemType.cs
public class ItemType : ITenantEntity
{
    public int ItemTypeId { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; }            // "Raw Material", "Consumable"
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Entities/ItemCategory.cs
public class ItemCategory : ITenantEntity
{
    public int ItemCategoryId { get; set; }
    public int TenantId { get; set; }
    public int ItemTypeId { get; set; }          // FK → belongs under a Type
    public string Name { get; set; }             // "Beans", "Syrups"
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### 1.2 Menu & Recipe System

```csharp
// Entities/MenuItem.cs
public class MenuItem : ITenantEntity
{
    public int MenuItemId { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; }             // "Iced Americano (Medium)"
    public string? Category { get; set; }        // "Coffee", "Frappe"
    public decimal SellingPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public ICollection<MenuItemIngredient> Ingredients { get; set; }
}

// Entities/MenuItemIngredient.cs
public class MenuItemIngredient
{
    public int MenuItemIngredientId { get; set; }
    public int MenuItemId { get; set; }
    public int ItemId { get; set; }              // FK → inventory item consumed
    public decimal QuantityPerUnit { get; set; } // e.g., 0.018 kg per drink
    public Item? Item { get; set; }
}
```

### 1.3 Bundles

```csharp
// Entities/BundleItem.cs
public class BundleItem
{
    public int BundleItemId { get; set; }
    public int ParentItemId { get; set; }        // FK → Item where IsBundle=true
    public int ChildItemId { get; set; }         // FK → the actual item inside
    public decimal Quantity { get; set; }
}
```

### 1.4 Employees (Staff Directory)

```csharp
// Entities/Employee.cs
public class Employee : ITenantEntity
{
    public int EmployeeId { get; set; }
    public int TenantId { get; set; }
    public int? BranchId { get; set; }           // null = HQ
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string? Position { get; set; }        // "Barista", "Cashier"
    public string? ContactNumber { get; set; }
    public DateTime? DateHired { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}
```

### 1.5 Couriers & Vehicles

```csharp
// Entities/Courier.cs
public class Courier : ITenantEntity
{
    public int CourierId { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; }
    public string? ContactNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public ICollection<Vehicle> Vehicles { get; set; }
}

// Entities/Vehicle.cs
public class Vehicle : ITenantEntity
{
    public int VehicleId { get; set; }
    public int TenantId { get; set; }
    public int CourierId { get; set; }
    public string PlateNumber { get; set; }
    public string? VehicleType { get; set; }     // "Motorcycle", "Van"
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}
```

### 1.6 Order Tracking

```csharp
// Entities/OrderStatusHistory.cs
public class OrderStatusHistory
{
    public int HistoryId { get; set; }
    public int OrderId { get; set; }
    public string Status { get; set; }
    public int? ChangedBy_UserId { get; set; }
    public string? Remarks { get; set; }
    public DateTime Timestamp { get; set; }
}
```

### 1.7 Return Items

```csharp
// Entities/ReturnItem.cs
public class ReturnItem
{
    public int ReturnItemId { get; set; }
    public int ReturnId { get; set; }
    public int ItemId { get; set; }
    public decimal QuantityReturned { get; set; }
    public string? Reason { get; set; }
}
```

### 1.8 Notifications

```csharp
// Entities/Notification.cs
public class Notification : ITenantEntity
{
    public int NotificationId { get; set; }
    public int TenantId { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public string Type { get; set; }             // "LowStock", "OrderUpdate"
    public string? ReferenceType { get; set; }   // "Order", "Item"
    public int? ReferenceId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; }
}
```

### 1.9 Consumption Logs

```csharp
// Entities/ConsumptionLog.cs
public class ConsumptionLog : ITenantEntity
{
    public int ConsumptionLogId { get; set; }
    public int TenantId { get; set; }
    public int BranchId { get; set; }
    public int LoggedBy_UserId { get; set; }
    public string Method { get; set; }           // "SalesDeduction", "DirectEntry", "PhysicalCount"
    public string? Shift { get; set; }           // "Morning", "Afternoon", "Evening"
    public DateTime LogDate { get; set; }
    public decimal? TotalRevenue { get; set; }   // only for SalesDeduction
    public DateTime CreatedAt { get; set; }
    public ICollection<ConsumptionLogItem> Items { get; set; }
}

// Entities/ConsumptionLogItem.cs
public class ConsumptionLogItem
{
    public int ConsumptionLogItemId { get; set; }
    public int ConsumptionLogId { get; set; }
    public int? MenuItemId { get; set; }         // for SalesDeduction method
    public int? ItemId { get; set; }             // for DirectEntry method
    public int QtySold { get; set; }             // menu items sold (SalesDeduction)
    public decimal QtyDeducted { get; set; }     // actual inventory deducted
    public string? Reason { get; set; }          // for DirectEntry
}
```

### 1.10 Updates to EXISTING Entities

#### `Item.cs` — Add fields:
- `int ItemTypeId` (FK → ItemType)
- `int ItemCategoryId` (FK → ItemCategory)
- `decimal? SellingPrice`
- `bool IsBundle = false`
- `string? ImageUrl`
- `bool IsActive = true`

#### `Branch.cs` — Add fields:
- `string? City`
- `string? ContactNumber`
- `TimeOnly? OpenTime`
- `TimeOnly? CloseTime`
- `int? OwnerUserId` (FK → User)
- `int? ManagerUserId` (FK → User)

#### `Shipment.cs` — Add fields:
- `int? CourierId` (FK → Courier)
- `int? VehicleId` (FK → Vehicle)

#### `Return.cs` — Add fields:
- `string? PhotoUrls` (JSON array of Cloudinary URLs)
- `int? ReviewedBy_UserId` (FK → User)
- `DateTime? ResolvedAt`
- `decimal? CreditAmount`
- `ICollection<ReturnItem> ReturnItems`

#### `Tenant.cs` — Add fields (for subscription):
- `string? Email`
- `string? Phone`
- `string? Address`
- `string? LogoUrl`
- `DateTime? SubscriptionStartDate`
- `DateTime? SubscriptionEndDate`
- `string? PayMongoCustomerId`

#### `OrderAllocation.cs` — Add `TenantId` if missing (for global filter)

#### `SupplyRequestItem.cs` — Add `TenantId` if missing (for global filter)

---

## 2. Services to Build — Business Logic

### 2.1 Inventory Service (`Services/Inventory/`)

| Method | Logic |
|---|---|
| `StockIn(itemId, qty, batchNumber, expiryDate, supplierName)` | Creates Batch (BranchId=null → HQ), creates InventoryTransaction (Restock) |
| `StockOut(itemId, qty, reason)` | FIFO: finds oldest HQ batch, deducts, creates InventoryTransaction (Adjustment) |
| `GetStockLevel(itemId, branchId?)` | Sum of Batch.CurrentQuantity for given item at location |
| `CheckThresholds(branchId)` | Compare stock levels vs thresholds, return items below threshold |
| `DeductFIFO(itemId, branchId, qty)` | Core FIFO deduction engine — iterates batches oldest→newest |
| `TransferToeBranch(batchId, branchId, qty)` | Sets Batch.BranchId, logs InventoryTransaction (Transfer) |

### 2.2 Order Service (`Services/Orders/`)

| Method | Logic |
|---|---|
| `CreateSupplyRequest(branchId, items[])` | Insert SupplyRequest + SupplyRequestItems |
| `ApproveRequest(requestId, approvedQtys[])` | Set status, create Order record |
| `RejectRequest(requestId, reason)` | Set status to Rejected |
| `StartPicking(orderId)` | Set Order.Status = "Picking" |
| `ConfirmPacked(orderId, allocations[])` | Create OrderAllocations (batch-level FIFO), deduct HQ batches, set "Packed" |
| `DispatchOrder(orderId, courierId, vehicleId, eta)` | Create Shipment, set "Dispatched", then auto → "InTransit" |
| `ConfirmDelivery(orderId)` | Set "Delivered", transfer batches to branch (set BranchId on allocated batches) |
| `LogStatusChange(orderId, status, userId, remarks)` | Insert into OrderStatusHistory |

### 2.3 Consumption Service (`Services/Consumption/`)

| Method | Logic |
|---|---|
| `LogSalesDeduction(branchId, menuItemSales[])` | For each sale: fetch recipe → multiply × qty sold → DeductFIFO per ingredient at branch level |
| `LogDirectEntry(branchId, itemId, qty, reason)` | DeductFIFO for specific item at branch |
| `SubmitPhysicalCount(branchId, counts[])` | Compare vs expected, create adjustment transactions for variances |
| `PreviewDeductions(menuItemSales[])` | Read-only: computes what would be deducted without saving (for the frontend preview) |

### 2.4 Returns Service (`Services/Returns/`)

| Method | Logic |
|---|---|
| `FileReturn(orderId, items[], reason, photos[])` | Create Return + ReturnItems, notify HQ |
| `ResolveReturn(returnId, resolution, remarks)` | Set resolution: "Replaced" (auto-create new order) / "Credited" (calc credit amount) / "Rejected" |

### 2.5 Notification Service (`Services/Notifications/`)

| Method | Logic |
|---|---|
| `CreateNotification(userId, title, message, type, refType?, refId?)` | Insert row in Notifications |
| `GetUnread(userId)` | Query unread notifications for user |
| `MarkAsRead(notificationId)` | Set IsRead = true |
| `MarkAllRead(userId)` | Bulk update |

### 2.6 Analytics Service (`Services/Analytics/`)

| Method | Logic |
|---|---|
| `CalculateEOQ(itemId)` | `√(2DS/H)` — D from avg monthly consumption logs, S = ordering cost estimate, H = holding % |
| `CalculateBranchScores(tenantId, dateRange)` | Weighted scoring across: fulfillment rate, return rate, delivery speed, stock accuracy |
| `GetInventoryValuation(tenantId, branchId?)` | Σ(UnitCost × CurrentQty) per batch, grouped by location |
| `GetFulfillmentCost(tenantId, dateRange, branchId?)` | Σ(UnitCost × Qty) for all delivered orders |

### 2.7 Email Service (`Services/Email/`)

| Method | Logic |
|---|---|
| `SendWelcomeEmail(email, tenantName, loginUrl)` | Sends onboarding email with credentials link |
| `SendLowStockAlert(email, items[])` | Email alert for critical stock levels |
| `SendOrderStatusUpdate(email, orderId, status)` | Status change email |
| `SendPasswordReset(email, resetToken)` | Forgot password flow |

**Technology**: SendGrid API. For Tier 1, you can stub this with console logging and implement real email later. The interface stays the same.

### 2.8 Subscription Service (`Services/Subscription/`)

| Method | Logic |
|---|---|
| `CreateCheckoutSession(plan, email)` | Calls PayMongo API → creates checkout link |
| `HandleWebhook(payload)` | PayMongo webhook → on payment success: create Tenant + TenantAdmin user |
| `GetSubscriptionStatus(tenantId)` | Returns current plan, start/end dates, active status |
| `CancelSubscription(tenantId)` | Sets Tenant.IsActive = false, Tenant.SubscriptionEndDate |

---

## 3. Controller Endpoints (Key APIs)

### Items / Inventory
```
GET    /api/items                     — List items (filterable by type, category)
POST   /api/items                     — Create item
GET    /api/items/{id}                — Get item detail + batches
PUT    /api/items/{id}                — Update item
POST   /api/items/{id}/stock-in       — Receive stock (create batch)
POST   /api/items/{id}/stock-out      — Adjust stock (FIFO deduction)
GET    /api/items/{id}/batches        — List batches for item
GET    /api/items/{id}/transactions   — Transaction ledger for item
```

### Menu Items
```
GET    /api/menu-items                — List menu items
POST   /api/menu-items                — Create with recipe
GET    /api/menu-items/{id}           — Detail with ingredients
PUT    /api/menu-items/{id}           — Update
DELETE /api/menu-items/{id}           — Soft delete (IsActive=false)
```

### Orders (Supply Request → Fulfillment Pipeline)
```
POST   /api/supply-requests           — Branch creates request
GET    /api/supply-requests           — List (branch-filtered)
PUT    /api/supply-requests/{id}/approve  — HQ approves
PUT    /api/supply-requests/{id}/reject   — HQ rejects
GET    /api/orders                    — List orders
GET    /api/orders/{id}               — Order detail + allocations
PUT    /api/orders/{id}/pick          — Start picking
PUT    /api/orders/{id}/pack          — Confirm packed
PUT    /api/orders/{id}/dispatch      — Dispatch (courier + vehicle)
PUT    /api/orders/{id}/deliver       — Branch confirms
GET    /api/orders/{id}/tracking      — Status timeline
```

### Consumption
```
POST   /api/consumption/sales         — Log sales deduction
POST   /api/consumption/direct        — Log direct entry
POST   /api/consumption/physical-count — Submit physical count
POST   /api/consumption/preview       — Preview deductions (read-only)
GET    /api/consumption/history       — Past logs
```

### Returns
```
POST   /api/returns                   — File return
GET    /api/returns                   — List returns
GET    /api/returns/{id}              — Return detail
PUT    /api/returns/{id}/resolve      — Resolve (replace/credit/reject)
```

### Notifications
```
GET    /api/notifications             — Get user's notifications
PUT    /api/notifications/{id}/read   — Mark as read
PUT    /api/notifications/read-all    — Mark all read
```

### Settings / Config
```
GET    /api/item-types                — List types
POST   /api/item-types                — Create type
GET    /api/item-categories           — List categories
POST   /api/item-categories           — Create category
GET    /api/couriers                  — List couriers
POST   /api/couriers                  — Create courier
GET    /api/couriers/{id}/vehicles    — List vehicles for courier
POST   /api/vehicles                  — Create vehicle
```

### Subscription (Public — used by marketing site)
```
POST   /api/subscription/register     — Register new tenant (public)
POST   /api/subscription/checkout     — Create PayMongo checkout
POST   /api/subscription/webhook      — PayMongo webhook callback
GET    /api/subscription/status       — Current tenant's subscription
```

---

## 4. Execution Phases (Revised)

### Phase 1 — Foundation Completion (Week 1)
> Most of this is already done. Finish the gaps.

- [x] EF Core + SQL Server ✅
- [x] Multi-tenant global query filters ✅
- [x] JWT Authentication ✅
- [x] CurrentUserService ✅
- [x] Auth endpoints ✅
- [x] User/Branch/Tenant CRUD ✅
- [ ] Add ALL new entities to `Entities/` folder
- [ ] Add DbSet entries to `ApplicationDbContext.cs`
- [ ] Add global query filters for all new ITenantEntity entities
- [ ] Update existing entities (Item, Branch, Shipment, Return, Tenant) with new fields
- [ ] Run `dotnet ef migrations add FullEntityExpansion`
- [ ] Expand `DbInitializer.cs` to seed: ItemTypes, ItemCategories, MenuItem + recipe, sample Courier + Vehicle

### Phase 2 — Inventory & Menu Core (Week 2)

- [ ] `InventoryService` — FIFO deduction engine (most critical algorithm)
- [ ] `ItemsController` — full CRUD + stock-in/stock-out
- [ ] `MenuItemsController` — CRUD with nested recipe ingredient management
- [ ] `ConsumptionService` — Sales deduction (recipe→FIFO), direct entry
- [ ] `ConsumptionController` — log + preview + history
- [ ] `SettingsController` — Item Types, Item Categories, Couriers, Vehicles CRUD
- [ ] `EmployeesController` — Staff directory CRUD
- [ ] `NotificationService` — basic create + read + mark-read

### Phase 3 — Order Pipeline & Tracking (Week 3)

- [ ] `OrderService` — full lifecycle: request → approve → pick → pack → dispatch → deliver
- [ ] `OrdersController` + `SupplyRequestsController`
- [ ] `OrderStatusHistory` — log every status change with timestamp
- [ ] `ReturnsService` + `ReturnsController`
- [ ] Dispatch integration: select courier + vehicle → create shipment
- [ ] Batch transfer on delivery confirmation (HQ → branch)
- [ ] Auto-draft supply requests on low-stock threshold breach

### Phase 4 — Analytics, Email & Subscription (Week 4)

- [ ] `AnalyticsService` — EOQ calculation + Weighted Branch Performance Scoring
- [ ] `ReportsController` — fulfillment cost, inventory valuation, branch scores
- [ ] `EmailService` — SendGrid integration (or stub with console logging)
- [ ] `SubscriptionService` — PayMongo checkout + webhook + tenant creation
- [ ] `SubscriptionController` — public endpoints for marketing site
- [ ] Subscription check middleware (block access if tenant subscription expired)
- [ ] Final seeder polish: demo-ready dataset

### Phase 5 — Polish & Super Admin (If Time Permits)

- [ ] Super Admin: tenants list, platform analytics, billing overview
- [ ] Audit log middleware (log all significant actions)
- [ ] Help & Support: static FAQ content, bug report CRUD
- [ ] Export endpoints (PDF/CSV generation)

---

## 5. Third-Party API Integration Summary

| API | Purpose | Priority | Notes |
|---|---|---|---|
| **SendGrid** | Email notifications | Tier 1 (stub OK) | Welcome email, low-stock alerts, password reset |
| **PayMongo** | Subscription payments | Tier 1 (stub OK) | Checkout session creation, webhook for payment confirmation |
| **Cloudinary** | Image uploads | Tier 1 | Item images, return evidence photos, company logo |
| ~~Google Maps~~ | ~~Delivery distance~~ | ❌ REMOVED | Replaced by status-based tracking |
| ~~EasyPost~~ | ~~Courier tracking~~ | ❌ REMOVED | Replaced by registered courier entities |

---

## 6. Middleware & Infrastructure

| Middleware | Purpose |
|---|---|
| **SubscriptionCheckMiddleware** | On every authenticated request, verify tenant subscription is active. If expired, return 403 with message. Exclude Super Admin and public endpoints. |
| **AuditLogMiddleware** (Tier 2) | Log: who, what, when, which entity for significant actions (create, update, delete). Write to AuditLog table. |

---

*Last updated: April 6, 2026 — Post system blueprint finalization*