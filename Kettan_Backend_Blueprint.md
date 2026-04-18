# Kettan — Backend Blueprint

> Merged from: Backend Implementation Plan + Backend Integration Guide.
> Aligned with finalized system blueprint. Solo developer, ~4 weeks remaining.

> **Last updated**: April 18, 2026

---

## Table of Contents

1. [Current State — What's Built](#1-current-state)
2. [Project Architecture](#2-project-architecture)
3. [New Entities to Add](#3-new-entities)
4. [Updates to Existing Entities](#4-entity-updates)
5. [Services — Business Logic](#5-services)
6. [Controller Endpoints](#6-endpoints)
7. [Frontend Integration Guide](#7-frontend-integration)
8. [Third-Party APIs](#8-third-party)
9. [Middleware & Infrastructure](#9-middleware)
10. [Execution Phases](#10-execution-phases)

---

## 1. Current State — What's Built ✅ {#1-current-state}

| Layer | What Exists |
|---|---|
| **Program.cs** | JWT Auth (cookie-based), EF Core + SQL Server, DbInitializer seeder, OpenAPI |
| **Entities** | Tenant, Branch, User, Item, Batch, InventoryTransaction, SupplyRequest, SupplyRequestItem, Order, OrderAllocation, Shipment, Return, ITenantEntity |
| **DbContext** | Global query filters (multi-tenant isolation), cascading delete prevention, unique email index |
| **Services** | `Auth/AuthService` (login, JWT), `Common/CurrentUserService` (tenant/user from token) |
| **Controllers** | AuthController, BranchesController, TenantsController, UsersController |
| **DTOs** | Auth, Branches, Tenants, Users |
| **Seeder** | SuperAdmin + Dummy Tenant + 6 role users seeded with BCrypt |

**Assessment**: Foundation is ~80% complete. What's missing is the expanded entity set and all business logic services.

---

## 2. Project Architecture {#2-project-architecture}

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
│   ├── Consumption/      ← NEW (recipe deduction, direct entry)
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

## 3. New Entities to Add {#3-new-entities}

### 3.1 Lookup Tables (Tenant-Configurable)

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

### 3.2 Menu & Recipe System

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

### 3.3 Bundles

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

### 3.4 Employees (Staff Directory)

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

### 3.5 Couriers & Vehicles

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

### 3.6 Order Tracking

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

### 3.7 Return Items

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

### 3.8 Notifications

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

### 3.9 Consumption Logs

```csharp
// Entities/ConsumptionLog.cs
public class ConsumptionLog : ITenantEntity
{
    public int ConsumptionLogId { get; set; }
    public int TenantId { get; set; }
    public int BranchId { get; set; }
    public int LoggedBy_UserId { get; set; }
    public string Method { get; set; }           // "SalesDeduction", "DirectEntry"
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

---

## 4. Updates to Existing Entities {#4-entity-updates}

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

---

## 5. Services — Business Logic {#5-services}

### 5.1 Inventory Service

| Method | Logic |
|---|---|
| `StockIn(itemId, qty, batchNumber, expiryDate, supplierName)` | Creates Batch (BranchId=null → HQ), creates InventoryTransaction (Restock) |
| `StockOut(itemId, qty, reason)` | FIFO: finds oldest HQ batch, deducts, creates InventoryTransaction (Adjustment) |
| `GetStockLevel(itemId, branchId?)` | Sum of Batch.CurrentQuantity for given item at location |
| `CheckThresholds(branchId)` | Compare stock levels vs thresholds, return items below threshold |
| `DeductFIFO(itemId, branchId, qty)` | Core FIFO deduction engine — iterates batches oldest→newest |
| `TransferToBranch(batchId, branchId, qty)` | Sets Batch.BranchId, logs InventoryTransaction (Transfer) |

### 5.2 Order Service

| Method | Logic |
|---|---|
| `CreateSupplyRequest(branchId, items[])` | Insert SupplyRequest + SupplyRequestItems |
| `ApproveRequest(requestId, approvedQtys[])` | Set status, create Order record |
| `RejectRequest(requestId, reason)` | Set status to Rejected |
| `StartPicking(orderId)` | Set Order.Status = "Picking" |
| `ConfirmPacked(orderId, allocations[])` | Create OrderAllocations (batch-level FIFO), deduct HQ batches, set "Packed" |
| `DispatchOrder(orderId, courierId, vehicleId, eta)` | Create Shipment, set "Dispatched", then auto → "InTransit" |
| `ConfirmDelivery(orderId)` | Set "Delivered", transfer batches to branch |
| `LogStatusChange(orderId, status, userId, remarks)` | Insert into OrderStatusHistory |

### 5.3 Consumption Service

| Method | Logic |
|---|---|
| `LogSalesDeduction(branchId, menuItemSales[])` | For each sale: fetch recipe → multiply × qty sold → DeductFIFO per ingredient at branch |
| `LogDirectEntry(branchId, itemId, qty, reason)` | DeductFIFO for specific item at branch |
| `PreviewDeductions(menuItemSales[])` | Read-only: computes what would be deducted without saving |

### 5.4 Returns Service

| Method | Logic |
|---|---|
| `FileReturn(orderId, items[], reason, photos[])` | Create Return + ReturnItems, notify HQ |
| `ResolveReturn(returnId, resolution, remarks)` | "Replaced" (auto-create new order) / "Credited" (calc credit) / "Rejected" |

### 5.5 Notification Service

| Method | Logic |
|---|---|
| `CreateNotification(userId, title, message, type, refType?, refId?)` | Insert row |
| `GetUnread(userId)` | Query unread for user |
| `MarkAsRead(notificationId)` | Set IsRead = true |
| `MarkAllRead(userId)` | Bulk update |

### 5.6 Analytics Service

| Method | Logic |
|---|---|
| `CalculateEOQ(itemId)` | `√(2DS/H)` — D from avg monthly consumption logs |
| `CalculateBranchScores(tenantId, dateRange)` | Weighted scoring: fulfillment rate, return rate, delivery speed, stock accuracy |
| `GetInventoryValuation(tenantId, branchId?)` | Σ(UnitCost × CurrentQty) per batch |
| `GetFulfillmentCost(tenantId, dateRange, branchId?)` | Σ(UnitCost × Qty) for delivered orders |

### 5.7 Email Service

| Method | Logic |
|---|---|
| `SendWelcomeEmail(email, tenantName, loginUrl)` | Welcome email with credentials |
| `SendLowStockAlert(email, items[])` | Alert for critical stock levels |
| `SendOrderStatusUpdate(email, orderId, status)` | Status change email |
| `SendPasswordReset(email, resetToken)` | Forgot password flow |

> For Tier 1: Implement `ConsoleEmailService` that logs to console. Swap to SendGrid later.

### 5.8 Subscription Service

| Method | Logic |
|---|---|
| `CreateCheckoutSession(plan, email)` | PayMongo API → checkout link |
| `HandleWebhook(payload)` | On payment success: create Tenant + TenantAdmin |
| `GetSubscriptionStatus(tenantId)` | Current plan, dates, active status |
| `CancelSubscription(tenantId)` | Sets tenant inactive |

---

## 6. Controller Endpoints {#6-endpoints}

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

### Supply Requests (Branch Side)
```
POST   /api/supply-requests           — Branch creates request
GET    /api/supply-requests           — List (branch-filtered)
GET    /api/supply-requests/{id}      — Detail with items and linked order
PUT    /api/supply-requests/{id}      — Edit draft
```

### Orders (HQ Side)
```
GET    /api/orders                    — List orders
GET    /api/orders/{id}               — Order detail + allocations
PUT    /api/supply-requests/{id}/approve  — HQ approves
PUT    /api/supply-requests/{id}/reject   — HQ rejects
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

### Employees
```
GET    /api/employees                 — List employees
GET    /api/employees/{id}            — Employee detail
POST   /api/employees                 — Create employee
PUT    /api/employees/{id}            — Update employee
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

### Subscription (Public — marketing site)
```
POST   /api/subscription/register     — Register new tenant (public)
POST   /api/subscription/checkout     — Create PayMongo checkout
POST   /api/subscription/webhook      — PayMongo webhook callback
GET    /api/subscription/status       — Current tenant's subscription
```

---

## 7. Frontend Integration Guide {#7-frontend-integration}

### Current State
The frontend uses **local mock data files** for all features:
- `features/hq-inventory/mockData.ts` — Inventory items, batches, transactions
- `features/branches/mockData.ts` — Branch data
- `features/orders/` — inline mock data in components
- `features/staff/` — inline mock data
- `features/branch-operations/api.ts` — API calls (Supply Requests, Consumption)

### Step 1: Create API Service Layer

```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    ...options,
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}
```

### Step 2: Use React Query Hooks

```typescript
// src/hooks/useInventory.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useInventoryItems() {
  return useQuery({ queryKey: ['inventory-items'], queryFn: inventoryApi.getItems });
}
```

### Step 3: Replace Mock Data in Components

**Before**: `import { MOCK_ITEMS } from './mockData'`
**After**: `const { data: items } = useInventoryItems()`

### Files to Update Per Feature

| Feature | Files | Changes |
|---|---|---|
| Inventory | `InventoryPage`, `InventoryItemProfilePage`, `InventoryTransactionPage` | Replace `MOCK_*` imports with hooks |
| Menu | `MenuItemsPage`, `MenuItemProfilePage`, `AddMenuItemPage` | Replace inline mocks with hooks |
| Staff | `StaffPage`, `StaffProfilePage` | Replace inline mocks with hooks |
| Branches | `BranchesPage`, `BranchProfilePage` | Replace inline mocks with hooks |
| Orders | `OrdersPage`, `OrderDetailPage` | Replace `MOCK_ORDERS` with hooks |

### Mock/API Toggle

```typescript
// src/config.ts
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
```

### Environment Variables

```env
# .env (development)
VITE_API_URL=https://localhost:5001/api
VITE_USE_MOCK_DATA=true

# .env.production
VITE_API_URL=https://your-api-domain.com/api
VITE_USE_MOCK_DATA=false
```

---

## 8. Third-Party APIs {#8-third-party}

| API | Purpose | Priority | Notes |
|---|---|---|---|
| **SendGrid** | Email notifications | Tier 1 (stub OK) | Welcome email, low-stock alerts, password reset |
| **PayMongo** | Subscription payments | Tier 1 (stub OK) | Checkout session creation, webhook for payment confirmation |
| **Cloudinary** | Image uploads | Tier 1 | Item images, return evidence photos, company logo |
| ~~Google Maps~~ | ~~Delivery distance~~ | ❌ REMOVED | Replaced by status-based tracking |
| ~~EasyPost~~ | ~~Courier tracking~~ | ❌ REMOVED | Replaced by registered courier entities |

---

## 9. Middleware & Infrastructure {#9-middleware}

| Middleware | Purpose |
|---|---|
| **SubscriptionCheckMiddleware** | On every authenticated request, verify tenant subscription is active. If expired, return 403. Exclude Super Admin and public endpoints. |
| **AuditLogMiddleware** (Tier 2) | Log: who, what, when, which entity for significant actions. |

---

## 10. Execution Phases {#10-execution-phases}

### Phase 1 — Foundation Completion (Week 1)
- [x] EF Core + SQL Server ✅
- [x] Multi-tenant global query filters ✅
- [x] JWT Authentication ✅
- [x] CurrentUserService ✅
- [x] Auth endpoints ✅
- [x] User/Branch/Tenant CRUD ✅
- [ ] Add ALL new entities
- [ ] Update existing entities with new fields
- [ ] Run migration
- [ ] Expand seeder with sample data

### Phase 2 — Inventory & Menu Core (Week 2)
- [ ] InventoryService (FIFO deduction engine)
- [ ] ItemsController (full CRUD + stock-in/out)
- [ ] MenuItemsController (CRUD with nested recipe management)
- [ ] ConsumptionService + Controller
- [ ] SettingsController (Item Types, Categories, Couriers, Vehicles)
- [ ] EmployeesController
- [ ] NotificationService (basic)

### Phase 3 — Order Pipeline & Tracking (Week 3)
- [ ] OrderService (full lifecycle)
- [ ] OrdersController + SupplyRequestsController
- [ ] OrderStatusHistory logging
- [ ] ReturnsService + Controller
- [ ] Dispatch with courier/vehicle
- [ ] Batch transfer on delivery confirmation
- [ ] Auto-draft supply requests on low-stock

### Phase 4 — Analytics, Email & Subscription (Week 4)
- [ ] AnalyticsService (EOQ + Weighted Scoring)
- [ ] ReportsController
- [ ] EmailService (stub or SendGrid)
- [ ] SubscriptionService + Controller
- [ ] Subscription check middleware
- [ ] Final seeder polish

### Phase 5 — Polish & Super Admin (If Time Permits)
- [ ] Super Admin endpoints
- [ ] Audit log middleware
- [ ] Help & Support content
- [ ] Export endpoints (PDF/CSV)

---

*Merged and updated: April 18, 2026*
