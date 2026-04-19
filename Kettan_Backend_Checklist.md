# Kettan — Backend Implementation Checklist

> Derived from a full audit of `Kettan.Server/` codebase vs `schema.sql` vs `Kettan_Backend_Blueprint.md`.
> Last updated: 2026-04-19

---

## Current State Summary

| Layer | What Exists | What's Missing |
|---|---|---|
| **Entities** | 37 files (Full alignment with schema.sql) | None |
| **DbContext** | All DbSets registered, global isolation & soft-delete filters, restrict delete behavior | None |
| **Controllers** | 9 real controllers (Auth, Branches, BranchOrders, Consumption, Notifications, Returns, SupplyRequests, Tenants, Users) | Missing: ItemsController, MenuItemsController, HQ OrdersController, EmployeesController, CouriersController, SettingsController, ReportsController, SubscriptionController |
| **Services** | Auth, CurrentUser, SupplyRequest, Consumption, OrderWorkflow, Return, Notification | Missing: InventoryService (FIFO engine), AnalyticsService, EmailService, SubscriptionService |
| **DTOs** | Auth, Branches, Consumption, Notifications, Orders, Returns, SupplyRequests, Tenants, Users | Missing DTOs for: Items, MenuItems, Employees, Couriers/Vehicles, Settings, Reports, Subscription |
| **Seeder** | Full generic coffee shop data (Items, Batches, Menu, Recipes) | None |
| **Middleware** | None | SubscriptionCheckMiddleware, AuditLogMiddleware |
| **Migrations** | `FullSchemaAlignment` (Migration 0) | Future operational migrations |

---

## Phase 1 — Entity & Schema Alignment (Week 1)

> Goal: Get ALL entities matching `schema.sql`, migrate DB, seed realistic data.

### 1A. New Entities to Create

- [x] `Entities/Unit.cs` — Units of measure (g, ml, pc, kg) — tenant-scoped
- [x] `Entities/InventoryCategory.cs` — Inventory groupings (Dry Goods, Dairy) — tenant-scoped
- [x] `Entities/ItemCategory.cs` — Item-level categories — tenant-scoped
- [x] `Entities/BundleItem.cs` — Bundle composition (parent → child items)
- [x] `Entities/Employee.cs` — Staff directory (tenant + optional branch)
- [x] `Entities/Courier.cs` — Registered delivery couriers — tenant-scoped
- [x] `Entities/Vehicle.cs` — Vehicles assigned to couriers — tenant-scoped
- [x] `Entities/MenuCategory.cs` — Menu groupings (Coffee, Food, Pastries)
- [x] `Entities/MenuTag.cs` — Labels/badges (Bestseller, Vegan)
- [x] `Entities/MenuItemTag.cs` — Junction table for MenuItems ↔ Tags
- [x] `Entities/MenuVariant.cs` — Sizes/portions with pricing
- [x] `Entities/VariantIngredient.cs` — Recipe per variant → inventory items
- [x] `Entities/SubscriptionPlan.cs` — Plan definitions (Starter, Growth, Enterprise)
- [x] `Entities/TenantSubscription.cs` — Active subscription per tenant
- [x] `Entities/SubscriptionInvoice.cs` — Billing invoices
- [x] `Entities/SubscriptionPayment.cs` — Payment records
- [x] `Entities/AuditLog.cs` — Audit trail entries

### 1B. Update Existing Entities (fields missing vs schema.sql)

- [x] **Item.cs** — Add: `UnitId` (FK→Unit, replace string `UnitOfMeasure`), `InventoryCategoryId`, `ItemCategoryId`, `SellingPrice`, `IsBundle`, `ImageUrl`, `PreviousUnitCost`, `IsDeleted`, `DeletedAt`, `UpdatedAt`
- [x] **Branch.cs** — Add: `Address`, `City`, `ContactNumber`, `OpenTime` (TimeOnly), `CloseTime` (TimeOnly), `OwnerUserId` (FK→User), `ManagerUserId` (FK→User), `IsDeleted`, `DeletedAt`
- [x] **Tenant.cs** — Add: `Email`, `Phone`, `Address`, `LogoUrl`, `CurrentSubscriptionId` (FK→TenantSubscription), `SubscriptionStatus`, `SubscriptionPeriodStart`, `SubscriptionPeriodEnd`, `IsDeleted`, `DeletedAt`
- [x] **Shipment.cs** — Add: `CourierId` (FK→Courier), `VehicleId` (FK→Vehicle), `IsDeleted`, `DeletedAt`
- [x] **MenuItem.cs** — Align to schema: `CategoryId` (FK→MenuCategory), `Description`, `ImageUrl`, `BasePrice`, `Status`, `UpdatedAt`, `IsDeleted`, `DeletedAt` — currently has `Category` as string and `SellingPrice`
- [x] **SupplyRequest.cs** — Add: `IsDeleted`, `DeletedAt` (if not present)
- [x] **Order.cs** — Add: `IsDeleted`, `DeletedAt`
- [x] **Return.cs** — Add: `IsDeleted`, `DeletedAt`
- [x] **User.cs** — Add: `IsDeleted`, `DeletedAt`
- [x] **Notification.cs** — Add: `ReadAt`

