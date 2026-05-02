# Implementation Plan: Audit Logs Access Expansion

## Overview

This implementation expands audit log access from SuperAdmin-only to include management-level roles (TenantAdmin, HqManager, BranchOwner) with strict tenant isolation and branch-level scoping. The implementation follows a security-first approach with backend authorization as the foundation, followed by frontend access control, UI enhancements, and comprehensive testing.

**Implementation Strategy:**
- Phase 1: Backend authorization (security-critical foundation)
- Phase 2: Frontend access control (role-based navigation)
- Phase 3: Main audit logs page enhancements (branch filtering)
- Phase 4: Branch profile integration (new audit logs tab)
- Phase 5: Testing and validation (comprehensive verification)

## Tasks

- [ ] 1. Backend Authorization - AuditLogsController Updates
  - [ ] 1.1 Update GetAuditLogs endpoint to support management roles
    - Modify the allowed roles array to include HqManager and BranchOwner
    - Add role-specific filtering logic for BranchOwner (restrict to owned branches only)
    - Implement tenant scoping for non-SuperAdmin roles
    - Add branchId and hqOnly query parameters
    - Include branch information (branchId, branchName) in the response projection
    - Update the Include statement to eager-load User.Branch relationship
    - _Requirements: 3.1, 3.2, 3.5, 6.1, 6.2, 6.5, 7.4, 7.5, 7.6_
  
  - [ ] 1.2 Write unit tests for AuditLogsController authorization
    - Test authorization for each role (SuperAdmin, TenantAdmin, HqManager, BranchOwner, HqStaff, BranchManager)
    - Test tenant scoping for non-SuperAdmin roles
    - Test BranchOwner can only see their branch logs
    - Test branch filter parameter functionality
    - Test HQ-only filter parameter functionality
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 7.4, 7.5, 7.6_

- [ ] 2. Backend Authorization - BranchesController New Endpoint
  - [ ] 2.1 Create GetBranchAuditLogs endpoint in BranchesController
    - Add new endpoint at route `[HttpGet("{id}/audit-logs")]`
    - Implement authorization check for management roles
    - Verify branch exists and return 404 if not found
    - Implement tenant scoping validation
    - Implement BranchOwner ownership validation (verify userBranchId matches requested branch)
    - Query audit logs filtered by branchId (User.BranchId == id)
    - Support search, action, startDate, endDate, page, and pageSize query parameters
    - Return paginated response with totalCount, page, pageSize, and data
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ]* 2.2 Write unit tests for BranchesController GetBranchAuditLogs endpoint
    - Test authorization for each role
    - Test branch ownership validation for BranchOwner
    - Test tenant scoping enforcement
    - Test 404 response for non-existent branch
    - Test 403 response for unauthorized branch access
    - Test query parameter filtering (search, action, date range)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 3. Checkpoint - Backend authorization complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Frontend Access Control - Role Helper Updates
  - [ ] 4.1 Update roleHelpers.ts to add audit-logs module
    - Add 'audit-logs' to the permissions Record in canAccessModule function
    - Map 'audit-logs' to roles: ['SuperAdmin', 'TenantAdmin', 'HqManager', 'BranchOwner']
    - Verify existing module permissions remain unchanged
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 4.2 Write unit tests for roleHelpers audit-logs permissions
    - Test canAccessModule('audit-logs', role) returns true for SuperAdmin, TenantAdmin, HqManager, BranchOwner
    - Test canAccessModule('audit-logs', role) returns false for HqStaff, BranchManager
    - Test undefined/null role handling
    - Test undefined/null module handling
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.3, 5.4_

- [ ] 5. Frontend Access Control - Sidebar Navigation Updates
  - [ ] 5.1 Update Sidebar.tsx to move Audit Logs to MAIN_NAV
    - Move the Audit Logs navigation item from SUPER_ADMIN_NAV to MAIN_NAV array
    - Add `module: 'audit-logs'` property to the Audit Logs nav item
    - Verify the existing navFilter logic correctly filters based on canAccessModule
    - Ensure SuperAdmin still sees Audit Logs in navigation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 5.2 Write unit tests for Sidebar navigation filtering
    - Test Audit Logs item appears in MAIN_NAV
    - Test menu filtering based on role using canAccessModule
    - Verify management roles see Audit Logs in filtered navigation
    - Verify staff roles do not see Audit Logs in filtered navigation
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 6. Checkpoint - Frontend access control complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Main Audit Logs Page - Branch Filter UI
  - [ ] 7.1 Add branch filter state and API integration to AuditLogsPage.tsx
    - Add branchFilter state variable ('' = all, 'hq' = HQ only, or branchId)
    - Add branches state variable to store branch list
    - Fetch branches list from `/api/branches` endpoint on component mount
    - Update loadRows function to include branchFilter in query parameters
    - Add logic to set `hqOnly=true` when branchFilter is 'hq'
    - Add logic to set `branchId` parameter when branchFilter is a specific branch ID
    - _Requirements: 10.4, 7.4, 7.5, 7.6_
  
  - [ ] 7.2 Add branch filter dropdown UI to AuditLogsPage.tsx
    - Add Dropdown component for branch filter in the filter controls section
    - Include "All Branches" option (value: '')
    - Include "HQ Only" option (value: 'hq')
    - Include individual branch options from branches state
    - Wire dropdown onChange to setBranchFilter
    - Position dropdown alongside existing action filter and date range controls
    - _Requirements: 10.4_
  
  - [ ] 7.3 Add branch column to audit logs table
    - Add new column definition with key 'branchName', label 'Branch', width 140
    - Implement render function to display branchName or 'HQ' when null
    - Position column appropriately in the table (after actor/role columns)
    - Style consistently with existing columns
    - _Requirements: 10.5, 10.6_

