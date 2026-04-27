# Role-Based System Alignment - Implementation Plan

> **Created**: April 27, 2026  
> **Status**: Planning  
> **Priority**: 🔴 P0 - Critical  
> **Estimated Time**: 2.5 hours

---

## Problem Statement

### Current Issue
- **Backend**: Returns user role as numeric enum value (e.g., `1` for TenantAdmin)
- **Frontend**: Expects role as string (e.g., `"TenantAdmin"`)
- **Database**: Already migrated to tinyint via `KettanDB_Optimize.sql`
- **Result**: 
  - UI displays "1" instead of "Tenant Admin"
  - Role-based access control fails
  - Sidebar shows incorrect menu items
  - Dashboard shows wrong content for roles

### Root Cause
The system was partially migrated to use numeric enums in the database (per optimization plan), but the API layer wasn't updated to convert these back to strings for the frontend. The frontend was built expecting string role values and has role-based logic throughout.

---

## Solution Overview

Convert role enum values to strings at the API boundary (DTOs) while keeping the database optimized with tinyint storage. This maintains database efficiency while preserving frontend compatibility.

### Architecture Decision
- **Database**: Keep tinyint (byte) storage ✅
- **Entity Layer**: Keep enum types ✅
- **API Layer**: Convert to string in DTOs ✅
- **Frontend**: Consume as string ✅

---

## Role Permission Matrix (Source of Truth)

Based on `Kettan_Business_Logic.md` and `Kettan_Architecture.md`:

| Module | TenantAdmin | HqManager | HqStaff | BranchOwner | BranchManager |
|--------|-------------|-----------|---------|-------------|---------------|
| **Dashboard** | ✅ Full | ✅ Full | ✅ Full | ✅ Branch | ✅ Branch |
| **Order Processing** | ✅ Full | ✅ Approve/Track | ✅ Pick/Pack/Dispatch | ❌ | ❌ |
| **HQ Inventory** | ✅ Full | ✅ Full | ✅ Stock-In/Out | ❌ | ❌ |
| **Menu & Recipes** | ✅ Manage | ✅ Manage | ❌ | ❌ | ❌ |
| **Consumption Logging** | ✅ View All | ✅ View All | ✅ View All | ✅ View Only | ✅ Create/Submit |
| **Branches** | ✅ Manage All | ✅ View All | ✅ View All | ❌ | ❌ |
| **Staff Directory** | ✅ Manage All | ✅ View All | ✅ View All | ❌ | ❌ |
| **Finance & Reports** | ✅ Full | ✅ Full | ❌ | ✅ Branch Only | ✅ Branch Only |
| **Returns** | ✅ View All | ✅ Resolve | ❌ | ✅ File/Track | ✅ File/Track |
| **Supply Requests** | ✅ View All | ✅ View All | ✅ View All | ✅ Create/Submit/Track | ✅ Create/Submit/Track |
| **Settings** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Company Profile** | ✅ Edit | ❌ | ❌ | ❌ | ❌ |

---

## Sidebar Navigation Per Role

### TenantAdmin / HqManager / HqStaff
```
📊 Dashboard
📋 Order Processing
📦 HQ Inventory
☕ Menu & Recipes
📝 Consumption Logging
🏪 Branches
👥 Staff Directory
📈 Finance & Reports
↩️ Returns
⚙️ Settings (TenantAdmin only)
```

### BranchOwner / BranchManager
```
📊 Dashboard
📋 Supply Requests
📝 Consumption Logging
↩️ Returns
📈 Reports (my branch)
```

---

## Implementation Phases

### Phase 1: Backend API - Return Role as String (30 min)
Convert role enum to string at the API boundary (DTOs).

**Files to Modify:**
- `Kettan.Server/DTOs/Auth/LoginResponse.cs`
- `Kettan.Server/DTOs/User/UserDto.cs`
- `Kettan.Server/Controllers/AuthController.cs`
- `Kettan.Server/Controllers/UsersController.cs`

**Changes:**
- Change DTO properties from `UserRole` enum to `string`
- Add `.ToString()` conversion in controllers when mapping entities to DTOs
- Ensure all user-related endpoints return role as string

