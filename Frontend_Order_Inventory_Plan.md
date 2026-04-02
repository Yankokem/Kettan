# Frontend Implementation Plan: Order Processing, Tracking, and Inventory

This document outlines the planned frontend architecture and UI strategy for the remaining Core and Additional modules in the Kettan platform, specifically focusing on Order Processing, Order Tracking, and Stock Movement (Inventory).

## 1. Order Processing (`/orders`)
**Purpose:** Provide HQ staff the tools to manage the lifecycle of branch supply requests.

*   **Order List Page (Table)**
    *   **UI:** A comprehensive `DataTable` component listing every branch constraint request.
    *   **Filters (Top Bar):** Date Range picker, Branch Dropdown, and Status Tabs (Pending, Approved, Packing, Ready for Dispatch, Suspended).
*   **Order Detail / Processing View (`/orders/:id`)**
    *   **Header:** Standard `AppLayout` header showing Order ID (`#ORD-...`) and current Status Chip.
    *   **Fulfillment Stepper:** A visual timeline component tracking: `Requested → Approved → Packing → Dispatched`.
    *   **Item Reconciliation Table:** A custom table showing the requested items.
        *   Columns: *Item Name*, *Requested Qty*, *HQ Available Stock*, and an input field for *Approved Qty*.
        *   Behavior: If the requested qty exceeds HQ stock, the UI clearly highlights the row in red, prompting the manager to "Partially Fulfill" the order or reject it.
    *   **Action Row:** Action buttons such as "Reject Order" or "Approve & Send to Packing", controlled by Role-Based Access Control hooks (`useAuthStore`).

## 2. Order Tracking (`/orders/:id/tracking`)
**Purpose:** Provide real-time delivery status visibility using a visual map interface.

*   **Technology Stack:** `react-leaflet` with OpenStreetMap base layer (API-key-free, highly customizable).
*   **Tracking UI Layout:**
    *   **Left Column (Logistics Journey):** 
        *   A vertical stepper showing real-time timestamps for checkpoints: "Order Received", "Packed at HQ", "Dispatched (EasyPost)", "In Transit", and "Arrived at Branch".
        *   Courier details, Driver Profile (Name/Plate Number), and ETA breakdown.
    *   **Right Container (The Map View):**
        *   A rounded MUI `Card` wrapping a full `<MapContainer>` from Leaflet.
        *   **Plotting Points:** 
            1. **HQ Origin Marker** (custom Kettan-colored pin).
            2. **Branch Destination Marker**.
            3. **A Polyline (Route)** drawn between Origin and Destination.
            4. **Moving Vehicle Marker** updating the simulated or requested GPS location of the order along the route.

## 3. Stock-in / Stock-out (Inventory Movement)
**Purpose:** Manage receiving supplier goods at HQ and daily consumption at the Branch levels.

*   **HQ Stock-in (Receiving Supplier Goods):**
    *   **Location:** Feature inside `/hq-inventory` (e.g., "Receive Stock" Dialog/Page).
    *   **Requirements:** A dedicated form capturing Item Selection, Quantity, Batch ID, and Expiry Date. Because Kettan uses strict FIFO, incoming stock cannot be processed without an expiry date assignment.
*   **Branch Stock-out (Consumption Logging):**
    *   **Location:** `/branches/:id/inventory` or a dedicated `/branch-consumption` tool for Managers.
    *   **Requirements:** A UI presenting 3 deduction methods defined in the Kettan documentation:
        1. **Direct Entry Tab:** Simple subtraction form (e.g., "Minus 5kg of Coffee Beans").
        2. **Sales Deduction Tab:** Recipe-based deduction (e.g., "Sold 50 Lattes" → system automatically subtracts milk, cups, and beans).
        3. **Physical Count Tab:** Audit form. User inputs counted total ("I counted 48 cups"), the system compares it against the expected total ("Expected 50"), and generates a variance log.
*   **The Transaction Ledger:**
    *   Both Stock-ins and Stock-outs aggregate as line items inside the `InventoryItemProfilePage`.
    *   **UI:** A nested `<DataTable>` tab showing a running ledger of every stock movement event, who authorized it, what type it was, and the exact timestamp.
