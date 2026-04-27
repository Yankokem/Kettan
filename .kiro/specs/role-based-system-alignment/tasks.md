# Role-Based System Alignment - Task List

> **Created**: April 27, 2026  
> **Status**: Not Started  
> **Total Tasks**: 15

---

## Phase 1: Backend API - Return Role as String

### 1.1 Update Auth DTOs
- [x] 1.1.1 Update `Kettan.Server/DTOs/Auth/LoginResponse.cs` - Change `Role` property from `UserRole` enum to `string`
- [x] 1.1.2 Update `Kettan.Server/DTOs/User/UserDto.cs` - Change `Role` property from `UserRole` enum to `string`

### 1.2 Update Auth Controller
- [x] 1.2.1 Update `LoginAsync()` in `Kettan.Server/Controllers/AuthController.cs` - Add `.ToString()` when mapping role to DTO
- [x] 1.2.2 Update `GetCurrentUser()` in `Kettan.Server/Controllers/AuthController.cs` - Add `.ToString()` when mapping role to DTO

### 1.3 Update Users Controller
- [x] 1.3.1 Update all endpoints in `Kettan.Server/Controllers/UsersController.cs` that return user data - Add `.ToString()` for role mapping

### 1.4 Verify Backend Changes
- [x] 1.4.1 Build backend project - Ensure no compilation errors
- [x] 1.4.2 Test login endpoint - Verify role returns as string (e.g., "TenantAdmin")
- [x] 1.4.3 Test GET /api/auth/me - Verify role returns as string

---

## Phase 2: Frontend - Role Helpers & Display

### 2.1 Create Role Utility Functions
- [x] 2.1.1 Create `kettan.client/src/utils/roleHelpers.ts`
- [x] 2.1.2 Implement `getRoleDisplayName()` function - Maps role to display name
- [x] 2.1.3 Implement `getRoleBadgeColor()` function - Maps role to MUI color
- [x] 2.1.4 Implement `isHqRole()` function - Checks if role is HQ-based
- [x] 2.1.5 Implement `isBranchRole()` function - Checks if role is branch-based
- [x] 2.1.6 Implement `canAccessModule()` function - Permission checking logic
- [x] 2.1.7 Export TypeScript type `UserRole` - Type definition for all roles

### 2.2 Fix Layout Role Display
- [-] 2.2.1 Update `kettan.client/src/components/Layout/AppLayout.tsx` - Replace raw role display with `getRoleDisplayName()`
- [~] 2.2.2 Add role badge with color - Use `getRoleBadgeColor()` for badge color
- [~] 2.2.3 Verify role displays correctly in header/profile area

### 2.3 Fix Sidebar Navigation
- [~] 2.3.1 Update `kettan.client/src/components/Layout/Sidebar.tsx` - Define menu items with module permissions
- [~] 2.3.2 Implement menu filtering logic - Use `canAccessModule()` to filter items
- [~] 2.3.3 Test sidebar for TenantAdmin - Should see all modules including Settings
- [~] 2.3.4 Test sidebar for HqManager - Should see HQ modules, no Settings
- [~] 2.3.5 Test sidebar for HqStaff - Should see HQ modules (limited), no Settings
- [~] 2.3.6 Test sidebar for BranchOwner - Should see branch modules only
- [~] 2.3.7 Test sidebar for BranchManager - Should see branch modules only

---

## Phase 3: Dashboard - Role-Based Content

### 3.1 Update Dashboard Page
- [~] 3.1.1 Update `kettan.client/src/features/dashboard/DashboardPage.tsx` - Add role-based widget visibility
- [~] 3.1.2 Implement HQ role widgets - Operations trend, recent orders, low stock alerts
- [~] 3.1.3 Implement branch role widgets - Supply requests, consumption logs, branch performance
- [~] 3.1.4 Implement TenantAdmin-specific widgets - Subscription status, branch ranking
- [~] 3.1.5 Test dashboard for each role - Verify correct widgets display

---

## Phase 4: Testing & Verification

### 4.1 Backend Testing
- [ ] 4.1.1 Test login endpoint - Verify role returns as string
- [ ] 4.1.2 Test GET /api/users - Verify all users have string roles
- [ ] 4.1.3 Test GET /api/auth/me - Verify current user role is string
- [ ] 4.1.4 Check all user-related DTOs - Ensure role is string type

### 4.2 Frontend Testing
- [ ] 4.2.1 Test role display - Should show "Tenant Admin" not "1"
- [ ] 4.2.2 Test role badge - Should show correct color
- [ ] 4.2.3 Test sidebar navigation - Should show correct items per role
- [ ] 4.2.4 Test dashboard widgets - Should show correct content per role
- [ ] 4.2.5 Test role-based access - Verify permission checks work

### 4.3 Role-Specific Testing
- [ ] 4.3.1 Test as TenantAdmin - Verify full access to all modules
- [ ] 4.3.2 Test as HqManager - Verify HQ access, no Settings
- [ ] 4.3.3 Test as HqStaff - Verify limited HQ access
- [ ] 4.3.4 Test as BranchOwner - Verify branch-only access
- [ ] 4.3.5 Test as BranchManager - Verify branch-only access

### 4.4 Regression Testing
- [ ] 4.4.1 Test existing role checks - Ensure no breaking changes
- [ ] 4.4.2 Test authentication flow - Login/logout works correctly
- [ ] 4.4.3 Test route protection - Unauthorized access blocked
- [ ] 4.4.4 Clear localStorage - Test with fresh auth state

---

## Phase 5: Cleanup & Documentation

### 5.1 Code Cleanup
- [ ] 5.1.1 Remove any old role-related code - Clean up unused imports
- [ ] 5.1.2 Update TypeScript types - Ensure consistency across codebase
- [ ] 5.1.3 Run linter - Fix any linting issues
- [ ] 5.1.4 Run type checker - Fix any type errors

### 5.2 Documentation
- [ ] 5.2.1 Update inline code comments - Document role helper functions
- [ ] 5.2.2 Update this task list - Mark all tasks as complete
- [ ] 5.2.3 Create completion summary - Document what was changed

---

## Progress Tracking

**Phase 1**: ⬜ Not Started (0/5 tasks)  
**Phase 2**: ⬜ Not Started (0/14 tasks)  
**Phase 3**: ⬜ Not Started (0/5 tasks)  
**Phase 4**: ⬜ Not Started (0/14 tasks)  
**Phase 5**: ⬜ Not Started (0/4 tasks)  

**Overall Progress**: 0/42 tasks completed (0%)

---

## Notes

- Each task should be completed in order within its phase
- Mark tasks as complete using `[x]` when done
- Add notes below tasks if issues arise
- Update progress tracking after each phase
