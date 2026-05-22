# ☕ Kettan: Easy-to-Understand System Study Guide & Panelist Defense

This guide provides simple, clear, and direct explanations of how the Kettan Order Fulfillment Management System (OFMS) works. It contains no confusing code snippets or overly complex steps, making it perfect for memorizing and presenting to your thesis panel.

---

## 🧭 1. System Overview (The Big Picture)

### What is Kettan?
Kettan is a **cloud-based, multi-tenant B2B SaaS platform** designed for coffee shop chains that have multiple branches.
*   **Multi-tenant:** One system used by multiple different coffee companies. Each company's data is completely locked and invisible to others.
*   **B2B (Business-to-Business):** Kettan is sold to businesses (coffee shop owners), not individual customers.
*   **The Problem It Solves:** Instead of branches requesting supplies via chaotic chat groups (like Viber/Messenger) and tracking stock on messy spreadsheets, Kettan centralizes and automates the entire supply pipeline between the Headquarters (HQ) warehouse and the retail branches.

### Core Operational Roles (Who uses it?)
1.  **Tenant Admin (Company Owner):** Manages the company subscription, registers branches, and manages the employee directory.
2.  **HQ Manager:** Approves or rejects supply requests from branches and monitors warehouse stock.
3.  **HQ Staff:** Physically picks, packs, and dispatches the approved supplies to the branches.
4.  **Branch Manager:** Logs daily ingredient usage, views stock alerts, and receives supply shipments.
5.  **Store Staff (Barista):** Helps log daily sales or raw ingredient consumption.

---

## 🔄 2. The Core Workflow (How Supplies Move)

The lifeblood of the system is the supply chain cycle from the HQ warehouse to the branches:

1.  **Logging Consumption:** The branch baristas record how much stock they used (manually or automatically via menu item sales).
2.  **Low Stock Alert & Auto-Drafting:** When branch stock falls below a set threshold, the system automatically sends an email alert and drafts a new supply request.
3.  **Branch Submission:** The Branch Manager reviews the automatically drafted request and submits it to HQ.
4.  **HQ Approval:** The HQ Manager reviews the request and can either fully approve, partially approve (if HQ is low on stock), or reject it.
5.  **Picking & Packing:** HQ Staff gets a checklist to physically pick the items from warehouse shelves and pack them.
6.  **Dispatch:** HQ Staff assigns a courier and delivery vehicle, changing the order status to "Dispatched."
7.  **Receiving & Restocking:** The Branch Manager receives the physical delivery, checks for any damages or missing items, and clicks "Confirm." The system automatically transfers stock ownership from HQ to the branch inventory.

---

## 💳 3. What happens when a user cancels their subscription?

Panelists love to ask this scenario. Here is the simple, direct answer:

### The Cancellation Process
*   **What triggers it:** The Tenant Admin clicks the "Cancel" button on the billing page.
*   **What files manage this:** 
    *   `SubscriptionController.cs` (handles the API request from the web page)
    *   `SubscriptionService.cs` (handles the business logic and database updates)
*   **What happens to the database:** The system updates the Tenant's status and their Subscription status to **"Canceled"** and turns off auto-renew.

### How the system enforces the block
To stop the canceled user from using the app without locking them out entirely, a special background check program called **`SubscriptionCheckMiddleware.cs`** intercepts every action in the application:

1.  **Allows Login & Billing Access:** The system always allows access to login, logout, and billing pages. This is critical so a canceled user can still log back in to pay and reactivate their account.
2.  **Allows Read-Only Access (GET requests):** The user can still navigate their dashboard, view their past orders, and look at their records.
3.  **Blocks All Write Operations (POST, PUT, DELETE requests):** If the user tries to save new data, edit records, or delete anything (like logging consumption or submitting supply requests), the system instantly blocks the action and returns a **"402 Payment Required"** error, displaying a message that the system is in read-only mode.

---

## 🧮 4. Core Algorithms (Explained with Formulas)

### 1. Economic Order Quantity (EOQ)

*   **The Formula:**
    $$\text{EOQ} = \sqrt{\frac{2 \times D \times S}{H}}$$
    *   **$D$** = Annual Demand Quantity (units per year)
    *   **$S$** = Setup or Ordering Cost (per single order)
    *   **$H$** = Holding or Carrying Cost (per unit per year)

*   **Why it is important:** 
    It prevents coffee shop chains from losing money on inventory. If they order too frequently in small batches, they waste money on delivery fees and handling costs. If they order too much in bulk, they waste money on storage space, electricity (refrigeration), and face high spoilage losses of perishables (like milk, syrups, or coffee beans). The EOQ calculates the absolute lowest cost sweet-spot.

