# Kettan — Backend Implementation Checklist

> Derived from a full audit of `Kettan.Server/` codebase vs `schema.sql` vs `Kettan_Backend_Blueprint.md`.
> Last updated: 2026-04-20 (Phase 3A backend kickoff: supply-request HQ actions + OrdersController workflow endpoints)

---

## Current State Summary

| Layer | What Exists | What's Missing |
|---|---|---|
| **Entities** | 37 files (Full alignment with schema.sql) | None |
| **DbContext** | All DbSets registered, global isolation & soft-delete filters, restrict delete behavior | None |
| **Controllers** | Auth, Branches, BranchOrders, Orders (HQ workflow), Consumption, Notifications, Returns, SupplyRequests, Tenants (self-profile + dev diagnostics), Users, Items, MenuItems, Employees, Couriers, Settings, Subscription | Missing: ReportsController |
| **Services** | Auth, CurrentUser, SupplyRequest, Consumption, OrderWorkflow, Return, Notification, Inventory, Email, Subscription | Missing: AnalyticsService |
| **DTOs** | Auth, Branches, Consumption, Notifications, Orders, Returns, SupplyRequests, Tenants (+ dev diagnostics DTO), Users, Items, MenuItems, Employees, Couriers/Vehicles, Settings, Subscription | Missing DTOs for: Reports |
| **Seeder** | Phase 1 seed coverage complete (lookups, items, FIFO batches, menu, employees, subscription, courier/vehicle) | None |
| **Middleware** | None | SubscriptionCheckMiddleware, AuditLogMiddleware |
| **Migrations** | `FullSchemaAlignment` + `Phase1ClosurePatch` | Future operational migrations |

---

## Mock-To-Real Tracker (Frontend Quick View)

> Status semantics: **DONE** = no runtime mock fallback in the migrated slice, **PARTIAL** = mixed real API + remaining mock/derived fields, **NOT DONE** = still primarily mock/localStorage.

| Frontend Area | Status | Current Reality | Remaining Work |
|---|---|---|---|
| HQ Inventory | PARTIAL | Core pages now API-backed (`InventoryPage`, `InventoryItemProfilePage`, `InventoryTransactionPage`) | Replace localStorage adapters (`itemCategoryApi`, `vehicleApi`) and remove residual `mockData` runtime dependency |
| Company Profile | PARTIAL | Reads/saves core tenant fields through `/api/tenants/me`; dev header connectivity signal is live | Persist full profile fields (`legalName`, `taxId`, `website`, dedicated `supportEmail`) via backend schema/DTO expansion |
| Branches & Staff | NOT DONE | Staff/branch flows still tracked for upcoming migration | Move listing/profile flows to `/api/branches` and `/api/employees`, remove mock fallbacks |
| Menu & Consumption | NOT DONE | Menu/consumption migration not yet executed | Replace menu + consumption mock sources with `/api/menu-items`, `/api/items`, and related lookups |
| Supply Requests & Orders | NOT DONE | Sample/fallback rows remain in current frontend flows | Remove fallback constants and wire create/edit/detail/order pages to real APIs |
| Tenant Dashboard & Reports | NOT DONE | Mock dashboards/reports still present in several views | Replace tenant/report mocks where endpoints exist; show NotAvailable for missing backend endpoints |

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

### 1E. Phase 1 Verification Snapshot (2026-04-19)

- [x] Migration `Phase1ClosurePatch` applied successfully via EF Core (`dotnet ef database update`)
- [x] Schema checks passed:
  - [x] `Tenants` includes `Email`, `Phone`, `Address`, `LogoUrl`
  - [x] `OrderStatusHistories.ChangedBy_UserId` is nullable
  - [x] `ReturnItems.Reason` is nullable `NVARCHAR(500)`
  - [x] `Shipments.OrderId` has unique index
- [x] Seed count checks passed in local DB (`KettanDB`):
  - [x] `Units = 8`
  - [x] `InventoryCategories = 5`
  - [x] `MenuCategories = 4`
  - [x] `Items = 10`
  - [x] `Batches = 20` (2+ per item)
  - [x] `Employees = 4`
  - [x] `Couriers = 1`
  - [x] `Vehicles = 1`

---

## Phase 2 — Inventory & Menu Core (Week 2)

> Goal: FIFO engine, full Items CRUD + stock operations, Menu CRUD, Settings CRUD.

### 2A. Inventory Service (CRITICAL — the heart of the system)

