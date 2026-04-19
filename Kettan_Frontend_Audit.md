# Frontend Done vs Not Done (Simple)

Last updated: 2026-04-19

Scope: This file tracks frontend implementation status only. Backend/API dependencies are listed separately and do not downgrade frontend DONE status.

## DONE (with role owner)

| Page/Module | Status | Role Owner |
|---|---|---|
| Login (`/login`) | DONE | All users (entry point) |
| Dashboard (`/`) | DONE | SuperAdmin, TenantAdmin, HqManager, HqStaff, BranchManager, BranchOwner |
| Supply Requests (`/supply-requests`) | DONE | BranchManager, BranchOwner |
| Create Supply Request (`/supply-requests/new`) | DONE | BranchManager, BranchOwner |
| Supply Request detail (`/supply-requests/$requestId`) | DONE (frontend-only, sample-backed) | BranchManager, BranchOwner |
| Supply Request edit draft (`/supply-requests/$requestId/edit`) | DONE (frontend-only, sample-backed) | BranchManager, BranchOwner |
| Consumption (`/consumption`) | DONE | BranchManager (operate), BranchOwner (view-only) |
| Create Consumption (`/consumption/new`) | DONE | BranchManager (operate), BranchOwner (view-only gate) |
| Returns list/create (`/returns`) | DONE | BranchManager, BranchOwner, HqManager, HqStaff |
| Return detail (`/returns/$returnId`) | DONE | BranchManager, BranchOwner, HqManager, HqStaff |
| Audit Logs (`/audit-logs`) | DONE (frontend-only) | SuperAdmin, TenantAdmin |
| Orders list (`/orders`) | DONE | HqManager, HqStaff, TenantAdmin |
| Order detail (`/orders/$orderId`) | DONE | HqManager, HqStaff, TenantAdmin |
| New internal request (`/orders/new`) | DONE | HqManager, HqStaff, TenantAdmin |
| Branches (`/branches`) | DONE | SuperAdmin, TenantAdmin, BranchManager, BranchOwner |
| Add branch (`/branches/add`) | DONE | SuperAdmin, TenantAdmin |
| Branch profile (`/branches/$branchId`) | DONE | SuperAdmin, TenantAdmin, BranchManager, BranchOwner |
| Company profile (`/company-profile`) | DONE | SuperAdmin, TenantAdmin |
| HQ Inventory (`/hq-inventory`) | DONE | HqManager, HqStaff, TenantAdmin |
| HQ Inventory transaction (`/hq-inventory/transaction`) | DONE | HqManager, HqStaff, TenantAdmin |
| Item Category management (`/hq-inventory/categories`) | DONE (frontend-only) | TenantAdmin, HqManager, HqStaff |
| Vehicle management (`/hq-inventory/vehicles`) | DONE (frontend-only) | TenantAdmin, HqManager, HqStaff |
| HQ Inventory item profile (`/hq-inventory/$itemId`) | DONE | HqManager, HqStaff, TenantAdmin |
| Menu list (`/menu`) | DONE | HqManager, HqStaff, TenantAdmin |
| Menu Category management (`/menu/categories`) | DONE (frontend-only) | TenantAdmin, HqManager, HqStaff |
| Add menu item (`/menu/add`) | DONE | HqManager, HqStaff, TenantAdmin |
| Menu item profile (`/menu/$menuItemId`) | DONE | HqManager, HqStaff, TenantAdmin |
| Staff directory (`/staff`) | DONE | TenantAdmin, HqManager, BranchManager |
| Staff profile (`/staff/$staffId`) | DONE | TenantAdmin, HqManager, BranchManager |
| Settings (`/settings`) | DONE | SuperAdmin, TenantAdmin |
| Reports (`/reports`) | DONE | TenantAdmin, BranchOwner, HqManager |
| Platform Analytics (`/analytics`) | DONE | SuperAdmin |
| Tenant Management (`/tenants`) | DONE | SuperAdmin |
| Tenant Detail (`/tenants/$tenantId`) | DONE | SuperAdmin |
| Help and Support (`/help`) | DONE | SuperAdmin |

## NOT DONE (with role owner)

| Missing Page/Module | Status | Role Owner |
|---|---|---|
| *(none — all pages implemented)* | — | — |

## PARTIAL (exists but still incomplete)

| Page/Module | Current | Missing | Role Owner |
|---|---|---|---|
| *(none — all modules complete)* | — | — | — |

## Backend Dependencies (Out of Frontend Scope)

| Item | Backend Gap | Frontend Status |
|---|---|---|
| Orders module integration | API wiring + data persistence not connected yet | Frontend COMPLETE (currently mock-data driven) |
| Consumption sold-today menu feed | Menu feed endpoint not wired to frontend yet | Frontend COMPLETE |
| Return resolution history timeline | Timeline data/history endpoint not wired yet | Frontend COMPLETE |
| Bell notifications API (read/unread, mark all read) | Notification state endpoints not fully wired | Frontend UI exists |
| Supply Request detail deep integration | Detail endpoint wiring still pending | Frontend COMPLETE (sample-backed detail) |

## CLEANUP NEEDED

| Item | Status | Owner |
|---|---|---|
| Duplicate marketing sources (`kettan.client/src/features/marketing/*` vs `market/*`) | TODO | TenantAdmin/Product owner decision |
| `.new.tsx` marketing variants still present | TODO | Frontend dev |

## Decision Lock (Order Flow)

- Final direction: **single transaction, status-driven flow** inside Order Processing.
- Separate Picking/Shipping pages are not required for current scale and timeline.
- If order volume later demands it, queue pages can be enabled as optional operational views.

## QA Checklist (Orders Role-Based Active Tabs)

1. Start frontend and open `/orders` as **HqManager** or **TenantAdmin**; expected default Active tab is **Pending Approval**.
2. Open `/orders` as **HqStaff**; expected default Active tab is **Approved**.
3. While in Active mode, click each status chip (Pending Approval, Approved, Processing, Picking, Packed); expected result is list filtered to that status.
4. For **Processing** and **Packed**, current mock dataset may show an empty state; expected message is “No orders match the selected filters.”
5. Switch to History mode using the top-right mode toggle; expected behavior is history status dropdown appears and view switches to table mode.
6. Apply a history status filter (for example Delivered or Rejected); expected result is rows match that selected history status only.
7. Confirm search, date range, and sort still affect the currently selected status filter in both Active and History modes.
8. Click any row/card and confirm navigation to `/orders/$orderId` detail route still works.
