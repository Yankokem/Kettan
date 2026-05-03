# Implementation Plan — Overhauling Return Request Workflow

The current "File Return" page is a basic form requiring manual entry of IDs, which is prone to error and provides poor user experience. This plan overhauls the page into a robust, guided workflow.

## User Review Required

> [!IMPORTANT]
> **Proposed Information Architecture for Returns:**
> - **Order Context**: Automatically fetched or selected via search (shows Reference No, Date, Branch).
> - **Itemized Selection**: Checkbox list of items from the original order.
> - **Reason Categories**: (Damaged, Expired, Delivery Error, Quality Issue).
> - **Return Resolution**: (Credit Request, Replacement Request).
> - **Evidence**: Visual placeholder for photo evidence (mandatory for certain reasons).

## Proposed Changes

### [Component Name]

#### [MODIFY] [router.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/app/router.tsx)
- Add `validateSearch` to `returnCreateRoute` to support `orderId` query parameter.

#### [MODIFY] [ReturnCreatePage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/returns/ReturnCreatePage.tsx) [REWRITE]
- Implement a two-step process:
    1. **Order Selection**: If `orderId` is not in URL, show a searchable dropdown of delivered orders.
    2. **Item Details**: Once an order is selected, display a table of its items.
- Add quantity validation (cannot return more than what was delivered).
- Add reason category dropdowns.
- Add "Resolution Type" (Credit/Replacement).
- Improve styling with modern Paper/Box layouts and typography.

#### [MODIFY] [OrderDetailPage.tsx](file:///c:/Users/nyanc/OneDrive/Desktop/Kettan-laptop/kettan.client/src/features/orders/OrderDetailPage.tsx)
- Update "File Return" button to pass `orderId` in the search params.

## Verification Plan

### Automated Tests
- Build verification: `npm run build`
- Manual verification of state transitions:
    1. Navigate from Order Detail -> Verify order is pre-selected.
    2. Select items -> Verify quantity validation.
    3. Submit -> Verify API call payload.
