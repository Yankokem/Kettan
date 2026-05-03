# Supply Request & Order Processing — Polish & Enhancement Plan

## Overview
The supply request → order processing workflow is functional but unpolished. This plan addresses specific UX issues, missing validations, cancellation flow, rejection visibility, and adds a messaging feature.

---

## 1. SupplyRequestCreatePage Cleanup

### Decisions Made (answering your questions):
- **Reference Number**: The backend auto-generates `SR-{RequestId}` — the text field is removed. The ID will be shown as read-only text after creation.
- **Request Type (Manual/Auto)**: This dropdown is pointless for branch users who are always creating "Regular" requests manually. Removed entirely — the backend defaults to `Regular`.
- **Priority**: Yes, it's just a label/tag. Kept as a dropdown but renamed to "Priority Level" for clarity.
- **Dispatch Date**: Renamed to **"Preferred Delivery Date"** — this is the date the branch *wants* the items to arrive. HQ uses it as a guideline for scheduling dispatch.

### Files Modified:
#### [MODIFY] [SupplyRequestCreatePage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/supply-requests/SupplyRequestCreatePage.tsx)
- Remove `referenceNumber` state and TextField
- Remove `requestType` state and Dropdown
- Rename dispatch date label to "Preferred Delivery Date"
- Clean up `handleCreate` payload (hardcode requestType to 'manual', remove referenceNumber)

---

## 2. SRItemTable — Picking Action Column Fix

The picking table currently shows a checkbox on the left. Per request, we replace this with an **Action Column on the right** containing:
- ✅ **Approve icon button** (green check) — marks item as picked
- ❌ **Reject icon button** (red X) — opens rejection reason modal
- 💬 **Message icon** — visible when item has rejection reason (viewable by both HQ and branch)

### Files Modified:
#### [MODIFY] [SRItemTable.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/supply-requests/components/SRItemTable.tsx)
- In `picking` mode: remove the checkbox column entirely
- Add a new Actions column (right-aligned) with:
  - CheckCircle icon (green) to toggle `isPicked`
  - Close icon (red) to open rejection modal
  - When rejected: show Comment icon (to view reason) + Undo icon
- In `packing` / `branch-check` modes: keep checkbox but move it into the action column as well (consistent design)
- In `readonly` / `readonly-packed` modes when viewing from branch: show a Comment icon on any rejected item so branch can read the rejection reason

---

## 3. Order Cancellation Flow (HQ Only, up to Packed)

### Business Logic:
- **Who**: Only HQ users (TenantAdmin, HqManager, HqStaff)
- **When**: Only when order status is `Processing`, `Picking`, `Packing`, or `Packed`
- **What happens**:
  - A confirmation modal appears: "Are you sure you want to cancel this order? All allocated inventory will be returned to HQ stock."
  - HQ user must provide a cancellation reason
  - Backend reverses any inventory deductions (from OrderAllocations)
  - Order status → `Cancelled`
  - SupplyRequest status → `Cancelled`
  - Notification sent to branch

### Files Modified:

#### [NEW] Cancel Order Endpoint
#### [MODIFY] [OrdersController.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Controllers/OrdersController.cs)
- Add `POST /api/Orders/{id}/workflow/cancel` endpoint

#### [MODIFY] [IOrderWorkflowService.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Services/BranchOperations/IOrderWorkflowService.cs)
- Add `Task<OrderDetailDto?> CancelOrderAsync(int orderId, CancelOrderDto dto)`

#### [MODIFY] [OrderWorkflowService.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Services/BranchOperations/OrderWorkflowService.cs)
- Implement `CancelOrderAsync`: reverse allocations, set statuses, log history

#### [MODIFY] [OrderWorkflowDtos.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/DTOs/Orders/OrderWorkflowDtos.cs)
- Add `CancelOrderDto` with `Reason` field

