# Order Dispatch Workflow - Debugging Summary & Handover

## 1. The Core Symptom
**Problem:** A persistent `InvalidOperationException` (400 Bad Request) when attempting to dispatch an order by selecting a vehicle from the dropdown. 
**Error Message:** `{"message":"Cannot dispatch until all items are packed. Unpacked: ItemID:12"}`
**Console Error:** `SRItemTable.tsx:43 Maximum update depth exceeded` (Fixed).

## 2. Root Causes Identified

### A. Identifier Mismatch (The "Ghost" Update)
*   **Cause:** The frontend was using `ItemId` (the general catalog ID) to identify order items during the packing step. However, the backend required `RequestItemId` (the specific primary key for that line item in the order).
*   **Impact:** When the user clicked "Confirm Items Packed," the backend looked for items with IDs like `12` in the `RequestItems` table. Since `12` was the catalog ID, it found nothing to update. The update "succeeded" with 0 items changed, leaving the items unpacked in the database.

### B. Enum Value Collision (The "Premature Unlock")
*   **Cause:** In `OrderStatus.cs`, both `Packing` and `Packed` were assigned the same numeric value (`2`).
*   **Impact:** The system could not distinguish between "Currently Packing" and "Finished Packing." This caused the frontend to unlock the "Assign Logistics" (Vehicle Dropdown) immediately after picking, before the user actually clicked "Confirm Items Packed."

### C. Interface Inconsistency
*   **Cause:** The frontend `api.ts` interface `OrderRequestItem` was missing the `requestItemId` field, causing the TypeScript mapping to fail silently or ignore the ID even after the backend started sending it.

### D. Redundant State Loop
*   **Cause:** Both `OrderDetailPage` and `SRItemTable` maintained local copies of the items list. 
*   **Impact:** Updating an item triggered a "ping-pong" effect where the components fought over the state, causing infinite re-renders and the "Maximum update depth exceeded" crash.

## 3. Actions Taken & Current State

### Backend Changes:
1.  **DTO Update**: Added `RequestItemId` to `OrderRequestItemDto`.
2.  **Enum Fix**: De-duplicated `OrderStatus` values (Sequential: Picking=2, Packing=3, Packed=4).
3.  **Service Logic**: 
    *   Updated `SavePackingAsync` to use `RequestItemId`.
    *   Added **Robust Dispatch**: If a dispatch is triggered on a `Packed` order, the server now auto-packs any missed items to clear legacy data corruption.

### Frontend Changes:
1.  **API Fix**: Added `requestItemId` to the `OrderRequestItem` interface.
2.  **State Lifting**: Removed internal state from `SRItemTable.tsx`. All items are now managed by `OrderDetailPage.tsx` as the single source of truth.
3.  **Sequential UI**: The vehicle dropdown is now strictly locked until the order status is exactly `4` (Packed).

## 4. Why the Error Might Persist (Next Steps)
If the 400 error continues after these fixes:
1.  **Database State**: The specific Order (ID: 4) used in tests might have its status cached as `Packed` while items are still `Unpacked`. 
2.  **Enum Sync**: Ensure the server was restarted after the `OrderStatus.cs` change.
3.  **Check Payload**: Verify in the Network tab that `submitPacking` is sending `requestItemId` (e.g., `1, 2, 3`) and NOT the `itemId` (e.g., `12`).
