# Kettan — System Analysis & Action Items

> Codebase audit results, business logic issues found, and prioritized work remaining.

> **Last updated**: April 18, 2026

---

## 1. Full Route Audit (What Exists in Code)

### 27 Routes Registered in `router.tsx`

| Route | Page | Status |
|---|---|---|
| `/login` | LoginPage | ✅ Done |
| `/` | DashboardPage | ✅ Done |
| `/branches` | BranchesPage | ✅ Done |
| `/branches/add` | AddBranchPage | ✅ Done |
| `/branches/$branchId` | BranchProfilePage (5 tabs: details, staff, activity, transactions, inventory) | ✅ Done |
| `/staff` | StaffPage | ✅ Done |
| `/staff/$staffId` | StaffProfilePage | ✅ Done |
| `/hq-inventory` | InventoryPage | ✅ Done |
| `/hq-inventory/transaction` | InventoryTransactionPage | ✅ Done |
| `/hq-inventory/categories` | ItemCategoriesPage | ✅ Done |
| `/hq-inventory/vehicles` | VehicleManagementPage | ✅ Done |
| `/hq-inventory/$itemId` | InventoryItemProfilePage | ✅ Done |
| `/company-profile` | CompanyProfilePage | ✅ Done |
| `/settings` | SettingsPage | ✅ Done |
| `/reports` | ReportsPage | ✅ Done |
| `/orders` | OrdersPage | ✅ Done |
| `/orders/new` | NewOrderRequestPage | ✅ Done |
| `/orders/$orderId` | OrderDetailPage | ✅ Done |
| `/supply-requests` | SupplyRequestsPage | ✅ Done |
| `/consumption` | ConsumptionPage | ✅ Done |
| `/returns` | ReturnsPage | ✅ Done |
| `/returns/new` | ReturnCreatePage | ✅ Done |
| `/returns/$returnId` | ReturnDetailPage | ✅ Done |
| `/audit-logs` | AuditLogsPage | ✅ Done |
| `/menu` | MenuItemsPage | ✅ Done |
| `/menu/add` | AddMenuItemPage | ✅ Done |
| `/menu/categories` | MenuCategoriesPage | ✅ Done |
| `/menu/$menuItemId` | MenuItemProfilePage | ✅ Done |

### Sidebar Items With No Route

| Sidebar Item | Route | Status |
|---|---|---|
| Platform Analytics | `/analytics` | ❌ No route, no page |

---

## 2. Pages That Need to Be Created

| Page | Route | Priority | Reason |
|---|---|---|---|
| **Supply Request Detail** | `/supply-requests/$requestId` | 🔴 High | Branch users can't view/track submitted requests |
| **Supply Request Edit Draft** | Modal or inline on detail page | 🟡 Medium | Editing auto-drafted/manual drafts before submission |
| **Super Admin Dashboard** | `/` (role-conditional) | 🟡 Medium | Super Admin sees tenant dashboard currently |
| **Tenant Management** | `/tenants` | 🟡 Medium | In sidebar plan but no route |
| **Tenant Detail** | `/tenants/$tenantId` | 🟡 Medium | View/manage individual tenant |
| **Help & Support** | `/help` | 🟢 Low | FAQs + bug report form, can be static |
| **Platform Analytics** | `/analytics` | 🟢 Low | In sidebar, no page |

### Partial Pages (Exist but Incomplete)

| Page | What Exists | What's Missing |
|---|---|---|
| Supply Requests | List + inline create form | Detail page, edit draft, item picker |
| Orders | List + detail + new request | Role-based default status tabs |
| Consumption | Log form + history table | (Complete for current scope) |
| Notifications | Bell icon in header | Backend wiring (mark read/unread) |

---

## 3. Business Logic Issues Found in Code

### Issue 1: Courier field in wrong page
- **Where**: `NewOrderRequestPage.tsx` line 185-191
- **Problem**: Lets you pick a Courier Vehicle during request creation
- **Rule**: Courier/vehicle assignment happens at **Step 4: Dispatch**, not during creation
- **Fix**: Remove "Courier Vehicle" dropdown. Add it to Order Detail page dispatch action instead.

### Issue 2: NewOrderRequestPage identity
- **Where**: `/orders/new` — labeled "New Internal Request"
- **Problem**: Lives under Orders (HQ-side) but functions like a supply request form
- **Decision**: This page is for **HQ-initiated pushes** — HQ proactively sending supplies to a branch WITHOUT a branch request (new branch setup, seasonal loadout, etc.)
- **Action**: Keep it. Differentiate from Supply Requests clearly: this is HQ-initiated, not branch-initiated.

### Issue 3: "Total Revenue" label
- **Where**: `OrdersPage.tsx` line 305
- **Problem**: Shows "Total Revenue" as a stat card. There is NO revenue in internal transfers.
- **Fix**: Change to **"Total Fulfillment Cost"**

### Issue 4: Status names don't match docs
- **Code uses**: `Pending`, `Approved`, `Packing`, `Dispatched`, `Delivered`, `Declined`, `Suspended`
- **Docs define**: `PendingApproval`, `Processing`, `Picking`, `Packed`, `Dispatched`, `InTransit`, `Delivered`, `Rejected`
- **Fix**: Align to canonical statuses defined in `Kettan_Business_Logic.md` Section 11

### Issue 5: Supply Requests uses raw Item ID input
- **Where**: `SupplyRequestsPage.tsx` — create form
- **Problem**: Branch Manager types a raw numeric Item ID
- **Fix**: Replace with item picker modal (reuse `InventorySelectionModal` from `/orders/new`)

---

## 4. Prioritized Build Order

### 🔴 Week 1: Core Fixes + Supply Request Detail
- [ ] Fix status alignment across all order/supply-request pages
- [ ] Fix `NewOrderRequestPage` — remove courier field
- [ ] Fix "Total Revenue" → "Total Fulfillment Cost" on OrdersPage
- [ ] Build Supply Request Detail page (`/supply-requests/$requestId`)
- [ ] Improve Supply Requests create form (item picker instead of raw ID)

### 🟡 Week 2: Complete the Order Lifecycle UX
- [ ] Add role-based default tabs on OrdersPage
- [ ] Supply Request Edit Draft functionality
- [ ] OrderDetailPage: add pick/pack/dispatch action buttons per status
- [ ] Ensure OrderFulfillmentStepper reflects canonical status list

### 🟡 Week 3: Super Admin Side
- [ ] Super Admin Dashboard (role-conditional on `/`)
- [ ] Tenant Management list page (`/tenants`)
- [ ] Tenant Detail page (`/tenants/$tenantId`)

### 🟢 Week 4: Polish & Backend Prep
- [ ] Help & Support page (static)
- [ ] Platform Analytics page
- [ ] Final UI polish, notification dropdown cleanup
- [ ] Ensure all mock data shapes match planned backend DTOs
- [ ] Prepare API service layer structure for backend integration

---

## 5. Confirmed Decisions

| Decision | Answer |
|---|---|
| Supply Requests vs Orders sidebar | Two separate items. Branch sees "Supply Requests". HQ sees "Order Processing". |
| Branch Inventory page | Not separate — lives inside Branch Profile page as a tab |
| Consumption correction | No editing past logs. Log new entry with corrective remarks. |
| Notifications center page | Dropdown only — no full page. |
| `/orders/new` purpose | HQ-initiated push (proactive supply send, not branch request) |
| Order flow architecture | Single transaction, status-driven. No separate picking/shipping pages. |

---

*Generated: April 18, 2026*
