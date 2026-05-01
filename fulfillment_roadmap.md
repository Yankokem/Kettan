# Project Roadmap: Inventory Isolation & Fulfillment Lifecycle

This document outlines the next two major phases for the Kettan platform: separating Branch/HQ inventory data and perfecting the automated fulfillment transition.

---

## Phase 1: Inventory Isolation (Branch vs. HQ)

Currently, Branch Managers see "HQ Inventory" data in their inventory tab. This should be isolated so each branch only sees their local stock.

### Requirements:
1. **Data Partitioning**: The `/api/inventory` (or equivalent) endpoint must detect the user's branch ID.
   - **If Branch Role**: Return only items belonging to that specific branch.
   - **If HQ Role**: Return global/warehouse stock levels.
2. **UI Labeling**: Rename the "Inventory" tab for branch users to "My Branch Inventory" to avoid confusion with the main warehouse.
3. **Prevention**: Ensure branch users cannot "Edit" or "Delete" global item definitions, only manage their local quantities.

---

## Phase 2: Unified Fulfillment Lifecycle (HQ View)

Refining the flow from "Administrative Approval" to "Warehouse Action."

### Workflow Logic:
1. **The Approval (Supply Request Page)**:
   - HQ Manager clicks "Approve."
   - **Visual Feedback**: The request card/header should show a "Processing..." or "Generating Order..." loading state.
2. **The Handover**:
   - Behind the scenes, the system creates a linked `Order` record.
   - The status is immediately set to `Picking`.
3. **The Fulfillment (Order Processing Page)**:
   - The request "disappears" from the new/pending inbox.
   - It appears **immediately** in the "Order Processing" tab under the `Picking` status.
4. **Real-time Sync**: If the HQ Manager has both tabs open, the Order Processing list should ideally refresh or show the new item without a manual page reload.

---

## Next Steps:
- [ ] **Inventory Audit**: Determine if a new `BranchInventory` table is needed or if we filter the existing `Inventory` table by `BranchId`.
- [ ] **Workflow Polish**: Enhance the `SupplyRequestDetailHeader` with the loading state requested.
