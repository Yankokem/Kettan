i # Requirements Document: Audit Logs Access Expansion

## Introduction

This feature expands access to the Audit Logs page beyond SuperAdmin to include management-level roles (TenantAdmin, HqManager, BranchOwner) while excluding store staff roles (HqStaff, BranchManager). Additionally, it implements multi-tenant data isolation, distinguishes between HQ-level and branch-level audit logs, and adds a branch-specific audit logs tab to the Branch Profile Page. The core Audit Logs page and API already exist; this feature adds access control, tenant scoping, branch-level filtering, and new UI components for branch-specific audit log viewing.

## Glossary

- **Audit_Logs_System**: The existing audit logging feature that tracks user actions and system events
- **Role_Helper**: The utility module (roleHelpers.ts) that manages role-based access control permissions
- **Sidebar_Navigation**: The navigation component (Sidebar.tsx) that displays menu items based on user roles
- **Backend_Authorization**: The API controller authorization logic that validates user permissions
- **Management_Roles**: TenantAdmin, HqManager, and BranchOwner roles that have oversight responsibilities
- **Staff_Roles**: HqStaff and BranchManager roles that perform operational tasks without audit log access
- **Tenant**: A company or business entity that uses the system; each tenant has complete data isolation from other tenants
- **HQ_Audit_Logs**: Audit log entries for actions performed by HQ staff (TenantAdmin, HqManager, HqStaff) at the headquarters level
- **Branch_Audit_Logs**: Audit log entries for actions performed by branch staff at specific branch locations
- **Branch_Profile_Page**: The existing branch detail page (BranchProfilePage.tsx) that displays branch information in tabs
- **Audit_Logs_Tab**: A new tab component to be added to the Branch Profile Page for displaying branch-specific audit logs

## Requirements

### Requirement 1: Role-Based Module Access Configuration

**User Story:** As a system administrator, I want to configure which roles can access the audit logs module, so that management roles can monitor system activity while restricting access from staff roles.

#### Acceptance Criteria

1. THE Role_Helper SHALL define 'audit-logs' as a valid module in the canAccessModule() function
2. WHEN canAccessModule() is called with 'audit-logs' module, THE Role_Helper SHALL return true for SuperAdmin, TenantAdmin, HqManager, and BranchOwner roles
3. WHEN canAccessModule() is called with 'audit-logs' module, THE Role_Helper SHALL return false for HqStaff and BranchManager roles
4. THE Role_Helper SHALL maintain backward compatibility with all existing module permission checks

### Requirement 2: Navigation Menu Configuration

**User Story:** As a management user, I want to see the Audit Logs menu item in my navigation sidebar, so that I can easily access audit log information.

#### Acceptance Criteria

1. THE Sidebar_Navigation SHALL move the Audit Logs navigation item from SUPER_ADMIN_NAV to MAIN_NAV array
2. THE Audit Logs navigation item SHALL include the module property set to 'audit-logs'
3. WHEN a user with Management_Roles views the sidebar, THE Sidebar_Navigation SHALL display the Audit Logs menu item
4. WHEN a user with Staff_Roles views the sidebar, THE Sidebar_Navigation SHALL NOT display the Audit Logs menu item
5. THE Sidebar_Navigation SHALL use the canAccessModule() function to filter menu items based on the module property

### Requirement 3: Backend Authorization Validation

**User Story:** As a security administrator, I want the backend API to enforce role-based access control, so that unauthorized users cannot access audit log data even if they bypass frontend restrictions.

#### Acceptance Criteria

1. WHEN a user with Management_Roles requests audit log data, THE Backend_Authorization SHALL return the requested audit log data
2. WHEN a user with Staff_Roles requests audit log data, THE Backend_Authorization SHALL return HTTP 403 Forbidden status
3. THE Backend_Authorization SHALL validate user role before processing any audit log queries
4. THE Backend_Authorization SHALL maintain existing SuperAdmin full access permissions
5. WHEN TenantAdmin, HqManager, or BranchOwner requests audit logs, THE Backend_Authorization SHALL filter results to their tenant scope

### Requirement 4: Route Access Protection

**User Story:** As a security administrator, I want the application router to protect the audit logs route, so that users cannot access the page by directly navigating to the URL.

#### Acceptance Criteria

1. THE Audit_Logs_System SHALL maintain the existing /audit-logs route configuration
2. WHEN a user with Staff_Roles attempts to navigate to /audit-logs, THE Audit_Logs_System SHALL redirect them to an appropriate page or display an access denied message
3. WHEN a user with Management_Roles navigates to /audit-logs, THE Audit_Logs_System SHALL display the Audit Logs page
4. THE Audit_Logs_System SHALL use the existing authentication guard to ensure only authenticated users can attempt access

### Requirement 5: Access Control Testing

**User Story:** As a quality assurance engineer, I want to verify that access control works correctly for all roles, so that I can ensure the security requirements are met.

#### Acceptance Criteria

1. FOR ALL user roles, THE Role_Helper SHALL return consistent results when canAccessModule() is called multiple times with the same parameters
2. WHEN the role permission matrix is updated, THE Role_Helper SHALL reflect changes immediately without requiring application restart
3. THE Role_Helper SHALL handle undefined or null role values gracefully by returning false
4. THE Role_Helper SHALL handle undefined or null module values gracefully by returning false

### Requirement 6: Tenant Data Isolation

**User Story:** As a tenant administrator, I want to ensure that my company's audit logs are completely isolated from other tenants, so that our sensitive operational data remains private and secure.

#### Acceptance Criteria