### 1C. DbContext Updates

- [x] Add DbSets for all new entities
- [x] Add global query filters for all new `ITenantEntity` entities
- [x] Add soft-delete query filters (`.HasQueryFilter(e => !e.IsDeleted)`) across all entities with `IsDeleted`
- [x] Configure EF relationships (FKs, navigation properties) for new entities
- [x] Configure composite key for `MenuItemTag` junction table

### 1D. Migration & Seeder

- [x] Delete existing migration folder (clean slate aligned to schema.sql)
- [x] Run `dotnet ef migrations add FullSchemaAlignment`
- [x] Run `dotnet ef database update` against local DB
- [x] Expand `DbInitializer.cs`:
  - [x] Seed Units (g, ml, pc, kg, L, box, bag, bottle)
  - [x] Seed InventoryCategories (Beans, Dairy, Syrups, Packaging, Dry Goods)
  - [x] Seed MenuCategories (Coffee, Non-Coffee, Food, Pastries)
  - [x] Seed sample Items (8-10 inventory items with SKUs)
  - [x] Seed sample Batches (2+ batches per item for FIFO testing)
  - [x] Seed sample MenuItems + Variants + Ingredients
  - [x] Seed sample Employees (3-4 across HQ and branch)
  - [x] Seed SubscriptionPlans (Starter, Growth, Enterprise)
  - [x] Seed sample Courier + Vehicle
- [x] Verify seeder runs cleanly from `dotnet run`

---

## Phase 2 — Inventory & Menu Core (Week 2)

> Goal: FIFO engine, full Items CRUD + stock operations, Menu CRUD, Settings CRUD.

### 2A. Inventory Service (CRITICAL — the heart of the system)

- [ ] `Services/Inventory/IInventoryService.cs` — Interface
- [ ] `Services/Inventory/InventoryService.cs` — Implementation:
  - [ ] `StockIn(itemId, qty, batchNumber, expiryDate)` — Create batch at HQ, log InventoryTransaction
  - [ ] `StockOut(itemId, qty, reason)` — FIFO deduction from HQ batches
  - [ ] `DeductFIFO(itemId, branchId, qty)` — Core FIFO engine (iterate oldest→newest batches)
  - [ ] `GetStockLevel(itemId, branchId?)` — Sum of batch quantities
  - [ ] `CheckThresholds(branchId)` — Compare stock vs thresholds, return alerts
  - [ ] `TransferToBranch(batchId, branchId, qty)` — Batch location transfer + transaction log
- [ ] Register `IInventoryService` in `Program.cs`

### 2B. Items Controller & DTOs

- [ ] `DTOs/Items/ItemDto.cs` (list/detail response)
- [ ] `DTOs/Items/CreateItemDto.cs`
- [ ] `DTOs/Items/UpdateItemDto.cs`
- [ ] `DTOs/Items/StockInDto.cs`
- [ ] `DTOs/Items/StockOutDto.cs`
- [ ] `DTOs/Items/BatchDto.cs`
- [ ] `DTOs/Items/TransactionDto.cs`
- [ ] `Controllers/ItemsController.cs`:
  - [ ] `GET /api/items` — List (filterable by category, type, search)
  - [ ] `POST /api/items` — Create item
  - [ ] `GET /api/items/{id}` — Detail + batches
  - [ ] `PUT /api/items/{id}` — Update
  - [ ] `POST /api/items/{id}/stock-in` — Receive stock
  - [ ] `POST /api/items/{id}/stock-out` — Adjust stock (FIFO)
  - [ ] `GET /api/items/{id}/batches` — Batch list
  - [ ] `GET /api/items/{id}/transactions` — Transaction ledger

### 2C. Menu Items Controller & DTOs

- [ ] `DTOs/MenuItems/MenuItemDto.cs`
- [ ] `DTOs/MenuItems/CreateMenuItemDto.cs`
- [ ] `DTOs/MenuItems/UpdateMenuItemDto.cs`
- [ ] `DTOs/MenuItems/VariantDto.cs`
- [ ] `Controllers/MenuItemsController.cs`:
  - [ ] `GET /api/menu-items` — List
  - [ ] `POST /api/menu-items` — Create with recipe (variants + ingredients)
  - [ ] `GET /api/menu-items/{id}` — Detail with ingredients
  - [ ] `PUT /api/menu-items/{id}` — Update
  - [ ] `DELETE /api/menu-items/{id}` — Soft delete