- [ ] 8. Branch Profile Integration - Create BranchAuditLogsTab Component
  - [ ] 8.1 Create BranchAuditLogsTab.tsx component
    - Create new file at `kettan.client/src/features/branches/components/BranchAuditLogsTab.tsx`
    - Define BranchAuditLogsTabProps interface with branchId property
    - Add state for logs, loading, search, actionFilter, sortBy, startDate, endDate
    - Implement loadLogs function to fetch from `/api/branches/${branchId}/audit-logs`
    - Add search, action filter, and date range filter controls
    - Implement DataTable component to display audit logs
    - Handle loading and empty states
    - Reuse existing audit log table column definitions (without tenant/branch columns)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 9.10_
  
  - [ ]* 8.2 Write unit tests for BranchAuditLogsTab component
    - Test component renders with branch ID
    - Test API call with correct endpoint and parameters
    - Test search and filter functionality
    - Test empty state rendering
    - Test loading state rendering
    - _Requirements: 9.3, 9.4, 9.5, 9.9_

- [ ] 9. Branch Profile Integration - Update Branch Profile Page
  - [ ] 9.1 Update branchProfileData.ts to add auditLogs tab
    - Add new tab object to BRANCH_PROFILE_TABS array
    - Set key: 'auditLogs', label: 'Audit Logs', icon: FeedRoundedIcon, showBadge: true
    - Position after existing tabs (details, staff, activity, transactions, inventory, menu)
    - _Requirements: 9.1_
  
  - [ ] 9.2 Update BranchProfilePage.tsx to render auditLogs tab
    - Add conditional rendering for activeTab === 'auditLogs'
    - Render BranchAuditLogsTab component with branchId prop
    - Import BranchAuditLogsTab component
    - Update loadTabContent function to handle 'auditLogs' case (no pre-loading needed)
    - _Requirements: 9.2, 9.10_
  
  - [ ] 9.3 Implement badge count for audit logs tab
    - Add API call to fetch audit log count for the branch
    - Update tab badge display logic to show audit log count
    - Implement lazy loading (only fetch when tab is activated)
    - _Requirements: 9.8_

- [ ] 10. Checkpoint - UI implementation complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Integration Testing and Validation
  - [ ]* 11.1 Write integration tests for end-to-end authorization flow
    - Test login as each role (SuperAdmin, TenantAdmin, HqManager, BranchOwner, HqStaff, BranchManager)
    - Verify navigation menu visibility for each role
    - Attempt to access /audit-logs route for each role
    - Verify API responses match role permissions
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3_
  
  - [ ]* 11.2 Write integration tests for tenant data isolation
    - Create audit logs for multiple tenants
    - Verify TenantAdmin only sees their tenant's logs
    - Verify BranchOwner only sees their branch logs
    - Verify SuperAdmin sees all logs with tenant identification
    - Test cross-tenant access attempts return 403
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 11.3 Write integration tests for branch-specific audit logs
    - Navigate to branch profile page
    - Activate audit logs tab
    - Verify correct API endpoint called with branch ID
    - Verify only branch-specific logs displayed
    - Test TenantAdmin can view any branch in their tenant
    - Test BranchOwner can only view their own branch
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.6, 9.7_
  
  - [ ]* 11.4 Perform manual testing with all roles
    - Verify SuperAdmin can access audit logs from navigation
    - Verify TenantAdmin sees Audit Logs in main navigation
    - Verify HqManager sees Audit Logs in main navigation
    - Verify BranchOwner sees Audit Logs in main navigation
    - Verify HqStaff does NOT see Audit Logs in navigation
    - Verify BranchManager does NOT see Audit Logs in navigation
    - Verify TenantAdmin sees HQ + all branch logs for their tenant
    - Verify HqManager sees HQ + all branch logs for their tenant
    - Verify BranchOwner sees only their branch logs
    - Test branch filter dropdown functionality
    - Test HQ-only filter shows only HQ logs
    - Test branch-specific filter shows only that branch's logs
    - Test branch profile audit logs tab displays correctly
    - Test search and filters work on both pages
    - Test pagination works correctly
    - Test empty states display appropriately
    - Test 403 errors for unauthorized access
    - Verify tenant isolation is enforced
    - _Requirements: All requirements_

- [ ] 12. Final checkpoint - Feature complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at phase boundaries
- Backend authorization (Tasks 1-3) is security-critical and must be completed first
- Frontend access control (Tasks 4-6) enables role-based navigation
- UI enhancements (Tasks 7-10) provide user-facing functionality
- Testing tasks (Task 11) validate the complete feature across all roles and scenarios
- The implementation leverages existing infrastructure (no schema changes required)
- Branch context is determined by User.BranchId (NULL = HQ, NOT NULL = Branch)
