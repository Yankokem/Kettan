# 📁 Kettan System Folder Structure & Technical Map

This guide maps the physical codebase to the logical features of the system, helping developers find exactly where important integrations and algorithms live.

## 1. High-Level Worktree
```text
Kettan-laptop/
├── kettan.client/                       # React / Vite Frontend
│   ├── public/
│   └── src/
│       ├── app/                         # App routing (router.tsx) and initialization
│       ├── components/                  # Reusable UI components
│       ├── features/                    # Feature-based slices (Auth, Inventory, Orders)
│       ├── store/                       # Global state management (Zustand/Redux)
│       └── utils/                       # API clients, formatters, helpers
│
└── Kettan.Server/                       # ASP.NET Core API Backend
    ├── Controllers/                     # HTTP API Endpoints (JWT protected)
    ├── Data/                            # EF Core DbContext, Migrations, Seeders
    ├── DTOs/                            # Data Transfer Objects for API requests/responses
    ├── Entities/                        # Database Models
    ├── Services/                        # Core Business Logic and Algorithms
    └── Program.cs                       # App startup, DI registration, Middleware config
```

## 2. Technical Map: Where are the important features?

### 🔐 Multi-Factor Authentication (MFA)
* **Backend Logic:** `Kettan.Server/Services/Auth/AuthService.cs`
  * Checks for the `kettan_device_id` HttpOnly cookie.
  * If unrecognized, generates a 6-digit OTP, hashes it using BCrypt, and sends it via Gmail SMTP.
* **Frontend UI:** `kettan.client/src/features/auth/LoginPage.tsx` (and related OTP entry components).

### 🏦 Multi-Tenancy & API Architecture
* **Data Isolation:** `Kettan.Server/Data/ApplicationDbContext.cs`
  * Multi-tenancy is enforced securely at the database query level using **EF Core Global Query Filters** applied to any model implementing `ITenantEntity`.
* **API Security:** Handled in `Controllers/` using stateless JWT (JSON Web Tokens) passed back and forth via `SameSite=Strict` HttpOnly cookies for safety.

### 💳 PayMongo Integration
* **Location:** `Kettan.Server/Services/Subscription/SubscriptionService.cs`
  * Directly interfaces with `api.paymongo.com/v1/checkout_sessions`.
  * Responsible for spinning up SaaS subscription checkout sessions for new tenants and listening to PayMongo webhooks for payment verification.

### 🧮 Core Algorithms

**1. Economic Order Quantity (EOQ)**
* **Location:** `Kettan.Server/Services/Analytics/AnalyticsService.cs` (Look for methods like `CalculateEOQAsync`)
* **Purpose:** Computes the mathematically optimal reorder recommendations for branches using the formula: `√((2 * demand * setupCost) / holdingCost)`.

**2. Weighted Average Costing (WAC)**
* **Location:** `Kettan.Server/Services/Inventory/InventoryService.cs`
* **Purpose:** Calculates the current stock valuation dynamically. As new items are ordered and enter HQ/Branch inventory at different price points, WAC ensures smooth financial reporting and accurate fulfillment cost estimation over time.
