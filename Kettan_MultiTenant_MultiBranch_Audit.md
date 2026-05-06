# Kettan Security Audit - Multi-Tenant & Multi-Branch Data Isolation

Date: 2026-05-07  
Scope: Controllers, Service Layer (including `AnalyticsService`), EF Core tenant filters, middleware, and debug/runtime exposure paths.

## Executive Verdict

**Isolation is not currently fully enforced.**  
Tenant-level and branch-level controls exist, but there are multiple exploitable leakage paths that allow unauthorized cross-tenant data exposure and cross-branch read/write access.

---

## Critical Findings

| Severity | Area | Finding | Evidence |
|---|---|---|---|
| **Critical** | Public debug surfaces | Unauthenticated debug endpoints expose internals and allow dangerous actions: password reset behavior and raw SQL schema mutation paths. | `Program.cs` L192-231 (`/api/debug/auth-diag` with `IgnoreQueryFilters()` and password overwrite), L233-268 (`/api/debug/fix-database` with `ExecuteSqlRawAsync`) |
| **Critical** | Controller auth | `BranchesController` has no `[Authorize]`; unauthenticated callers can list all branches, and update/delete paths are also reachable without auth. | `BranchesController.cs` L12-14, L30-71, L134-176; `ApplicationDbContext.cs` L137 (`!TenantId.HasValue || ...`) |
| **Critical** | Branch isolation (orders) | Branch users can transition other branches' orders in workflow because branch ownership check is missing in arrival/complete methods. | `OrderWorkflowService.cs` L935-1094 (`ConfirmArrivalAsync`, `CompleteTransactionAsync` no `GetOrderForWorkflowAsync`/branch check) |
| **Critical** | Branch isolation (order listing) | Branch-scoped user can pass arbitrary `branchId` and read another branch’s orders. | `BranchOrdersController.cs` L21-26 (accepts `branchId`), `OrderWorkflowService.cs` L45-53 (`branchId` applied before branch-scope restriction) |
| **Critical** | Branch isolation (order messages) | Any tenant user can read/post messages for any order ID in tenant; no branch-level access check. | `OrdersController.cs` L227-247, `OrderWorkflowService.cs` L1169-1223 |
| **Critical** | Branch isolation (inventory visibility) | Branch users can access branch/HQ inventory not belonging to them via item endpoints. | `ItemsController.cs` L50-51 + L88-96 (`hqOnly` + caller `branchId` drives stock query), L408-431 (`GetItemBatches` no branch restriction), L433-472 (`GetItemTransactions` no branch restriction) |

---

## High Findings

| Severity | Area | Finding | Evidence |
|---|---|---|---|
| **High** | Branch isolation (consumption logs) | Branch user can query other branch logs by supplying `branchId`. | `ConsumptionController.cs` L20-29, `ConsumptionService.cs` L201-208 (`branchId` overrides current branch restriction) |
| **High** | Branch financial isolation | Branch roles can call scorecard endpoint returning all branches' comparative metrics. | `ReportsController.cs` L82-90 (branch roles allowed), `AnalyticsService.cs` L75-134 (returns all branch scores) |
| **High** | Role gating | `UsersController` mutation endpoints are not role-restricted; any authenticated user can create/update/delete users. | `UsersController.cs` class-level `[Authorize]` only (L13-16), write endpoints L102+, L183+, L231+, L247+ |
| **High** | Tenant filter safety model | EF tenant filters explicitly allow all data when tenant claim is absent (`!TenantId.HasValue`). Any unprotected endpoint against tenant entities becomes cross-tenant leak-prone. | `ApplicationDbContext.cs` L137-167 |

---

## Medium Findings

| Severity | Area | Finding | Evidence |
|---|---|---|---|
| **Medium** | Data model consistency | Several `ITenantEntity` types are not globally query-filtered and depend on call-site checks; this increases risk and already contributed to gaps. | `Entities` implementing `ITenantEntity` include `OrderAllocation`, `SupplyRequestItem`, `ReturnItem`, `OrderStatusHistory`, `ConsumptionLogItem`, `MenuItemIngredient`; not all have `HasQueryFilter` in `ApplicationDbContext.cs` |
| **Medium** | Branch setting integrity | `BranchItemSetting.BranchId = null` itself is not direct bleed, but item threshold write path lacks strict tenant-item validation in branch endpoint. | `ItemsController.cs` L326-360 (`SetBranchThreshold` no item tenant existence check) |

---

## Answers to Your Four Questions

### 1) Tenant Isolation (Cross-Business)

**Not fully safe.**  
Most authenticated business flows rely on tenant filters correctly, but there are hard leakage points:
1. Unauthenticated debug endpoints and debug controller routes.
2. Unprotected `BranchesController` combined with permissive filter fallback when tenant claim is missing.

A TenantAdmin with valid tenant claim is generally constrained, but anonymous or weakly-gated routes currently break total isolation guarantees.

### 2) Branch Isolation (Intra-Business)

**Not fully safe.**  
Branch 1 can access/modify Branch 2 data through multiple paths:
1. Order list by injecting `branchId`.
2. Order workflow arrive/complete actions without branch ownership checks.
3. Item batch/transaction endpoints lacking branch scoping.
4. Consumption logs via `branchId` override.
5. Order messages lacking branch access checks.
6. Branch scorecard endpoint exposing chain-wide performance to branch roles.

### 3) Hybrid Edge Case (`BranchItemSetting.BranchId` nullable)

**Nullable field alone is not the primary hole**, and branch views do not automatically inherit HQ thresholds in normal branch-path lookups.  
However, branch users can still query non-owned stock contexts through item endpoint parameter logic (`hqOnly` + `branchId`), which creates practical bleed behavior adjacent to this design.

### 4) Global Catalog & Master Data (`Item`)

**Direct Item mutation (price/SKU) is HQ-gated at controller level.**  
Item write operations (`CreateItem`, `UpdateItem`, `StockIn`, `StockOut`) are restricted to HQ roles (`TenantAdmin,HqManager,HqStaff`) in `ItemsController` (L145+, L201+, L254+, L294+).  

So branch users are blocked from direct catalog edits, but branch users can still access unauthorized cross-branch inventory visibility via other item endpoints.

---

## Priority Remediation Order

1. **Immediately remove/lock down all debug endpoints** (`/api/debug/*`, `DebugController`) and restrict to development with explicit auth.
2. **Add `[Authorize]` + role policies to `BranchesController` and `UsersController`.**
3. **Fix branch access checks in `OrderWorkflowService`** (`ConfirmArrivalAsync`, `CompleteTransactionAsync`) and in order message methods.
4. **Fix branch parameter trust bugs** (`ListBranchOrdersAsync`, `ConsumptionService.ListAsync`, `ItemsController.GetItems/GetItemBatches/GetItemTransactions`).
5. **Tighten tenant filter strategy** so missing tenant claim never defaults to full visibility in production request paths.
6. **Add explicit tenant+branch authorization guards in service layer** for all methods that accept IDs from request inputs.

