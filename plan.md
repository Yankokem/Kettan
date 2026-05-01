godamnit the wholr supply request and order processing workflow doesnt work fuck. I want you to work on it.

Supply Request (SR) Detail Page + Order Processing — Full Lifecycle Plan (v3)
Context: Multi-tenant SaaS coffee chain ops system. Supply requests live in their own SR page first. Only after HQ approves does it cross over to Order Processing, where the rest of the workflow runs. The SR page still shows the record throughout — but once approved, it switches to a loading/in-progress indicator while the actual work happens in Order Processing.

Page Visibility Rules

SR Page — visible to both HQ and Branch at all times for any SR record, regardless of status. When the SR is approved and being processed, the SR page shows a loading indicator / "In Progress" badge — read-only for everyone.
Order Processing Page — an SR only appears here after HQ approves it. This is where Picking → Packing → Dispatch → Completed happens.


1. Pending (SR Page only)
Branch submits the SR. It sits in the SR page, invisible to Order Processing. Branch can cancel it before HQ acts. HQ sees it but takes no action yet — they review it in the next step.

2. HQ Review (SR Page only)
HQ sees Approve (green) and Reject (red) buttons where the status indicator sits — HQ roles only.

Approve → SR is handed off to Order Processing. SR page switches to loading/in-progress view.
Reject → SR status becomes Rejected (terminal, stays in SR page only).


3. Approved — Loading State (SR Page)
Once approved, the SR card/page shows a spinner or "In Progress" badge. Both HQ and Branch can see this. Neither can take action here — all work is now in Order Processing.

4. Picking (Order Processing — HQ)

Table component: dedicated SRItemTable with mode="picking", replacing any shared generic table
Row-click toggles checkbox (whole row is the hit target)
Each row has a Reject action
Rejecting: row gets red outline + comment icon in action column → clicking opens a modal for rejection reason
Undo: uncheck rows, undo rejections (restores row fully)


5. Packing (Order Processing — HQ)

Checklist only — no reject action
Rejected items from Picking appear at the bottom, grayed out, disabled
Undo: uncheck rows
All non-rejected items must be checked before Dispatch button unlocks (disabled with helper text otherwise)


6. Dispatch (Order Processing)

HQ: read-only, waiting state
Branch: sees "Package Arrived" button → stamps timestamp + branch user identity → unlocks branch final checklist


7. Post-Arrival Branch Checklist (Order Processing — Branch)
After "Package Arrived":

Branch gets a final item checklist (no per-item comments)
Undo: uncheck rows
HQ: read-only, waiting
Once all items checked → "Complete Transaction" button activates


8. New Status: Completed (Order Processing + SR Page resolved)
Branch clicks "Complete Transaction" → SR is marked Completed. Both pages show a read-only summary:

Items received
Date received (timestamp of "Package Arrived")
Who confirmed arrival (branch user)
Who completed (branch user who clicked "Complete Transaction")

Update the status tracker/stepper in Order Processing to include Completed as the final step.

Undo / Back — Picking, Packing, Branch Checklist
Row-level undo only — no "go back a whole stage" button. Checked rows can be unchecked. Rejected items in Picking can be un-rejected (fully restored).

Show me your plan, some of these things might already be implemented but isnt used or errors, so iw ant you to work on it alright? comprehensive plan, do your best.