---

### Phase 2: Frontend - Role Helpers & Display (45 min)

#### 2A. Create Role Utility Functions (15 min)
Create centralized role helper functions for display names, colors, and permissions.

**New File:**
- `kettan.client/src/utils/roleHelpers.ts`

**Functions:**
- `getRoleDisplayName(role: string): string` - "TenantAdmin" → "Tenant Admin"
- `getRoleBadgeColor(role: string): string` - Returns MUI color
- `isHqRole(role: string): boolean` - Check if HQ role
- `isBranchRole(role: string): boolean` - Check if branch role
- `canAccessModule(userRole: string, module: string): boolean` - Permission check

#### 2B. Fix Layout Role Display (10 min)
Update header/profile areas to display role properly.

**Files to Modify:**
- `kettan.client/src/components/Layout/AppLayout.tsx`
- `kettan.client/src/components/Layout/Header.tsx` (if exists)

**Changes:**
- Replace raw role display with `getRoleDisplayName(user.role)`
- Add role badge with proper color using `getRoleBadgeColor(user.role)`

#### 2C. Fix Sidebar Navigation (20 min)
Filter sidebar menu items based on role permissions.

**Files to Modify:**
- `kettan.client/src/components/Layout/Sidebar.tsx`

**Changes:**
- Define menu items with module permissions
- Filter menu items using `canAccessModule(user.role, module)`
- Show/hide menu items based on role

---

### Phase 3: Dashboard - Role-Based Content (45 min)
Show appropriate dashboard widgets based on user role.

**Files to Modify:**
- `kettan.client/src/features/dashboard/DashboardPage.tsx`

**Changes:**
- Add role-based widget visibility
- HQ roles: Operations trend, recent orders, low stock alerts
- Branch roles: Supply requests, consumption logs, branch performance
- TenantAdmin: All widgets + subscription status

---

## Testing Checklist

### Backend Testing
- [ ] Login returns role as string (not number)
- [ ] GET /api/users returns role as string
- [ ] GET /api/auth/me returns role as string
- [ ] All user DTOs have string role property

### Frontend Testing
- [ ] Role displays as "Tenant Admin" (not "1")
- [ ] Role badge shows correct color
- [ ] Sidebar shows correct menu items per role
- [ ] Dashboard shows correct widgets per role
- [ ] Role-based access checks work correctly

### Role-Specific Testing
Test each role to verify correct behavior:
- [ ] **TenantAdmin**: Sees all modules, all widgets
- [ ] **HqManager**: Sees HQ modules, no Settings
- [ ] **HqStaff**: Sees HQ modules (limited), no Settings
- [ ] **BranchOwner**: Sees branch modules only
- [ ] **BranchManager**: Sees branch modules only

---

## Success Criteria

✅ Role displays as human-readable text (e.g., "Tenant Admin")  
✅ Sidebar shows only accessible modules for each role  
✅ Dashboard shows role-appropriate widgets  
✅ All role-based access checks work correctly  
✅ System fully aligned with `Kettan_Business_Logic.md` permissions  
✅ No breaking changes to existing functionality  
✅ Database remains optimized (tinyint storage)  

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing role checks | High | Thorough testing of all role-based logic |
| Frontend type errors | Medium | Update TypeScript types, run type check |
| Cached auth data | Low | Clear localStorage after deployment |
| Missing role conversions | Medium | Search codebase for all role usages |

---

## Rollback Plan

If issues arise:
1. Revert DTO changes (restore enum types)
2. Revert controller changes (remove .ToString())
3. Clear user sessions (force re-login)
4. Database remains unchanged (no rollback needed)

---

## Notes

- This fix aligns the system with the database optimization plan (`KettanDB_Optimize.sql`)
- The database schema is correct (tinyint storage)
- The issue is purely at the API/frontend boundary
- No database migrations needed
- No entity model changes needed

---

## References

- `Kettan_Architecture.md` - System architecture and roles
- `Kettan_Business_Logic.md` - Role permissions and navigation
- `KettanDB_Optimize.sql` - Database optimization plan
- `.kiro/specs/enum-string-conversion-errors/` - Related enum conversion fixes
