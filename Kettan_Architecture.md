
# Kettan: System Architecture & Specification

> **Master Document**
> This document serves as the single source of truth for the Kettan platform, combining system classification, business rules, entity architecture, and backend blueprints.

---

## 1. System Overview

Kettan is a multi-tenant, cloud-based Software-as-a-Service (SaaS) platform designed to manage the complete internal operations of multi-branch coffee shop businesses. It covers supply order fulfillment, inventory oversight, human resource management, and financial reporting.

### 1.1 Business Model
Kettan is a Business-to-Business (B2B) platform. Its customers are coffee shop chain operators. Each tenant represents one coffee chain that subscribes to the platform to manage its branches.

### 1.2 Technology Stack
| Layer | Technology |
|---|---|
| **Backend** | ASP.NET Core Web API (C# .NET 8) |
| **Frontend** | React (Vite) + Tailwind CSS + React Query + Axios |
| **Database** | Microsoft SQL Server + Entity Framework Core |
| **Authentication** | ASP.NET Core Identity + JWT |
| **Multi-Tenancy** | Tenant-aware query filtering via discriminator / tenant ID |
| **Third-Party APIs** | **PayMongo** (Subscription Billing), **Mailtrap** (Email Notifications), **Cloudinary** (Media/Image Storage) |

---

## 2. System Modules & Flow

Kettan replaces manual group chats and spreadsheets with a centralized Order Fulfillment Management System (OFMS).

### 2.1 The Operational Pipeline

1. **Consumption Logging**: Branch Managers log daily inventory usage via direct item entry or recipe-based sales deductions.
2. **Low Stock Detection**: The system checks stock against configurable branch thresholds. If stock falls below the threshold, it triggers an alert (Mailtrap) and auto-drafts a supply request.
3. **Supply Request**: Branch Managers review and submit the request to HQ.
4. **Order Processing**: HQ Managers review incoming requests. They can Full Approve, Partially Fulfill, or Reject.
5. **Picking & Packing**: HQ Staff are guided through retrieving items by batch (enforcing FIFO) and packing them.
6. **Dispatch**: HQ Staff assign a registered Courier and Vehicle to the order and dispatch it.
7. **Delivery**: The Branch Manager receives the items and confirms delivery in the system, automatically transferring the batch ownership from HQ to the Branch.

### 2.2 Core Modules

| Module | Description |
|---|---|
| **Inventory Management** | Tracks stock at HQ and per branch by batch ID and expiry date. Enforces FIFO. Uses EOQ algorithm for optimal reorder quantity. |
| **Order Processing** | Receives and validates supply requests. Routes for approval based on rules. |
| **Picking, Packing & Shipping** | HQ fulfillment workflow. Manages dispatch logistics using registered couriers and vehicles. |
| **Returns Management** | Handles branch-initiated returns for damaged/incorrect goods (Replace, Credit, Reject). |
| **Finance & Reports** | Aggregates fulfillment costs, branch performance metrics (Weighted Scoring), and inventory valuation. Note: No actual money changes hands between HQ and Branch. |
| **Subscription & Billing** | Manages tenant subscription tiers via PayMongo. Enforced by middleware. |

---

## 3. User Roles & Access

Kettan uses a strict Role-Based Access Control (RBAC) system.

**Platform Level:**
*   **Super Admin**: Manages all tenants, views platform analytics, handles support tickets.

**Tenant Level:**
*   **Tenant Admin**: Onboards branches, manages staff, configures settings, manages PayMongo subscription.
*   **HQ Manager**: Approves supply orders, oversees HQ inventory and fulfillment performance.
*   **HQ Staff**: Processes and fulfills orders, handles picking, packing, and dispatch.
*   **Branch Owner**: Oversees branch financials and fulfillment performance (Read-only on operations).
*   **Branch Manager**: Logs consumption, submits/tracks supply orders, confirms deliveries, files returns.

---

## 4. Database Entities & Architecture

The database uses Entity Framework Core with global query filters to enforce tenant isolation.

### 4.1 Inventory & Catalog

*   `Item`: The base product. Tracks `ItemType`, `ItemCategory`, `UnitOfMeasure`, `UnitCost`. 
*   `Batch`: Tracks physical stock instances. Has `ExpiryDate` and `CurrentQuantity`. If `BranchId` is null, it's at HQ.
*   `MenuItem` & `MenuItemIngredient`: Represents sellable recipes. Consumes `Items` based on defined `QuantityPerUnit`.
*   `InventoryTransaction`: Ledger of all movements (Restock, Adjustment, Transfer, Consumption).

### 4.2 Order Fulfillment

*   `SupplyRequest` & `SupplyRequestItem`: Branch-initiated requests.
*   `Order` & `OrderAllocation`: HQ-approved orders. Allocations link to specific `Batches` for FIFO tracking.
*   `Shipment`: Delivery record linking the `Order` to a `Courier` and `Vehicle`.
*   `OrderStatusHistory`: Timeline logging every status transition.
*   `Return` & `ReturnItem`: Branch-initiated damage/error claims.

### 4.3 Tenant & Organization

*   `Tenant`: The coffee chain. Holds PayMongo subscription details.
*   `Branch`: Physical store locations.
*   `Employee`: Headcount records for branches/HQ (Note: Employees are not necessarily system Users).
*   `Courier` & `Vehicle`: Registered 3rd party logistics providers used for dispatch.

---

## 5. Backend Service Layer

The backend uses a thin-controller, fat-service architecture.

| Service | Responsibility |
|---|---|
| `InventoryService` | FIFO deduction engine, stock-in/out logic, batch transferring. |
| `OrderService` | State machine for supply requests → orders → shipments → deliveries. |
| `ConsumptionService` | Recipe-based sales deductions and direct manual entry deductions. |
| `SubscriptionService` | PayMongo checkout session generation, webhook handling, and middleware enforcement. |
| `EmailService` | Mailtrap integration for Welcome Emails, Low Stock Alerts, and OTPs. |
| `AnalyticsService` | EOQ (Economic Order Quantity) and Weighted Branch Performance Scoring. |

---

> *Compiled: April 22, 2026*