- [x] `Services/Inventory/IInventoryService.cs` — Interface
- [x] `Services/Inventory/InventoryService.cs` — Implementation:
  - [x] `StockIn(itemId, qty, batchNumber, expiryDate)` — Create batch at HQ, log InventoryTransaction
  - [x] `StockOut(itemId, qty, reason)` — FIFO deduction from HQ batches
  - [x] `DeductFIFO(itemId, branchId, qty)` — Core FIFO engine (iterate oldest→newest batches)
  - [x] `GetStockLevel(itemId, branchId?)` — Sum of batch quantities
  - [x] `CheckThresholds(branchId)` — Compare stock vs thresholds, return alerts
  - [x] `TransferToBranch(batchId, branchId, qty)` — Batch location transfer + transaction log
- [x] Register `IInventoryService` in `Program.cs`

### 2B. Items Controller & DTOs

- [x] `DTOs/Items/ItemDto.cs` (list/detail response)
- [x] `DTOs/Items/CreateItemDto.cs`
- [x] `DTOs/Items/UpdateItemDto.cs`
- [x] `DTOs/Items/StockInDto.cs`
- [x] `DTOs/Items/StockOutDto.cs`
- [x] `DTOs/Items/BatchDto.cs`
- [x] `DTOs/Items/TransactionDto.cs`
- [x] `Controllers/ItemsController.cs`:
  - [x] `GET /api/items` — List (filterable by category, type, search)
  - [x] `POST /api/items` — Create item
  - [x] `GET /api/items/{id}` — Detail + batches
  - [x] `PUT /api/items/{id}` — Update
  - [x] `POST /api/items/{id}/stock-in` — Receive stock
  - [x] `POST /api/items/{id}/stock-out` — Adjust stock (FIFO)
  - [x] `GET /api/items/{id}/batches` — Batch list
  - [x] `GET /api/items/{id}/transactions` — Transaction ledger

### 2C. Menu Items Controller & DTOs

- [x] `DTOs/MenuItems/MenuItemDto.cs`
- [x] `DTOs/MenuItems/CreateMenuItemDto.cs`
- [x] `DTOs/MenuItems/UpdateMenuItemDto.cs`
- [x] `DTOs/MenuItems/VariantDto.cs`
- [x] `Controllers/MenuItemsController.cs`:
  - [x] `GET /api/menu-items` — List
  - [x] `POST /api/menu-items` — Create with recipe (variants + ingredients)
  - [x] `GET /api/menu-items/{id}` — Detail with ingredients
  - [x] `PUT /api/menu-items/{id}` — Update
  - [x] `DELETE /api/menu-items/{id}` — Soft delete

### 2D. Settings Controllers (Lookup Tables CRUD)

- [x] `Controllers/SettingsController.cs` or separate per resource:
  - [x] `GET/POST/PUT/DELETE /api/item-categories`
  - [x] `GET/POST/PUT/DELETE /api/inventory-categories`
  - [x] `GET/POST/PUT/DELETE /api/units`
  - [x] `GET/POST/PUT/DELETE /api/menu-categories`
  - [x] `GET/POST/PUT/DELETE /api/menu-tags`
- [x] DTOs for each lookup type

### 2E. Employees Controller

- [x] `DTOs/Employees/EmployeeDto.cs`
- [x] `DTOs/Employees/CreateEmployeeDto.cs`
- [x] `DTOs/Employees/UpdateEmployeeDto.cs`
- [x] `Controllers/EmployeesController.cs`:
  - [x] `GET /api/employees` — List (filterable by branch)
  - [x] `GET /api/employees/{id}` — Detail
  - [x] `POST /api/employees` — Create
  - [x] `PUT /api/employees/{id}` — Update
  - [x] `DELETE /api/employees/{id}` — Soft delete

### 2F. Couriers & Vehicles Controller

- [x] `DTOs/Couriers/CourierDto.cs`
- [x] `DTOs/Couriers/VehicleDto.cs`
- [x] `Controllers/CouriersController.cs`:
  - [x] `GET /api/couriers` — List
  - [x] `GET /api/couriers/{id}` — Detail
  - [x] `POST /api/couriers` — Create courier
  - [x] `PUT /api/couriers/{id}` — Update courier
  - [x] `DELETE /api/couriers/{id}` — Soft delete courier
  - [x] `GET /api/couriers/{id}/vehicles` — Vehicles for courier
  - [x] `GET /api/vehicles` — Vehicle list (supports filter)
  - [x] `GET /api/vehicles/{id}` — Vehicle detail
  - [x] `POST /api/vehicles` — Create vehicle
  - [x] `PUT /api/vehicles/{id}` — Update vehicle
  - [x] `DELETE /api/vehicles/{id}` — Soft delete vehicle

