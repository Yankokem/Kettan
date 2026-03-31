# Kettan: Backend Implementation Plan

Based on the `Kettan_Documentation.md` and informed by the architecture of the **BrewGuard** reference project, the backend (`Kettan.Server`) will follow a layered, service-oriented structure within a single project. The primary difference from BrewGuard will be Kettan's strict multi-tenant SaaS requirements.

## 0. Project Architecture & Folder Structure (Reference: BrewGuard)
The `.NET` Web API project will be structured into clear separation-of-concern directories:
*   `Controllers/`: API Endpoints routing requests to specific services.
*   `Services/`: Business logic, grouped by feature domains (e.g., `Auth/`, `Tenants/`, `Inventory/`, `Orders/`, `Common/`). Each will contain an Interface (e.g., `IOrderService`) and its Implementation.
*   `DTOs/`: Data Transfer Objects for strictly typing request/response payloads to the controllers.
*   `Entities/`: EF Core domain models (e.g., `Tenant.cs`, `User.cs`, `Branch.cs`).
*   `Data/`: Contains `ApplicationDbContext.cs` and future database seeders.
*   `Constants/`: Roles, permission strings, and system threshold defaults.

## Phase 1: Database & Multi-Tenancy Foundation
Every piece of data (except platform-level Super Admin analytics) must be strictly isolated per coffee chain (Tenant). 

**Key Tasks:**
1. **Entity Framework Core Setup**: Install EF Core and configure the SQL Server connection.
2. **CurrentUserService (BrewGuard style)**: Implement an `ICurrentUserService` in `Services/Common/` to extract the `TenantId` and `UserId` dynamically from the current HTTP Request's JWT token.
3. **Multi-Tenant Architecture**: 
   - Create an `ITenantEntity` interface containing a `TenantId`.
   - Configure the `ApplicationDbContext` with a **Global Query Filter** (using `ICurrentUserService` to inject `_currentTenantId`) ensuring users from one chain can never read another chain's data:
     `modelBuilder.Entity<ITenantEntity>().HasQueryFilter(e => e.TenantId == _currentTenantId);`
4. **Core Entities**: Create the initial `Entities/Tenant.cs` (the coffee chain) and `Entities/Branch.cs` (the individual shop locations).

## Phase 2: Custom Authentication, Users & Roles
Following BrewGuard's pattern, we'll use a clean, customized User entity paired with JWT authentication instead of fully blown heavy ASP.NET Core Identity (unless explicitly needed), mapping directly to Kettan's 6 specific roles.

**Key Tasks:**
1. **User Entity**: Create `Entities/User.cs` with foreign keys to `TenantId` (nullable for Super Admin) and `BranchId` (nullable for HQ). Adding native `PasswordHash` fields.
2. **JWT Authentication**: Scaffold `Services/Auth/AuthService.cs` to handle login, token generation, and password validation.
3. **Roles Configuration**: Define the 6 core roles in `Constants/RoleConstants.cs`:
   * *Platform*: SuperAdmin
   * *Tenant Level*: TenantAdmin, HqManager, HqStaff, BranchOwner, BranchManager
4. **Auth Endpoints**: Build `Controllers/AuthController.cs` with Login endpoints returning the token containing `{ userId, role, tenantId, branchId }`.

## Phase 3: Core Domain Modeling (OFMS & Inventory)
Once the multi-tenant architecture is proven through user sign-ins, we can model the business logic for supply and tracking.

**Key Tasks:**
1. **Inventory Services**: Create `Services/Inventory/` with models like `Item`, `InventoryTransaction`, and `Batch` entities to support FIFO deduction logic.
2. **Order Fulfillment Services**: Create `Services/Orders/` supporting the 5 core OFMS modules (`SupplyRequest`, `Order`, `Return`).
3. **Algorithm Stubs**: Setup `Services/Analytics/` to house service logic where the EOQ (Economic Order Quantity) and Weighted Branch Performance Scoring will live.

---

*Note: Phase 1 & 2 are highly dependent on each other. We will likely build them simultaneously to ensure Users are correctly tied to their respective Tenants before proceeding to Phase 3.*