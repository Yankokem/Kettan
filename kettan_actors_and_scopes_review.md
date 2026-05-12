# Kettan Use Cases & Actors Scope Review

Based on your system diagrams and updates, here is the revised markdown documentation of your Use Cases, followed by a breakdown of the scopes and my recommendations.

## 1. Updated Use Cases by Scope

### Scope 1: Super Admin
*Operates the overall SaaS application.*
*   **Manage tenants**
*   **View platform analytics**
*   **View platform audit logs**

### Scope 2: Tenant Admin, HQ Manager, HQ Staff
*Operates at the headquarters level for a specific tenant.*

**Tenant Admin**
*   **Register and manage branches**
*   **Manage user accounts**
*   **Assign roles and access**
*   **Configure reorder thresholds**
*   **View audit logs**

**HQ Manager**
*   **Maintain inventory items**
*   **Process fulfillment orders** *(Unified: covers approving, creating, picking/packing, and shipping)*
*   **Resolve returns and credits**
*   **Maintain menu items**
*   **Configure reorder thresholds**
*   **View audit logs**

**HQ Staff**
*   **Process fulfillment orders** *(Unified: covers picking/packing, shipping, etc.)*
*   **Maintain menu items**

### Scope 3: Branch Level Actors
*Operates at the individual branch level.*

**Branch Owner**
*   **Manage branch inventory**
*   **Manage supply requests** *(Unified: covers submitting, tracking, receiving)*
*   **Configure reorder thresholds**
*   **View audit logs**

**Branch Manager**
*   **Manage branch inventory**
*   **Manage supply requests** *(Unified: covers submitting, tracking, receiving)*
*   **Initiate return request**
*   **Configure reorder thresholds**

**Branch / Store Staff**
*   **Manage supply requests** *(Unified: submitting, tracking, receiving)*
*   **Log branch consumption** *(Exclusive to this role)*

---

## 2. "What's Up" with the Scopes (Analysis & Recommendations)

Here is a scan of your architecture's actor scopes, highlighting what makes sense and what might need tweaking based on the latest updates:

### 1. Unified Supply Request & Fulfillment Processing
*   **HQ Side (`Process fulfillment orders`):** Consolidating the approval, picking, and shipping into a single "Process fulfillment orders" use case for both HQ Managers and HQ Staff drastically simplifies the diagram. It acknowledges that both roles collaborate on the single continuous flow of getting supplies to branches.
*   **Branch Side (`Manage supply requests`):** Similarly, grouping the submitting, tracking, and receiving under one task for Owner, Manager, and Staff cleans up the branch side. However, you are letting Staff submit resource requests—ensure your UI has budget/quantity safeguards if staff are making these orders!

### 2. The Great Consumption Shift
*   **Log branch consumption:** By restricting this *only* to Branch/Store Staff, you are fully committing to the "Staff executes, Managers observe/manage" paradigm. Branch Managers and Owners are no longer expected to be logging day-to-day item usage off the floor themselves. This provides a very clean role separation.

### 3. Reorder Threshold Access
*   You granted `Configure reorder thresholds` to everyone *except* HQ/Branch Staff. This is highly flexible:
    *   Tenant Admin/HQ Manager can set global defaults.
    *   Branch Owners/Managers can tweak thresholds specifically for their branch's localized needs.
    *   Staff relies on these rules.

### 4. Visibility and Accountability (Audit Logs & Inventory)
*   **Audit logs:** Appropriately distributed to stakeholders (Tenant Admin, HQ Manager, Branch Owner). Lower-level managers and staff don't need to see the audit trail.
*   **Inventories and Menus:** Branch inventories are explicitly managed by Branch Owners/Managers, while global overarching menus are strictly managed by HQ. 

**Conclusion:** These updates consolidate the scattered micro-tasks into meaty, meaningful business use cases. It clearly defines the line between high-level management (thresholds, audits) and execution (consumption, fulfillment).