### 2G. Phase 2 Verification Snapshot (2026-04-19)

- [x] Build checks passed:
  - [x] `dotnet build Kettan.Server.csproj -o .\\tmp-build3` succeeded
  - [x] Runtime build lock issue handled by alternate output folder while another debug process held `bin/Debug`
- [x] Runtime smoke checks passed (Development env, local DB):
  - [x] Unauthenticated route checks return `401` for new secured endpoints (`/api/items`, `/api/menu-items`, `/api/item-categories`, `/api/inventory-categories`, `/api/units`, `/api/menu-categories`, `/api/menu-tags`, `/api/employees`, `/api/couriers`)
  - [x] Authenticated HQ Manager (`hqmanager@dummycorp.local` / `password123`) gets `200` on new Phase 2 GET endpoints
  - [x] Inventory write flow validated: `POST /api/items/{id}/stock-in` and `POST /api/items/{id}/stock-out` both return `200`
  - [x] CRUD write smoke validated:
    - [x] `POST /api/item-categories` → `200`
    - [x] `POST /api/units` valid payload → `200`
    - [x] `POST /api/units` oversized symbol → `400` (validation guard)
    - [x] `POST /api/employees` → `201`
    - [x] `POST /api/couriers` → `200`
    - [x] `POST /api/vehicles` → `200`
    - [x] `POST /api/menu-items` → `201`

---

## Phase 3 — Order Pipeline & Returns (Week 3)

> Goal: Full supply-request → order lifecycle, HQ approval flow, delivery, returns resolution.

### 3A. HQ Order Management (expand existing services)

- [x] Expand `OrderWorkflowService`:
  - [x] `StartPicking(orderId)` — Status → Picking
  - [x] `ConfirmPacked(orderId, allocations[])` — FIFO batch allocation + HQ stock deduction implemented via EF transaction
  - [x] `ConfirmPacked(orderId)` status transition and timeline logging
  - [x] `DispatchOrder(orderId, courierId, vehicleId, eta)` — Create/update Shipment, Status → Dispatched
  - [x] `LogStatusChange(orderId, status, userId, remarks)` — Timeline entries now written on pick/pack/dispatch/deliver transitions
- [x] Expand `SupplyRequestService`:
  - [x] `UpdateDraft(requestId, payload)` — Edit draft (matches frontend edit page)
  - [x] `ApproveRequest(requestId, approvedQtys[])` — Status → Approved, item approvals persisted, Order created in Processing, initial OrderStatusHistory inserted
  - [x] `RejectRequest(requestId, reason)` — Status → Rejected, item approvals zeroed, requester notified
  - [x] `AutoDraftOnLowStock(branchId)` — Triggered by threshold check
- [x] `Controllers/OrdersController.cs` (HQ-side) added:
  - [x] `GET /api/orders` — List orders (HQ view)
  - [x] `GET /api/orders/{id}` — Order detail + allocations + shipment metadata
  - [x] `PUT /api/supplyrequests/{id}/approve` (implemented in `SupplyRequestsController`)
  - [x] `PUT /api/supplyrequests/{id}/reject` (implemented in `SupplyRequestsController`)
  - [x] `PUT /api/orders/{id}/pick`
  - [x] `PUT /api/orders/{id}/pack`
  - [x] `PUT /api/orders/{id}/dispatch`
  - [x] `PUT /api/orders/{id}/deliver`
  - [x] `GET /api/orders/{id}/tracking` — Timeline

### 3A.1 Verification Snapshot (2026-04-20)

- [x] Build checks passed after Phase 3A kickoff changes:
  - [x] `dotnet build Kettan.Server.csproj -o .\tmp-build-phase3a` succeeded
  - [x] `dotnet build Kettan.Server.csproj -o .\tmp-build-phase3b` succeeded
- [x] New contract surface is compile-verified:
  - [x] `PUT /api/SupplyRequests/{id}` (update draft)
  - [x] `PUT /api/SupplyRequests/{id}/approve`
  - [x] `PUT /api/SupplyRequests/{id}/reject`
  - [x] `GET /api/orders`
  - [x] `GET /api/orders/{id}`
  - [x] `PUT /api/orders/{id}/pick`
  - [x] `PUT /api/orders/{id}/pack`
  - [x] `PUT /api/orders/{id}/dispatch`
  - [x] `PUT /api/orders/{id}/deliver`
  - [x] `GET /api/orders/{id}/tracking`
