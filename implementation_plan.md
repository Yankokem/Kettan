# Kettan: Final System Blueprint

> **Context**: Solo developer, 1-month deadline. Every decision below is filtered through "can one person build this in 4 weeks?"

---

## Table of Contents
1. [The Big Answer: Is Money Involved in Branch Orders?](#1-the-big-answer)
2. [Inventory Management — Complete Model](#2-inventory-management)
3. [Consumption Logging — Menu-to-Inventory Bridge](#3-consumption-logging)
4. [Order Processing — Step-by-Step Flow](#4-order-processing)
5. [Order Tracking — Status-Based (No Maps, No Courier User)](#5-order-tracking)
6. [Branch Management](#6-branch-management)
7. [Settings & Configuration](#7-settings--configuration)
8. [Finance & Reports](#8-finance--reports)
9. [Returns Management — Simplified](#9-returns-management)
10. [HR & Staff Management — Clarified](#10-hr--staff-management)
11. [Super Admin Side](#11-super-admin-side)
12. [Final Role Matrix](#12-final-role-matrix)
13. [Cut List — What NOT to Build](#13-cut-list)

---

## 1. The Big Answer: Is Money Involved in Branch Orders? {#1-the-big-answer}

> [!IMPORTANT]
> **No. Branch orders are internal transfers, not purchases.**

Here's the real-world logic: In a coffee chain, **HQ owns all inventory**. When a branch "orders" supplies, they're requesting an internal allocation — not buying from HQ. Think of it like a corporate distribution center shipping supplies to its own stores.

### What this means for Kettan:
- **No payment flow** between branches and HQ. No invoices for internal orders.
- **Cost is tracked** (for accounting/reporting purposes), but no money changes hands.
- Each order has a **fulfillment cost** = sum of (unit cost × quantity) of all items shipped. This is for **reporting only** — so the Tenant Admin can see "Branch X consumed ₱45,000 worth of supplies this month."
- The only **real money** in the system is the **tenant's subscription** (PayMongo) to your SaaS platform.

### Why this is the right call:
1. Real chains operate this way — branches don't "buy" from their own HQ
2. It removes the need for a payment module within tenant operations (huge time saver)
3. You still get financial reporting because you track unit costs on each item

---

## 2. Inventory Management — Complete Model {#2-inventory-management}

### 2.1 Inventory Item Structure

An inventory item (the `Items` table) represents a **product that a coffee chain stocks and distributes**. Here's the complete field model:

| Field | Type | Purpose | Example |
|---|---|---|---|
| `ItemId` | PK | Unique identifier | 1 |
| `TenantId` | FK | Multi-tenant isolation | — |
| `SKU` | string | Stock-keeping unit code | `BN-ARB-001` |
| `Name` | string | Display name | "Arabica Coffee Beans" |
| **`Type`** | enum | **Raw Material** vs **Finished Good** vs **Consumable** vs **Equipment** | `RawMaterial` |
| **`Category`** | string | Grouping within type | "Beans", "Syrups", "Cups", "Lids" |
| `UnitOfMeasure` | enum | How it's counted | `kg`, `L`, `pcs`, `boxes`, `sachets` |
| **`UnitCost`** | decimal | Cost per unit (for reporting) | ₱850.00/kg |
| **`SellingPrice`** | decimal (nullable) | Only for items sold directly (merch, bottled drinks) | ₱120.00 |
| `DefaultThreshold` | decimal | Low-stock alert trigger level | 5.0 |
| **`IsBundle`** | bool | Whether this item is a bundle | `false` |
| **`ImageUrl`** | string (nullable) | Product image (Cloudinary) | — |
| `IsActive` | bool | Soft delete | `true` |
| `CreatedAt` | datetime | — | — |

### 2.2 Item Types & Categories — Tenant-Configurable

Both **Types** and **Categories** are tenant-managed lookup tables. The Tenant Admin creates them in a settings/config area, and they appear as dropdown options when adding inventory items. No more free-typing.

#### ItemTypes Table:
```
ItemTypes
├── ItemTypeId (PK)
├── TenantId (FK)
├── Name              — e.g., "Raw Material", "Finished Good", "Consumable", "Equipment"
├── Description       — optional
└── CreatedAt
```

#### ItemCategories Table:
```
ItemCategories
├── ItemCategoryId (PK)
├── TenantId (FK)
├── ItemTypeId (FK)   — categories belong under a type
├── Name              — e.g., "Beans", "Syrups", "Cups"
├── Description       — optional
└── CreatedAt
```

**Relationship**: Type → has many Categories → Items reference both.

The `Items` table gets two FK fields:
- `ItemTypeId` (FK → ItemTypes)
- `ItemCategoryId` (FK → ItemCategories)

**Default seed examples** (auto-created on tenant onboarding):

| Type | Categories |
|---|---|
| Raw Material | Beans, Dairy & Alternatives, Syrups & Sauces, Sweeteners, Powders |
| Finished Good | Bottled Drinks, Pastries & Food, Merchandise |
| Consumable | Cups, Lids, Straws, Sleeves, Napkins |
| Equipment | Machines, Grinders, Accessories |

### 2.4 Bundles

A bundle is a group of items packaged together for ordering convenience. For example, a "New Branch Starter Kit" bundle:

| Bundle: New Branch Starter Kit | Qty |
|---|---|
| Arabica Beans (1kg bags) | 10 |
| Fresh Milk (1L cartons) | 20 |
| Vanilla Syrup (750ml) | 5 |
| Medium Cups (sleeve of 50) | 10 |
| Lids (sleeve of 50) | 10 |

**Implementation**: Create a `BundleItems` junction table:
```
BundleItems
├── BundleItemId (PK)
├── ParentItemId (FK → Items, where IsBundle = true)
├── ChildItemId (FK → Items, the actual item)
└── Quantity (decimal — how many of ChildItem per bundle)
```

When a branch orders 2x "Starter Kit", the system expands it to: 20 bags of beans, 40 cartons of milk, etc. for fulfillment.

### 2.5 Stock-In / Stock-Out (As Tenant Admin / HQ Staff)

#### Stock-In (Receiving goods into HQ warehouse)

**Who**: HQ Staff or HQ Manager  
**When**: Supplies arrive from external suppliers  
**Process**:
1. Navigate to HQ Inventory → "Receive Stock" action
2. Select the Item from the catalog
3. Enter: **Quantity**, **Batch Number** (e.g., `BATCH-2026-04-001`), **Expiry Date**, **Supplier Name** (text field, not a full supplier module)
4. System creates a new `Batch` record with `BranchId = NULL` (meaning it's at HQ)
5. System creates an `InventoryTransaction` of type `Restock` with positive quantity

#### Stock-Out (Consumption or spoilage at HQ)

**Who**: HQ Staff  
**When**: Items are damaged, expired, or consumed at HQ  
**Process**:
1. Navigate to HQ Inventory → "Adjust Stock" action
2. Select Item → system shows available batches (FIFO order)
3. Enter: **Quantity to deduct**, **Reason** (Damaged, Expired, Consumed, Other)
4. System deducts from oldest batch first (FIFO)
5. System creates an `InventoryTransaction` of type `Adjustment` with negative quantity

> [!NOTE]
> The Tenant Admin has full visibility over all inventory movements but typically delegates the actual stock-in/stock-out actions to HQ Staff.

---

## 3. Consumption Logging — Menu-to-Inventory Bridge {#3-consumption-logging}

### The Core Concept

The consumption logging module is **the branch's alternative to a POS**. Instead of ringing up sales in real-time, the Branch Manager logs what was sold/used at the end of a shift, and the system deducts inventory accordingly.

### 3.1 Menu Items (The Recipe System)

Before consumption logging works, the Tenant Admin (or HQ Manager) must create **Menu Items** — the products the branch actually sells to customers.

#### MenuItems Table:
```
MenuItems
├── MenuItemId (PK)
├── TenantId (FK)
├── Name                — e.g., "Iced Americano (Medium)"
├── Category            — e.g., "Coffee", "Frappe", "Food"
├── SellingPrice        — e.g., ₱120.00
├── IsActive
└── CreatedAt
```

#### MenuItemIngredients Table (The Recipe):
```
MenuItemIngredients
├── MenuItemIngredientId (PK)
├── MenuItemId (FK)
├── ItemId (FK → Items, the inventory item it consumes)
├── QuantityPerUnit     — how much of Item is needed per 1 sale
└── UnitOfMeasure       — must match the Item's UnitOfMeasure
```

**Example Recipe — Iced Americano (Medium)**:

| Ingredient (Inventory Item) | Qty Per Unit | UOM |
|---|---|---|
| Arabica Coffee Beans | 0.018 | kg |
| Filtered Water | 0.200 | L |
| Medium Cup | 1 | pcs |
| Medium Lid | 1 | pcs |
| Straw | 1 | pcs |

### 3.2 The Three Deduction Methods

#### Method 1: Direct Consumption Entry
- Branch staff manually enters: "Used 5kg of beans today"
- System deducts from oldest branch batch (FIFO)
- **Best for**: Bulk ingredients hard to tie to specific drinks (e.g., cleaning supplies, sugar refills)

#### Method 2: Sales Count with Recipe Deduction ⭐ (Primary Method)
- Branch Manager enters: "Sold 50 Iced Americanos, 30 Lattes, 15 Croissants"
- System multiplies each sale count × recipe ingredients
- System deducts total from branch inventory (FIFO per item)
- Creates `InventoryTransaction` records of type `Sales_Auto`
- **Best for**: Daily end-of-shift logging

#### Method 3: Physical Stock Count
- Branch staff counts actual stock on hand: "We have 48 cups, 3.2kg beans"
- System compares counted vs expected (based on previous balance minus logged consumption)
- Flags discrepancies: "Expected 50 cups, counted 48 → variance of -2"
- Branch Manager reviews and approves the adjustment
- **Best for**: Weekly/monthly audits

### 3.3 The Step-by-Step Flow

```
1. Tenant Admin creates Menu Items + Recipes (one-time setup)
2. Daily: Branch Manager opens Consumption Logging
3. Selects shift (Morning/Afternoon/Evening) and date
4. Enters sales counts per menu item OR direct usage
5. System calculates total ingredient deductions (preview shown)
6. Branch Manager confirms → system deducts from branch batches (FIFO)
7. If any item drops below threshold → low-stock alert triggered
8. If low-stock → auto-draft supply request created
```

---

## 4. Order Processing — Step-by-Step Flow {#4-order-processing}

> This is the **complete lifecycle** of a supply order from branch request to delivery.

### 4.1 The Full Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────┐
│   Branch     │────▶│   HQ Review  │────▶│   Packing     │────▶│   Dispatch    │────▶│  Delivery  │
│   Request    │     │   & Approve  │     │   at HQ       │     │   Shipped     │     │  Confirmed │
└─────────────┘     └─────────────┘     └──────────────┘     └──────────────┘     └───────────┘
```

### 4.1.1 Do We Need Separate Picking/Shipping Pages?

Short answer for current scope: **no, not required**.

- Kettan uses **one order transaction** from request to delivery.
- Picking, packing, shipping, and delivery are **status transitions** of the same record.
- For a solo build and 1-month timeline, the default implementation is a **single Order Processing flow** with status tabs and detail actions.

Current direction:
- **Order Processing page** = main lifecycle workspace.
- **Order Detail page** = where approve/reject/pick/pack/dispatch/deliver actions are done by role.
- **Picking/Shipping pages** = optional future queue views only if volume grows.

UX note:
- Use role-based default tabs to reduce noise without adding extra pages.
- Example: HQ Manager default tab = `PendingApproval`; HQ Staff default tab = `Approved` or `Picking`.

### 4.2 Step-by-Step

#### Step 1: Branch Creates Supply Request
**Who**: Branch Manager (or auto-created by low-stock detection)  
**Action**:
1. Branch Manager navigates to Orders → "New Supply Request"
2. Selects items from the tenant's inventory catalog
3. Enters requested quantities per item
4. Can select a bundle (system auto-expands items)  
5. Sets urgency: `Normal` or `Urgent`
6. Submits the request

**Status**: `PendingApproval`

#### Step 2: HQ Reviews & Approves
**Who**: HQ Manager  
**Action**:
1. HQ Manager sees incoming request in the Orders queue
2. Reviews each item: sees **Requested Qty** vs **HQ Available Stock**
3. Three options:
   - ✅ **Full Approve** — all items in stock, approve all quantities
   - ⚠️ **Partial Fulfill** — some items low, adjust approved quantities down
   - ❌ **Reject** — with reason (e.g., "branch overstocked already")
4. On approval, system creates an **Order** record linked to the request

**Status**: `Approved` → Order created with status `Processing`

#### Step 3: Picking & Packing
**Who**: HQ Staff  
**Action**:
1. HQ Staff opens the Order → sees "Pick List" (items to retrieve from warehouse)
2. For each item, system shows **which batches to pick from** (FIFO — oldest expiry first)
3. HQ Staff confirms each item picked → creates `OrderAllocation` records (batch-level)
4. System deducts picked quantities from HQ batches
5. HQ Staff marks order as "Packed"

**Status**: `Picking` → `Packed`

> [!TIP]
> No new "Warehouse Manager" user needed. **HQ Staff already handles this**. They are your warehouse workers. The HQ Manager oversees and approves, the HQ Staff does the physical fulfillment work.

#### Step 4: Dispatch
**Who**: HQ Staff (or HQ Manager)  
**Action**:
1. HQ Staff creates a Shipment record for the order
2. Selects a **Courier** from the registered courier list (see below)
3. Selects a **Vehicle** assigned to that courier
4. Enters: **Estimated Arrival**, optional **Tracking Number**
5. Marks as "Dispatched"

**Status**: `Dispatched`

##### Couriers & Vehicles (Registered Entities, NOT Users)

Couriers and vehicles are **data records** — they don't log into the system. The Tenant Admin registers them ahead of time, and HQ Staff selects them during dispatch.

**Couriers Table:**
```
Couriers
├── CourierId (PK)
├── TenantId (FK)
├── Name              — "Juan Delivery Services" or "Miguel Santos"
├── ContactNumber
├── IsActive
└── CreatedAt
```

**Vehicles Table:**
```
Vehicles
├── VehicleId (PK)
├── TenantId (FK)
├── CourierId (FK)    — which courier owns/drives this vehicle
├── PlateNumber       — "ABC-1234"
├── VehicleType       — "Motorcycle", "Van", "Truck"
├── Description       — optional, e.g., "White L300 Van"
├── IsActive
└── CreatedAt
```

**Updated Shipments Table** adds:
- `CourierId` (FK → Couriers)
- `VehicleId` (FK → Vehicles)

During dispatch, HQ Staff selects Courier → dropdown auto-filters to that courier's vehicles → selects Vehicle. Clean and linked.

#### Step 5: In-Transit (Passive)
**Status**: `InTransit`  
No one updates this — the system auto-sets this after dispatch. It's a visual state for the tracking UI.

#### Step 6: Branch Confirms Delivery
**Who**: Branch Manager  
**Action**:
1. Branch Manager receives physical delivery
2. Opens the order in the system → clicks "Confirm Delivery"
3. System transfers the batch records: updates `Batch.BranchId` from `NULL` (HQ) to the branch's ID
4. Creates `InventoryTransaction` of type `Transfer` on the branch side

**Status**: `Delivered`

#### Step 7: (Optional) Return
If items are damaged → see [Returns Management](#9-returns-management)

### 4.3 Supply Request Statuses (complete list)

| Status | Set By | Meaning |
|---|---|---|
| `Draft` | System/Branch | Branch hasn't submitted yet |
| `AutoDrafted` | System | Created by low-stock detection, awaiting Branch Manager review |
| `PendingApproval` | Branch | Submitted to HQ, waiting for review |
| `Approved` | HQ Manager | Approved, Order generated |
| `PartiallyApproved` | HQ Manager | Some items adjusted down |
| `Rejected` | HQ Manager | Denied with reason |

### 4.4 Order Statuses (after approval)

| Status | Set By | Meaning |
|---|---|---|
| `Processing` | System | Order created, waiting for picker |
| `Picking` | HQ Staff | Staff is retrieving items |
| `Packed` | HQ Staff | All items packed, ready for dispatch |
| `Dispatched` | HQ Staff | Handed to courier |
| `InTransit` | System | Auto-set after dispatch |
| `Delivered` | Branch Manager | Branch confirmed receipt |
| `Returned` | Branch Manager | Return filed (see Returns) |

---

## 5. Order Tracking — Status-Based {#5-order-tracking}

> [!IMPORTANT]
> ✅ No maps. No courier user. No real-time GPS. Just a **clean status timeline**.

### 5.1 How Tracking Works

The tracking page is a **vertical timeline/stepper** showing the order's journey through statuses with timestamps and who performed each action.

```
✅ Request Submitted          — Apr 5, 2026 9:00 AM — by Maria Santos (Branch Manager)
✅ Approved by HQ              — Apr 5, 2026 10:15 AM — by John Cruz (HQ Manager)
✅ Picking Started             — Apr 5, 2026 11:00 AM — by Ana Reyes (HQ Staff)
✅ Packed & Ready              — Apr 5, 2026 1:30 PM — by Ana Reyes (HQ Staff)
✅ Dispatched                  — Apr 5, 2026 2:00 PM — Courier: Juan Delivery Services
🔵 In Transit                 — Est. arrival: Apr 5, 2026 5:00 PM
⬜ Delivered                   — Awaiting branch confirmation
```

### 5.2 Who Updates Each Status

| Status Transition | Who Clicks the Button | Where |
|---|---|---|
| Draft → PendingApproval | Branch Manager | New Order Request page |
| PendingApproval → Approved | HQ Manager | Order Detail page |
| Approved → Picking | HQ Staff | Order Detail page ("Start Picking") |
| Picking → Packed | HQ Staff | Order Detail page ("Mark as Packed") |
| Packed → Dispatched | HQ Staff | Order Detail page ("Dispatch", enters courier info) |
| Dispatched → InTransit | Auto (system) | Automatic after dispatch |
| InTransit → Delivered | Branch Manager | Order Detail page ("Confirm Delivery") |

### 5.3 Implementation

You need an **OrderStatusHistory** table to store the timeline:

```
OrderStatusHistory
├── HistoryId (PK)
├── OrderId (FK)
├── Status (string)
├── ChangedBy_UserId (FK)
├── Remarks (nullable string)
└── Timestamp (datetime)
```

Every time someone clicks a status-change button, insert a row into this table. The tracking page simply queries this table ordered by timestamp.

> [!TIP]
> This replaces the maps/EasyPost/Google Maps entirely. Remove those from your Third-Party APIs list. You don't need them.

---

## 6. Branch Management {#6-branch-management}

### 6.1 Branch Profile Fields

| Field | Type | Purpose |
|---|---|---|
| `BranchId` | PK | — |
| `TenantId` | FK | — |
| `Name` | string | "BGC Reserve" |
| **`Address`** | string | Full street address |
| **`City`** | string | City for filtering/grouping |
| **`ContactNumber`** | string | Branch phone |
| **`OpenTime`** | TimeOnly | e.g., 7:00 AM |
| **`CloseTime`** | TimeOnly | e.g., 10:00 PM |
| **`OwnerUserId`** | FK → Users (nullable) | The Branch Owner assigned |
| **`ManagerUserId`** | FK → Users (nullable) | The Branch Manager assigned |
| `IsActive` | bool | — |
| `CreatedAt` | datetime | — |

### 6.2 The Two Mandatory Users Per Branch

Every branch has exactly **two key users**:

| Role | Purpose | Can Do |
|---|---|---|
| **Branch Owner** | Passive oversight | View branch financials, performance reports, staff list. Read-only on most things. |
| **Branch Manager** | Active operator | Log consumption, create/submit supply requests, confirm deliveries, file returns, manage daily operations. |

### 6.3 Staff Roster — Yes, Include Them (But Keep It Light)

> **Should you include branch staff?**  
> **Yes, but as a read-only roster.** Their purpose is **record-keeping and reporting**, not system access.

Staff members listed under a branch are **NOT system users** — they don't log in. They're records in an `Employees` table that live under a branch for organizational tracking.

**What staff records are for:**
- The Branch Owner can see who works at their branch
- The Tenant Admin has a company-wide employee directory
- Headcount reporting (e.g., "Branch X has 8 staff, Branch Y has 12")
- Future extensibility (if you ever add scheduling, payroll, etc.)

**What staff records are NOT for:**
- No system login / no user account
- No payroll
- No scheduling (Tier 2/3 roadmap item)

#### Employees Table:
```
Employees
├── EmployeeId (PK)
├── TenantId (FK)
├── BranchId (FK, nullable — null means HQ)
├── FirstName
├── LastName
├── Position              — "Barista", "Cashier", "Shift Lead"
├── ContactNumber
├── DateHired
├── IsActive
└── CreatedAt
```

> [!NOTE]  
> **Employees ≠ Users.** Users = people who log into Kettan (6 roles). Employees = headcount records. A Branch Manager is both an Employee and a User. A Barista is only an Employee.

---

## 7. Settings & Configuration {#7-settings--configuration}

Here's what belongs in Settings — practical items that the **Tenant Admin** configures:

### 7.1 Settings Sections

| Section | What It Controls | Details |
|---|---|---|
| **Role Access Control** | Which modules each role can see/do | Toggle matrix: role × module × permission (view/create/edit/delete). E.g., "Can Branch Manager see Reports?" |
| **Inventory Thresholds** | Default low-stock levels | Set chain-wide defaults (e.g., beans = 5kg, cups = 100 pcs). Can be overridden per branch. |
| **Order Approval Rules** | Auto-approve vs. manual | Set a cost threshold: orders under ₱5,000 auto-approve, orders above require HQ Manager sign-off |
| **Notification Preferences** | What triggers alerts | Toggle: low-stock alerts ✅, order status changes ✅, delivery confirmations ✅ |
| **Item Types & Categories** | Manage the lookup lists | CRUD for the types and categories that appear in inventory item dropdowns |
| **Couriers & Vehicles** | Manage registered couriers | CRUD for courier profiles and their assigned vehicles |

> [!NOTE]
> **Company Profile** is NOT in settings — it already has its own dedicated page (`/company-profile`).

### 7.2 What NOT to Put in Settings

- ❌ Dark/light mode (already a global toggle)
- ❌ Language settings (not needed for your scope)
- ❌ Email templates (overkill)
- ❌ Subscription management (Super Admin side, not Tenant Settings)
- ❌ Company Profile (dedicated page already exists)

---

## 8. Finance & Reports {#8-finance--reports}

### 8.1 Reports Available (with Time Scope Filter)

| Report | What It Shows | Scope Filter | Visual |
|---|---|---|---|
| **Fulfillment Cost Summary** | Total cost of goods transferred to branches | Weekly/Monthly/Quarterly | Bar chart |
| **Branch Cost Breakdown** | How much each branch "consumed" in supply value | Monthly | Stacked bar by branch |
| **Inventory Valuation** | Total value of current stock (HQ + all branches) | Point-in-time (snapshot) | Summary cards |
| **Inventory Movement Log** | All stock-in, stock-out, transfer transactions | Date range | Data table |
| **Consumption Analytics** | Which menu items sold most, which ingredients consumed most | Weekly/Monthly | Ranked list + bar chart |
| **Branch Leaderboard** | Weighted Performance Scoring (your algorithm) | Monthly/Quarterly | Ranked table (already built ✅) |
| **EOQ Recommendations** | Optimal reorder quantities per item | On-demand | Table with suggested qty |
| **Low Stock History** | How often each item triggered low-stock alerts | Monthly | Heat map or table |

### 8.2 The "Finance" Part — What to Show

Since there's no real money exchanging between branches and HQ, "Finance" here means **cost tracking and valuation**:

| Metric | Formula | Purpose |
|---|---|---|
| **Branch Supply Cost** | Σ(UnitCost × Qty Delivered) per branch | How much value each branch received |
| **Total Fulfillment Cost** | Σ all branches' supply costs | Chain-wide spending on supplies |
| **HQ Inventory Value** | Σ(UnitCost × CurrentQty) for HQ batches | What's sitting in the warehouse |
| **Branch Inventory Value** | Same, per branch | What each branch holds |
| **Total Inventory Value** | HQ + All Branches | Complete asset picture |
| **Wastage/Spoilage Cost** | Σ(UnitCost × Qty) for expired/damaged adjustments | Money lost to waste |

### 8.3 Your Two Algorithms in Reports

#### EOQ (Economic Order Quantity)
- Shows on each item's profile or in the EOQ Report tab
- Formula: `EOQ = √(2DS/H)` where D=demand, S=ordering cost, H=holding cost
- Input: Average monthly consumption (from consumption logs), estimated ordering cost, estimated holding cost %
- Output: "Recommended reorder quantity: 25kg" with explanation

#### Weighted Branch Performance Scoring
- Already partially built in your `BranchLeaderboardTable` ✅
- Metrics and default weights:
  - Fulfillment Rate (30%) — % of requested items that were actually delivered
  - Return Rate (20%) — % of orders with return filings (lower is better)
  - Delivery Speed (25%) — average hours from request submission to delivery
  - Stock Accuracy (25%) — how close physical counts match expected counts

### 8.4 The Tabs Structure (Updated)

```
Reports Page
├── Tab 1: Overview (KPI cards + cost chart — already built ✅)
├── Tab 2: Branch Performance (Leaderboard — already built ✅)
├── Tab 3: Inventory Reports (Valuation, Movement Log, EOQ)
└── Tab 4: Consumption Analytics (Top menu items, ingredient usage)
```

---

## 9. Returns Management — Simplified {#9-returns-management}

> [!TIP]
> Keep this lean. No physical return shipping logistics, no restocking automation.

### 9.1 The Flow

```
1. Branch Manager receives delivery → notices damaged/wrong items
2. Opens the delivered order → clicks "File Return"
3. Selects which items to return + quantities + reason:
   - Damaged in transit
   - Wrong item sent
   - Expired on arrival
   - Quality issue
4. Attaches optional photo evidence (Cloudinary upload)
5. Submits → Return status: "Pending"
6. HQ Manager reviews the return request
7. HQ Manager resolves with one of:
   - ✅ "Replacement" → new order auto-created for just the returned items
   - ✅ "Credit" → a credit memo logged (reduces branch's next fulfillment cost in reports)
   - ❌ "Rejected" → with reason
8. Done. No physical return shipping tracked.
```

### 9.2 Additions to Returns Table

| Field to Add | Purpose |
|---|---|
| `ReturnItems` | Junction table: which specific items/qty are being returned |
| `PhotoUrls` | JSON array of Cloudinary image URLs as evidence |
| `ReviewedBy_UserId` | FK → who resolved it |
| `ResolvedAt` | When it was resolved |
| `CreditAmount` | If credited, how much (auto-calculated from unit costs) |

#### ReturnItems Table:
```
ReturnItems
├── ReturnItemId (PK)
├── ReturnId (FK)
├── ItemId (FK)
├── QuantityReturned (decimal)
└── Reason (string)
```

---

## 10. HR & Staff Management — Clarified {#10-hr--staff-management}

### 10.1 Rename: "Staff Directory" (not HR)

> [!IMPORTANT]
> **Do NOT create a separate "HR" role.** There is no HR person in a small coffee chain. The Tenant Admin handles everything HR-related.

The module should be called **"Staff Directory"** or **"Employee Management"** — it's a record-keeping module, not a full HR suite.

### 10.2 What It Actually Does

| Feature | Description | Who |
|---|---|---|
| **Employee Roster** | Add/edit/deactivate employee records | Tenant Admin |
| **Branch Assignment** | Assign employees to branches | Tenant Admin |
| **Position Tracking** | Record job title/position per employee | Tenant Admin |
| **Contact Info** | Phone, email for employee records | Tenant Admin |
| **Headcount Dashboard** | "Branch X: 8 staff, Branch Y: 12 staff" | Tenant Admin, Branch Owner |

### 10.3 What It Does NOT Do

- ❌ Payroll
- ❌ Scheduling / shift management
- ❌ Attendance tracking
- ❌ Performance reviews
- ❌ Leave management

### 10.4 Staff vs Users — The Final Word

| Concept | Login? | Table | Count |
|---|---|---|---|
| **Users** (system users) | ✅ Yes | `Users` | ~6 per tenant (the roles) |
| **Employees** (staff records) | ❌ No | `Employees` | Many (all baristas, cashiers, etc.) |

Some people are both: a Branch Manager exists in **both** tables. A Barista exists only in `Employees`.

Your existing `Staff` frontend feature already shows a list and profile pages — just rename it conceptually to "Employees" and make sure the data model behind it is the `Employees` table (not `Users`).

---

## 11. Super Admin Side {#11-super-admin-side}

### 11.1 Super Admin Modules

| Module | What It Does | Priority |
|---|---|---|
| **Tenant Management** | View all tenants, activate/deactivate, see subscription tier | Tier 1 ✅ |
| **Platform Analytics** | Dashboard: total tenants, total orders across platform, system health | Tier 1 ✅ |
| **Help & Support Center** | FAQs, user manual/guides, bug report submission | Tier 2 |
| **Audit Logs** | View all significant actions across the platform | Tier 2 (read-only table) |
| **Subscription & Billing** | View tenant subscription status, plan changes | Tier 2 (read-only, PayMongo handles actual billing) |

### 11.2 Help & Support Center (Refined)

This is NOT a ticket system. It's a **knowledge base + bug reporting** module:

| Section | Who Sees It | What It Contains |
|---|---|---|
| **FAQs** | All users | Common questions about the system, organized by module. Super Admin writes them. |
| **User Manual / Guides** | All users | Step-by-step guides per module ("How to create a supply request", "How to log consumption"). Could be markdown pages or embedded PDFs. |
| **Bug Reports** | Tenants submit → Super Admin views | Simple form: title, description, screenshot, severity. Super Admin reviews and updates status (Open → In Progress → Resolved). |

> [!TIP]
> For Tier 1, you can ship this as a static page with hardcoded FAQs and a simple bug report form. The user manual can be a single scrollable page with anchor links per module.

### 11.3 Super Admin Layout

**Same layout shell**, different sidebar items. The `AppLayout` component checks the user's role and renders different sidebar navigation:
- Super Admin sees: Dashboard, Tenants, Help & Support, Audit Logs, Billing
- Tenant Admin sees: Dashboard, Branches, Inventory, Orders, etc.

No separate layout component needed — just conditional sidebar rendering based on role.

### 11.4 What the Super Admin Does NOT Need

- ❌ Inventory management (that's per-tenant)
- ❌ Order processing (that's per-tenant)
- ❌ Any tenant-side operations

### 11.5 Super Admin Dashboard KPIs

| Metric | Source |
|---|---|
| Total Active Tenants | Count of `Tenants` where `IsActive = true` |
| Total Branches (all tenants) | Count of `Branches` |
| Total Orders This Month | Count of `Orders` in current month |
| System Uptime | Static or from health check |
| Revenue This Month | Sum of subscription payments (if tracking) |

---

## 12. Final Role Matrix {#12-final-role-matrix}

| Module | Super Admin | Tenant Admin | HQ Manager | HQ Staff | Branch Owner | Branch Manager |
|---|---|---|---|---|---|---|
| Dashboard | Platform-level | Chain-wide | HQ-focused | HQ-focused | Branch-only | Branch-only |
| Inventory (HQ) | — | View | Full | Full (stock-in/out) | — | — |
| Inventory (Branch) | — | View All | View All | — | View Own | Full (consumption) |
| Menu Items / Recipes | — | Full | Full | View | — | View |
| Consumption Logging | — | View | View | — | — | Full |
| Supply Requests | — | View | Approve/Reject | — | View Own | Create/Submit |
| Order Processing | — | View | Approve | Pick/Pack/Dispatch | View Own | View Own |
| Order Tracking | — | View All | View All | View All | View Own | View Own |
| Returns | — | View | Resolve | — | View Own | File Returns |
| Branches | — | Full | View | — | View Own | View Own |
| Staff Directory | — | Full | View HQ | — | View Own Branch | View Own Branch |
| Reports & Finance | — | Full | View | — | Branch-only | Branch-only |
| Settings | — | Full | — | — | — | — |
| Tenants | Full | — | — | — | — | — |
| Platform Analytics | Full | — | — | — | — | — |
| Support Tickets | Manage | Create | — | — | — | — |

---

## 13. Cut List — What NOT to Build {#13-cut-list}

Given your 1-month deadline and solo status, here's what to **cut or defer**:

### ❌ Remove Entirely
| Item | Reason |
|---|---|
| Google Maps API | Replaced by status-based tracking |
| EasyPost live API integration | Replaced by internal courier + vehicle records for dispatch |
| Courier/Driver user role | Not needed |
| Warehouse Manager role | HQ Staff already does this |
| Payment between branches & HQ | Internal transfers, no money |
| Supplier Portal (Module 18) | Tier 3 roadmap item |

### ⏳ Defer to Tier 2 (If Time Permits)
| Item | Reason |
|---|---|
| SendGrid email notifications | Start with in-app only; email is nice-to-have |
| Audit Logs module | Can be seeded/shown as read-only demo data |
| Support & Helpdesk | Simple table with status, low priority |
| PayMongo subscription billing | Can demo with mock data |
| Physical Stock Count (Method 3) | Direct Entry and Sales Count cover 90% of use cases |
| EOQ algorithm full implementation | Show the formula and a demo calculation; full integration later |
| Export to PDF/CSV | Nice-to-have for reports |

### ✅ Tier 1 — Must Build
| Item | Status |
|---|---|
| Auth (login, JWT, roles) | Backend entities exist |
| Dashboard (per-role) | Frontend exists ✅ |
| Inventory Management (HQ + Branch) | Frontend exists ✅, needs backend |
| Menu Items + Recipe system | **NEW — needs both frontend + backend** |
| Consumption Logging (Method 1 & 2) | Needs frontend + backend |
| Supply Request → Order pipeline | Frontend exists ✅, needs backend |
| Picking & Packing flow | Part of Order Detail page |
| Status-based Order Tracking | Frontend exists ✅, needs revision (remove map) |
| Branch Management | Frontend exists ✅ |
| Staff Directory / Employees | Frontend exists ✅, model needs revision |
| Returns (simplified) | Needs frontend + backend |
| Reports (with algorithms) | Frontend exists ✅, needs backend data |
| Settings (role access, thresholds) | Needs frontend + backend |
| Super Admin dashboard | Needs separate layout/pages |

---

## Decisions Confirmed ✅

| Decision | Answer |
|---|---|
| Item Types/Categories | Tenant-configurable lookup tables (flexible) |
| Menu Items module | **Standalone sidebar item** — "Menu & Recipes" |
| Super Admin layout | **Same layout**, different sidebar content based on role |
| Consumption Logging | **Standalone sidebar item** |
| Notifications | **Dual system**: Toast for confirmations ("Order placed!") + Bell icon dropdown for alerts (low stock, delivery updates) |
| Staff module name | "Staff Directory" / "Employee Management" |
| Company Profile | Stays as its own dedicated page, removed from Settings |
| Couriers | Registered entities with vehicles, not users |
| Support module | FAQs + User Manual + Bug Reports (not a ticket system) |

### Notification System Details

| Type | Trigger | UI |
|---|---|---|
| **Toast** (ephemeral) | User actions: "Order placed!", "Item saved!", "Delivery confirmed!" | Bottom-right snackbar, auto-dismiss 3-5s |
| **Bell Alerts** (persistent) | System events: Low stock detected, order status changed, return filed, delivery arrived | Bell icon in header with unread count badge → dropdown list → click to navigate |

**Notifications Table** (for bell alerts):
```
Notifications
├── NotificationId (PK)
├── TenantId (FK)
├── UserId (FK)          — who receives it
├── Title                — "Low Stock Alert"
├── Message              — "Arabica Beans at BGC Reserve is below threshold (3.2kg remaining)"
├── Type                 — "LowStock", "OrderUpdate", "ReturnFiled", "DeliveryConfirmed"
├── ReferenceType        — "Order", "Item", "Return"
├── ReferenceId          — links to the relevant record
├── IsRead (bool)
└── CreatedAt
```

---

## Final Sidebar Navigation (Per Role)

### Tenant Admin / HQ Manager / HQ Staff Sidebar:
```
📊 Dashboard
📋 Orders
📦 Inventory (HQ)
☕ Menu & Recipes
📝 Consumption Logging
🏪 Branches
👥 Staff Directory
📈 Reports & Finance
↩️ Returns
⚙️ Settings
```

### Branch Owner / Branch Manager Sidebar:
```
📊 Dashboard
📋 Orders (my branch)
📦 Branch Inventory
📝 Consumption Logging
↩️ Returns
📈 Reports (my branch)
```

### Super Admin Sidebar:
```
📊 Platform Dashboard
🏢 Tenant Management
📊 Platform Analytics
❓ Help & Support
📜 Audit Logs
💳 Subscription & Billing
```

---

## New Entities Summary (Added by This Plan)

| Entity | Table | Purpose |
|---|---|---|
| `ItemTypes` | Lookup | Tenant-configurable item types |
| `ItemCategories` | Lookup | Tenant-configurable categories under types |
| `MenuItems` | Domain | Menu products sold at branches |
| `MenuItemIngredients` | Junction | Recipe: which inventory items a menu item consumes |
| `BundleItems` | Junction | Which items are inside a bundle |
| `Employees` | Domain | Staff roster (non-login records) |
| `Couriers` | Domain | Registered delivery couriers |
| `Vehicles` | Domain | Vehicles assigned to couriers |
| `OrderStatusHistory` | Tracking | Timeline of status changes per order |
| `ReturnItems` | Junction | Specific items being returned |
| `Notifications` | System | Bell alert records per user |

---

## Verification Plan

### Automated Tests
- Backend: Unit tests on FIFO deduction logic, EOQ calculation, and Weighted Branch Scoring
- Frontend: Verify all routes render without errors, form validation works

### Manual Verification
- Walk through the complete order lifecycle: Branch creates request → HQ approves → HQ picks/packs → Dispatch (select courier + vehicle) → Branch confirms delivery
- Verify status timeline shows correctly on tracking page with timestamps and actors
- Verify consumption logging deducts correct quantities from branch inventory via recipes
- Verify reports show accurate cost calculations
- Verify bell notifications appear for low-stock events and order status changes
- Verify toast confirmations fire on all user actions
