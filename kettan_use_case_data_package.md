# Kettan Use Case Data Package

This document is designed for AI consumption (ChatGPT, Claude, etc.). Copy and paste the sections below to help the AI understand the Kettan platform for generating Use Case specifications.

---

## 1. System Overview
- **Name**: Kettan
- **Type**: Multi-tenant B2B SaaS for coffee shop chains.
- **Core Function**: Centralized Order Fulfillment Management System (OFMS) connecting Branch locations to a central Headquarters (HQ).
- **Primary Goal**: Replace manual supply coordination (group chats, spreadsheets) with a structured, auditable transaction flow.

## 2. Actors & Roles
| Role | Responsibility | Primary Goals |
|---|---|---|
| **Tenant Admin** | The chain owner. | System configuration, staff management, high-level oversight. |
| **HQ Manager** | Inventory & fulfillment lead. | Review/Approve supply requests, oversee HQ stock levels. |
| **HQ Staff** | Fulfillment operator. | Picking, packing, and dispatching orders from the warehouse. |
| **Branch Manager** | Daily branch operator. | Consumption logging, submitting supply requests, confirming deliveries. |
| **Branch Owner** | Strategic branch operator. | Oversight of branch performance, can also submit requests. |

## 3. The Core "Supply Transaction" Lifecycle
This is the main business transaction in Kettan. It follows a strictly controlled state machine:

### Phase 1: Initiation (Branch Side)
1. **Consumption Logging**: Branch Manager logs daily sales → System deducts stock using Recipes.
2. **Low Stock Detection**: System detects stock below threshold → Auto-drafts a `SupplyRequest`.
3. **Submission**: Branch Manager reviews and submits the `SupplyRequest` (Status: `PendingApproval`).

### Phase 2: Review (HQ Side)
4. **Approval**: HQ Manager reviews the request.
   - Action: `Approve` (Full or Partial) or `Reject`.
   - Result: An `Order` is generated (Status: `Processing`).

### Phase 3: Fulfillment (HQ Side)
5. **Picking**: HQ Staff starts retrieving items from the warehouse using FIFO (First-In-First-Out) batch logic.
6. **Packing**: HQ Staff marks items as packed.
7. **Dispatch**: HQ Staff assigns a `Courier` + `Vehicle` and dispatches the order (Status: `InTransit`).

### Phase 4: Receiving (Branch Side)
8. **Confirmation**: Branch Manager receives the items and confirms delivery in the system.
9. **Transfer**: System automatically transfers inventory "Batch" ownership from HQ to the Branch.

## 4. Key Business Rules
- **Multi-Tenancy**: Data is strictly isolated by `TenantId`.
- **FIFO Enforcement**: All inventory deductions MUST use the oldest non-expired batches first.
- **Recipe-Based Deduction**: Consumption logging calculates ingredient usage automatically based on menu items sold.
- **No Direct Payments**: Internal transfers only; "Finance" is for cost tracking and performance scoring.

## 5. Status State Machine (Reference)
Use these exact status values for state transitions:

**SupplyRequest Statuses:**
`Draft`, `AutoDrafted`, `PendingApproval`, `Approved`, `PartiallyApproved`, `Rejected`, `Cancelled`, `Fulfilled`

**Order Statuses:**
`Processing`, `Picking`, `Packing`, `Packed`, `Dispatched`, `InTransit`, `Arrived`, `Completed`, `Cancelled`, `Returned`, `Delivered`

## 6. Exception Scenarios
- **HQ Stock-out**: HQ Manager may partially approve a request if HQ inventory is low.
- **Damaged Goods**: Branch Manager files a `Return` after delivery.
- **Resolution**: HQ Manager can resolve returns as `Replacement` (new order) or `Credit`.

---

## AI Prompt Suggestion
> "Using the **Kettan Use Case Data Package** provided, please generate a detailed Use Case specification for: **[INSERT TOPIC HERE, e.g., 'Automated Low-Stock Supply Request']**. 
>
> Please follow this structure:
> 1. Use Case Name
> 2. Primary Actor
> 3. Pre-conditions
> 4. Main Flow (Step-by-step)
> 5. Alternative Flows (Exceptions)
> 6. Post-conditions (System state changes)"
