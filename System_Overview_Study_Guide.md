# ☕ Kettan System Overview Study Guide

This document serves as a high-level conceptual guide for the Kettan Order Fulfillment Management System (OFMS).

## 1. What is Kettan?
Kettan is a **multi-tenant, cloud-based B2B SaaS platform** designed specifically for multi-branch coffee shop operators. Its primary goal is to centralize and automate the Order Fulfillment Management System (OFMS), replacing manual processes like standard chat groups and spreadsheet tracking between a Headquarters (HQ) and its branches.

## 2. Core Operational Roles
The system strictly enforces Role-Based Access Control (RBAC) to ensure users only see and perform actions relevant to their location:
* **HQ Manager:** Overviews the entire operation, approves supply requests from branches, monitors analytics, and manages subscriptions/finance.
* **HQ Staff:** Handles the physical logistics of order fulfillment (picking, packing, dispatching with couriers).
* **Branch Manager:** Manages branch-level inventory, logs daily consumption, initiates returns, and verifies received deliveries.
* **Admin (System):** Super-user that manages platform-wide settings (rarely involved in daily operations).

## 3. The Core Workflow (Fulfillment Lifecycle)
The lifeblood of Kettan is the supply chain from HQ to Branch:

1. **Consumption Logging:** Branch Managers log daily stock usage. 
2. **Auto-Drafting:** If a branch's current stock drops below configured thresholds, the system automatically drafts a Supply Request.
3. **Approval:** HQ Managers review and approve (or modify/reject) the submitted Supply Requests.
4. **Fulfillment:** HQ Staff picks, packs, and dispatches the approved items, assigning a registered courier to the delivery.
5. **Receiving/Restocking:** The Branch Manager receives the physical goods. Upon system confirmation, ownership of the inventory officially transfers from HQ to the Branch.

## 4. Key Secondary Modules
* **Returns Management:** Branches can initiate returns for damaged, expired, or incorrect goods received, sending them back to HQ.
* **Finance & Internal Reports:** Tracks the internal costs of fulfillment. Since branches and HQ belong to the same business entity, no actual money is exchanged between them in the system, but *valuations* and *costs* are heavily tracked for performance metrics.
* **Subscription Management:** Handles the coffee shop chain's subscription to the Kettan platform (billing, tiers, upgrades).