### 2D. Settings Controllers (Lookup Tables CRUD)

- [ ] `Controllers/SettingsController.cs` or separate per resource:
  - [ ] `GET/POST /api/item-categories`
  - [ ] `GET/POST /api/inventory-categories`
  - [ ] `GET/POST /api/units`
  - [ ] `GET/POST /api/menu-categories`
  - [ ] `GET/POST /api/menu-tags`
- [ ] DTOs for each lookup type

### 2E. Employees Controller

- [ ] `DTOs/Employees/EmployeeDto.cs`
- [ ] `DTOs/Employees/CreateEmployeeDto.cs`
- [ ] `DTOs/Employees/UpdateEmployeeDto.cs`
- [ ] `Controllers/EmployeesController.cs`:
  - [ ] `GET /api/employees` — List (filterable by branch)
  - [ ] `GET /api/employees/{id}` — Detail
  - [ ] `POST /api/employees` — Create
  - [ ] `PUT /api/employees/{id}` — Update

### 2F. Couriers & Vehicles Controller

- [ ] `DTOs/Couriers/CourierDto.cs`
- [ ] `DTOs/Couriers/VehicleDto.cs`
- [ ] `Controllers/CouriersController.cs`:
  - [ ] `GET /api/couriers` — List
  - [ ] `POST /api/couriers` — Create courier
  - [ ] `GET /api/couriers/{id}/vehicles` — Vehicles for courier
  - [ ] `POST /api/vehicles` — Create vehicle

---

## Phase 3 — Order Pipeline & Returns (Week 3)

> Goal: Full supply-request → order lifecycle, HQ approval flow, delivery, returns resolution.

### 3A. HQ Order Management (expand existing services)

- [ ] Expand `OrderWorkflowService`:
  - [ ] `ApproveRequest(requestId, approvedQtys[])` — Set status, create Order
  - [ ] `RejectRequest(requestId, reason)` — Set status Rejected
  - [ ] `StartPicking(orderId)` — Status → Picking
  - [ ] `ConfirmPacked(orderId, allocations[])` — FIFO batch allocation, deduct HQ stock, Status → Packed
  - [ ] `DispatchOrder(orderId, courierId, vehicleId, eta)` — Create Shipment, Status → Dispatched
  - [ ] `LogStatusChange(orderId, status, userId, remarks)` — Insert OrderStatusHistory
- [ ] Expand `SupplyRequestService`:
  - [ ] `UpdateDraft(requestId, payload)` — Edit draft (matches frontend edit page)
  - [ ] `AutoDraftOnLowStock(branchId)` — Triggered by threshold check
- [ ] `Controllers/OrdersController.cs` (HQ-side):
  - [ ] `GET /api/orders` — List orders (HQ view)
  - [ ] `GET /api/orders/{id}` — Order detail + allocations + timeline
  - [ ] `PUT /api/supply-requests/{id}/approve`
  - [ ] `PUT /api/supply-requests/{id}/reject`
  - [ ] `PUT /api/orders/{id}/pick`
  - [ ] `PUT /api/orders/{id}/pack`
  - [ ] `PUT /api/orders/{id}/dispatch`
  - [ ] `PUT /api/orders/{id}/deliver`
  - [ ] `GET /api/orders/{id}/tracking` — Timeline

### 3B. Returns Enhancement

- [ ] Expand `ReturnService`:
  - [ ] `ResolveReturn` — "Replaced" (auto-create new order) / "Credited" (calc credit) / "Rejected"
- [ ] Verify `ReturnsController` has all endpoints from blueprint

### 3C. Consumption Enhancement

- [ ] Expand `ConsumptionService`:
  - [ ] Wire `DeductFIFO` from InventoryService into sales deduction flow
  - [ ] Add `PreviewDeductions(menuItemSales[])` — Read-only preview
- [ ] Verify `ConsumptionController` has preview endpoint

### 3D. Notification Triggers

- [ ] Wire auto-notifications:
  - [ ] On low stock threshold breach → notify BranchManager
  - [ ] On supply request status change → notify requester
  - [ ] On order status change → notify relevant parties
  - [ ] On return filed → notify HQ

---

## Phase 4 — Analytics, Email & Subscription (Week 4)

> Goal: Reporting engine, email stubs, subscription/billing, middleware.

### 4A. Analytics Service

- [ ] `Services/Analytics/IAnalyticsService.cs`
- [ ] `Services/Analytics/AnalyticsService.cs`:
  - [ ] `CalculateEOQ(itemId)` — Economic Order Quantity
  - [ ] `CalculateBranchScores(tenantId, dateRange)` — Weighted scoring
  - [ ] `GetInventoryValuation(tenantId, branchId?)` — Σ(UnitCost × CurrentQty)
  - [ ] `GetFulfillmentCost(tenantId, dateRange)` — Σ cost of delivered orders

