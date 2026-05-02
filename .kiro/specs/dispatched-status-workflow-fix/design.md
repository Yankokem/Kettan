# Dispatched Status Workflow Fix - Bugfix Design

## Overview

This bugfix addresses multiple UI and data display issues that occur when an order reaches the "Dispatched" status in the Order Processing system. The primary issue is that branch users cannot confirm package arrival because the "Package Arrived" button is missing from OrderDetailPage.tsx. Additionally, the OrderDetailsPanel component (lines 40-70) has hardcoded mock data instead of using the actual order data passed via props. The OrderDetailPage is also missing the "Complete Transaction" button logic for branch users after the package arrives and the branch checklist is completed.

The fix will:
1. Add the "Package Arrived" button for branch users when order status is "Dispatched"
2. Refactor OrderDetailsPanel to accept and display actual order data instead of hardcoded strings
3. Map actual fields from the OrderDetail interface (Date Requested, Destination, Status, Assigned Vehicle, Reviewed By, Filled By, Notes)
4. Add "Complete Transaction" button logic for branch users at the Arrived step with validation

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bugs - when an order has status "Dispatched" or "Arrived"
- **Property (P)**: The desired behavior when status is "Dispatched" or "Arrived" - display "Package Arrived" button, display "Complete Transaction" button, and show correct order data
- **Preservation**: Existing behavior for all other order statuses that must remain unchanged by the fix
- **OrderDetailPage**: The main component in `kettan.client/src/features/orders/OrderDetailPage.tsx` that renders the order detail view
- **OrderDetailsPanel**: The sidebar component in `kettan.client/src/features/orders/components/OrderDetailsPanel.tsx` that displays order metadata (currently has hardcoded data on lines 40-70)
- **OrderDetail**: The TypeScript interface in `kettan.client/src/features/branch-operations/api.ts` that defines the order data structure
- **confirmArrival**: The API function in `kettan.client/src/features/branch-operations/api.ts` that confirms package arrival (may need to be created)
- **completeTransaction**: The API function that marks an order as Completed after branch checklist validation (may need to be created)

## Bug Details

### Bug Condition

The bugs manifest when an order reaches the "Dispatched" or "Arrived" status. At these points, the UI fails to provide the correct workflow controls and displays hardcoded placeholder information instead of actual order data.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { status: OrderStatus, role: string }
  OUTPUT: boolean
  
  RETURN (input.status == 'Dispatched' OR input.status == 'Arrived')
         AND (input.role IN ['BranchManager', 'BranchOwner'] 
              OR input.role IN ['TenantAdmin', 'HqManager', 'HqStaff'])