- [x] Remaining 3A functional gap closed:
  - [x] Pack step now performs FIFO batch allocation + HQ stock deduction

### 3B. Returns Enhancement

- [x] Expand `ReturnService`:
  - [x] `ResolveReturn` — "Replaced" (auto-create new order) / "Credited" (calc credit) / "Rejected"
- [x] Verify `ReturnsController` has all endpoints from blueprint

### 3C. Consumption Enhancement

- [x] Expand `ConsumptionService`:
  - [x] Wire `DeductFIFO` from InventoryService into sales deduction flow
  - [x] Add `PreviewDeductions(menuItemSales[])` — Read-only preview
- [x] Verify `ConsumptionController` has preview endpoint

### 3D. Notification Triggers

- [x] Wire auto-notifications:
  - [x] On low stock threshold breach → notify BranchManager
  - [x] On supply request status change → notify requester (approve/reject)
  - [x] On order status change → notify relevant parties (pick/pack/dispatch to branch roles, delivery confirmation to HQ roles)
  - [x] On return filed → notify HQ

---

## Phase 4 — Analytics, Email & Subscription (Week 4)

> Goal: Reporting engine, email stubs, subscription/billing, middleware.

### 4A. Analytics Service

- [x] `Services/Analytics/IAnalyticsService.cs`
- [x] `Services/Analytics/AnalyticsService.cs`:
  - [x] `CalculateEOQ(itemId)` — Economic Order Quantity
  - [x] `CalculateBranchScores(tenantId, dateRange)` — Weighted scoring
  - [x] `GetInventoryValuation(tenantId, branchId?)` — Σ(UnitCost × CurrentQty)
  - [x] `GetFulfillmentCost(tenantId, dateRange)` — Σ cost of delivered orders

### 4B. Reports Controller

- [x] `Controllers/ReportsController.cs`:
  - [x] `GET /api/reports/inventory-summary` — Stock levels, valuation
  - [x] `GET /api/reports/order-fulfillment` — Fulfillment rates, times
  - [x] `GET /api/reports/consumption-trends` — Deduction patterns by date/branch
  - [x] `GET /api/reports/branch-scorecard` — Weighted branch scores

### 4C. Email Service (Stub First)

- [x] `Services/Email/IEmailService.cs`
- [x] `Services/Email/ConsoleEmailService.cs` — Logs to console (swap to SendGrid later):
  - [x] `SendWelcomeEmail(email, tenantName, loginUrl)`
  - [x] `SendLowStockAlert(email, items[])`
  - [x] `SendOrderStatusUpdate(email, orderId, status)`
  - [x] `SendPasswordReset(email, resetToken)`
- [x] Register in `Program.cs`

### 4D. Subscription Service

- [x] `Services/Subscription/ISubscriptionService.cs`
- [x] `Services/Subscription/SubscriptionService.cs` foundation:
  - [x] OTP flow: request/resend/verify
  - [x] `Register` flow with session tracking
  - [x] `HandleWebhook(payload)` foundation
  - [x] `GetStatus(sessionReference)`
  - [x] Dedicated `CreateCheckoutSession(plan, email)` endpoint/service contract (PayMongo Integration)
  - [x] Subscription cancel flow
- [x] `Controllers/SubscriptionController.cs`:
  - [x] `POST /api/subscription/register` — Public
  - [x] `POST /api/subscription/request-otp`
  - [x] `POST /api/subscription/resend-otp`
  - [x] `POST /api/subscription/verify-otp`
  - [x] `POST /api/subscription/webhook`
  - [x] `GET /api/subscription/plans`
  - [x] `GET /api/subscription/status/{sessionReference}`
  - [x] `POST /api/subscription/checkout-session`
  - [x] `POST /api/subscription/cancel`

### 4E. Middleware

- [x] `Middleware/SubscriptionCheckMiddleware.cs` — Verify active subscription on every authenticated request (exclude SuperAdmin + public endpoints)
- [x] Register in `Program.cs` pipeline

---

## Phase 5 — Polish, Super Admin & Audit (If Time Permits)

> Goal: Platform-level admin tools, audit logging, export.

### 5A. Tenants Controller

- [x] Tenant self profile endpoints:
  - [x] `GET /api/tenants/me` — Enriched payload includes contact + subscription period metadata
  - [x] `PUT /api/tenants/me` — Updates core tenant profile fields (`Name`, `SubscriptionTier`, `Email`, `Phone`, `Address`)