### 4B. Reports Controller

- [ ] `Controllers/ReportsController.cs`:
  - [ ] `GET /api/reports/inventory-summary` — Stock levels, valuation
  - [ ] `GET /api/reports/order-fulfillment` — Fulfillment rates, times
  - [ ] `GET /api/reports/consumption-trends` — Deduction patterns by date/branch
  - [ ] `GET /api/reports/branch-scorecard` — Weighted branch scores

### 4C. Email Service (Stub First)

- [ ] `Services/Email/IEmailService.cs`
- [ ] `Services/Email/ConsoleEmailService.cs` — Logs to console (swap to SendGrid later):
  - [ ] `SendWelcomeEmail(email, tenantName, loginUrl)`
  - [ ] `SendLowStockAlert(email, items[])`
  - [ ] `SendOrderStatusUpdate(email, orderId, status)`
  - [ ] `SendPasswordReset(email, resetToken)`
- [ ] Register in `Program.cs`

### 4D. Subscription Service

- [ ] `Services/Subscription/ISubscriptionService.cs`
- [ ] `Services/Subscription/SubscriptionService.cs`:
  - [ ] `CreateCheckoutSession(plan, email)` — (stub, PayMongo later)
  - [ ] `HandleWebhook(payload)` — On payment: create Tenant + TenantAdmin
  - [ ] `GetSubscriptionStatus(tenantId)`
  - [ ] `CancelSubscription(tenantId)`
- [ ] `Controllers/SubscriptionController.cs`:
  - [ ] `POST /api/subscription/register` — Public
  - [ ] `POST /api/subscription/checkout`
  - [ ] `POST /api/subscription/webhook`
  - [ ] `GET /api/subscription/status`

### 4E. Middleware

- [ ] `Middleware/SubscriptionCheckMiddleware.cs` — Verify active subscription on every authenticated request (exclude SuperAdmin + public endpoints)
- [ ] Register in `Program.cs` pipeline

---

## Phase 5 — Polish, Super Admin & Audit (If Time Permits)

> Goal: Platform-level admin tools, audit logging, export.

### 5A. Super Admin Endpoints

- [ ] Expand `TenantsController`:
  - [ ] `GET /api/tenants` — List all tenants (SuperAdmin only)
  - [ ] `GET /api/tenants/{id}` — Tenant detail + subscription status
  - [ ] `PUT /api/tenants/{id}/deactivate` — Kill-switch
  - [ ] `GET /api/tenants/{id}/stats` — Usage stats

### 5B. Audit Log Middleware

- [ ] `Middleware/AuditLogMiddleware.cs` — Auto-log: who, what, when, which entity
- [ ] OR use EF `SaveChangesInterceptor` to capture changes on save

### 5C. Data Export

- [ ] CSV export endpoints for inventory, orders, returns
- [ ] PDF generation for reports (optional — depends on scope)

### 5D. Frontend ↔ Backend Wiring

- [ ] Replace all frontend mock data with real API calls
- [ ] Add React Query hooks per feature
- [ ] Add `VITE_USE_MOCK_DATA` toggle for development fallback
- [ ] Update `VITE_API_URL` for production

---

## Phase 6 — Deployment & Production (Post-Dev)

> See: `Kettan_Deployment_Guide.md` for full instructions.

- [ ] Run schema.sql against MonsterASP MSSQL via SSMS
- [ ] Update `appsettings.json` with production connection string
- [ ] Publish via Web Deploy from Visual Studio
- [ ] Verify JWT + CORS in production
- [ ] Test all critical flows end-to-end on live URL
- [ ] Set up HTTPS / custom domain

---

## Priority Matrix

| Priority | What | Why |
|---|---|---|
| 🔴 P0 | Phase 1 (Entity alignment + migration) | Everything depends on this |
| 🔴 P0 | Phase 2A (FIFO InventoryService) | Core business logic — orders, consumption, everything calls this |
| 🟠 P1 | Phase 2B-C (Items + Menu CRUD) | Frontend already built, just needs API swap |
| 🟠 P1 | Phase 3A (Order pipeline) | The main module — supply request → delivery |
| 🟡 P2 | Phase 2D-F (Settings, Employees, Couriers) | Simple CRUD, low risk |
| 🟡 P2 | Phase 3B-D (Returns, Consumption, Notifications) | Services exist, just need enhancement |
| 🟢 P3 | Phase 4 (Analytics, Email, Subscription) | Can be stubbed |
| 🟢 P3 | Phase 5 (Super Admin, Audit, Export) | Nice-to-have |

---

*Generated: April 19, 2026*
