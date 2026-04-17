# Frontend Next Modules Roadmap

## Current Status
Tenant Admin frontend is in a strong state for core admin screens.
The next step is to complete role-based operations and end-to-end workflow coverage.

## Priority Order

### 1. Branch Operations Role (Highest Priority)
Build the Branch Manager experience first:
- Consumption Logging module
- Branch-facing Orders flow (my requests, status, confirm delivery)
- Returns filing page

Why this is first:
- It unlocks real day-to-day branch operations.
- It generates activity data needed by reports and HQ workflows.

### 2. HQ Fulfillment Modules
Complete post-approval execution screens:
- Picking and Packing page
- Shipping and Delivery dispatch page (courier + vehicle assignment)
- Order status transition controls in Order Processing

Why this is second:
- It closes the fulfillment loop after internal requests are submitted.
- It ensures the no-tracker design still has complete status progression.

### 3. Notifications System (Shared UX Backbone)
Implement both notification layers:
- Bell notifications (persistent)
- Toast confirmations (ephemeral)

Key trigger events:
- Low stock
- Order status changes
- Return filed
- Delivery confirmed

Why this is third:
- It ties all modules together with operational awareness.
- It significantly improves usability and responsiveness.

### 4. Super Admin Frontend
Build the control-plane pages:
- Platform Dashboard
- Tenant Management
- Platform Analytics
- Help and Support

Why this is fourth:
- It completes multi-tenant governance and strengthens demo readiness.

### 5. Backend Integration Pass (Critical)
Replace remaining mock data with API-driven state:
- Orders
- Inventory
- Reports

Integration priority inside this phase:
1. Order status history
2. Inventory deduction logic
3. Report calculations

Why this is fifth:
- Frontend can look complete but still be non-operational without real data integrity.

## Practical 2-Week Execution Plan

### Week 1
1. Consumption Logging
2. Branch Orders/Returns
3. Picking and Shipping pages

### Week 2
1. Notifications
2. Super Admin pages
3. API integration and QA pass

## Deliverable Checklist

### Branch Role
- [ ] Consumption logging screen
- [ ] Request supply screen (branch view)
- [ ] Delivery confirmation flow
- [ ] Return filing flow

### HQ Role
- [ ] Picking queue/page
- [ ] Dispatch page with courier + vehicle selectors
- [ ] Status transition actions wired in UI

### Shared System
- [ ] Bell notification dropdown
- [ ] Toast feedback on user actions
- [ ] Notification state handling (read/unread)

### Super Admin
- [ ] Platform dashboard
- [ ] Tenants management list/detail
- [ ] Platform analytics summary
- [ ] Help and support page

### Integration + QA
- [ ] Remove/replace mock datasets
- [ ] Wire API calls and loading states
- [ ] Error handling states
- [ ] Basic role smoke test pass

## Suggested Immediate Next Build
Start with Consumption Logging scaffold first (route + page shell + reusable components), because it is the highest impact and unlocks branch workflow data for other modules.