END FUNCTION
```

### Examples

- **Branch User View - Dispatched**: When Maria Santos (Branch Manager) views ORD-12345 with status "Dispatched", she does not see a "Package Arrived" button to confirm the package has arrived at her branch. Expected: "Package Arrived" button should be visible.

- **Hardcoded Data Display**: When viewing the Order Details sidebar for ORD-12345, the panel shows hardcoded strings like "Apr 02, 2026, 09:41 AM", "Downtown Main", "Pending Approval" instead of the actual order data. Expected: The panel should display the actual data from the order prop (order.pushedToFulfillmentAt, order.branchName, order.status, etc.).

- **Branch User View - Arrived**: When Maria Santos (Branch Manager) views ORD-12345 with status "Arrived" and all items in the branch checklist are checked, she does not see a "Complete Transaction" button. Expected: "Complete Transaction" button should be visible and enabled.

- **OrderDetailsPanel Props Ignored**: The OrderDetailsPanel component receives an `order` prop with full OrderDetail data, but the component only uses `orderId` and renders hardcoded strings for all other fields. Expected: The component should map and display actual fields from the order prop.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The action buttons (Start Picking, Update Picking, Confirm Items Packed) must continue to display correctly for HQ users during Processing, Picking, and Packing statuses
- The DispatchAssignmentCard must continue to display for HQ users when status is "Packed"
- The Order Details panel must continue to display correct data for all order statuses (after fixing the hardcoded data issue)
- The "File Return" button must continue to work correctly for Delivered status
- The OrderFulfillmentStepper must continue to display correctly for all applicable statuses
- HQ users must continue to see read-only views when status is "Arrived"

**Scope:**
All orders that do NOT have status "Dispatched" or "Arrived" should be completely unaffected by this fix. This includes:
- Processing/Picking/Packing orders showing HQ workflow actions
- Packed orders showing the DispatchAssignmentCard
- Delivered orders showing the "File Return" button

## Hypothesized Root Cause

Based on the bug description, code analysis, and comparison with Gemini's analysis, the root causes are:

1. **Hardcoded Data in OrderDetailsPanel**: Lines 40-70 of `OrderDetailsPanel.tsx` contain hardcoded mock strings ("Apr 02, 2026, 09:41 AM", "Downtown Main", "Pending Approval", "Not yet assigned", "Pending Review", "Alex Morgan", etc.). The component accepts an `orderId: string` prop but should accept the full `order: OrderDetail` prop and map actual fields.

2. **Missing Package Arrived Button Logic**: The `OrderDetailPage` component does not have a conditional block to render the "Package Arrived" button when status is "Dispatched" and the user is a branch role. The button should call a `confirmArrival` API function (which may need to be created or already exists).

3. **Missing Complete Transaction Button Logic**: The `OrderDetailPage` component does not have a conditional block to render the "Complete Transaction" button when status is "Arrived", the user is a branch role, and all items in the branch checklist are checked. The button should call a `completeTransaction` API function with validation.

4. **OrderDetailsPanel Props Interface**: The `OrderDetailsPanelProps` interface only accepts `orderId: string` instead of the full `order: OrderDetail` object, preventing the component from accessing actual order data.

## Correctness Properties

Property 1: Bug Condition - Package Arrived Button Display

_For any_ order where the status is "Dispatched" and the user role is "BranchManager" or "BranchOwner", the fixed OrderDetailPage component SHALL display a "Package Arrived" button that, when clicked, calls the confirmArrival API function and updates the order status to "Arrived".

**Validates: Requirements 2.1**

Property 2: Bug Condition - Order Details Panel Displays Actual Data

_For any_ order with any status, the fixed OrderDetailsPanel component SHALL display the actual order data from the order prop, including order ID, date requested (from pushedToFulfillmentAt), destination branch (from branchName), status, assigned vehicle, reviewed by, filled by, and notes. The component SHALL NOT display hardcoded strings.

**Validates: Requirements 2.2, 2.3**

Property 3: Bug Condition - Complete Transaction Button Display

_For any_ order where the status is "Arrived" and the user role is "BranchManager" or "BranchOwner" and all items in the branch checklist are checked (isBranchChecked === true), the fixed OrderDetailPage component SHALL display a "Complete Transaction" button that, when clicked, calls the completeTransaction API function and updates the order status to "Completed".

**Validates: Requirements 2.4**

Property 4: Preservation - Non-Dispatched/Arrived Status Behavior

_For any_ order where the status is NOT "Dispatched" or "Arrived", the fixed code SHALL produce exactly the same UI behavior as the original code, preserving all existing button displays, action logic, and data display (with the exception that OrderDetailsPanel will now show actual data instead of hardcoded data for all statuses).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `kettan.client/src/features/orders/components/OrderDetailsPanel.tsx`

**Function**: `OrderDetailsPanel` component

**Specific Changes**:
1. **Update Props Interface**: Change `OrderDetailsPanelProps` to accept `order: OrderDetail` instead of `orderId: string`
   - Current: `export interface OrderDetailsPanelProps { orderId: string; }`
   - Fixed: `export interface OrderDetailsPanelProps { order: OrderDetail; }`
   - Import `OrderDetail` type from `../../branch-operations/api`

2. **Replace Hardcoded Data with Actual Props**: Map all hardcoded strings (lines 40-70) to actual order prop fields
   - Order ID: Use `order.orderId` instead of hardcoded `orderId` prop
   - Date Requested: Use `new Date(order.pushedToFulfillmentAt).toLocaleString()` instead of "Apr 02, 2026, 09:41 AM"
   - Destination Branch: Use `order.branchName` instead of "Downtown Main"
   - Status: Use `order.status` instead of "Pending Approval"
   - Assigned Vehicle: Use `order.vehicleId ? order.vehicleName : "Not yet assigned"` instead of hardcoded "Not yet assigned"
   - Reviewed By: Use appropriate field from order (may need to add to OrderDetail interface)
   - Filled By: Use appropriate field from order (may need to add to OrderDetail interface)
   - Notes: Use `order.notes` or appropriate field from order

**File**: `kettan.client/src/features/orders/OrderDetailPage.tsx`

**Function**: `OrderDetailPage` component

**Specific Changes**:
1. **Update OrderDetailsPanel Usage**: Pass the full `order` object instead of just `orderId`
   - Current: `<OrderDetailsPanel orderId={orderId} />`
   - Fixed: `<OrderDetailsPanel order={order} />`

2. **Add Package Arrived Button**: Add a new conditional block in the header actions area to render the "Package Arrived" button for Dispatched status
   - Condition: `orderStatus === 'Dispatched' && (user?.role === 'BranchManager' || user?.role === 'BranchOwner')`
   - Button: Primary button with CheckCircleRoundedIcon, label "Package Arrived", onClick calls `handleConfirmArrival`
   - Position: After the Dispatched status check, before the Delivered status check

3. **Add confirmArrival Handler**: Add a new async function `handleConfirmArrival` that calls the `confirmArrival` API function
   - Import `confirmArrival` from `../branch-operations/api` (if it exists, otherwise create it)
   - Implement handler: `const handleConfirmArrival = async () => { await confirmArrival(Number(orderId)); await loadOrder(); }`
   - This will enable the "Package Arrived" button functionality

4. **Add Complete Transaction Button**: Add a new conditional block in the header actions area to render the "Complete Transaction" button for Arrived status
   - Condition: `orderStatus === 'Arrived' && (user?.role === 'BranchManager' || user?.role === 'BranchOwner') && localItems.every(i => i.isBranchChecked)`
   - Button: Primary button with CheckCircleRoundedIcon, label "Complete Transaction", onClick calls `handleCompleteTransaction`
   - Position: After the Arrived status check

5. **Add completeTransaction Handler**: Add a new async function `handleCompleteTransaction` that calls the `completeTransaction` API function
   - Import `completeTransaction` from `../branch-operations/api` (if it exists, otherwise create it)
   - Implement handler: `const handleCompleteTransaction = async () => { await completeTransaction(Number(orderId)); await loadOrder(); }`
   - This will enable the "Complete Transaction" button functionality

**File**: `kettan.client/src/features/branch-operations/api.ts` (if needed)

**Function**: `confirmArrival` and `completeTransaction` API functions

**Specific Changes**:
1. **Create confirmArrival Function** (if it doesn't exist):
   - Function signature: `export async function confirmArrival(orderId: number): Promise<void>`
   - API call: `POST /api/orders/${orderId}/confirm-arrival`
   - This will update the order status to "Arrived" and stamp the arrival timestamp

2. **Create completeTransaction Function** (if it doesn't exist):
   - Function signature: `export async function completeTransaction(orderId: number): Promise<void>`
   - API call: `POST /api/orders/${orderId}/complete`
   - This will update the order status to "Completed" after branch checklist validation

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that render the OrderDetailPage and OrderDetailsPanel components with status "Dispatched" and "Arrived" and verify that the expected UI elements are present/absent and that actual data is displayed. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Missing Package Arrived Button Test**: Render OrderDetailPage with status="Dispatched" and role="BranchManager", assert "Package Arrived" button is present (will fail on unfixed code)
2. **Hardcoded Data Display Test**: Render OrderDetailsPanel with an order prop containing actual data, assert all fields display the actual data from the prop, not hardcoded strings (will fail on unfixed code)
3. **Missing Complete Transaction Button Test**: Render OrderDetailPage with status="Arrived", role="BranchManager", and all items checked, assert "Complete Transaction" button is present (will fail on unfixed code)
4. **OrderDetailsPanel Props Test**: Verify OrderDetailsPanel accepts and uses the full order prop instead of just orderId (will fail on unfixed code)

**Expected Counterexamples**:
- "Package Arrived" button is not rendered when status is "Dispatched"
- OrderDetailsPanel displays hardcoded strings like "Apr 02, 2026, 09:41 AM", "Downtown Main", "Pending Approval" instead of actual order data
- "Complete Transaction" button is not rendered when status is "Arrived" and all items are checked
- OrderDetailsPanel only accepts orderId prop and ignores actual order data

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed components produce the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderOrderDetailPage_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Expected Behavior Function:**
```
FUNCTION expectedBehavior(result)
  IF result.status == 'Dispatched' AND result.role IN ['BranchManager', 'BranchOwner'] THEN
    ASSERT result.hasPackageArrivedButton == true
  END IF
  
  IF result.status == 'Arrived' AND result.role IN ['BranchManager', 'BranchOwner'] AND result.allItemsChecked == true THEN
    ASSERT result.hasCompleteTransactionButton == true
  END IF
  
  ASSERT result.orderDetailsPanel.data == result.actualOrderData
  ASSERT result.orderDetailsPanel.data != hardcodedMockData
