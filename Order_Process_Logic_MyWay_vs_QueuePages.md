# Order Process Logic: Your Way vs Queue Pages Way

## 1) Your Way (Single Transaction, Status-Driven)

Core idea:
- One order stays one order record from start to finish.
- Picking, Packing, Shipping, Delivery are statuses of the same transaction.
- Main working area is Order Processing.

Flow:
1. Branch submits request.
2. HQ approves or rejects.
3. Same order moves to Picking status.
4. Same order moves to Packed status.
5. Same order moves to Dispatched/In Transit status.
6. Same order moves to Delivered status.
7. Returns (if needed) are linked to the same order.

UI behavior:
- One page/module handles the lifecycle.
- Use status tabs/filters/chips (Pending, Approved, Picking, Packed, In Transit, Delivered).
- Open one detail screen for all actions.

Pros:
- Very clear: one transaction, one home.
- Less page-switching.
- Easier to explain and demo quickly.

Tradeoff:
- As order volume grows, one page can become crowded for operations teams.

## 2) Queue Pages Way (Operational Views, Same Transaction)

Core idea:
- Still one order transaction and one status timeline.
- Add dedicated queue pages for specific work stages.
- Pages are workflow views, not separate transactions.

Flow:
1. Order approved in Order Processing.
2. Order appears in Picking & Packing queue.
3. After packed, order appears in Shipping & Delivery queue.
4. Delivered status is completed there (or in detail page).
5. Record remains the same order ID across all pages.

UI behavior:
- Order Processing = approval and full management.
- Picking page = "work now" list for pick/pack team.
- Shipping page = "dispatch now" list for delivery team.
- All actions update the same order status.

Pros:
- Faster execution for role-based operations.
- Cleaner queues for teams.
- Better for high-volume daily workflow.

Tradeoff:
- More pages to maintain.
- Can feel repetitive if order volume is small.

## 3) Straight Clarification

Both approaches use the same order transaction.
- Difference is UI structure, not data model.
- Your way: one main page with status filters.
- Queue-pages way: extra operational pages per stage.

## 4) Recommended Direction for Your Preference

Use Your Way as default:
1. Keep Order Processing as the main lifecycle page.
2. Keep status tabs as the primary workflow.
3. Keep Picking/Shipping pages optional (or hidden) until operations scale.

This matches your "same transaction, status-driven" requirement exactly.

## 5) Final Decision (Locked)

Decision:
- Kettan will use **Your Way** for MVP.

Why this is the correct choice now:
1. Solo build + 1-month timeline: fewer pages means faster delivery and less maintenance.
2. Existing RBAC already separates work by role without separate queue pages.
3. Current expected order volume does not justify dedicated operational queue screens.
4. Existing implementation direction already supports pick/pack/dispatch as status actions in order flow.

Required UX detail:
- Set default status views by role on Order Processing:
	- HQ Manager default: `PendingApproval`
	- HQ Staff default: `Approved` or `Picking`

Result:
- 80% of queue-page operational clarity with much lower build complexity.