- [x] Development diagnostics endpoint:
  - [x] `GET /api/tenants/dev-connection-status` — Returns API/DB/tenant-read status + safe environment/database metadata (development only)
- [ ] Super Admin expansion:
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

> Canonical execution checklist adopted on 2026-04-20.
> This section supersedes the old generic frontend bullets and is now the source of truth for frontend mock-to-real progress.
> Policy decision: no temporary mock fallback rows on blocked pages; show explicit NotAvailable/empty states.

#### 5D.1. Guardrails and Standards

- [ ] Capture baseline screenshots and expected UI states before each feature migration.
- [ ] Build shared adapter conventions for int/decimal/date mapping across all frontend modules.
  - Status: PARTIAL — implemented for HQ Inventory in `kettan.client/src/features/hq-inventory/hqInventoryApi.ts`.
- [ ] Apply unified loading/error/empty/not-available UX patterns across migrated pages.
  - Status: PARTIAL — implemented in current HQ Inventory migration scope.
- [ ] Maintain truthful DONE/PARTIAL/NOT DONE tracking for every migrated page and endpoint gap.

#### 5D.2. Phase 1 — HQ Inventory (In Progress)

- [x] Replace mocks in `kettan.client/src/features/hq-inventory/InventoryPage.tsx` with live `/api/items` + `/api/items/{id}/transactions` reads.
- [x] Replace mocks in `kettan.client/src/features/hq-inventory/InventoryItemProfilePage.tsx` with live detail/batches/transactions and real update save flow.
- [x] Replace mocks in `kettan.client/src/features/hq-inventory/InventoryTransactionPage.tsx` with live catalog and real stock-in/stock-out persistence.
- [ ] Replace localStorage adapter in `kettan.client/src/features/hq-inventory/itemCategoryApi.ts` with real settings endpoints.
- [ ] Replace localStorage adapter in `kettan.client/src/features/hq-inventory/vehicleApi.ts` with real courier/vehicle endpoints.
- [ ] Remove remaining runtime dependence on `kettan.client/src/features/hq-inventory/mockData.ts` after category/vehicle migration.

#### 5D.2A. Tenant Company Profile + Dev Connectivity (Implemented 2026-04-20)

- [x] Replace mock source in `kettan.client/src/features/company/CompanyProfilePage.tsx` with live `/api/tenants/me` reads.
- [x] Replace local-only profile save with `/api/tenants/me` update + post-save API refresh.
- [x] Add adapter in `kettan.client/src/features/company/companyProfileApi.ts` to map tenant payloads and fetch diagnostics.
- [x] Add development-only header connectivity indicator in `kettan.client/src/components/Layout/Header.tsx` using `/api/tenants/dev-connection-status`.
- [ ] Persist full company profile form fields (`legalName`, `taxId`, `website`, dedicated `supportEmail`) once tenant schema/DTO coverage is expanded.

#### 5D.3. Phase 2 — Branches and Staff

- [ ] Migrate branch listing/profile pages to live branches endpoints.
- [ ] Migrate staff page to `/api/employees`.
- [ ] Remove branch/staff mocks; if backend data is unavailable, show NotAvailable state.

#### 5D.4. Phase 3 — Menu and Consumption

- [ ] Migrate menu listing/profile/add/edit flows to `/api/menu-items` and settings lookups.
- [ ] Migrate recipe/variant inventory selectors to live `/api/items`.
- [ ] Migrate consumption create flow to live menu/items sources.

#### 5D.5. Phase 4 — Supply Requests and Orders

- [ ] Remove sample fallback rows from supply request pages.
- [ ] Replace request create/edit/detail mock constants with real supply request and items APIs.
- [ ] Replace orders pages mock data with real order/supply workflow APIs.
- [ ] For missing order workflow endpoints, render NotAvailable state without fallback mock data.

#### 5D.6. Phase 5 — Super Admin, Reports, Final Mock Purge

- [ ] Replace tenant/dashboard mocks with real endpoints where available.
- [ ] Replace reports mocks where backend endpoints exist; otherwise show NotAvailable.
- [ ] Remove dead mock modules/imports and run a final global mock usage scan.

#### 5D.7. Verification Gate (Run Every Phase)

- [ ] Frontend typecheck/build passes, or blockers are explicitly documented as unrelated.
- [ ] Role-correct behavior is verified (HQ vs Branch).
- [ ] Existing UI layout/components are preserved.
- [ ] No migrated page displays mock fallback data.
- [ ] Blocked pages are clearly tagged as endpoint gaps, not marked as done.

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

*Generated: April 20, 2026*
