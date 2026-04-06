# Kettan — Frontend Blueprint

> Every page, every table, every component. The definitive map.

---

## Table of Contents

1. [Final Sidebar Navigation](#1-sidebar)
2. [Complete Route Map](#2-routes)
3. [Page-by-Page Breakdown](#3-pages)
4. [Component Audit](#4-components)

---

## 1. Final Sidebar Navigation {#1-sidebar}

### Tenant Admin / HQ Manager / HQ Staff
```
📊 Dashboard                    /
📋 Orders                       /orders
📦 HQ Inventory                 /hq-inventory
☕ Menu & Recipes                /menu                    ← NEW
📝 Consumption Logging          /consumption             ← NEW
🏪 Branches                     /branches
👥 Staff Directory              /staff
↩️ Returns                      /returns                 ← NEW
📈 Reports & Finance            /reports
🏢 Company Profile              /company-profile
⚙️ Settings                     /settings
```

### Branch Owner / Branch Manager
```
📊 Dashboard                    /
📋 My Orders                    /orders
📦 Branch Inventory             /branch-inventory/$branchId
📝 Consumption Logging          /consumption             ← NEW
↩️ Returns                      /returns                 ← NEW
📈 Reports                      /reports
```

### Super Admin
```
📊 Platform Dashboard           /
🏢 Tenant Management            /tenants                 ← NEW
❓ Help & Support               /support                 ← NEW
📜 Audit Logs                   /audit-logs              ← NEW (Tier 2)
💳 Billing                      /billing                 ← NEW (Tier 2)
```

> [!NOTE]
> Items visible per role are filtered by the existing `allowedRoles` array on each `NavItem` in `Sidebar.tsx`. No new layout component needed — just update the `MAIN_NAV` array.

---

## 2. Complete Route Map {#2-routes}

### Existing Routes (Keep/Modify)
| Route | Page | Status |
|---|---|---|
| `/` | DashboardPage | ✅ Exists |
| `/login` | LoginPage | ✅ Exists |
| `/orders` | OrdersPage | ✅ Exists — minor tweaks |
| `/orders/new` | NewOrderRequestPage | ✅ Exists |
| `/orders/$orderId` | OrderDetailPage | ✅ Exists |
| `/orders/$orderId/tracking` | OrderTrackingPage | 🔧 **REWRITE** — remove map, add status timeline |
| `/orders/active-tracking` | GlobalTrackingPage | ❌ **DELETE** — replaced by status-based tracking |
| `/hq-inventory` | InventoryPage | ✅ Exists — add Type/Category tabs |
| `/hq-inventory/add` | AddInventoryPage | ✅ Exists — add type/category dropdowns |
| `/hq-inventory/$itemId` | InventoryItemProfilePage | ✅ Exists — add batch table, stock-in/out |
| `/branch-inventory/$branchId` | BranchInventoryDetailPage | ✅ Exists |
| `/branches` | BranchesPage | ✅ Exists |
| `/branches/add` | AddBranchPage | ✅ Exists — add open/close time |
| `/branches/$branchId` | BranchProfilePage | ✅ Exists — add staff roster section |
| `/staff` | StaffPage | ✅ Exists — rename from HR to Staff Directory |
| `/staff/add` | AddStaffPage | ✅ Exists |
| `/staff/$staffId` | StaffProfilePage | ✅ Exists |
| `/company-profile` | CompanyProfilePage | ✅ Exists |
| `/settings` | SettingsPage | 🔧 **BUILD OUT** — currently placeholder |
| `/reports` | ReportsPage | ✅ Exists — add new tabs |

### New Routes (To Build)
| Route | Page | Priority |
|---|---|---|
| `/menu` | MenuItemsPage | Tier 1 |
| `/menu/add` | AddMenuItemPage | Tier 1 |
| `/menu/$menuItemId` | MenuItemProfilePage | Tier 1 |
| `/consumption` | ConsumptionLoggingPage | Tier 1 |
| `/returns` | ReturnsPage | Tier 1 |
| `/returns/$returnId` | ReturnDetailPage | Tier 1 |
| `/tenants` | TenantManagementPage | Tier 1 (Super Admin) |
| `/tenants/$tenantId` | TenantDetailPage | Tier 1 (Super Admin) |
| `/support` | HelpSupportPage | Tier 2 |
| `/audit-logs` | AuditLogsPage | Tier 2 |
| `/billing` | BillingPage | Tier 2 |

---

## 3. Page-by-Page Breakdown {#3-pages}

---

### 📊 DASHBOARD — `/`

**Status**: ✅ Exists — no major changes needed

| Section | Component | What It Shows |
|---|---|---|
| Greeting | Inline | "Good morning, {name} 👋" |
| Stat Cards (4) | `StatCard` × 4 | Pending Orders, Low Stock Items, Active Shipments, Pending Returns |
| Chart | `DashboardChart` | Fulfillment trend line chart |
| Side Panel | `BranchPerformance` or `FulfillmentStepper` | Role-dependent |
| Activity Table | `DataTable` | Recent order activity |
| Alerts Panel | `InventoryAlerts` | Low stock warnings |

**Existing sub-components**: `BranchPerformance`, `DashboardChart`, `FulfillmentStepper`, `InventoryAlerts` — all exist ✅

---

### 📋 ORDERS — `/orders`

**Status**: ✅ Exists — minor tweaks

#### Main Page (`/orders`)

| Section | Details |
|---|---|
| **Stat Cards** (4) | Pending Requests, Orders Packing, In Transit, Total Fulfillment Cost |
| **Filter Bar** | Branch dropdown, Date range picker |
| **Action Button** | "New Supply Request" → navigates to `/orders/new` |
| **Status Tabs** | All Orders · Pending · Approved · Picking · Packed · Dispatched · Delivered |
| **DataTable** | Orders list |

**Orders Table Columns**:
| Column | Width | Content |
|---|---|---|
| Order ID | 120px | `#ORD-8891` (monospace, linked) |
| Branch | 1.5fr | Branch name |
| Items | 100px | "14 SKUs" |
| Est. Cost | 120px | `₱8,540.00` |
| Status | 120px | Chip with color |
| Date Requested | 120px | Formatted date |
| Actions | 100px | "Manage" button → `/orders/$orderId` |

#### Order Detail Page (`/orders/$orderId`)

**Status**: ✅ Exists — good shape

| Section | Details |
|---|---|
| **Header** | Back button, Order ID (monospace), Status chip, action buttons |
| **Action Buttons** | Reject Order, Approve & Send to Packing, Track Order — **role-dependent visibility** |
| **Fulfillment Stepper** | `OrderFulfillmentStepper` — visual pipeline: Requested → Approved → Picking → Packed → Dispatched → Delivered |
| **Left Panel** (3.5 cols) | `OrderDetailsPanel` — branch info, request date, requester, urgency |
| **Right Panel** (8.5 cols) | Item Reconciliation `DataTable` |

**Item Reconciliation Table Columns**:
| Column | Content |
|---|---|
| Requested Item | Item name |
| HQ Stock | Available qty (red if insufficient) |
| Requested | Requested qty |
| Availability | Chip: Available / Low Stock / Out of Stock |
| Approved Qty | Editable input (HQ Manager only) |

**Status-dependent action buttons**:
| Order Status | Buttons Shown | Who Sees |
|---|---|---|
| PendingApproval | Reject Order, Approve & Send to Packing | HQ Manager |
| Processing/Picking | Mark as Packed | HQ Staff |
| Packed | Dispatch (opens courier/vehicle selection) | HQ Staff |
| Dispatched/InTransit | Confirm Delivery | Branch Manager |
| Delivered | File Return | Branch Manager |

#### Order Tracking Page (`/orders/$orderId/tracking`)

**Status**: 🔧 **REWRITE** — remove Leaflet map, replace with status timeline

| Section | Details |
|---|---|
| **Header** | Back button, Order ID, current status chip |
| **Left Column** (4 cols) | `DeliveryDetailsPanel` — courier info, vehicle info, ETA |
| **Right Column** (8 cols) | **`OrderStatusTimeline`** ← **NEW COMPONENT** |

**OrderStatusTimeline** shows:
```
✅ Request Submitted       — Apr 5, 9:00 AM — by Maria Santos (Branch Manager)
✅ Approved by HQ           — Apr 5, 10:15 AM — by John Cruz (HQ Manager)
✅ Picking Started          — Apr 5, 11:00 AM — by Ana Reyes (HQ Staff)  
✅ Packed & Ready           — Apr 5, 1:30 PM — by Ana Reyes (HQ Staff)
✅ Dispatched               — Apr 5, 2:00 PM — Courier: Juan | Vehicle: ABC-1234 (Van)
🔵 In Transit              — Est. arrival: Apr 5, 5:00 PM
⬜ Delivered                — Awaiting branch confirmation
```

> [!IMPORTANT]
> **Delete**: `TrackingMap.tsx`, `GlobalTrackingPage.tsx`, all `react-leaflet` imports. Remove the `/orders/active-tracking` route. Uninstall `react-leaflet` and `leaflet` packages.

#### New Order Request Page (`/orders/new`)

**Status**: ✅ Exists — no changes needed

---

### 📦 HQ INVENTORY — `/hq-inventory`

**Status**: ✅ Exists — needs enhancement

#### Main Page (`/hq-inventory`)

| Section | Details |
|---|---|
| **Stat Cards** (4) | Total Active SKUs, Low Stock Alerts, Pending Restocks, Inventory Value |
| **Filter/Action Bar** | Search, Type dropdown, Category dropdown, "Add Item" button |
| **Category Tabs** | All · *(dynamically rendered from tenant's ItemCategories)* |
| **DataTable** or **Card Grid** | Inventory items (toggle via `ViewToggle`) |

**Inventory Table Columns**:
| Column | Content |
|---|---|
| SKU | `BN-ARB-001` (monospace) |
| Name | Item name (linked → `/hq-inventory/$itemId`) |
| Type | "Raw Material" chip |
| Category | "Beans" chip |
| Stock | Current total (sum of batches) |
| UOM | kg, L, pcs |
| Unit Cost | `₱850.00` |
| Status | In Stock / Low Stock / Out of Stock |
| Actions | "View" button |

> [!TIP]
> The **Type and Category dropdowns** are populated from the `ItemTypes` and `ItemCategories` API. Category dropdown filters based on selected Type (cascading filter).

#### Add Inventory Page (`/hq-inventory/add`)

**Status**: ✅ Exists — needs type/category dropdowns added

| Form Field | Type | Source |
|---|---|---|
| Item Name | TextField | User input |
| SKU | TextField | User input |
| **Type** | Dropdown | **From ItemTypes API** ← NEW |
| **Category** | Dropdown | **From ItemCategories API (filtered by Type)** ← NEW |
| Unit of Measure | Dropdown | kg, L, pcs, boxes, sachets |
| Unit Cost | Number TextField | User input |
| Selling Price | Number TextField (optional) | User input |
| Reorder Threshold | Number TextField | User input |
| **Is Bundle?** | Switch/Toggle | If true, show bundle items section ← NEW |
| Image | Upload (Cloudinary) | Optional |

**If Is Bundle = true**: Show `BundleItemsEditor` — a sub-table where user adds child items + quantity per bundle unit.

#### Inventory Item Profile Page (`/hq-inventory/$itemId`)

**Status**: ✅ Exists — needs expansion

| Section | Details |
|---|---|
| **Header** | Avatar, Item name, SKU chip, Status chip, Type/Category chips |
| **Action Buttons** | "Receive Stock" (stock-in), "Adjust Stock" (stock-out), Save Changes |
| **Tab 1: Configuration** | Form fields: Name, SKU, Type, Category, UOM, Unit Cost, Threshold |
| **Tab 2: Batch Inventory** ← NEW | DataTable of all batches for this item |
| **Tab 3: Transaction Ledger** ← NEW | DataTable of all InventoryTransactions |

**Batch Inventory Table Columns**:
| Column | Content |
|---|---|
| Batch # | `BATCH-2026-04-001` |
| Location | "HQ Warehouse" or branch name |
| Qty Remaining | 25.00 kg |
| Expiry Date | Apr 30, 2026 |
| Age | "21 days old" |
| Status | Fresh / Expiring Soon / Expired |

**Transaction Ledger Table Columns**:
| Column | Content |
|---|---|
| Date | Timestamp |
| Type | Restock / Consumption / Transfer / Adjustment |
| Qty Change | +50.00 or -18.00 |
| Batch | Batch # |
| By | User name |
| Remarks | "Received from supplier" |

**Stock-In Dialog** (opens when "Receive Stock" clicked):
| Field | Type |
|---|---|
| Quantity | Number input |
| Batch Number | TextField |
| Expiry Date | Date picker |
| Supplier Name | TextField (free text) |
| Remarks | TextField (optional) |

**Stock-Out Dialog** (opens when "Adjust Stock" clicked):
| Field | Type |
|---|---|
| Quantity to Deduct | Number input |
| Reason | Dropdown: Damaged, Expired, Consumed, Other |
| Remarks | TextField (optional) |
*System auto-selects oldest batch (FIFO)*

---

### ☕ MENU & RECIPES — `/menu` ← NEW

#### Main Page (`/menu`)

| Section | Details |
|---|---|
| **Filter Bar** | Search, Category dropdown (Coffee, Frappe, Food, etc.), "Add Menu Item" button |
| **DataTable** | Menu items list |

**Menu Items Table Columns**:
| Column | Content |
|---|---|
| Name | "Iced Americano (Medium)" (linked → `/menu/$id`) |
| Category | "Coffee" chip |
| Selling Price | `₱120.00` |
| # Ingredients | "5 items" |
| Status | Active / Inactive |
| Actions | "Manage" button |

#### Add Menu Item Page (`/menu/add`)

| Form Section | Fields |
|---|---|
| **Basic Info** | Name, Category (dropdown), Selling Price, Status (Active/Inactive) |
| **Recipe Builder** ← KEY FEATURE | Interactive table to add ingredients |

**Recipe Builder Table** (inline editing):
| Column | Content |
|---|---|
| Ingredient | Dropdown → selects from Inventory Items (only Raw Material / Consumable types) |
| Qty Per Unit | Number input (e.g., 0.018) |
| UOM | Auto-filled from selected Item's UOM |
| Remove | ❌ button |
| + Add Row | Button at bottom |

#### Menu Item Profile Page (`/menu/$menuItemId`)

Same as Add page but pre-populated, with Save Changes and Delete buttons.

---

### 📝 CONSUMPTION LOGGING — `/consumption` ← NEW

#### Main Page (`/consumption`)

| Section | Details |
|---|---|
| **Header** | "Consumption Logging" title, current branch name |
| **Date & Shift Selector** | Date picker + Shift dropdown (Morning / Afternoon / Evening / Full Day) |
| **Method Tabs** | **Sales Deduction** · **Direct Entry** · **Physical Count** |

**Tab 1: Sales Deduction** (primary — this is the main feature):
| Section | Details |
|---|---|
| Menu items list | DataTable of all active menu items with a "Qty Sold" input column |
| Preview panel | Real-time calculation: "50 Americanos = 0.9kg beans + 10L water + 50 cups + 50 lids + 50 straws" |
| Submit button | "Log Consumption & Deduct" — opens confirmation dialog showing total deductions |

**Sales Deduction Table Columns**:
| Column | Content |
|---|---|
| Menu Item | "Iced Americano (Medium)" |
| Category | "Coffee" |
| Selling Price | ₱120.00 |
| **Qty Sold** | **Number input** ← user fills this |
| Total Revenue | Auto-calc: price × qty |

**Tab 2: Direct Entry**:
| Section | Details |
|---|---|
| Item selector | Dropdown of inventory items |
| Quantity | Number input |
| Reason | Dropdown: Daily Usage, Spillage, Complimentary, Other |
| Add to batch | Button to add row to deduction list |
| Deduction list | Running list of items to deduct |
| Submit | "Confirm Direct Deductions" |

**Tab 3: Physical Count**:
| Section | Details |
|---|---|
| **DataTable** | All branch inventory items |
| Column: Expected | System-calculated expected qty |
| Column: **Counted** | **Number input** ← user fills this |
| Column: Variance | Auto-calc: Counted - Expected (highlighted red if negative) |
| Submit | "Submit Stock Count" — flags discrepancies for Branch Manager review |

#### Consumption History sub-section
Below the tabs, a collapsible `DataTable` showing past consumption logs:
| Column | Content |
|---|---|
| Date | Apr 5, 2026 |
| Shift | Morning |
| Method | Sales Deduction |
| Total Items Deducted | 14 items |
| Logged By | Maria Santos |
| Total Revenue | ₱15,240.00 |

---

### 🏪 BRANCHES — `/branches`

**Status**: ✅ Exists — minor additions

#### Main Page (`/branches`)

| Section | Details |
|---|---|
| **Stat Cards** (4) | Monitored Branches, Branches Low on Stock, Total Tracked SKUs, Pending Installations |
| **Filter Bar** | Search, Status dropdown, "Add Branch" button |
| **Branch Cards Grid** | `BranchCard` × N |

**BranchCard** shows: Name, Location, Manager, Staff count, Low stock alert badge, Status (Active/Setup)  
**Click card** → `/branches/$branchId`  
**"View Inventory" button on card** → `/branch-inventory/$branchId`

#### Add Branch Page (`/branches/add`)

**Status**: ✅ Exists — add fields

| Form Field | Type | Status |
|---|---|---|
| Branch Name | TextField | ✅ Exists |
| Address | TextField | ✅ Exists |
| City | TextField | ← NEW |
| Contact Number | TextField | ← NEW |
| **Open Time** | Time picker | ← NEW |
| **Close Time** | Time picker | ← NEW |
| Assigned Owner | Dropdown (from Users with BranchOwner role) | ← NEW |
| Assigned Manager | Dropdown (from Users with BranchManager role) | ✅ Exists |

#### Branch Profile Page (`/branches/$branchId`)

**Status**: ✅ Exists — add tabs

| Tab | Content |
|---|---|
| **Settings** (exists) | Name, Status, Address, Manager dropdown, Owner dropdown, Open/Close time |
| **Staff Roster** ← NEW | DataTable of employees assigned to this branch |
| **Inventory** | Button link → `/branch-inventory/$branchId` |

**Staff Roster Table Columns** (inside branch profile):
| Column | Content |
|---|---|
| Name | Employee full name |
| Position | "Barista", "Cashier", "Shift Lead" |
| Contact | Phone number |
| Date Hired | Formatted date |
| Status | Active / Inactive |

---

### 👥 STAFF DIRECTORY — `/staff`

**Status**: ✅ Exists — rename from "HR & Staff"

#### Main Page (`/staff`)

| Section | Details |
|---|---|
| **Filter Bar** | Search, Role dropdown (All / Barista / Cashier / Shift Lead / etc.), Branch dropdown, "Add Employee" button |
| **Card Grid** | `StaffCard` × N |

**StaffCard** shows: Avatar initials, Name, Position, Branch, Status chip  
**Click card** → `/staff/$staffId`

#### Add Employee Page (`/staff/add`)

| Field | Type |
|---|---|
| First Name | TextField |
| Last Name | TextField |
| Position | Dropdown: Barista, Cashier, Shift Lead, Kitchen Staff |
| Branch Assignment | Dropdown (from branches) — null = HQ |
| Contact Number | TextField |
| Email | TextField (optional — for contact, not login) |
| Date Hired | Date picker |

#### Employee Profile Page (`/staff/$staffId`)

| Section | Details |
|---|---|
| **Header** | Avatar, Name, Position chip, Branch chip, Status chip |
| **Info Section** | All editable fields from Add page |
| **Actions** | Save Changes, Deactivate |

---

### ↩️ RETURNS — `/returns` ← NEW

#### Main Page (`/returns`)

| Section | Details |
|---|---|
| **Stat Cards** (3) | Pending Returns, Resolved This Month, Avg Resolution Time |
| **Status Tabs** | All · Pending · Replaced · Credited · Rejected |
| **DataTable** | Returns list |

**Returns Table Columns**:
| Column | Content |
|---|---|
| Return ID | `RTN-001` |
| Order ID | `ORD-8891` (linked) |
| Branch | "Downtown Main" |
| Items | "3 items" |
| Reason | "Damaged in transit" (truncated) |
| Resolution | Chip: Pending / Replaced / Credited / Rejected |
| Filed | Date |
| Actions | "Review" button → `/returns/$returnId` |

#### Return Detail Page (`/returns/$returnId`)

| Section | Details |
|---|---|
| **Header** | Back button, Return ID, Status chip, Filed by, Date |
| **Order Reference** | Link to original order |
| **Returned Items Table** | Item name, Qty returned, Reason per item |
| **Evidence Photos** | Gallery of uploaded images (Cloudinary) |
| **Resolution Panel** (HQ Manager) | Dropdown: Replace / Credit / Reject, Remarks, Resolve button |
| **Credit Amount** | Auto-calculated if "Credit" selected |

---

### 📈 REPORTS & FINANCE — `/reports`

**Status**: ✅ Exists — expand tabs

#### Main Page (`/reports`)

| Section | Details |
|---|---|
| **Filter Bar** | Branch dropdown, Date range picker, Export dropdown (PDF/CSV), Export button |
| **Tabs** | Overview · Branch Performance · Inventory Reports · Consumption Analytics |

**Tab 1: Overview** (✅ exists):
- Stat Cards: Total Fulfillment Spend, Logistics Expenses, Avg Return Rate, Top Performer
- `FinancialCostChart` (fulfillment vs shipping costs over time)
- `InvoiceLedger` (recent order cost records)

**Tab 2: Branch Performance** (✅ exists):
- `BranchLeaderboardTable` — ranked by Weighted Performance Score
- Columns: Branch, Fulfillment Rate, Return Rate, Delivery Speed, Stock Accuracy, Weighted Score

**Tab 3: Inventory Reports** ← NEW:

| Sub-section | Content |
|---|---|
| **Valuation Cards** | HQ Inventory Value, Total Branch Inventory Value, Combined, Wastage Cost |
| **Movement Log Table** | All InventoryTransactions across all items, filterable by type |
| **EOQ Recommendations Table** | Per-item suggested reorder quantities |

**EOQ Table Columns**:
| Column | Content |
|---|---|
| Item | Name |
| Avg Monthly Demand | 45 kg |
| Current Stock | 12 kg |
| EOQ Suggestion | 25 kg |
| Status | Needs Reorder / Sufficient |

**Tab 4: Consumption Analytics** ← NEW:

| Sub-section | Content |
|---|---|
| **Top Menu Items** | Ranked bar chart — most sold items |
| **Top Ingredients Consumed** | Ranked list — which inventory items are used most |
| **Revenue Summary** | Total sales revenue from logged consumption |

---

### ⚙️ SETTINGS — `/settings`

**Status**: 🔧 Currently placeholder — **BUILD OUT**

#### Main Page (`/settings`)

| Tab | Content |
|---|---|
| **Role Access Control** | Matrix table: rows = roles, columns = modules, cells = checkboxes (View/Create/Edit/Delete) |
| **Inventory Thresholds** | DataTable of items with editable threshold values per branch |
| **Order Approval Rules** | Form: Auto-approve threshold (₱ amount), Toggle for urgent orders bypass |
| **Notification Preferences** | Toggle list: Low stock alerts ✅, Order status changes ✅, Delivery confirmations ✅, Return filings ✅ |
| **Item Types & Categories** | CRUD table for managing Types and nested Categories |
| **Couriers & Vehicles** | CRUD table for managing Couriers and their assigned Vehicles |

**Role Access Matrix Table**:
| Module | TenantAdmin | HQ Manager | HQ Staff | Branch Owner | Branch Manager |
|---|---|---|---|---|---|
| Dashboard | VCUD | V | V | V | V |
| Orders | VCUD | VCU | VCU | V | VCU |
| Inventory | VCUD | VCUD | VCU | V | V |
| ... | ... | ... | ... | ... | ... |

*(V=View, C=Create, U=Update, D=Delete — checkboxes)*

**Courier CRUD Table Columns**:
| Column | Content |
|---|---|
| Name | "Juan Delivery Services" |
| Contact | "+63 917 123 4567" |
| Vehicles | "2 vehicles" (expandable) |
| Status | Active/Inactive |
| Actions | Edit, Deactivate |

**Vehicle Sub-table** (nested under courier):
| Column | Content |
|---|---|
| Plate # | "ABC-1234" |
| Type | Motorcycle / Van / Truck |
| Description | "White L300 Van" |
| Actions | Edit, Remove |

---

### 🏢 COMPANY PROFILE — `/company-profile`

**Status**: ✅ Exists — no changes needed

| Section | Details |
|---|---|
| Header | Company name, location chip, subscription plan chip, ID |
| Org Settings Form | Name, Billing Email, Phone, HQ Address |
| System Limits | Branch limit bar, Staff limit bar |

---

### 🏢 TENANT MANAGEMENT — `/tenants` ← NEW (Super Admin)

#### Main Page (`/tenants`)

| Section | Details |
|---|---|
| **Stat Cards** (3) | Total Tenants, Active Tenants, New This Month |
| **DataTable** | Tenant list |

**Tenants Table Columns**:
| Column | Content |
|---|---|
| Tenant Name | "Philippine Roasters Corp." (linked) |
| Plan | Starter / Growth / Enterprise chip |
| Branches | "12 branches" |
| Users | "45 users" |
| Status | Active / Suspended |
| Since | "Jan 2026" |
| Actions | View, Suspend/Activate |

#### Tenant Detail Page (`/tenants/$tenantId`)

| Section | Details |
|---|---|
| **Header** | Tenant name, plan chip, status |
| **Info** | Read-only overview: branch count, user count, order count |
| **Actions** | Suspend, Activate, Change plan |

---

### ❓ HELP & SUPPORT — `/support` ← NEW (Tier 2)

| Tab | Content |
|---|---|
| **FAQs** | Accordion list of questions/answers, grouped by module |
| **User Manual** | Scrollable guide with anchor links per module |
| **Bug Reports** | Form: Title, Description, Severity, Screenshot upload. DataTable of submitted reports |

---

## 4. Component Audit {#4-components}

### ✅ Existing Components — KEEP

#### Layout Components (`components/Layout/`)
| Component | File | Status |
|---|---|---|
| `AppLayout` | AppLayout.tsx | ✅ Keep |
| `Header` | Header.tsx | 🔧 Update PAGE_TITLES, add bell icon dropdown |
| `Sidebar` | Sidebar.tsx | 🔧 Update MAIN_NAV array |

#### UI Components (`components/UI/`)
| Component | File | Purpose | Status |
|---|---|---|---|
| `BackButton` | BackButton.tsx | Navigation back | ✅ Keep |
| `Button` | Button.tsx | Primary/outlined buttons | ✅ Keep |
| `DataTable` | DataTable.tsx | Generic paginated data table | ✅ Keep |
| `DateRangePicker` | DateRangePicker.tsx | Date range filter | ✅ Keep |
| `Dropdown` | Dropdown.tsx | Select dropdowns | ✅ Keep |
| `FilterAndSort` | FilterAndSort.tsx | Filter toolbar | ✅ Keep |
| `SearchInput` | SearchInput.tsx | Search bar | ✅ Keep |
| `StatCard` | StatCard.tsx | KPI metric cards | ✅ Keep |
| `TablePaginationFooter` | TablePaginationFooter.tsx | Pagination | ✅ Keep |
| `TextField` | TextField.tsx | Text inputs | ✅ Keep |
| `ViewToggle` | ViewToggle.tsx | Table/Card view switch | ✅ Keep |

#### Form Components (`components/Form/`)
| Component | File | Status |
|---|---|---|
| `FormActions` | FormActions.tsx | ✅ Keep |
| `FormDropdown` | FormDropdown.tsx | ✅ Keep |
| `FormTextField` | FormTextField.tsx | ✅ Keep |

#### Feature Sub-Components — KEEP
| Component | Feature | Status |
|---|---|---|
| `BranchPerformance` | dashboard | ✅ Keep |
| `DashboardChart` | dashboard | ✅ Keep |
| `FulfillmentStepper` | dashboard | ✅ Keep |
| `InventoryAlerts` | dashboard | ✅ Keep |
| `InventoryCard` | hq-inventory | ✅ Keep |
| `InventoryTable` | hq-inventory | ✅ Keep (shared with branch inventory) |
| `BranchCard` | branches | ✅ Keep |
| `StaffCard` | staff | ✅ Keep |
| `BranchLeaderboardTable` | reports | ✅ Keep |
| `FinancialCostChart` | reports | ✅ Keep |
| `InvoiceLedger` | reports | ✅ Keep |
| `OrderFulfillmentStepper` | orders | ✅ Keep |
| `OrderDetailsPanel` | orders | ✅ Keep |
| `StatusAlertIcon` | orders | ✅ Keep |
| `PartialFulfillmentAlert` | orders | ✅ Keep |
| `SelectedItemsTable` | orders | ✅ Keep |
| `InventoryItemCard` | orders | ✅ Keep |
| `InventoryItemDetails` | orders | ✅ Keep |
| `InventorySelectionModal` | orders | ✅ Keep |
| `ActiveOrderCard` | orders | ⚠️ Repurpose (no longer for map, use in order list) |
| `DeliveryDetailsPanel` | orders | 🔧 Update (show courier + vehicle from entities) |

---

### ❌ Components to DELETE

| Component | Reason |
|---|---|
| `TrackingMap.tsx` | Map removed |
| `GlobalTrackingPage.tsx` | Map removed |

---

### 🆕 NEW Components to Build

#### UI Components (`components/UI/`)

| Component | Purpose | Used By |
|---|---|---|
| **`ToastProvider`** | Snackbar wrapper for action confirmations | App-wide |
| **`NotificationBell`** | Bell icon + dropdown in header for alerts | Header |
| **`StatusTimeline`** | Vertical timeline with icons/timestamps | Order Tracking |
| **`ConfirmDialog`** | "Are you sure?" confirmation modal | Stock-out, Delete, Submit |
| **`TabPanel`** | Simple tab content wrapper (if not using MUI's directly) | Multiple pages |
| **`TimePicker`** | Time input field | Branch: open/close hours |
| **`ImageUpload`** | Cloudinary upload component | Returns (evidence), Inventory (item image) |
| **`Switch`** | Toggle switch (styled) | Settings toggles, Is Bundle |
| **`AccessMatrix`** | Role × Module permission grid | Settings |
| **`EmptyState`** | "No data" placeholder graphic | All tables |

#### Feature Components

| Component | Feature | Purpose |
|---|---|---|
| **`OrderStatusTimeline`** | orders | Replace map — vertical status history with timestamps |
| **`DispatchDialog`** | orders | Modal for selecting Courier + Vehicle during dispatch |
| **`RecipeBuilder`** | menu | Inline table for adding ingredients to a menu item |
| **`SalesDeductionForm`** | consumption | Table of menu items with qty sold inputs |
| **`DirectEntryForm`** | consumption | Item selector + qty + reason for manual deduction |
| **`PhysicalCountForm`** | consumption | Expected vs Counted table with variance |
| **`DeductionPreview`** | consumption | Shows calculated ingredient deductions before confirming |
| **`ConsumptionHistory`** | consumption | Past consumption log table |
| **`StockInDialog`** | hq-inventory | Dialog form for receiving stock |
| **`StockOutDialog`** | hq-inventory | Dialog form for stock adjustment/deduction |
| **`BatchTable`** | hq-inventory | Table of batches for an item |
| **`TransactionLedger`** | hq-inventory | Table of inventory transactions |
| **`ReturnItemsTable`** | returns | Items being returned with qty and reason |
| **`ReturnResolutionPanel`** | returns | HQ Manager resolution form |
| **`EvidenceGallery`** | returns | Photo evidence display |
| **`CourierVehicleCRUD`** | settings | CRUD table for managing couriers + nested vehicles |
| **`TypeCategoryCRUD`** | settings | CRUD table for item types and nested categories |
| **`ThresholdEditor`** | settings | Editable threshold table |
| **`NotificationToggleList`** | settings | Toggle switches for notification preferences |
| **`TenantCard`** or **`TenantTable`** | tenants | Super Admin tenant listing |
| **`StaffRosterTable`** | branches | Employee list inside branch profile |

---

## Component Count Summary

| Category | Existing | Delete | New | Modify |
|---|---|---|---|---|
| Layout | 3 | 0 | 0 | 2 (Header, Sidebar) |
| UI (shared) | 11 | 0 | 10 | 0 |
| Form | 3 | 0 | 0 | 0 |
| Feature sub-components | 21 | 1 (TrackingMap) | 21 | 2 (DeliveryDetailsPanel, ActiveOrderCard) |
| **Pages** | **21** | **1** (GlobalTracking) | **11** | **5** |
| **TOTAL** | **59** | **2** | **42** | **9** |

---

## Open Questions

> [!IMPORTANT]
> Just two small questions:

1. **Consumption Logging access for Branch Owner**: Should Branch Owners also be able to *view* (but not create) consumption logs? Or is it purely a Branch Manager feature?

2. **Settings page access**: Should HQ Manager have read-only access to some settings (like viewing thresholds), or is Settings strictly Tenant Admin only?
