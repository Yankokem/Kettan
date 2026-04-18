# Frontend Done vs Not Done (Simple)

Last updated: 2026-04-18

## DONE (with role owner)

| Page/Module | Status | Role Owner |
|---|---|---|
| Login (`/login`) | DONE | All users (entry point) |
| Dashboard (`/`) | DONE | SuperAdmin, TenantAdmin, HqManager, HqStaff, BranchManager, BranchOwner |
| Supply Requests (`/supply-requests`) | DONE | BranchManager, BranchOwner |
| Consumption (`/consumption`) | DONE | BranchManager, BranchOwner |
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

## NOT DONE (with role owner)

| Missing Page/Module | Status | Role Owner |
|---|---|---|
| Platform Analytics page (`/analytics`) | NOT DONE | SuperAdmin |
| Platform Dashboard page (Super Admin) | NOT DONE | SuperAdmin |
| Tenant Management list page | NOT DONE | SuperAdmin |
| Tenant Detail page | NOT DONE | SuperAdmin |
| Help and Support page | NOT DONE | SuperAdmin |
| Supply Request detail page (`/supply-requests/$id`) | NOT DONE | BranchManager, BranchOwner, HqManager |
| Supply Request edit draft page | NOT DONE | BranchManager, BranchOwner |
| Return resolution backend history timeline | NOT DONE | HqManager, HqStaff |
| Notifications center page | NOT DONE | All tenant users |
| Bell notifications fully API-wired (read/unread, mark all read) | NOT DONE | All tenant users |

## PARTIAL (exists but still incomplete)

| Page/Module | Current | Missing | Role Owner |
|---|---|---|---|
| Supply Requests | List + create + submit done | Detail + edit draft | BranchManager, BranchOwner |
| Consumption | Log + list done | Detail + correction flow | BranchManager |
| Orders | List + detail + request done | Role-based default status tabs (HQ Manager: PendingApproval, HQ Staff: Approved/Picking) | HqManager, HqStaff |
| Notifications | UI bell exists | Backend wiring not complete | All tenant users |

## CLEANUP NEEDED

| Item | Status | Owner |
|---|---|---|
| Duplicate marketing sources (`kettan.client/src/features/marketing/*` vs `market/*`) | TODO | TenantAdmin/Product owner decision |
| `.new.tsx` marketing variants still present | TODO | Frontend dev |

## Decision Lock (Order Flow)

- Final direction: **single transaction, status-driven flow** inside Order Processing.
- Separate Picking/Shipping pages are not required for current scale and timeline.
- If order volume later demands it, queue pages can be enabled as optional operational views.
