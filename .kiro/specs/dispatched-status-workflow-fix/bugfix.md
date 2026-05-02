# Bugfix Requirements Document

## Introduction

This document addresses multiple workflow issues that occur when an order reaches the "Dispatched" status in the Order Processing system. The bugs prevent branch users from confirming package arrival and displaying incorrect/placeholder data in the Order Details sidebar. The OrderDetailsPanel component has hardcoded mock data instead of using the actual order data passed as props, and the OrderDetailPage is missing the "Package Arrived" button logic for branch users when status is "Dispatched". These issues block the critical "Package Arrived" workflow step and create confusion about the actual state of dispatched orders.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an order has status "Dispatched" AND the user is a branch owner or branch manager THEN the system does not display the "Package Arrived" button

1.2 WHEN viewing the Order Details sidebar panel (OrderDetailsPanel.tsx) THEN the system displays hardcoded mock data (e.g., "Apr 02, 2026, 09:41 AM", "Downtown Main", "Pending Approval") instead of the actual order data from the order prop

1.3 WHEN the OrderDetailsPanel component receives an order prop with actual data THEN the system ignores the prop and renders hardcoded strings from lines 40-70 of OrderDetailsPanel.tsx

1.4 WHEN an order has status "Arrived" AND the user is a branch owner or branch manager THEN the system does not display the "Complete Transaction" button after the branch checklist is completed

### Expected Behavior (Correct)

2.1 WHEN an order has status "Dispatched" AND the user is a branch owner or branch manager THEN the system SHALL display a "Package Arrived" button that allows the branch user to confirm package arrival

2.2 WHEN viewing the Order Details sidebar panel (OrderDetailsPanel.tsx) THEN the system SHALL display the actual order data from the order prop including order ID, date requested, destination branch, status, assigned vehicle, reviewed by, filled by, and notes

2.3 WHEN the OrderDetailsPanel component receives an order prop with actual data THEN the system SHALL map and display the actual field values from the OrderDetail interface

2.4 WHEN an order has status "Arrived" AND the user is a branch owner or branch manager AND all items in the branch checklist are checked THEN the system SHALL display a "Complete Transaction" button that marks the order as Completed

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an order has status "Processing", "Picking", "Packing", or "Packed" THEN the system SHALL CONTINUE TO display the correct action buttons for HQ users (Start Picking, Update Picking, Confirm Items Packed)

3.2 WHEN an order has status "Packed" THEN the system SHALL CONTINUE TO display the DispatchAssignmentCard component for HQ users to assign logistics

3.3 WHEN viewing the Order Details sidebar panel for an order with any status other than "Dispatched" THEN the system SHALL CONTINUE TO display the correct order data (after fixing the hardcoded data issue)

3.4 WHEN an order has status "Delivered" AND the user is a branch owner or branch manager THEN the system SHALL CONTINUE TO display the "File Return" button

3.5 WHEN the OrderFulfillmentStepper component is displayed THEN the system SHALL CONTINUE TO show the correct status progression for all order statuses

3.6 WHEN an order has status "Arrived" AND the user is HQ staff THEN the system SHALL CONTINUE TO display a read-only view with no action buttons
