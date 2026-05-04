Good catch, critical piece. Let me think through both sides:
Branch side — when does deduction happen?
The items being returned are already in the branch inventory. The deduction should happen when the branch confirms handoff (Dispatched). At that point the items have physically left the branch, so it makes sense to deduct from branch inventory then.
HQ side — the damaged/expired problem:
When the package arrives and gets inspected, HQ marks each item with the verified reason. If it's Damaged or Expired — those batches should be written off, not restocked. If somehow it's a Delivery Error or Quality Issue that's still in good condition, it could potentially go back to HQ inventory. So the inspection step needs a per-item "disposition" — Write Off vs Restock.
Quick summary before the full prompt:
Branch confirms handoff → deduct from branch inventory
HQ inspects:
  - Damaged/Expired → write off (InventoryTransaction: WriteOff)
  - Delivery Error/Quality Issue (good condition) → restock to HQ batch

Here's the updated full prompt:

I want to implement the Returns workflow for my system. Read the attached MDs for full context — the architecture MD is the source of truth for the system, the implementation plan MD covers the return filing UI but is outdated on the post-submission flow, ignore that part.
System context: Kettan is a multi-tenant B2B SaaS for coffee chain operations. Returns are branch-initiated. There are no courier user accounts — vehicles are registered in the system but driven by third-party couriers without system access. The existing messaging/notes feature from Supply Requests and Order Processing should be replicated for Returns.

Finalized return workflow:
Status machine:
Draft → Submitted → Acknowledged → Dispatched → Arrived → Inspecting → Completed
                        ↘ Rejected (only at Submitted stage)
Step-by-step:

Draft → Submitted — Branch files the return. They select the original order, check which items to return, specify quantity, select a reason per item (Damaged, Expired, Delivery Error, Quality Issue), and declare the expected resolution (Credit or Replacement).
Submitted → Acknowledged or Rejected — HQ reviews the claim. If rejected, they provide a reason and the return is closed. If acknowledged, HQ simultaneously assigns a Vehicle and sets a Pickup Date/Time. Branch is notified and can see "Vehicle NGA-021 arriving May 6, 2:00 PM — have items ready."
Acknowledged — Branch prepares and packs the items. HQ can reschedule the pickup (change vehicle or date/time) as long as status is still Acknowledged, and the branch view updates accordingly. A note should accompany any reschedule. Rescheduling is locked once Dispatched.
Acknowledged → Dispatched — Branch confirms the physical handoff to the vehicle. This triggers an inventory deduction from the branch for the returned items. Log this as an InventoryTransaction with type Transfer (or a dedicated ReturnDispatch type if the codebase supports it).
Dispatched → Arrived — HQ confirms the package has arrived at HQ.
Arrived → Inspecting — HQ inspects the returned items against the stated reason. Resolution (Credit or Replacement) was already locked in at Acknowledgment, so inspection is just verification. During inspection, HQ sets a disposition per item:

Damaged or Expired → Write Off. Log as InventoryTransaction type WriteOff. Items do not re-enter HQ inventory under any circumstance.
Delivery Error or Quality Issue (item is still in usable condition) → Restock. Items are returned to an HQ batch and logged as InventoryTransaction type Restock.


Inspecting → Completed — HQ confirms all items have been dispositioned and marks the return complete. The pre-set resolution (Credit or Replacement) is then executed.


Inventory rules summary:

Branch inventory deducted at Dispatched (handoff confirmed).
HQ inventory updated at Inspecting → Completed based on per-item disposition.
Damaged/Expired items are always written off — they never re-enter HQ inventory.
Delivery Error/Quality Issue items in good condition may be restocked at HQ discretion during inspection.
All inventory movements must be logged in InventoryTransaction with the return reference.


Additional considerations:

When HQ assigns a vehicle during acknowledgment, show a warning if that vehicle already has an existing schedule on the selected date.
Rescheduling is only allowed while status is Acknowledged. Lock the field after Dispatched.
Notify the branch via in-app notification when the pickup is scheduled or rescheduled (Mailtrap already integrated).
Replicate the existing notes/comments-per-record pattern from Supply Requests and Order Processing.