# Kettan Use Case Updates & Scope Analysis

## 1. Applied Changes
Based on your instructions, the following explicit changes have been made to the actor scopes:
- **Added:** `Branch/Store Staff` actor to Scope 3.
- **Removed:** `Handle support tickets` from Super Admin (Scope 1).
- **Removed:** `Receive notifications` from Branch Owner and Branch Manager (Scope 3).
- **Verified/Emphasized:** `Manage user accounts` is explicitly assigned to the Tenant Admin.

---

## 2. Updated Use Case Definitions

### Scope 1: Super Admin
*Operates at the SaaS platform level, managing the tenants (clients) rather than day-to-day business.*
*   Manage tenants
*   View platform analytics
*   View platform audit logs

### Scope 2: Tenant Admin, HQ Manager, HQ Staff
*Operates at the headquarters level for a specific tenant (business).*

**Tenant Admin**
*   Register and manage branches
*   Manage user accounts *(Ensured this is grouped with Assign roles and access)*
*   Assign roles and access
*   Configure reorder thresholds
*   Maintain inventory items
*   Maintain menu items

**HQ Manager**
*   Log inventory movements
*   Review and approve requests
*   Create fulfillment orders
*   Resolve returns and credits

**HQ Staff**
*   Pick and pack orders
*   Ship orders and tracking

### Scope 3: Branch Owner, Branch Manager, Branch/Store Staff (Updated)
*Operates at the individual branch/store level.*

**Branch Owner** *(See suggestions below - currently matches Branch Manager)*
*   Monitor stock levels
*   Log branch consumption
*   Submit supply request
*   Track delivery status
*   Initiate return request

**Branch Manager**
*   Monitor stock levels
*   Log branch consumption
*   Submit supply request
*   Track delivery status
*   Initiate return request

**Branch/Store Staff (NEW)**
*   Log branch consumption (e.g., ringing up sales or wasting items)
*   View stock levels (Read-only, localized to their branch)
*   Receive deliveries (Log items as received at the store)

---

## 3. Actor Scope Review & Recommendations

After analyzing the roles and their authorized actions, here are some critical observations and recommendations for your architecture:

### A. Redundancy Between Branch Owner and Branch Manager
In your current diagram, **Branch Owner** and **Branch Manager** point to the exact same use cases. 
*   **Recommendation:** Differentiate them. A Branch Owner should likely have access to branch-level analytics/reporting (e.g., profit/loss, aggregate consumption reports) and the ability to manage branch-level users. The Branch Manager handles the day-to-day operations (supply requests, returns, consumption). If their roles are identical, you might only need one role conceptually (e.g., "Branch Admin").

### B. The New "Branch/Store Staff" Role
Adding the Staff role is a good move for real-world application. Staff should have the lowest possible privileges.
*   **Their Scope:** They should only be able to deduct inventory (Log consumption) through making sales or reporting waste. They shouldn't be allowed to request new stock or initiate returns – those functions require financial/operational authorization and should remain with the Branch Manager. 

### C. HQ Staff vs. HQ Manager Separation
*   **Observation:** The separation here is excellent. HQ Managers authorize and resolve (approving requests, resolving returns), while HQ Staff execute (pick, pack, ship). This follows the principle of least privilege perfectly.

### D. System-Level "Notifications" 
*   **Observation:** You asked to remove "Receive notifications." This is conceptually correct for a Use Case Diagram. Receiving a notification isn't usually a standalone *use case* initiated by a user; it's a system behavior or extension of other use cases (like "Submit supply request" triggering a notification to HQ). Good call removing it.

### E. Tenant Admin Scope
*   **Observation:** The Tenant Admin acts as the master data manager (inventory items, menu items, users). This is standard and well-scoped. If the system scales, you might eventually need a specialized "Catalog Manager" role, but for now, bundling it under Tenant Admin is perfectly fine for most typical SaaS setups.
