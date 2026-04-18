# Kettan — Business Logic & Operational Flows

> **What this doc is**: The single source of truth for how Kettan works operationally. Every user action, every status transition, every rule — all in one place.

> **Last updated**: April 18, 2026

---

## Table of Contents

1. [System Identity](#1-system-identity)
2. [Money Model](#2-money-model)
3. [Roles & What They Do](#3-roles--what-they-do)
4. [The Core Lifecycle](#4-the-core-lifecycle-branch--hq)
5. [Inventory Model](#5-inventory-model)
6. [Consumption Logging](#6-consumption-logging)
7. [Supply Request Flow (Branch Side)](#7-supply-request-flow-branch-side)
8. [Order Processing Flow (HQ Side)](#8-order-processing-flow-hq-side)
9. [Order Tracking](#9-order-tracking)
10. [Returns Management](#10-returns-management)
11. [Status Definitions (Canonical)](#11-status-definitions-canonical)
12. [Notifications](#12-notifications)
13. [Finance & Reports](#13-finance--reports)
14. [Settings & Configuration](#14-settings--configuration)
15. [Super Admin Operations](#15-super-admin-operations)
16. [Sidebar Navigation Per Role](#16-sidebar-navigation-per-role)

---

## 1. System Identity

Kettan is a **multi-tenant B2B SaaS** for multi-branch coffee chains. Each subscribing coffee chain = one tenant with isolated data. It is NOT a POS, NOT consumer-facing — it is an **internal operations management platform**.

**Core problem solved**: Replaces group chats, spreadsheets, and phone calls for supply coordination between HQ and branches.

---

## 2. Money Model

> **No money flows between branches and HQ.**

- Branch orders are **internal transfers** — HQ owns all inventory and distributes it to branches
- Each order has a **fulfillment cost** = Σ(unit cost × quantity) — this is for **reporting only**
- The only real money in the system is the **tenant's SaaS subscription** (PayMongo)
- Finance module = **cost tracking and valuation**, NOT payments or invoicing

---

## 3. Roles & What They Do

### Platform Level

| Role | What They Actually Do |
|---|---|
| **Super Admin** | Manages all tenants, monitors platform health, handles support. Never touches tenant operations. |

### Tenant Level

| Role | What They Actually Do |
|---|---|
| **Tenant Admin** | The chain owner. Configures everything: branches, staff, settings, menu items, item categories. Full visibility. |
| **HQ Manager** | Approves/rejects supply requests. Oversees HQ inventory and fulfillment. Views chain-wide performance. |
| **HQ Staff** | The warehouse worker. Does stock-in/out, picks, packs, dispatches. Handles physical fulfillment. |
| **Branch Owner** | Strategic branch operator. Can create/submit supply requests, track requests, confirm deliveries, and file returns. Consumption is view-only. |
| **Branch Manager** | Daily branch operator. Logs consumption, submits supply requests, confirms deliveries, files returns. |

### Key Distinction: Users vs Employees

| Concept | Logs In? | Table | Example |
|---|---|---|---|
| **Users** | ✅ Yes | `Users` | Tenant Admin, HQ Manager, Branch Manager |
| **Employees** | ❌ No | `Employees` | Baristas, cashiers, shift leads (record-keeping only) |

A Branch Manager is BOTH a User and an Employee. A Barista is ONLY an Employee.

---

## 4. The Core Lifecycle (Branch → HQ)

This is the heartbeat of the system:

```
Branch Manager logs daily consumption
    ↓
Item drops below threshold → system detects low stock
    ↓
System auto-drafts a supply request (or Branch Owner / Branch Manager creates manually)
    ↓
Branch Owner / Branch Manager reviews, adjusts, submits to HQ
    ↓
HQ Manager approves (full / partial / reject)
    ↓
HQ Staff picks items from warehouse (FIFO by batch)
    ↓
HQ Staff packs and dispatches (assigns courier + vehicle)
    ↓
Branch Manager confirms delivery → inventory transfers to branch
    ↓
(Optional) Branch Manager files return if items are damaged
```

**Architecture decision (LOCKED)**: This entire lifecycle is **ONE order transaction** moving through statuses. There are NO separate Picking, Packing, or Shipping pages. All actions happen on the **Order Detail page** through status transitions, filtered by role.

---

## 5. Inventory Model

### Two Levels of Inventory

| Level | What It Holds | Managed By |
|---|---|---|
| **HQ Inventory** | Central warehouse stock from external suppliers | HQ Staff (stock-in/out), HQ Manager (oversight) |
| **Branch Inventory** | Per-branch stock received from HQ | Branch Manager (consumption logging) |

### How Items Are Structured

- Each item has a **Type** (Raw Material, Consumable, etc.) and **Category** (Beans, Syrups, Cups)
- Types and Categories are **tenant-configurable lookup tables** — Tenant Admin creates them
- Items are tracked by **Batch** with expiry dates
- **FIFO enforced** on ALL deductions — oldest non-expired batch first
- **Bundles** exist for ordering convenience (e.g., "Starter Kit" = 10 bags beans + 20 cartons milk)

### Stock Operations at HQ

| Operation | Who | What Happens |
|---|---|---|
| **Stock-In** | HQ Staff | External supplier delivery → creates new Batch (BranchId = NULL = HQ) |
| **Stock-Out** | HQ Staff | Damage/expired/consumed at HQ → FIFO deduction from oldest HQ batch |
| **Transfer** | System (on delivery confirm) | Batch ownership changes from HQ → Branch |

### Low Stock & Auto-Reorder

1. Each item has a **configurable minimum threshold** per branch (set in Settings)
2. When branch stock drops below threshold, system **simultaneously**:
   - Triggers an in-app alert to the Branch Manager
   - Auto-drafts a supply request pre-filled with the low-stock items
3. Branch Owner or Branch Manager reviews, adjusts quantities, and submits to HQ
4. **EOQ algorithm** suggests optimal reorder quantities

---

## 6. Consumption Logging

The consumption module is **the branch's alternative to a POS**. Branch Manager logs menu-item sales at end of shift → system deducts inventory via recipes.

### Route Shape (Current UX)
- Queue/history route: `/consumption` (stat cards + search/date/sort/filter + transactions table)
- Create route: `/consumption/new` (dedicated create workflow)
- Branch Owner can view queue/history but remains view-only for create/submit actions.

### Sales Count with Recipe Deduction ⭐ (Primary)
- Branch Manager opens sold-menu-item selection modal, picks menu items sold today, and enters quantity sold per selected menu item.
- System multiplies each sale × recipe ingredients → deducts from branch inventory (FIFO)
- **Requires**: Menu Items with Recipes set up by Tenant Admin
- **Best for**: Daily end-of-shift logging

### Manual Non-Sales Usage (Out of Scope for Consumption)
- Manual ingredient deductions (wastage/spoilage/internal use) should be logged through inventory stock-out/adjustment workflows.
- Consumption logging page remains sales-only.

### Method 3: Physical Stock Count (Tier 2 — Deferred)
- Branch staff counts actual stock on hand
- System compares counted vs expected, flags discrepancies
- Branch Manager reviews and approves adjustments

### The Step-by-Step Flow

```
1. Tenant Admin creates Menu Items + Recipes (one-time setup)
2. Daily: Branch Manager opens Consumption queue (`/consumption`) then clicks Add Consumption (`/consumption/new`)
3. Selects shift (Morning/Afternoon/Evening) and date
4. Enters sales counts using sold-menu-item modal
5. System calculates total ingredient deductions (preview shown)
6. Branch Manager confirms → system deducts from branch batches (FIFO)
7. If any item drops below threshold → low-stock alert triggered
8. If low-stock → auto-draft supply request created
```

### Rules
- ❌ Past consumption logs **cannot be edited or corrected**
- ✅ If a mistake was made, log a new entry with corrective remarks

---

## 7. Supply Request Flow (Branch Side)

Supply Requests is **the branch user's view** of the order lifecycle.

### Who Uses It
- **Branch Manager** — creates, submits, tracks
- **Branch Owner** — creates, submits, tracks

### Sidebar Item
`Supply Requests` → `/supply-requests` (visible to Branch Manager, Branch Owner)

### Actions

| Action | Where | Who |
|---|---|---|
| Create new request | Create page (`/supply-requests/new`) | Branch Manager, Branch Owner |
| Submit to HQ | Create page (`/supply-requests/new`) | Branch Manager, Branch Owner |
| View request detail + track status | `/supply-requests/$requestId` | Branch Manager, Branch Owner |
| Edit draft before submission | Supply Request Detail page (when status = Draft/AutoDrafted) | Branch Manager, Branch Owner |
| Confirm delivery | Supply Request Detail page (when status = InTransit/Dispatched) | Branch Manager, Branch Owner |
| File return | Supply Request Detail page (when status = Delivered) | Branch Manager, Branch Owner |

### What the Detail Page Shows
1. Status badge + timeline (reuses OrderFulfillmentStepper)
2. Request details (branch, priority, type, notes, dates)
3. Requested items table (read-only after submission)
4. Linked Order ID (once approved — clickable for HQ roles only)
5. Contextual action buttons based on current status

### Supply Request Statuses

| Status | Set By | Meaning |
|---|---|---|
| `Draft` | Branch Manager | Manually created, not yet submitted |
| `AutoDrafted` | System | Created by low-stock detection, awaiting Branch Manager review |
| `PendingApproval` | Branch Manager | Submitted to HQ, waiting for review |
| `Approved` | HQ Manager | Fully approved, order generated |
| `PartiallyApproved` | HQ Manager | Some items adjusted down |
| `Rejected` | HQ Manager | Denied with reason |

---

## 8. Order Processing Flow (HQ Side)

Order Processing is **the HQ's view** of the same transactions.

### Who Uses It
- **HQ Manager** — approves/rejects incoming requests
- **HQ Staff** — picks, packs, dispatches
- **Tenant Admin** — full visibility

### Sidebar Item
`Order Processing` → `/orders` (visible to HQ Manager, HQ Staff, Tenant Admin)

### Role-Based Default Tabs
- HQ Manager default view: `PendingApproval` (incoming requests to review)
- HQ Staff default view: `Approved` / `Picking` (orders ready to fulfill)

### Actions Per Status

| Status | Who Acts | Actions Available |
|---|---|---|
| `PendingApproval` | HQ Manager | Review items → **Approve** (full/partial) or **Reject** |
| `Approved` / `Processing` | HQ Staff | **Start Picking** |
| `Picking` | HQ Staff | Confirm each item picked (FIFO batch selection shown) → **Mark as Packed** |
| `Packed` | HQ Staff | Select Courier + Vehicle → Enter ETA → **Dispatch** |
| `Dispatched` | System | Auto-transitions to `InTransit` |
| `InTransit` | Branch Manager / Branch Owner | **Confirm Delivery** (on their Supply Request Detail page) |
| `Delivered` | — | Complete. Branch Manager can file return if needed. |

### The `/orders/new` Page (HQ-Initiated Push)
This page exists for HQ to **proactively send supplies** to a branch WITHOUT a branch request (e.g., seasonal loadout, new branch setup). It skips the supply request flow entirely — HQ creates an order directly.

**Important**: This page should NOT have courier/vehicle selection (that happens at dispatch step).

---

## 9. Order Tracking

> No maps. No GPS. No courier login. Just a **clean status timeline**.

The tracking view is a **vertical stepper** showing the order's journey with timestamps and actors:

```
✅ Request Submitted        — Apr 5, 2026 9:00 AM  — by Maria Santos (Branch Manager)
✅ Approved by HQ            — Apr 5, 2026 10:15 AM — by John Cruz (HQ Manager)
✅ Picking Started           — Apr 5, 2026 11:00 AM — by Ana Reyes (HQ Staff)
✅ Packed & Ready            — Apr 5, 2026 1:30 PM  — by Ana Reyes (HQ Staff)
✅ Dispatched                — Apr 5, 2026 2:00 PM  — Courier: Juan Delivery Services
🔵 In Transit               — Est. arrival: Apr 5, 2026 5:00 PM
⬜ Delivered                 — Awaiting branch confirmation
```

Powered by the `OrderStatusHistory` table — every status change inserts a row with timestamp, user, and remarks.

---

## 10. Returns Management

### The Flow

```
1. Branch Manager receives delivery → notices damaged/wrong items
2. Opens delivered order → clicks "File Return"
3. Selects items to return + quantities + reason:
   - Damaged in transit
   - Wrong item sent
   - Expired on arrival
   - Quality issue
4. Attaches optional photo evidence (Cloudinary)
5. Submits → Return status: "Pending"
6. HQ Manager reviews the return request
7. HQ Manager resolves:
   - ✅ "Replacement" → new order auto-created for returned items
   - ✅ "Credit" → credit memo logged (cost reporting adjustment)
   - ❌ "Rejected" → with reason (remarks required)
8. Done. No physical return shipping tracked.
```

### Rules
- Returns are linked to the parent order (same transaction model)
- `Rejected` resolution requires remarks
- All return actions create audit events

---

## 11. Status Definitions (Canonical)

> **This is the single source of truth.** All frontend code and backend code must use these exact status strings.

### Supply Request Statuses

| Status | String Value | Set By |
|---|---|---|
| Draft | `Draft` | Branch Manager / System |
| Auto-Drafted | `AutoDrafted` | System (low-stock detection) |
| Pending Approval | `PendingApproval` | Branch Manager (on submit) |
| Approved | `Approved` | HQ Manager |
| Partially Approved | `PartiallyApproved` | HQ Manager |
| Rejected | `Rejected` | HQ Manager |

### Order Statuses (after approval creates an Order)

| Status | String Value | Set By |
|---|---|---|
| Processing | `Processing` | System (on order creation) |
| Picking | `Picking` | HQ Staff |
| Packed | `Packed` | HQ Staff |
| Dispatched | `Dispatched` | HQ Staff |
| In Transit | `InTransit` | System (auto after dispatch) |
| Delivered | `Delivered` | Branch Manager |
| Returned | `Returned` | Branch Manager (return filed) |

### Return Statuses

| Status | String Value | Set By |
|---|---|---|
| Pending | `Pending` | Branch Manager (on file) |
| Credited | `Credited` | HQ Manager |
| Replaced | `Replaced` | HQ Manager |
| Rejected | `Rejected` | HQ Manager |

### ❌ Statuses NOT Used (removed from code)
- ~~`Declined`~~ → use `Rejected`
- ~~`Suspended`~~ → removed entirely
- ~~`Packing`~~ → use `Packed` (the status is set when packing is COMPLETE)

---

## 12. Notifications

### Dual System

| Type | Trigger | UI | Persistence |
|---|---|---|---|
| **Toast** (ephemeral) | User actions: "Order placed!", "Item saved!" | Bottom-right snackbar, auto-dismiss 3-5s | None |
| **Bell Alerts** (persistent) | System events: low stock, order status change, return filed | Bell icon in header → dropdown list | `Notifications` table |

### No full notifications page. Dropdown only.

### Alert Types

| Type | Example |
|---|---|
| `LowStock` | "Arabica Beans at BGC Reserve is below threshold (3.2kg remaining)" |
| `OrderUpdate` | "Order ORD-8894 has been approved by HQ" |
| `ReturnFiled` | "A return has been filed for Order ORD-8891" |
| `DeliveryConfirmed` | "Order ORD-8893 has been delivered to Uptown Station" |

---

## 13. Finance & Reports

### What "Finance" Means (No Real Money)

| Metric | Formula | Purpose |
|---|---|---|
| Branch Supply Cost | Σ(UnitCost × Qty Delivered) per branch | How much value each branch received |
| Total Fulfillment Cost | Σ all branches' supply costs | Chain-wide spending on supplies |
| HQ Inventory Value | Σ(UnitCost × CurrentQty) for HQ batches | What's in the warehouse |
| Branch Inventory Value | Same, per branch | What each branch holds |
| Wastage/Spoilage Cost | Σ(UnitCost × Qty) for expired/damaged adjustments | Money lost to waste |

### Reports Tab Structure

```
Reports Page
├── Tab 1: Overview (KPI cards + cost chart)
├── Tab 2: Branch Performance (Weighted Scoring leaderboard)
├── Tab 3: Inventory Reports (Valuation, Movement Log, EOQ)
└── Tab 4: Consumption Analytics (Top menu items, ingredient usage)
```

### Two Algorithms

| Algorithm | What It Does |
|---|---|
| **EOQ** (Economic Order Quantity) | `√(2DS/H)` — suggests optimal reorder quantities per item |
| **Weighted Branch Performance Scoring** | Ranks branches by: Fulfillment Rate (30%), Return Rate (20%), Delivery Speed (25%), Stock Accuracy (25%) |

---

## 14. Settings & Configuration

Managed by **Tenant Admin** only.

| Section | What It Controls |
|---|---|
| Role Access Control | Toggle matrix: role × module × permission (view/create/edit/delete) |
| Inventory Thresholds | Default low-stock levels per item. Can be overridden per branch. |
| Order Approval Rules | Cost threshold for auto-approve vs manual (e.g., orders under ₱5,000 auto-approve) |
| Notification Preferences | Toggle which alerts are enabled |
| Item Types & Categories | CRUD for lookup lists used in inventory item dropdowns |
| Couriers & Vehicles | CRUD for registered couriers and their vehicles |

### NOT in Settings
- ❌ Company Profile (has its own page at `/company-profile`)
- ❌ Dark/light mode (global toggle in header)
- ❌ Subscription management (Super Admin side)

---

## 15. Super Admin Operations

Completely separate from tenant operations. Same layout shell, different sidebar.

| Module | What It Does | Priority |
|---|---|---|
| Platform Dashboard | KPIs: total tenants, total branches, total orders, uptime | Tier 1 |
| Tenant Management | List/view/activate/deactivate tenants | Tier 1 |
| Platform Analytics | Deep metrics on platform usage | Tier 2 |
| Help & Support | FAQs + user manual + bug report form (NOT a ticket system) | Tier 2 |
| Audit Logs | Read-only log of all significant actions across platform | Tier 2 |
| Subscription & Billing | View tenant subscription status (PayMongo handles actual billing) | Tier 2 |

---

## 16. Sidebar Navigation Per Role

### Tenant Admin / HQ Manager / HQ Staff
```
📊 Dashboard
📋 Order Processing
📦 HQ Inventory
☕ Menu & Recipes
📝 Consumption Logging
🏪 Branches
👥 Staff Directory
📈 Finance & Reports
↩️ Returns
⚙️ Settings
```
*(HQ Staff does NOT see Settings. HQ Manager does NOT see Settings.)*

### Branch Owner / Branch Manager
```
📊 Dashboard
📋 Supply Requests
📝 Consumption Logging
↩️ Returns
📈 Reports (my branch)
```
*(Branch Inventory lives inside the Branch Profile page as a tab — no separate sidebar item. Branch Owner can create/submit supply requests but has view-only access in Consumption Logging.)*

### Super Admin
```
📊 Platform Dashboard
🏢 Tenant Management
📊 Platform Analytics
❓ Help & Support
📜 Audit Logs
💳 Subscription & Billing
```