1. WHEN any user requests audit log data, THE Backend_Authorization SHALL filter results to include only records matching the user's tenantId
2. THE Backend_Authorization SHALL reject requests that attempt to access audit logs from a different tenant with HTTP 403 Forbidden status
3. WHEN a SuperAdmin views audit logs, THE Audit_Logs_System SHALL display audit logs from all tenants with tenant identification
4. WHEN TenantAdmin, HqManager, or BranchOwner views audit logs, THE Audit_Logs_System SHALL display only audit logs from their own tenant
5. THE Backend_Authorization SHALL validate tenantId on every audit log query before returning any data
6. THE Audit_Logs_System SHALL include tenantId and tenantName fields in all audit log entries for traceability

### Requirement 7: HQ and Branch Audit Log Scoping

**User Story:** As an HQ manager, I want to distinguish between HQ-level activities and branch-level activities in audit logs, so that I can monitor operations at the appropriate organizational level.

#### Acceptance Criteria

1. WHEN an action is performed by TenantAdmin, HqManager, or HqStaff, THE Audit_Logs_System SHALL record the audit log entry as an HQ_Audit_Log with branchId set to null
2. WHEN an action is performed by BranchOwner or BranchManager at a specific branch, THE Audit_Logs_System SHALL record the audit log entry as a Branch_Audit_Log with the corresponding branchId
3. THE Audit_Logs_System SHALL include both branchId and branchName fields in all audit log entries
4. WHEN TenantAdmin requests audit logs from the main audit logs page, THE Backend_Authorization SHALL return both HQ_Audit_Logs and all Branch_Audit_Logs for their tenant
5. WHEN HqManager requests audit logs from the main audit logs page, THE Backend_Authorization SHALL return both HQ_Audit_Logs and all Branch_Audit_Logs for their tenant
6. WHEN BranchOwner requests audit logs from the main audit logs page, THE Backend_Authorization SHALL return only Branch_Audit_Logs for branches they own

### Requirement 8: Branch-Specific Audit Log API Endpoint

**User Story:** As a branch owner, I want to view audit logs specific to my branch, so that I can monitor activities and compliance at my location.

#### Acceptance Criteria

1. THE Backend_Authorization SHALL provide a new API endpoint at `/api/branches/{branchId}/audit-logs` for retrieving branch-specific audit logs
2. WHEN the branch-specific endpoint is called, THE Backend_Authorization SHALL filter audit logs by both tenantId and branchId
3. WHEN TenantAdmin requests branch-specific audit logs, THE Backend_Authorization SHALL return all audit logs for the specified branch within their tenant
4. WHEN HqManager requests branch-specific audit logs, THE Backend_Authorization SHALL return all audit logs for the specified branch within their tenant
5. WHEN BranchOwner requests branch-specific audit logs for a branch they own, THE Backend_Authorization SHALL return all audit logs for that branch
6. WHEN BranchOwner requests branch-specific audit logs for a branch they do not own, THE Backend_Authorization SHALL return HTTP 403 Forbidden status
7. THE branch-specific endpoint SHALL support the same query parameters as the main audit logs endpoint (search, action, startDate, endDate, pagination)

### Requirement 9: Branch Profile Audit Logs Tab UI

**User Story:** As a branch owner, I want to see an Audit Logs tab on the branch profile page, so that I can easily access audit history for that specific branch without navigating away.

#### Acceptance Criteria

1. THE Branch_Profile_Page SHALL add an 'auditLogs' tab to the existing tab navigation alongside details, staff, activity, transactions, inventory, and menu tabs
2. WHEN the auditLogs tab is selected, THE Branch_Profile_Page SHALL display the Audit_Logs_Tab component
3. THE Audit_Logs_Tab SHALL fetch audit logs from the `/api/branches/{branchId}/audit-logs` endpoint
4. THE Audit_Logs_Tab SHALL display audit log entries in a table format consistent with the main AuditLogsPage design
5. THE Audit_Logs_Tab SHALL include search, date range filtering, action filtering, and sorting capabilities
6. WHEN TenantAdmin or HqManager views the auditLogs tab, THE Audit_Logs_Tab SHALL display all audit logs for that branch
7. WHEN BranchOwner views the auditLogs tab for their own branch, THE Audit_Logs_Tab SHALL display all audit logs for that branch
8. THE Audit_Logs_Tab SHALL show a badge count indicating the total number of audit log entries for that branch
9. THE Audit_Logs_Tab SHALL handle loading states and empty states appropriately
10. THE Audit_Logs_Tab SHALL lazy-load audit log data only when the tab is activated, consistent with other tabs on the Branch_Profile_Page

### Requirement 10: Main Audit Logs Page HQ Scope

**User Story:** As an HQ manager, I want the main Audit Logs page to show HQ-level activities by default, so that I can monitor headquarters operations separately from branch activities.

#### Acceptance Criteria

1. WHEN TenantAdmin accesses the main audit logs page at `/audit-logs`, THE Audit_Logs_System SHALL display both HQ_Audit_Logs and Branch_Audit_Logs for their tenant
2. WHEN HqManager accesses the main audit logs page at `/audit-logs`, THE Audit_Logs_System SHALL display both HQ_Audit_Logs and Branch_Audit_Logs for their tenant
3. WHEN BranchOwner accesses the main audit logs page at `/audit-logs`, THE Audit_Logs_System SHALL display only Branch_Audit_Logs for branches they own
4. THE Audit_Logs_System SHALL add a branch filter dropdown to allow filtering by specific branches or "HQ Only"
5. THE Audit_Logs_System SHALL display branch information in the audit log table when branchId is present
6. WHEN an audit log entry has a null branchId, THE Audit_Logs_System SHALL display "HQ" or "Headquarters" in the branch column