#### [MODIFY] [api.ts](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/branch-operations/api.ts)
- Add `cancelOrder(orderId, reason)` function

#### [MODIFY] [OrderDetailPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/OrderDetailPage.tsx)
- Add "Cancel Order" button (visible for HQ, up to Packed)
- Add CancelOrderModal component with reason input + confirmation

---

## 4. Validation & Confirmation Modals per Status Transition

Add confirmation modals for each workflow step showing a summary:

### Picking → Packing confirmation:
- Summary: X items approved, Y items rejected (with reasons listed)
- Warning if no items were picked
- "Confirm & Move to Packing" / "Cancel"

### Packing → Packed confirmation:
- Summary: X items packed (ready for dispatch)
- Y items rejected during picking (shown greyed out)
- "Confirm All Packed" / "Cancel"

### Dispatch confirmation:
- Already handled by DispatchAssignmentCard — no changes needed

### Files Modified:
#### [MODIFY] [OrderDetailPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/OrderDetailPage.tsx)
- Add `PickingConfirmModal` and `PackingConfirmModal` inline
- Wire the existing buttons to open these modals instead of directly calling the API

---

## 5. Messaging Feature (HQ ↔ Branch Communication)

A simple chat/messaging system scoped to each order. Both HQ (OrderDetailPage) and Branch (SupplyRequestDetailPage) can send/view messages.

### Backend:

#### [NEW] [OrderMessage.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Entities/OrderMessage.cs)
New entity:
```csharp
public class OrderMessage : ITenantEntity {
    int MessageId, int TenantId, int OrderId, int SenderUserId,
    string Content, DateTime SentAt
}
```

#### [MODIFY] [ApplicationDbContext.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Data/ApplicationDbContext.cs)
- Add `DbSet<OrderMessage>` + tenant filter

#### [NEW] DB Migration
- Add OrderMessages table

#### [MODIFY] [OrderWorkflowDtos.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/DTOs/Orders/OrderWorkflowDtos.cs)
- Add `OrderMessageDto`, `SendMessageDto`

#### [MODIFY] [IOrderWorkflowService.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Services/BranchOperations/IOrderWorkflowService.cs)
- Add `GetMessagesAsync(orderId)`, `SendMessageAsync(orderId, dto)`

#### [MODIFY] [OrderWorkflowService.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Services/BranchOperations/OrderWorkflowService.cs)
- Implement messaging methods

#### [MODIFY] [OrdersController.cs](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/Kettan.Server/Controllers/OrdersController.cs)
- Add `GET /api/Orders/{id}/messages` and `POST /api/Orders/{id}/messages`

### Frontend:

#### [MODIFY] [api.ts](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/branch-operations/api.ts)
- Add `fetchOrderMessages(orderId)` and `sendOrderMessage(orderId, content)`

#### [NEW] [OrderMessagesModal.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/components/OrderMessagesModal.tsx)
- Chat-style modal with message list + input
- Shows sender name, timestamp, message content
- Used on both OrderDetailPage (HQ) and SupplyRequestDetailPage (Branch)

#### [MODIFY] [OrderDetailPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/OrderDetailPage.tsx)
- Add message button in header row

#### [MODIFY] [SupplyRequestDetailHeader.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/supply-requests/components/SupplyRequestDetailHeader.tsx)
- Add message button (only when order is linked)

#### [MODIFY] [SupplyRequestDetailPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/supply-requests/SupplyRequestDetailPage.tsx)
- Wire up messages modal with orderId from linkedOrderId

---

## 6. Verification Plan

### Build Check
- Run `dotnet build` on backend to verify no compilation errors
- Run `npm run build` on frontend to verify no TypeScript errors

### Manual Verification
- Test supply request creation (simplified form)
- Test picking with action column (approve/reject)
- Test rejection reason visibility on branch side
- Test order cancellation at each eligible status
- Test confirmation modals for picking/packing transitions
- Test messaging between HQ and branch