*   **How it works:**
    The formula balances the ordering setup costs against holding costs. By taking the square root of twice the annual demand multiplied by setup costs, divided by the holding cost, it identifies the mathematically optimal order quantity. In Kettan, if a branch hasn't manually configured an annual demand figure, the system automatically calculates it by looking at the branch's last 30 days of consumption logs and multiplying it by 12.

*   **Where it can be found in the system:**
    *   **File:** `Kettan.Server/Services/Analytics/AnalyticsService.cs`
    *   **Methods:** `CalculateEOQAsync` (runs the calculation for a specific item) and `GetEoqSuggestionsAsync` (recommends optimal reorders across items).

---

### 2. Weighted Average Costing (WAC)

*   **The Formula:**
    $$\text{New Unit Cost} = \frac{(\text{Current Quantity} \times \text{Current Unit Cost}) + (\text{Incoming Quantity} \times \text{Incoming Unit Cost})}{\text{Current Quantity} + \text{Incoming Quantity}}$$

*   **Why it is important:**
    Coffee ingredients fluctuate in price constantly due to season, inflation, or different suppliers. If a chain buys coffee beans at ₱100 a bag this week, and ₱120 a bag next week, we need an accurate value for their total stock. WAC ensures that the overall valuation of the inventory remains 100% financially accurate on balance sheets and that when branches log consumption, the cost deduction calculations are consistent and smooth.

*   **How it works:**
    Every time new supplies are checked into the warehouse or branch (Stock-In):
    1. The system calculates the total financial value of the inventory currently sitting on hand (Current Quantity multiplied by its Current Unit Cost).
    2. It calculates the total financial value of the incoming stock (Incoming Quantity multiplied by its purchase Unit Cost).
    3. It adds these two total values together and divides it by the new total quantity of items.
    4. If the current inventory quantity is zero, the cost simply defaults to the incoming stock's cost.

*   **Where it can be found in the system:**
    *   **File:** `Kettan.Server/Services/Inventory/InventoryService.cs`
    *   **Method:** `StockInAsync` (updates the unit cost of the item in the catalog during restock operations).

---

## 🎓 5. Direct Panelist Questions & Simple Answers

Here are the most common questions panelists will ask, with short, easy-to-remember answers you can say out loud:

### Q1: How do you make sure Tenant A cannot see Tenant B's database records?
*   **Answer:** We use **EF Core Global Query Filters** in our database context file (`ApplicationDbContext.cs`). Every table that belongs to a company has a company ID column. The database automatically appends a filter to every query, making sure a user can only pull records matching their own company ID. This is enforced automatically at the database level so developers can never forget it.

### Q2: Why did you use JWT cookies instead of LocalStorage for user login sessions?
*   **Answer:** Storing login sessions in LocalStorage is dangerous because any malicious JavaScript running on the website can read it. We store our JWT login tokens in **HttpOnly Secure cookies**. The `HttpOnly` flag makes it completely invisible to JavaScript, protecting the user's session from hacker attacks.

### Q3: What happens if two branch managers submit supply requests at the exact same millisecond, but HQ only has enough stock for one?
*   **Answer:** The system uses isolated **Database Transactions**. When an order is approved, it locks the inventory records momentarily. If a collision occurs, the database will only let one transaction finish, while the second transaction will fail gracefully, notifying the second manager that stock levels have just changed.

### Q4: If HQ and Branches belong to the same company, why do we track pricing and valuations?
*   **Answer:** Even though no actual money is exchanged when HQ sends beans to a branch, the business owner needs to see how much money each branch is spending, track the cost of spoiled or wasted items, and value their total warehouse inventory for accurate company tax and profit reports.

### Q5: How do you prevent brute-force attacks on the login page?
*   **Answer:** We implemented **Rate Limiting** in the backend startup file (`Program.cs`). If a user or an automated script tries to log in more than 5 times in a single minute from the same IP address, the system blocks them automatically and returns an error.

### Q6: What is the purpose of the 30-minute idle timer?
*   **Answer:** It is a client-side security feature. If a branch manager logs in and leaves their computer unlocked and walks away, the browser hook (`useIdleTimer.ts`) detects that there has been no mouse movement or keyboard typing for 30 minutes, and automatically logs them out to prevent unauthorized access.

### Q7: If a user forgets their password, how does the system securely verify their identity?
*   **Answer:** We use a secure **Forgot Password flow** managed by `AuthController.cs` and `AuthService.cs`. The user inputs their email, and the system sends a 6-digit verification code (OTP) to their email address. They must verify this code before the system allows them to create a new password. The code itself is hashed in our database for security.