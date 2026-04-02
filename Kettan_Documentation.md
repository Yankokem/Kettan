# Kettan: A Multi-Tenant SaaS Platform for Supply Order Fulfillment, Inventory Control, and Branch Operations Management in Multi-Branch Coffee Chains

> *Derived from Kette (German) — meaning chain*

---

## Project Information

| Field | Details |
|---|---|
| **Student** | Russel M. Labiaga |
| **Subject** | IT15/L — Integrative Programming and Technologies |
| **Code** | 8448 |
| **Time** | 8:00 AM – 10:00 AM |
| **Topic** | #30 Order Fulfillment Management System |
| **Products/Services** | Multi-branch coffee shop chains |
| **Date Submitted** | March 29, 2026 |

---

## 1. System Classification

Kettan is a multi-tenant, cloud-based Software-as-a-Service (SaaS) platform designed to manage the complete internal operations of multi-branch coffee shop businesses. It covers supply order fulfillment, inventory oversight, human resource management, and financial reporting — all within a single, role-governed platform.

### 1.1 Platform Type

- **Multi-tenant SaaS** — each subscribing coffee chain operates as an isolated tenant with its own data environment
- **Web-based** — accessible via any modern browser with no client-side installation required
- **Role-based** — access is strictly governed by user roles assigned at the platform, tenant, and branch level
- Built on **ASP.NET Core (C#)** with **React** frontend and **SQL Server** database backend

### 1.2 Business Model

Kettan is a Business-to-Business (B2B) platform. Its customers are coffee shop chain operators, not individual consumers. Each tenant represents one coffee chain that subscribes to the platform to manage its branches.

---

## 2. Academic and Conceptual Basis

The foundational module structure of Kettan is based on the **Order Fulfillment Management System (OFMS)** framework, which defines five core modules for managing supply fulfillment across multiple branches. These five modules form the operational backbone of Kettan and have been extended with additional and SaaS platform modules to support a complete, production-grade deployment.

The five OFMS core modules are:

1. Order Processing
2. Picking and Packing
3. Shipping and Delivery
4. Order Tracking
5. Returns Management

---

## 3. Project Objectives

- To develop a multi-tenant SaaS platform that centralizes supply order fulfillment for multi-branch coffee chains.
- To implement a branch inventory system with batch tracking, FIFO deduction, and automated low-stock detection.
- To implement a real-time order tracking system that allows HQ and branch users to monitor supply order status from dispatch through delivery confirmation.
- To apply the EOQ algorithm for optimal reorder quantity suggestions and Weighted Branch Performance Scoring for branch analytics.
- To provide role-based access control across six user roles ensuring data security and operational accountability.

---

## 4. Project Description

Kettan is a B2B platform built for coffee shop chain operators and their staff across all levels of the organization. Each subscribing coffee chain is onboarded as an isolated tenant with its own secure data environment, meaning no two chains can ever access each other's data. The platform accommodates six distinct roles across two operational levels. At the platform level, the Super Admin oversees all tenants, monitors system health, and manages support. At the tenant level, the Tenant Admin configures the chain, while HQ Managers and HQ Staff handle order fulfillment and inventory operations. Branch Owners and Branch Managers handle day-to-day branch supply requests, consumption logging, and delivery monitoring.

Most multi-branch coffee chains today rely on group chats, spreadsheets, and phone calls to coordinate supply requests between branches and headquarters. This approach is error-prone, hard to track, and nearly impossible to audit. Kettan replaces this entirely by giving every role a purpose-built workspace within one unified platform.

- **Branch Managers** no longer need to manually follow up on orders because the system tracks every supply request from submission to delivery confirmation.
- **HQ Staff** are guided through picking and packing with batch-level precision, enforcing FIFO deduction automatically so expired stock never gets dispatched.
- **Low stock situations** are caught early through configurable thresholds that trigger alerts and auto-draft supply requests before a branch even runs out.
- At the **reporting level**, the Weighted Branch Performance Scoring algorithm turns raw fulfillment data into ranked, visual branch performance metrics, giving operators the insight they need to identify which branches are underperforming and why.

---

## 5. Technology Stack

| Layer | Technology |
|---|---|
| **Language** | C# (.NET 8) |
| **Backend** | ASP.NET Core Web API |
| **Frontend** | React (Vite) + Tailwind CSS + React Query + Axios |
| **Database** | Microsoft SQL Server + Entity Framework Core |
| **Authentication** | ASP.NET Core Identity + JWT |
| **Multi-Tenancy** | Tenant-aware query filtering via discriminator / tenant ID |
| **Deployment** | IIS / Azure App Service |
| **IDE** | Visual Studio 2026 |
| **DB Management** | SSMS (SQL Server Management Studio) |
| **Media Storage** | Cloudinary |
| **Version Control** | Git |

### 5.1 Third-Party APIs

| API | Purpose |
|---|---|
| **PayMongo API** | Payment gateway for tenant subscription billing |
| **EasyPost** | Courier assignment, tracking numbers, and dispatch logistics |
| **SendGrid** | Email notifications and billing invoice delivery |
| **Google Maps** | Delivery distance calculation |

### 5.2 Algorithms

| Algorithm | Application |
|---|---|
| **Economic Order Quantity (EOQ)** | Calculates the optimal reorder quantity that minimizes total inventory costs (ordering + holding costs). Applied when auto-drafting supply requests. |
| **Weighted Branch Performance Scoring** | Ranks branches by applying weighted scores across key metrics: fulfillment rate, return rate, delivery speed, and stock accuracy. |

### 5.3 Security Features

- Authentication and Authorization
- Role-Based Access Control (RBAC)
- Input Validation
- Audit Logs and Monitoring
- Multi-tenant Data Isolation

---

## 6. Operational Flow

The following describes the primary operational flow within Kettan, from tenant onboarding through to fulfillment and reporting:

1. **Tenant Onboarding** — A coffee chain subscribes to Kettan. The Tenant Admin sets up the chain profile, registers branch locations, and creates user accounts for HQ and branch staff.
2. **Branch Consumption Logging** — Branch staff log daily inventory usage via direct consumption entry, sales count with recipe-based auto-deduction, or periodic physical stock count.
3. **Low Stock Detection** — The inventory engine compares current stock against configurable thresholds. When stock falls below the threshold, an alert is triggered and a supply request is auto-drafted.
4. **Branch Supply Request** — The Branch Manager reviews the auto-drafted request (or creates one manually), adjusts quantities, and submits it to HQ.
5. **Order Processing** — HQ receives the request. Small orders are auto-approved; large orders require HQ Manager sign-off. Partial fulfillment is supported if HQ stock is insufficient.
6. **Picking and Packing** — HQ Staff are guided through retrieving the correct items by batch (FIFO enforced) and preparing them for dispatch.
7. **Shipping and Delivery** — The packed order is dispatched via EasyPost. Courier assignment, tracking number, and estimated arrival are recorded. Google Maps calculates delivery distance.
8. **Order Tracking** — Both HQ and the Branch Manager monitor real-time delivery status until receipt is confirmed by the branch.
9. **Returns Management** — If items arrive damaged or incorrect, the Branch Manager initiates a return. HQ processes it and issues a replacement or credit memo.
10. **Finance & Reporting** — Each fulfilled order generates an invoice. Costs, delivery expenses, and branch performance metrics are aggregated in the Finance dashboard using Weighted Branch Performance Scoring and use Economic Order Quantity (EOQ) Algorithm.

---

## 7. System Modules

Kettan consists of 18 modules organized across three categories:

- **Core (OFMS)** — derived from the academic basis of this project
- **Additional** — support full operational coverage
- **SaaS Platform** — support the platform layer operated by the Super Admin

Build tiers reflect development priority for the initial release: **Tier 1** modules are fully implemented, **Tier 2** are built if time permits, and **Tier 3** are documented as roadmap items.

| No. | Module | Description | Classification |
|---|---|---|---|
| 1 | **Order Processing** | Receives and validates supply requests from branches, including item selection, quantity, urgency flagging, and approval routing (auto-approve under threshold, HQ Manager approval for large orders). | Core (OFMS) |
| 2 | **Picking & Packing** | Guides HQ warehouse staff through retrieving and preparing approved order items. Supports partial fulfillment — system notifies branch and adjusts order if full stock is unavailable. | Core (OFMS) |
| 3 | **Shipping & Delivery** | Manages dispatch logistics via EasyPost API, including courier assignment, estimated arrival, and Google Maps distance calculation. | Core (OFMS) |
| 4 | **Order Tracking** | Provides real-time delivery status visibility for both HQ and branch users, from dispatch through delivery confirmation. | Core (OFMS) |
| 5 | **Returns Management** | Handles branch-initiated returns for damaged or incorrect goods. HQ processes the return and issues a replacement or credit memo. | Core (OFMS) |
| 6 | **Inventory Management** | Tracks stock at HQ and per branch by batch ID and expiry date. Enforces FIFO deduction, triggers low-stock alerts, and auto-drafts supply requests when branch stock falls below configurable thresholds. Uses EOQ algorithm for optimal reorder quantity suggestions. | Additional |
| 7 | **Consumption Logging** | Branch staff record daily inventory usage via three methods: (1) direct item consumption entry, (2) sales count log with recipe-based auto-deduction, and (3) periodic physical stock count with discrepancy detection. | Additional |
| 8 | **User & Role Management** | Controls platform and tenant-level access for all six roles: Super Admin, Tenant Admin, HQ Manager, HQ Staff, Branch Owner, and Branch Manager. | Additional |
| 9 | **Tenant & Branch Management** | Manages the onboarding of coffee chain tenants, branch registration, branch profile configuration, and tenant suspension or deactivation. | Additional |
| 10 | **HR & Staff Management** | Manages employee records, role assignments, scheduling, and department groupings per branch and HQ. | Additional |
| 11 | **Finance & Reports** | Aggregates fulfillment costs, delivery expenses, invoices per order, and branch performance metrics. Uses Weighted Branch Performance Scoring algorithm. Visual dashboards per branch and chain-wide. | Additional |
| 12 | **Notifications & Alerts** | Centralized alert system for low-stock warnings, order status changes, delivery confirmations, and return updates. Delivered via in-app notifications and email (SendGrid). | Additional |
| 13 | **Settings & Configuration** | Tenant-level configuration for reorder thresholds per item, order approval rules, branch operating hours, and notification preferences. | Additional |
| 14 | **Platform Analytics** | Super Admin dashboard showing platform-wide metrics: active tenants, total orders processed, subscription revenue, and system health indicators. | SaaS Platform |
| 15 | **Support & Helpdesk** | Tenants submit support tickets directly within the platform. Super Admin responds and manages ticket status. Tracks open, in-progress, and resolved issues. | SaaS Platform |
| 16 | **Audit Logs & Monitoring** | Records all significant user actions system-wide for accountability and debugging. Accessible to Super Admin. | SaaS Platform |
| 17 | **Subscription & Billing** | Manages tenant subscription tiers, renewal dates, and payment processing via PayMongo. Sends invoice emails on billing cycle. | SaaS Platform |
| 18 | **Supplier Portal** | External-facing module for registered suppliers to receive and acknowledge HQ purchase orders. Future expansion of the supply chain loop. | SaaS Platform |

---

## 8. User Roles and Access Levels

Kettan employs a six-tier role hierarchy across two levels: the **Platform level** (Super Admin) and the **Tenant level** (all other roles). Access to modules and actions is strictly governed by assigned role.

### 8.1 Platform Level

| Role | Scope | Key Permissions |
|---|---|---|
| **Super Admin** | Entire platform | Manages all tenants, monitors platform health, views platform analytics, handles support tickets, configures global settings, can impersonate tenant for support |

### 8.2 Tenant Level

| Role | Scope | Key Permissions |
|---|---|---|
| **Tenant Admin** | Entire chain | Onboards branches, manages all staff accounts, views all financials and reports, configures tenant-wide settings, manages subscription |
| **HQ Manager** | HQ operations | Approves large supply orders, oversees HQ inventory, views chain-wide fulfillment performance, manages HQ staff |
| **HQ Staff** | HQ operations | Processes and fulfills orders, manages HQ inventory batches, handles picking, packing, and shipping |
| **Branch Owner** | Single branch | Oversees branch operations, views branch financials, HR records, and fulfillment performance. Read-only on most branch data |
| **Branch Manager** | Single branch | Logs consumption, submits and tracks supply orders, files returns, manages branch-level staff schedules |

### 8.3 Target Users

- Coffee Chain Business Owner / Operator
- Tenant Administrator
- HQ Manager / HQ Staff
- Branch Owner
- Branch Manager

---

## 9. Inventory and Consumption Model

Kettan manages inventory at two levels: **HQ inventory** (the central warehouse stock that fulfills branch orders) and **branch inventory** (per-branch stock received from HQ). Branch inventory is tracked using batch IDs and expiry dates, with FIFO deduction enforced automatically.

### 9.1 Branch Stock Deduction Methods

**Option 1 — Direct Consumption Entry**
Branch staff manually log specific items consumed during a shift (e.g., "5kg coffee beans used today"). The system deducts directly from the oldest non-expired batch (FIFO). Best for ingredients that are hard to tie to individual drinks.

**Option 2 — Sales Count with Recipe Deduction**
Branch staff log how many of each menu item they sold during a shift. The system references the product recipe (e.g., 1 Iced Americano = 18g beans, 200ml water) and auto-deducts all required ingredients. This is the closest to POS behavior without a full POS system.

**Option 3 — Physical Stock Count**
Branch staff periodically conduct a physical count and enter actual quantities into the system. The system compares the counted stock against the expected stock (based on previous logs) and flags discrepancies for the Branch Manager to review.

### 9.2 Low Stock and Auto-Reorder

Each item has a configurable minimum threshold per branch, set via the Settings & Configuration module. When any item falls below its threshold, the system simultaneously:

- Triggers an in-app and email alert to the Branch Manager
- Auto-drafts a supply request pre-filled with the low-stock items

The Branch Manager reviews, adjusts if needed, and submits to HQ. The EOQ algorithm suggests optimal reorder quantities.

---

## 10. Subscription Tiers

Kettan is offered across three tiered subscription plans to accommodate coffee chains of different sizes:

| Tier | Target | Included Modules |
|---|---|---|
| **Starter** | 1–3 branches | Order Fulfillment (core 5), Inventory Management, Consumption Logging, User & Role Management, Notifications & Alerts |
| **Growth** | 4–15 branches | All Starter + HR & Staff Management, Finance & Reports, Tenant & Branch Management, Settings & Configuration, Support & Helpdesk |
| **Enterprise** | 16+ branches | All Growth + Platform Analytics, Subscription & Billing, Audit Logs, Supplier Portal, Priority Support, API Access |
