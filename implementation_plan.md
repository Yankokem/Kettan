# HQ Supply Dispatch (SD) — Implementation Plan

## Overview

This feature adds a new transaction type where **HQ proactively sends supplies to a branch** — the inverse of the existing Supply Request flow. Currently, the `NewOrderRequestPage` (`/orders/new`) exists but creates orders that immediately enter the standard SR→OR pipeline. This plan introduces a **distinct "Supply Dispatch" module** with its own lifecycle, branch acknowledgement step, and notification triggers.

---

## User Review Required

> [!IMPORTANT]
> **Process Design Decision: Does the branch need to approve?**
> My recommendation: **No approval required, but the branch MUST be notified.** Here's why:
> - HQ owns all inventory. This is an internal transfer, not a purchase.
> - Requiring branch approval creates a bottleneck — if a branch is short-staffed, they'd delay their own resupply.
> - Instead, the branch gets a **notification at creation** ("HQ is preparing a shipment for you") and a **second notification at dispatch** ("Your shipment is on the way").
> - The branch's real input comes at **Arrived** (confirming receipt) and **Completed** (checking items) — same as the existing OR flow.

> [!IMPORTANT]
> **How does HQ know a branch needs supplies?**
> Three signals already exist in the system:
> 1. **Low-stock alerts** — The `Notification` system already fires `LowStock` alerts when branch inventory drops below threshold. HQ users (HqManager, TenantAdmin) receive these.
> 2. **Branch Performance Reports** — The EOQ algorithm and inventory reports show which branches are running low.
> 3. **Manual judgment** — New branch setup, seasonal events, promo loadouts.
>
> **No new "request from branch" mechanism is needed.** The existing `NewOrderRequestPage` already has branch selection, item selection, and request type (replenishment / event / manual). We will **refactor this page** into the SD module rather than creating a duplicate.

> [!WARNING]
> **Naming Correction:** Your proposed first status "Created" — I'm renaming it to **"Preparing"** to indicate HQ is actively assembling the shipment. "Created" is too generic and doesn't communicate state to the branch.

---

## Open Questions

> [!IMPORTANT]
> 1. **Should the SD module live under the existing "Order Processing" sidebar item, or get its own sidebar entry (e.g., "Supply Dispatch")?** My recommendation: Add it as a **tab within Order Processing** (e.g., "Outbound" tab alongside the existing "Inbound" tab for branch-initiated requests). This avoids sidebar bloat and keeps all fulfillment in one place.
>
> 2. **Should the branch see SD transactions in their "Supply Requests" page?** My recommendation: Yes — add an "Incoming Shipments" tab on the branch's Supply Requests page so they can track HQ-initiated dispatches alongside their own requests.
>
> 3. **Can HQ cancel an SD after dispatch?** Current OR flow allows cancel up to Packed. Should SD follow the same rule?

---

## Status Lifecycle

Based on the existing OR statuses (reusing the `OrderStatus` enum), the SD flow is:

```
Preparing → Picking → Packed → Dispatched → Arrived → Completed
    │                                                      │
    └──────── Cancelled (HQ only, up to Packed) ───────────┘
```

| Status | Enum Value | Set By | What Happens | Branch Notified? |
|:---|:---|:---|:---|:---|
| **Preparing** | `Processing` | HQ (on create) | HQ created the dispatch form, selected items. Order record exists. | ✅ "HQ is preparing a supply shipment for your branch" |
| **Picking** | `Picking` | HQ Staff | Warehouse picks items. Same approve/reject action column as OR. | ❌ |
| **Packed** | `Packed` | HQ Staff | Items packed, ready for dispatch. | ❌ |
| **Dispatched** | `Dispatched` | HQ Staff | Vehicle + tracking assigned, shipment on the way. | ✅ "Your supply shipment has been dispatched" |
| **Arrived** | `Arrived` | Branch | Branch confirms the package physically arrived. | ❌ (HQ gets notified instead) |
| **Completed** | `Completed` | Branch | Branch checks items, inventory transfers. | ❌ |
| **Cancelled** | `Cancelled` | HQ | Order cancelled, allocations reversed. | ✅ "HQ cancelled the planned shipment" |

> [!NOTE]
> We reuse the **existing `OrderStatus` enum values** — no new enum values needed. The differentiation is via `RequestType = HqInitiated` on the parent `SupplyRequest` and `isHqInitiated = true` flag on the `Order`.

### Stepper Mapping

The `OrderFulfillmentStepper` will be reused with a **modified STEPS array** for SD:

```
Preparing → Picking → Packed → Dispatched → Arrived → Completed
```