END FUNCTION
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed components produce the same result as the original components (with the exception that OrderDetailsPanel will now show actual data for all statuses).

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderOrderDetailPage_original(input) = renderOrderDetailPage_fixed(input)
  // Exception: OrderDetailsPanel will show actual data instead of hardcoded data for all statuses
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (all possible order statuses and roles)
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-Dispatched/Arrived statuses

**Test Plan**: Observe behavior on UNFIXED code first for non-Dispatched/Arrived statuses, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Processing Status Preservation**: Observe that "Start Picking" button displays for status="Processing" on unfixed code, then write test to verify this continues after fix
2. **Packing Status Preservation**: Observe that "Confirm Items Packed" button displays for status="Packing" on unfixed code, then write test to verify this continues after fix
3. **Packed Status Preservation**: Observe that DispatchAssignmentCard displays for status="Packed" on unfixed code, then write test to verify this continues after fix
4. **Delivered Status Preservation**: Observe that "File Return" button displays for status="Delivered" and branch role on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test OrderDetailPage renders "Package Arrived" button when status is "Dispatched" and role is branch
- Test OrderDetailPage renders "Complete Transaction" button when status is "Arrived", role is branch, and all items are checked
- Test OrderDetailsPanel displays actual order data from order prop instead of hardcoded strings
- Test OrderDetailsPanel correctly maps all fields from OrderDetail interface
- Test confirmArrival API call is made when "Package Arrived" button is clicked
- Test completeTransaction API call is made when "Complete Transaction" button is clicked
- Test that all other status/role combinations continue to render correct buttons

### Property-Based Tests

- Generate random order states with various statuses (excluding "Dispatched" and "Arrived") and verify UI elements remain unchanged
- Generate random role combinations and verify correct button visibility for each status
- Generate random order data and verify OrderDetailsPanel displays correct information for all fields
- Test that clicking "Package Arrived" updates the order status correctly across many scenarios
- Test that clicking "Complete Transaction" updates the order status correctly across many scenarios

### Integration Tests

- Test full workflow: Create order → Pick → Pack → Dispatch → Confirm Arrival → Complete Transaction
- Test that "Package Arrived" button appears after dispatch and updates status correctly
- Test that "Complete Transaction" button appears after arrival with all items checked and updates status correctly
- Test that OrderDetailsPanel shows correct data throughout the entire workflow
- Test that HQ users see read-only view when status is "Arrived"
