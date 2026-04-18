# Kettan — Marketing Site Plan

> The public-facing website where coffee chain owners discover, subscribe to, and access the Kettan platform.

---

## Table of Contents

1. [The Access Architecture — How It All Connects](#1-architecture)
2. [The Customer Journey — Step by Step](#2-journey)
3. [Site Pages — Complete Breakdown](#3-pages)
4. [Subscription & Payment Flow](#4-subscription)
5. [Email Integration](#5-email)
6. [Tech Stack & Implementation](#6-tech)
7. [Backend APIs Needed](#7-backend)

---

## 1. The Access Architecture {#1-architecture}

> [!IMPORTANT]
> The marketing site and the app dashboard are **two separate entry points** served from the **same backend**.

```
┌─────────────────────────────────────────────────────┐
│                    kettan.site                       │
│                                                     │
│  PUBLIC PAGES (no login required)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Home   │ │ Features │ │ Pricing  │           │
│  └──────────┘ └──────────┘ └────┬─────┘           │
│                                  │                  │
│                          "Get Started"              │
│                                  │                  │
│                          ┌──────▼──────┐           │
│                          │  Register   │           │
│                          │  (Sign Up)  │           │
│                          └──────┬──────┘           │
│                                  │                  │
│                          PayMongo Checkout           │
│                                  │                  │
│                          ✅ Payment Success          │
│                                  │                  │
│               Account Created + Welcome Email Sent  │
│                                  │                  │
│  ┌──────────────────────────────▼───────────────┐  │
│  │              LOGIN PAGE                       │  │
│  │  (Same page for returning & new users)        │  │
│  │  Email + Password → JWT → Redirect to App    │  │
│  └──────────────────────┬───────────────────────┘  │
│                          │                          │
│              ┌───────────▼────────────┐            │
│              │   APP DASHBOARD        │            │
│              │   (The actual SaaS)    │            │
│              │   Sidebar + Header     │            │
│              │   Role-based content   │            │
│              └────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### How It Works in Code

Your existing Vite React app already serves at the root. The marketing site pages are simply **public routes** (no auth required) in the same React app, with a **different layout** (no sidebar, no header — just a clean marketing layout).

```
/                    → Marketing Home (public layout)
/features            → Features Page (public layout)
/pricing             → Pricing Page (public layout)
/register            → Registration Page (public layout)
/login               → Login Page (already exists — public)
/app                 → Dashboard redirect (auth required → uses AppLayout)
/app/orders          → Orders page (auth required)
/app/hq-inventory    → Inventory page (auth required)
...
```

> [!TIP]
> Move all your existing authenticated routes under an `/app` prefix. The root `/` becomes the marketing home page. When logged-in users visit `/`, they auto-redirect to `/app`. When logged-out users visit `/app`, they redirect to `/login`.

### Why This Approach?

- **One codebase, one deployment** — no separate project to maintain
- The marketing site is just 4-5 static pages with a different layout component
- Login page is shared — it already exists
- After login, user lands on the dashboard (`/app`) — seamless

---

## 2. The Customer Journey {#2-journey}

### New Customer (First Time)

```
1. 🌐  Finds kettan website (search, referral, etc.)
2. 📖  Browses Home → Features → Pricing
3. 💡  Clicks "Get Started" on a plan (e.g., Growth Plan)
4. 📝  Fills registration form:
        - Company Name (tenant name)
        - Admin Full Name
        - Admin Email (real email — will be verified)
        - Password
        - Selected Plan (pre-filled from pricing click)
5. 💳  Redirected to PayMongo checkout page
6. ✅  Payment successful → PayMongo webhook fires
7. 🏗️  Backend automatically:
        a. Creates Tenant record (with plan, subscription dates)
        b. Creates TenantAdmin User (with hashed password)
        c. Seeds default ItemTypes + ItemCategories for the tenant
        d. Sends welcome email with login link
8. 📧  User receives email: "Your Kettan account is ready!"
9. 🔐  User clicks login link → enters email/password
10. 🏠  Lands on Dashboard → starts onboarding (add branches, inventory, staff)
```

### Returning Customer (Already Subscribed)

```
1. 🌐  Visits website
2. 🔐  Clicks "Login" button in the navbar
3. 📧  Enters email + password
4. 🏠  JWT token set → redirect to /app (Dashboard)
5. ☕  Proceeds with daily operations
```

### Demo / Trial (Optional — If You Want)

```
1. 🌐  Clicks "Try Demo" on the site
2. 🏗️  System creates a temporary tenant with pre-seeded data
3. 🔐  Auto-logs in with demo credentials
4. ⏰  Demo expires after 7 days (or is read-only)
```

> [!NOTE]
> The demo is **optional and Tier 2**. For your defense/presentation, the seeded dummy tenant with `password123` already works as a demo.

---

## 3. Site Pages — Complete Breakdown {#3-pages}

---

### 🏠 HOME PAGE — `/`

**Layout**: MarketingLayout (navbar + footer, no sidebar)

#### Navbar (sticky)
```
[Kettan Logo]     Home    Features    Pricing     [Login]  [Get Started →]
```
- **Login**: outlined button → `/login`
- **Get Started**: filled/primary button → `/pricing`

#### Section 1: Hero
| Element | Content |
|---|---|
| **Badge** | "☕ Built for Coffee Chains" |
| **Headline** | "Run Your Entire Coffee Chain From One Platform" |
| **Subheadline** | "Kettan manages supply orders, inventory, consumption logging, and branch operations — so you can focus on brewing great coffee." |
| **CTA Buttons** | "Get Started" (primary → /pricing) · "Watch Demo" (outlined, optional) |
| **Hero Image** | Dashboard screenshot or generated illustration |

#### Section 2: Trusted By / Stats Bar
```
[ 50+ Branches Managed ]  [ 10,000+ Orders Fulfilled ]  [ 99.9% Uptime ]
```
*(These can be aspirational/projected numbers for launch)*

#### Section 3: Problem Statement
| Element | Content |
|---|---|
| **Headline** | "Spreadsheets and Group Chats Aren't Cutting It" |
| **Body** | Short paragraph about how multi-branch chains struggle with supply coordination |
| **Before/After** | Two columns: "Without Kettan" (chaos) vs "With Kettan" (organized) |

#### Section 4: Feature Highlights (3-4 cards)
| Card | Icon | Title | Description |
|---|---|---|---|
| 1 | 📦 | Smart Inventory | "Track stock across HQ and every branch with batch-level FIFO precision." |
| 2 | 📋 | Order Fulfillment | "From supply request to doorstep delivery — every step tracked." |
| 3 | ☕ | Consumption Logging | "Log sales, deduct ingredients automatically. No POS required." |
| 4 | 📊 | Branch Analytics | "See which branches perform best with weighted performance scoring." |

#### Section 5: Who It's For (Target Market)
| Card | Title | Description |
|---|---|---|
| 1 | "Coffee Chain Owners" | "Centralize your multi-branch operations under one system." |
| 2 | "HQ Operations Teams" | "Manage inventory, approve orders, and track shipments." |
| 3 | "Branch Managers" | "Request supplies, log consumption, and confirm deliveries." |

#### Section 6: CTA Banner
```
"Ready to streamline your coffee chain?"
[Get Started — It's Free to Try]    [Talk to Sales →]
```

#### Footer
```
Kettan · © 2026
Product: Features · Pricing · Login
Company: About · Contact
Legal: Terms · Privacy
```

---

### ✨ FEATURES PAGE — `/features`

**Layout**: MarketingLayout

#### Section 1: Header
| Element | Content |
|---|---|
| **Badge** | "Platform Features" |
| **Headline** | "Everything You Need to Run a Coffee Chain" |
| **Subheadline** | "18 integrated modules. One unified platform." |

#### Section 2: Module Showcase (The 5 Core OFMS Modules)

| Module | Content |
|---|---|
| **Order Processing** | Screenshot of Order Detail page. Description of request → approve → fulfill pipeline. |
| **Picking & Packing** | Description of batch-level FIFO picking with batch allocation table preview. |
| **Shipping & Delivery** | Description of registered couriers, vehicle assignment, dispatch flow. |
| **Order Tracking** | Screenshot of status timeline. Emphasize: "No confusing maps — clear, actionable status updates." |
| **Returns Management** | Description of file → review → replace/credit resolution flow. |

#### Section 3: Additional Modules Grid (remaining modules)

Each as a card with icon + title + one-liner:
- Inventory Management
- Consumption Logging
- Menu & Recipes
- Branch Management
- Staff Directory
- Finance & Reports
- Notifications & Alerts
- Settings & Configuration
- Company Profile

#### Section 4: Algorithms

| Card | Title | Description |
|---|---|---|
| 1 | "EOQ — Economic Order Quantity" | "The system calculates optimal reorder quantities to minimize your total inventory cost." |
| 2 | "Branch Performance Scoring" | "Every branch gets a weighted score based on fulfillment rate, returns, delivery speed, and stock accuracy." |

#### Section 5: Security & Architecture
- Multi-tenant data isolation
- JWT authentication
- Role-based access control (6 roles)
- Audit logging

#### Section 6: CTA
```
"See it in action"
[View Pricing Plans →]
```

---

### 💰 PRICING PAGE — `/pricing`

**Layout**: MarketingLayout

#### Section 1: Header
| Element | Content |
|---|---|
| **Headline** | "Simple, Transparent Pricing" |
| **Subheadline** | "Choose the plan that fits your chain. Scale when you're ready." |
| **Toggle** | Monthly / Annually (annual saves 20%) |

#### Section 2: Plan Cards (3 columns)

| | Starter | Growth ⭐ POPULAR | Enterprise |
|---|---|---|---|
| **Target** | 1–3 branches | 4–15 branches | 16+ branches |
| **Price** | ₱2,999/mo | ₱7,999/mo | ₱14,999/mo |
| **Annual** | ₱28,800/yr | ₱76,800/yr | ₱143,990/yr |
| **Modules** | Core OFMS (5), Inventory, Consumption, User Mgmt, Notifications | All Starter + Staff Directory, Finance & Reports, Branch Mgmt, Settings, Help & Support | All Growth + Platform Analytics, Audit Logs, Billing Dashboard, Priority Support |
| **Branches** | Up to 3 | Up to 15 | Unlimited |
| **Users** | Up to 10 | Up to 50 | Unlimited |
| **Support** | Email | Email + Chat | Dedicated Account Manager |
| **CTA** | "Get Started" → `/register?plan=starter` | "Get Started" → `/register?plan=growth` | "Contact Sales" → mailto/form |

> [!NOTE]
> Prices are examples. Adjust to whatever makes sense for your market. The important thing is the **structure**: tiered plans with module gating and branch/user limits.

#### Section 3: Feature Comparison Table

Full checklist matrix: all modules × plans. ✅ or ❌ per plan.

#### Section 4: FAQ Accordion

| Q | A |
|---|---|
| "Can I upgrade later?" | "Yes, you can upgrade at any time. The difference is prorated." |
| "Is there a free trial?" | "We offer a 14-day free trial on any plan." |
| "What payment methods?" | "We accept credit/debit cards, GCash, and bank transfer via PayMongo." |
| "Can I cancel anytime?" | "Yes, cancel anytime. Your data is retained for 30 days." |

---

### 📝 REGISTRATION PAGE — `/register`

**Layout**: Minimal (centered card, no sidebar, just logo + back link)

#### Registration Form

| Field | Type | Validation |
|---|---|---|
| **Company Name** | TextField | Required, 3–100 chars |
| **Your Full Name** | TextField | Required |
| **Email Address** | TextField | Required, valid email, unique check |
| **Password** | Password field | Required, min 8 chars, strength indicator |
| **Confirm Password** | Password field | Must match |
| **Selected Plan** | Read-only chip | Pre-filled from URL param `?plan=growth` |
| **Agree to Terms** | Checkbox | Required |
| **CTA** | "Create Account & Continue to Payment →" | Submits form → PayMongo checkout |

#### What Happens on Submit

```
1. Frontend validates fields
2. POST /api/subscription/register
   Body: { companyName, fullName, email, password, plan }
3. Backend:
   a. Validates email uniqueness
   b. Creates Tenant (IsActive=false until payment)
   c. Creates TenantAdmin User (password hashed)
   d. Seeds default ItemTypes + ItemCategories
   e. Calls PayMongo → creates checkout session
   f. Returns checkout URL
4. Frontend redirects to PayMongo checkout page
5. User completes payment on PayMongo
6. PayMongo sends webhook → POST /api/subscription/webhook
7. Backend webhook handler:
   a. Verifies payment signature
   b. Sets Tenant.IsActive = true
   c. Sets SubscriptionStartDate and SubscriptionEndDate
   d. Sends welcome email via SendGrid
8. PayMongo redirects user to /register/success
```

#### Success Page (`/register/success`)

```
✅ "You're all set!"

"Your Kettan account has been created. Check your email for a confirmation."

[Login to Your Dashboard →]
```

---

### 🔐 LOGIN PAGE — `/login`

**Status**: ✅ Already exists — minor updates

#### Changes Needed
- Add "Don't have an account? [Sign up →]" link below the login form
- Add "Forgot password?" link (Tier 2 — sends reset email via SendGrid)
- After successful login, redirect to `/app` (not `/` which is now the marketing home)

---

### 📱 APP DASHBOARD — `/app`

This is the **existing Kettan SaaS platform** — everything in the current `AppLayout`. All the pages from the frontend blueprint live under `/app/*`.

**Important router change**: All your existing authenticated routes become:
```
/app                    → Dashboard
/app/orders             → Orders
/app/hq-inventory       → HQ Inventory
/app/menu               → Menu & Recipes
/app/consumption        → Consumption Logging
/app/branches           → Branches
/app/staff              → Staff Directory
/app/returns            → Returns
/app/reports            → Reports
/app/company-profile    → Company Profile
/app/settings           → Settings
/app/tenants            → Tenant Management (Super Admin)
```

> [!WARNING]
> This means updating **every route** in `router.tsx` to use the `/app` prefix. The `layoutRoute` path changes from `id: 'layout'` (pathless) to `path: '/app'`. All child routes become relative.

---

## 4. Subscription & Payment Flow {#4-subscription}

### PayMongo Integration

| Step | Who | What Happens |
|---|---|---|
| 1 | User | Clicks "Get Started" on pricing card |
| 2 | Frontend | Loads registration page with `?plan=growth` |
| 3 | User | Fills form, clicks submit |
| 4 | Backend | Creates Tenant (inactive) + User, calls PayMongo `POST /checkout_sessions` |
| 5 | PayMongo | Returns a checkout URL |
| 6 | Frontend | Redirects user to PayMongo hosted checkout |
| 7 | User | Enters payment details on PayMongo page |
| 8 | PayMongo | Processes payment, calls your webhook URL |
| 9 | Backend | Webhook handler activates tenant, sends welcome email |
| 10 | PayMongo | Redirects user to your success page |

### PayMongo API Calls Needed

```
// Create checkout session
POST https://api.paymongo.com/v1/checkout_sessions
Body: {
  data: {
    attributes: {
      line_items: [{
        name: "Kettan Growth Plan — Monthly",
        amount: 799900,           // in centavos (₱7,999.00)
        currency: "PHP",
        quantity: 1
      }],
      payment_method_types: ["card", "gcash", "grab_pay"],
      success_url: "https://yoursite.com/register/success",
      cancel_url: "https://yoursite.com/pricing",
      metadata: {
        tenantId: "123",
        plan: "growth"
      }
    }
  }
}
```

### Subscription Middleware

Every authenticated API request goes through `SubscriptionCheckMiddleware`:

```csharp
// Pseudocode
if (user.Role == "SuperAdmin") → skip check
if (tenant.IsActive == false) → return 403 "Subscription inactive"
if (tenant.SubscriptionEndDate < DateTime.UtcNow) → return 403 "Subscription expired"
else → continue
```

---

## 5. Email Integration {#5-email}

### Emails to Send

| Trigger | Email | Content |
|---|---|---|
| After successful payment | **Welcome Email** | "Your Kettan account is ready. Login at app.kettan.io. Your email: X, Password: (set during registration)." |
| **Forgot Password** (Tier 2) | Reset link | "Click here to reset your password. Link expires in 1 hour." |
| Low stock detected | **Stock Alert** | "⚠️ Arabica Beans at BGC Branch is below threshold (3.2kg remaining)." |
| Order delivered | **Delivery Confirmation** | "Order #ORD-8891 has been delivered to Downtown Main." |

### SendGrid Implementation

```csharp
// Services/Email/IEmailService.cs
public interface IEmailService
{
    Task SendWelcomeEmail(string toEmail, string tenantName, string loginUrl);
    Task SendPasswordReset(string toEmail, string resetToken);
    Task SendLowStockAlert(string toEmail, List<LowStockItem> items);
    Task SendOrderUpdate(string toEmail, string orderId, string status);
}
```

**For Tier 1**: Implement a `ConsoleEmailService` that just logs to console. Swap to real SendGrid when ready — the interface stays the same.

---

## 6. Tech Stack & Implementation {#6-tech}

### Marketing Site Frontend

| Option | Approach | Recommendation |
|---|---|---|
| **Option A** (Recommended) | Add marketing pages to the existing Vite React app with a `MarketingLayout` | ✅ One codebase, one build, shared components |
| Option B | Separate static site | More work, separate deployment |

### New Files to Create

```
src/
├── components/
│   └── Marketing/
│       ├── MarketingLayout.tsx       ← Navbar + Footer (no sidebar)
│       ├── MarketingNavbar.tsx       ← Public navbar with Login/Signup buttons
│       ├── MarketingFooter.tsx       ← Footer with links
│       ├── HeroSection.tsx           ← Home hero with CTA
│       ├── FeatureCard.tsx           ← Reusable feature highlight card
│       ├── PricingCard.tsx           ← Plan card with features list
│       ├── PricingToggle.tsx         ← Monthly/Annual switch
│       ├── ModuleShowcase.tsx        ← Feature page module display
│       ├── FAQAccordion.tsx          ← Expandable Q&A
│       ├── CTABanner.tsx             ← Call-to-action banner
│       ├── StatsBar.tsx              ← Trust metrics bar
│       └── ComparisonTable.tsx       ← Plan feature comparison
│
├── features/
│   └── marketing/
│       ├── HomePage.tsx              ← The marketing landing page
│       ├── FeaturesPage.tsx          ← Features overview
│       ├── PricingPage.tsx           ← Plans & pricing
│       └── RegisterPage.tsx          ← Signup form
│       └── RegisterSuccessPage.tsx   ← Post-payment success
```

### Router Update

```tsx
// Marketing routes (public, MarketingLayout)
const marketingLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'marketing',
  component: MarketingLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => marketingLayout,
  path: '/',
  component: HomePage,
});

const featuresRoute = createRoute({ ... path: '/features' ... });
const pricingRoute = createRoute({ ... path: '/pricing' ... });
const registerRoute = createRoute({ ... path: '/register' ... });
const registerSuccessRoute = createRoute({ ... path: '/register/success' ... });

// App routes (auth required, AppLayout) — prefix with /app
const appLayout = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: AppLayout,
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/',                    // resolves to /app
  component: DashboardPage,
});
// ... all other routes become children of appLayout
```

---

## 7. Backend APIs Needed (for Marketing Site) {#7-backend}

### Public Endpoints (No Auth Required)

```
POST /api/subscription/register
  Body: { companyName, fullName, email, password, plan }
  Response: { checkoutUrl, tenantId }

POST /api/subscription/webhook
  Body: PayMongo webhook payload
  Response: 200 OK

GET  /api/subscription/plans
  Response: List of plan details (name, price, features, limits)
  Purpose: Pricing page can fetch dynamically instead of hardcoding
```

### Auth Endpoints (Update Existing)

```
POST /api/auth/login
  Body: { email, password }
  Response: { token, user: { id, name, email, role, tenantId, branchId } }
  Change: After login redirect should go to /app, not /

POST /api/auth/forgot-password     ← NEW (Tier 2)
  Body: { email }
  Response: 200 (sends reset email)

POST /api/auth/reset-password      ← NEW (Tier 2)
  Body: { token, newPassword }
  Response: 200
```

---

## Summary — What This Adds to Your Workload

| New Work | Effort |
|---|---|
| 5 marketing pages (Home, Features, Pricing, Register, Success) | ~2-3 days |
| MarketingLayout + marketing components (~12 new components) | ~1-2 days |
| Router restructuring (add `/app` prefix) | ~1 day |
| SubscriptionController + SubscriptionService | ~1 day |
| PayMongo integration (checkout + webhook) | ~1 day |
| EmailService (stub first, real later) | ~0.5 day |
| SubscriptionCheckMiddleware | ~0.5 day |
| **Total** | **~6-8 days** |

> [!WARNING]
> The marketing site is important for your thesis defense (shows the full product lifecycle), but the **SaaS app itself is the core deliverable**. Prioritize finishing the app first, then build the marketing site in the last week. You could even hardcode the marketing site content (no CMS needed) and stub the PayMongo integration for demo purposes.