(Drops the "Requested" and "Approved" steps since there's no branch request/approval phase)

---

## Proposed Changes

### Backend — Entity & Migration

---

#### [MODIFY] [Order.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Entities/Order.cs)
- Add `bool IsHqInitiated { get; set; } = false;` — distinguishes SD orders from branch-requested orders
- Add `string? DispatchReason { get; set; }` — e.g., "Replenishment", "Event Loadout", "New Branch Setup"

#### [MODIFY] [RequestType.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Enums/RequestType.cs)
- Clean up the alias mess. Add proper distinct values:
  - `Replenishment = 3`
  - `EventLoadout = 4`
  - `NewBranchSetup = 5`

#### [MODIFY] [NotificationReferenceType.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Enums/NotificationReferenceType.cs)
- Add `SupplyDispatch = 5` for SD-specific notification references

#### [NEW] DB Migration
- `AddHqInitiatedFields` migration:
  - Add `IsHqInitiated` (bool, default false) to `Orders`
  - Add `DispatchReason` (nvarchar(200), nullable) to `Orders`

---

### Backend — Service Layer

---

#### [MODIFY] [IOrderWorkflowService.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Services/BranchOperations/IOrderWorkflowService.cs)
- Modify `CreateHqOrderAsync` to set `IsHqInitiated = true` and fire branch notification
- Add `Task<List<BranchOrderDto>> ListHqDispatchesAsync(string? status = null)` — filtered list for the "Outbound" tab
- Add `Task<List<BranchOrderDto>> ListIncomingShipmentsAsync(string? status = null)` — branch-side filtered list

#### [MODIFY] [OrderWorkflowService.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Services/BranchOperations/OrderWorkflowService.cs)
- In `CreateHqOrderAsync`:
  - Set `order.IsHqInitiated = true`
  - Set `order.DispatchReason = dto.RequestType` (maps "replenishment"/"event"/"manual" to the reason)
  - Fire notification to branch users: `CreateForRolesAsync(["BranchManager", "BranchOwner"], "Incoming Supply Shipment", "HQ is preparing a supply dispatch for {branchName}...", "Info", branchId, "SupplyDispatch", orderId)`
- In `SubmitDispatchAsync`: Fire notification to branch: `"Your supply shipment #{orderId} has been dispatched"`
- In `ConfirmArrivalAsync`: Fire notification to HQ roles: `"Branch {name} confirmed arrival of shipment #{orderId}"`
- In `CompleteTransactionAsync`: Fire notification to HQ: `"Shipment #{orderId} completed at {branchName}"`
- In `CancelOrderAsync` (when `IsHqInitiated`): Fire notification to branch: `"HQ cancelled planned shipment #{orderId}"`
- Implement `ListHqDispatchesAsync`: Filter `Orders.Where(o => o.IsHqInitiated)` with standard tab filtering
- Implement `ListIncomingShipmentsAsync`: Filter by current user's branch + `IsHqInitiated`

#### [MODIFY] [OrdersController.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Controllers/OrdersController.cs)
- Add `GET /api/Orders/hq-dispatches?status=` — calls `ListHqDispatchesAsync`
- Add `GET /api/Orders/incoming-shipments?status=` — calls `ListIncomingShipmentsAsync` (branch roles only)

#### [MODIFY] [NotificationsController.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Controllers/NotificationsController.cs)
- Currently only has a stub. Wire up:
  - `GET /api/Notifications` → `GetCurrentUserNotificationsAsync()`
  - `PUT /api/Notifications/{id}/read` → `MarkAsReadAsync(id)`
  - `PUT /api/Notifications/read-all` → Mark all as read

---

### Backend — DTOs

---

#### [MODIFY] [OrderWorkflowDtos.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/DTOs/Orders/OrderWorkflowDtos.cs)
- Add `IsHqInitiated` and `DispatchReason` to `OrderDetailDto` and `BranchOrderDto`

#### [NEW] [NotificationDtos.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/DTOs/Notifications/NotificationDtos.cs)
- `NotificationDto` — already exists inline, extract to shared DTO file if not already

---

### Frontend — API Layer

---

#### [MODIFY] [api.ts](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/branch-operations/api.ts)
- Add `isHqInitiated` and `dispatchReason` fields to `OrderDetail` and `BranchOrder` interfaces
- Add `fetchHqDispatches(status?)` → `GET /api/Orders/hq-dispatches`
- Add `fetchIncomingShipments(status?)` → `GET /api/Orders/incoming-shipments`
- Add notification API functions:
  - `fetchNotifications(unreadOnly?)` → `GET /api/Notifications`
  - `markNotificationRead(id)` → `PUT /api/Notifications/{id}/read`
  - `markAllNotificationsRead()` → `PUT /api/Notifications/read-all`

---

### Frontend — Orders Module (HQ Side)

---

#### [MODIFY] [OrdersPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/OrdersPage.tsx)
- Add a top-level **tab switcher**: "Inbound" (existing branch-initiated orders) | "Outbound" (HQ dispatches)
- "Outbound" tab calls `fetchHqDispatches()` and renders the same `OrderListCard` component
- Each card shows a "HQ Dispatch" pill/badge to differentiate from branch requests

#### [MODIFY] [OrderDetailPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/OrderDetailPage.tsx)
- Detect `order.isHqInitiated` and adjust:
  - Header subtitle: "HQ-initiated supply dispatch to **{branchName}**" instead of "Workflow management for order fulfillment..."
  - Use SD-specific stepper steps (no Requested/Approved)
  - Status banners adjusted for SD context

#### [MODIFY] [OrderFulfillmentStepper.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/components/OrderFulfillmentStepper.tsx)
- Accept new prop `variant?: 'default' | 'hq-dispatch'`
- When `variant === 'hq-dispatch'`, use a 6-step array:
  ```
  Preparing → Picking → Packed → Dispatched → Arrived → Completed
  ```
- Adjust `getStepIndex` mapping for the SD variant

#### [MODIFY] [OrderDetailsPanel.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/components/OrderDetailsPanel.tsx)
- Show `Dispatch Reason` field (e.g., "Low-Stock Replenishment", "Event Loadout")
- Show `Initiated By` instead of `Pushed By` when `isHqInitiated`

#### [MODIFY] [NewOrderRequestPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/NewOrderRequestPage.tsx)
- Rename header to "New Supply Dispatch" 
- Keep existing form fields (branch, priority, request type, dispatch window, items, notes)
- The `REQUEST_TYPES` dropdown already has the right options (`replenishment`, `event`, `manual`)
- On submit: the backend now handles `IsHqInitiated = true` + notifications

---

### Frontend — Supply Requests Module (Branch Side)

---

#### [MODIFY] [SupplyRequestsPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/supply-requests/SupplyRequestsPage.tsx)
- Add a secondary tab: "My Requests" (existing) | "Incoming Shipments" (HQ dispatches)
- "Incoming Shipments" tab calls `fetchIncomingShipments()` and renders cards
- Each card links to `/orders/{orderId}` for the branch to track

---

### Frontend — Notification Bell (Live Integration)

---

#### [MODIFY] [NotificationBell.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/components/UI/NotificationBell.tsx)
- **Replace hardcoded mock data** with live API calls:
  - On mount: `fetchNotifications()`
  - Badge count: unread count from API
  - "Mark all read" button: calls `markAllNotificationsRead()`
  - Each notification item: clickable, calls `markNotificationRead(id)` + navigates to the reference
- Add `ReferenceType` → route mapping:
  - `Order` / `SupplyDispatch` → `/orders/{referenceId}`
  - `SupplyRequest` → `/supply-requests/{referenceId}`
  - `Return` → `/returns/{referenceId}`
- Poll every 30s for new notifications (or use SignalR if hub exists)

---

### Frontend — Routing

---

#### [MODIFY] [router.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/app/router.tsx)
- No new routes needed. The existing `/orders/new`, `/orders/$orderId` routes handle SD.
- The "Incoming Shipments" tab on Supply Requests page links to existing `/orders/$orderId`.

---

## Component Reuse Summary

| Existing Component | Reused In SD? | Modifications |
|:---|:---|:---|
| `OrderFulfillmentStepper` | ✅ | New `variant` prop for 6-step SD flow |
| `SRItemTable` | ✅ | No changes — same picking/packing/branch-check modes |
| `SharedFloatingChat` | ✅ | No changes — `contextType="order"` works as-is |
| `WorkflowStatusBanner` | ✅ | Different copy for SD context |
| `OrderDetailsPanel` | ✅ | Shows dispatch reason + "Initiated By" |
| `DispatchDialog` | ✅ | No changes |
| `InventorySelectionModal` | ✅ | No changes |
| `SelectedItemsTable` | ✅ | No changes |

---

## Notification Triggers (Complete Matrix)

| Event | Recipients | Title | Message |
|:---|:---|:---|:---|
| SD Created | Branch users (BM, BO) | Incoming Supply Shipment | "HQ is preparing a supply dispatch for {branch}. {itemCount} items selected." |
| SD Dispatched | Branch users | Shipment Dispatched | "Supply shipment #{id} is on its way to {branch}." |
| SD Arrived | HQ roles | Shipment Arrived | "{branch} confirmed arrival of shipment #{id}." |
| SD Completed | HQ roles | Shipment Completed | "Shipment #{id} has been received and verified at {branch}." |
| SD Cancelled | Branch users | Shipment Cancelled | "HQ has cancelled the planned supply shipment #{id}." |

---

## Verification Plan

### Automated Tests
- `dotnet build` — verify migration and entity changes compile
- `npm run build` — verify no TypeScript errors

### Manual Verification
1. **HQ creates SD**: Navigate to `/orders/new`, select branch + items, submit → verify order created with `isHqInitiated = true`
2. **Branch notification**: Log in as branch user → verify notification bell shows "Incoming Supply Shipment"
3. **Picking flow**: HQ picks items using action column (approve/reject with notes) → verify same UX as existing OR
4. **Packing flow**: HQ packs → verify checkbox flow works
5. **Dispatch**: HQ assigns vehicle + tracking → verify branch notification fires
6. **Branch arrival**: Branch confirms arrival → verify HQ notification
7. **Branch completion**: Branch checks items → verify inventory transfer + completion notification
8. **Cancellation**: HQ cancels mid-flow → verify branch notification + allocation reversal
9. **Tab navigation**: Verify "Outbound" tab on Orders page filters correctly
10. **Branch incoming**: Verify "Incoming Shipments" tab on Supply Requests page shows SD orders
11. **Stepper**: Verify 6-step stepper renders correctly (no Requested/Approved steps)
