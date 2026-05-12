# Dashboard Modernization & Dynamic Metrics Summary

This document summarizes the transition of the Kettan Dashboard from static placeholders to a dynamic, data-driven experience.

## 1. Dynamic Performance Metrics (Backend)
- **Real-time Aggregation**: Implemented server-side logic in `AnalyticsService.cs` to calculate live counts for the current analaytics the current statcards displays
- **Trend Calculation**: Developed a week-over-week (WoW) comparison logic that calculates percentage changes by comparing the last 7 days of data against the 7 days prior.

## 2. UI Refinement & Branding
- **Minimalist Aesthetics**: Removed redundant "sub-text" labels (e.g., "Requires fulfillment") to achieve the requested professional look.
- **Trend Formatting**: Updated all stat cards to display dynamic percentages (e.g., `+12.5% vs last week`) instead of static numbers.
- **Color Sync**: Updated branch card labels to "Kettan Brown" (`#6B4C2A`) for consistent branding across the profile and dashboard.

## 3. Interactive Drill-down (Clickable Cards)
- **Modal Integration**: Added a premium detail modal using MUI `Dialog` that appears when any stat card is clicked.
- **Data Breakdown**: Each card provides a unique, dynamic list of the top 10 most relevant items contributing to the metric (e.g., specific low-stock SKUs or active order IDs).
- **UX Reliability**: Implemented `ButtonBase` in the `StatCard` component to ensure high-fidelity touch/click feedback (ripples) and robust event propagation.
- **Modal UI Refinement**:
    - **Typography**: Reduced font sizes for both titles (`0.95rem`) and list items (`0.82rem` primary, `0.75rem` secondary) to create a more sophisticated, data-dense look.
    - **Visual Hierarchy**: Added contextual icons to the modal headers that match the parent stat card's icon.
    - **Spacing**: Tightened padding and margins for a sleeker, more professional footprint.

## 5. Order Processing Modernization
- **Operational KPIs**: Introduced four new interactive metrics for the Order Processing module:
    - **Pending Fulfillment**: Tracking approved orders awaiting processing.
    - **Orders Picking**: Real-time count of orders currently being picked.
    - **In Transit**: Active shipments moving through the logistics chain.
    - **Total Fulfillment Cost**: Financial overview of processed supply requests.
- **Drill-down Capability**: Each Order Processing stat card is now clickable, revealing a detailed list of the top 10 specific orders or costs contributing to the metric.
- **Unified Trends**: Standardized the "X% vs last week" visual feedback across all system dashboards.

## 6. Returns Management Modernization
- **Dynamic KPIs**: Refactored the Returns dashboard to use live database metrics instead of client-side filtering:
    - **Total Returns**: Monitors the all-time growth of returns.
    - **Awaiting Action**: Tracks returns requiring immediate HQ attention (Submitted/Inspecting).
    - **In Transit / Arrived**: Real-time tracking of returns currently on the way to the warehouse.
    - **Completed**: Summarizes resolved and credited returns.
- **Interactive Drill-down**: Enabled full modal breakdown for each return metric, allowing users to jump directly to specific return records from the summary cards.
- **Unified Aesthetic**: Applied the refined modal typography (`0.95rem` headers, `0.82rem` list items) and iconography consistent with the Dashboard and Order Processing modules.

## 7. Branch Network Analytics
- **Live Branch Status**: Integrated real-time monitoring of branch health:
    - **Monitored Branches**: Tracks active, operational locations.
    - **Branches Low on Stock**: Identifies locations requiring inventory replenishment based on global thresholds.
    - **Total Branches**: Overview of the entire network size.
    - **Inactive Branches**: Monitors locations currently in setup or decommissioning phases.
- **Direct Navigation**: Modal breakdowns allow HQ managers to jump directly into specific branch profiles for immediate intervention.

## 8. HQ Inventory & Stock Modernization
- **SKU-Level Visibility**: Modernized the global inventory dashboard with drill-down metrics:
    - **Total Active SKUs**: Monitors the variety of stock held in the main warehouse.
    - **Low Stock Alerts**: Real-time identification of critical stock levels.
    - **Pending Restocks**: Tracks supplier orders and inbound shipments.
    - **Inventory Value**: Provides a financial snapshot of total held stock value.
- **Integrated Workflows**: Users can navigate directly from an inventory alert modal to the specific SKU profile or the related supplier order.

## 9. Menu & Recipes Modernization
- **Global Menu Oversight**: Integrated dynamic tracking for the tenant-wide menu:
    - **Total Items**: Full count of all menu offerings.
    - **Active**: Real-time monitoring of live items available to branches.
    - **Inactive**: Visibility into hidden or seasonal menu items.
    - **Out of Stock**: Advanced logic that checks the availability of mandatory ingredients in HQ to identify menu items that cannot be fulfilled.
- **Drill-down Navigation**: Modal breakdowns allow managers to jump directly to specific menu item profiles to update pricing, status, or recipes.

## 10. Staff Directory Modernization
- **Team Insights**: Implemented real-time workforce analytics:
    - **Total Staff**: Unified count of the entire organizational team.
    - **Active**: Monitoring of personnel currently onboarded and active in the system.
    - **Inactive**: Visibility into staff members currently off-boarded or in transition.
    - **Archived**: Secure tracking of historical staff records and deleted accounts.
- **Direct Profile Access**: The drill-down modals enable rapid navigation to staff profiles, allowing HR or managers to quickly adjust roles, branch assignments, or system access.

## 11. Audit Logs Modernization
- **Administrative Intelligence**: Enabled dynamic auditing metrics for high-level oversight:
    - **Total Events**: Real-time count of all system-wide activities.
    - **Created Events**: Tracking of new entity registrations and resource additions.
    - **Active Users**: Monitoring of system engagement by measuring distinct actors over time.
    - **Archive/Inactive Events**: visibility into data lifecycle changes (deletions, archival).
- **Trend-Only KPI Standard**: In accordance with administrative sensitivity, these metrics provide Week-over-Week (WoW) percentage trends without direct drill-down capabilities, maintaining a focused high-level view while still indicating activity surges or drops.

## 12. Finance & Reports Modernization
- **Financial Transparency**: Integrated real-time fiscal analytics with accurate cost tracking:
    - **Total Fulfillment Cost**: Fixed logic to aggregate the actual value of picked and dispatched supply orders, providing a true spend reflection.
    - **Chain Inventory Value**: Live valuation of all held assets across HQ and all branch locations.
    - **Total Wastage Loss**: Monitoring of financial leakage from spoilage and manual inventory adjustments.
    - **Returns Credit Loss**: Tracking of credits issued for returned goods, identifying potential supplier or branch handling issues.
- **Fiscal Drill-downs**: Managers can now drill into each financial metric to see the specific orders, batches, or logs contributing to the total value, ensuring full accountability.

## 13. Technical Implementation Details
- **DTO Synchronization**: Created `StatMetricDto` and `StatItemDto` in C# and matched them with TypeScript interfaces in `reportsApi.ts`.
- **EF Core Optimization**: Used `Include` and `Select` projections to fetch drill-down data efficiently without over-fetching unrelated entity fields.
- **Debug Traceability**: Added console logging for interaction tracking to ensure modal state transitions are visible in development.

---
**Status**: Completed & Verified
**Date**: May 12, 2026
