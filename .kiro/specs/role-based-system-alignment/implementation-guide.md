# Role-Based System Alignment - Implementation Guide

> **Created**: April 27, 2026  
> **Purpose**: Detailed code examples and implementation instructions

---

## Table of Contents

1. [Phase 1: Backend Changes](#phase-1-backend-changes)
2. [Phase 2: Frontend Role Helpers](#phase-2-frontend-role-helpers)
3. [Phase 3: Frontend UI Updates](#phase-3-frontend-ui-updates)
4. [Testing Guide](#testing-guide)

---

## Phase 1: Backend Changes

### 1.1 Update LoginResponse DTO

**File**: `Kettan.Server/DTOs/Auth/LoginResponse.cs`

**Before:**
```csharp
public class LoginResponse
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; }  // ❌ Enum type
    public string Token { get; set; } = string.Empty;
    // ... other properties
}
```

**After:**
```csharp
public class LoginResponse
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;  // ✅ String type
    public string Token { get; set; } = string.Empty;
    // ... other properties
}
```

---

### 1.2 Update UserDto

**File**: `Kettan.Server/DTOs/User/UserDto.cs`

**Before:**
```csharp
public class UserDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; }  // ❌ Enum type
    // ... other properties
}
```

**After:**
```csharp
public class UserDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;  // ✅ String type
    // ... other properties
}
```

---

### 1.3 Update AuthController

**File**: `Kettan.Server/Controllers/AuthController.cs`

**LoginAsync Method - Before:**
```csharp
var response = new LoginResponse
{
    UserId = user.UserId,
    Email = user.Email,
    Name = $"{user.FirstName} {user.LastName}",
    Role = user.Role,  // ❌ Direct enum assignment
    Token = token,
    // ... other properties
};
```

**LoginAsync Method - After:**
```csharp
var response = new LoginResponse
{
    UserId = user.UserId,
    Email = user.Email,
    Name = $"{user.FirstName} {user.LastName}",
    Role = user.Role.ToString(),  // ✅ Convert enum to string
    Token = token,
    // ... other properties
};
```

**GetCurrentUser Method - Before:**
```csharp
return Ok(new
{
    id = user.UserId.ToString(),
    email = user.Email,
    name = $"{user.FirstName} {user.LastName}",
    role = user.Role,  // ❌ Direct enum
    // ... other properties
});
```

**GetCurrentUser Method - After:**
```csharp
return Ok(new
{
    id = user.UserId.ToString(),
    email = user.Email,
    name = $"{user.FirstName} {user.LastName}",
    role = user.Role.ToString(),  // ✅ Convert enum to string
    // ... other properties
});
```

---

### 1.4 Update UsersController

**File**: `Kettan.Server/Controllers/UsersController.cs`

**Any method returning UserDto - Before:**
```csharp
var userDto = new UserDto
{
    UserId = user.UserId,
    Email = user.Email,
    FirstName = user.FirstName,
    LastName = user.LastName,
    Role = user.Role,  // ❌ Direct enum
    // ... other properties
};
```

**Any method returning UserDto - After:**
```csharp
var userDto = new UserDto
{
    UserId = user.UserId,
    Email = user.Email,
    FirstName = user.FirstName,
    LastName = user.LastName,
    Role = user.Role.ToString(),  // ✅ Convert enum to string
    // ... other properties
};
```

---

## Phase 2: Frontend Role Helpers

### 2.1 Create roleHelpers.ts

**File**: `kettan.client/src/utils/roleHelpers.ts`

```typescript
/**
 * Role-based access control utilities
 * Aligned with Kettan_Business_Logic.md
 */

export type UserRole = 
  | 'SuperAdmin'
  | 'TenantAdmin'
  | 'HqManager'
  | 'HqStaff'
  | 'BranchOwner'
  | 'BranchManager';

/**
 * Convert role string to human-readable display name
 * @example getRoleDisplayName('TenantAdmin') => 'Tenant Admin'
 */
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    SuperAdmin: 'Super Admin',
    TenantAdmin: 'Tenant Admin',
    HqManager: 'HQ Manager',
    HqStaff: 'HQ Staff',
    BranchOwner: 'Branch Owner',
    BranchManager: 'Branch Manager',
  };
  return roleMap[role] || role;
};

/**
 * Get MUI color for role badge
 * @example getRoleBadgeColor('TenantAdmin') => 'primary'
 */
export const getRoleBadgeColor = (role: string): 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'default' => {
  const colorMap: Record<string, 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning'> = {
    SuperAdmin: 'error',
    TenantAdmin: 'primary',
    HqManager: 'secondary',
    HqStaff: 'info',
    BranchOwner: 'success',
    BranchManager: 'warning',
  };
  return colorMap[role] || 'default';
};

/**
 * Check if role is HQ-based (TenantAdmin, HqManager, HqStaff)
 */
export const isHqRole = (role: string): boolean => {
  return ['TenantAdmin', 'HqManager', 'HqStaff'].includes(role);
};

/**
 * Check if role is branch-based (BranchOwner, BranchManager)
 */
export const isBranchRole = (role: string): boolean => {
  return ['BranchOwner', 'BranchManager'].includes(role);
};

/**
 * Check if user role can access a specific module
 * Based on Kettan_Business_Logic.md role permission matrix
 */
export const canAccessModule = (userRole: string, module: string): boolean => {
  const permissions: Record<string, string[]> = {
    'dashboard': ['SuperAdmin', 'TenantAdmin', 'HqManager', 'HqStaff', 'BranchOwner', 'BranchManager'],
    'order-processing': ['TenantAdmin', 'HqManager', 'HqStaff'],
    'hq-inventory': ['TenantAdmin', 'HqManager', 'HqStaff'],
    'menu': ['TenantAdmin', 'HqManager'],
    'consumption': ['TenantAdmin', 'HqManager', 'HqStaff', 'BranchOwner', 'BranchManager'],
    'branches': ['TenantAdmin', 'HqManager', 'HqStaff'],
    'staff': ['TenantAdmin', 'HqManager', 'HqStaff'],
    'reports': ['TenantAdmin', 'HqManager', 'BranchOwner', 'BranchManager'],
    'returns': ['TenantAdmin', 'HqManager', 'BranchOwner', 'BranchManager'],
    'supply-requests': ['TenantAdmin', 'HqManager', 'HqStaff', 'BranchOwner', 'BranchManager'],
    'settings': ['TenantAdmin'],
    'company-profile': ['TenantAdmin'],
  };
  
  return permissions[module]?.includes(userRole) ?? false;
};

/**
 * Check if user can perform specific action on a module
 */
export const canPerformAction = (
  userRole: string, 
  module: string, 
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean => {
  // TenantAdmin has full access to everything
  if (userRole === 'TenantAdmin') return true;
  
  // Module-specific action permissions
  const actionPermissions: Record<string, Record<string, string[]>> = {
    'consumption': {
      'view': ['TenantAdmin', 'HqManager', 'HqStaff', 'BranchOwner', 'BranchManager'],
      'create': ['TenantAdmin', 'BranchManager'],
      'edit': [],
      'delete': [],
    },
    'supply-requests': {
      'view': ['TenantAdmin', 'HqManager', 'HqStaff', 'BranchOwner', 'BranchManager'],
      'create': ['TenantAdmin', 'BranchOwner', 'BranchManager'],
      'edit': ['TenantAdmin', 'BranchOwner', 'BranchManager'],
      'delete': [],
    },
    'returns': {
      'view': ['TenantAdmin', 'HqManager', 'BranchOwner', 'BranchManager'],
      'create': ['TenantAdmin', 'BranchOwner', 'BranchManager'],
      'edit': ['TenantAdmin', 'HqManager'],
      'delete': [],
    },
    // Add more modules as needed
  };
  
  return actionPermissions[module]?.[action]?.includes(userRole) ?? false;
};
```

---

## Phase 3: Frontend UI Updates

### 3.1 Update AppLayout (Role Display)

**File**: `kettan.client/src/components/Layout/AppLayout.tsx`

```typescript
import { getRoleDisplayName, getRoleBadgeColor } from '@/utils/roleHelpers';
import { Chip } from '@mui/material';

// In your header/profile section:
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Typography variant="body2">{user?.name}</Typography>
  <Chip 
    label={getRoleDisplayName(user?.role ?? '')} 
    color={getRoleBadgeColor(user?.role ?? '')}
    size="small"
  />
</Box>
```

---

### 3.2 Update Sidebar (Menu Filtering)

**File**: `kettan.client/src/components/Layout/Sidebar.tsx`

```typescript
import { canAccessModule } from '@/utils/roleHelpers';
import { useAuthStore } from '@/store/useAuthStore';

const Sidebar = () => {
  const { user } = useAuthStore();
  const userRole = user?.role ?? '';

  // Define all menu items with their module identifiers
  const allMenuItems = [
    { 
      label: 'Dashboard', 
      path: '/dashboard', 
      icon: DashboardIcon, 
      module: 'dashboard' 
    },
    { 
      label: 'Order Processing', 
      path: '/orders', 
      icon: OrderIcon, 
      module: 'order-processing' 
    },
    { 
      label: 'HQ Inventory', 
      path: '/hq-inventory', 
      icon: InventoryIcon, 
      module: 'hq-inventory' 
    },
    { 
      label: 'Menu & Recipes', 
      path: '/menu', 
      icon: MenuIcon, 
      module: 'menu' 
    },
    { 
      label: 'Consumption Logging', 
      path: '/consumption', 
      icon: ConsumptionIcon, 
      module: 'consumption' 
    },
    { 
      label: 'Branches', 
      path: '/branches', 
      icon: BranchIcon, 
      module: 'branches' 
    },
    { 
      label: 'Staff Directory', 
      path: '/staff', 
      icon: StaffIcon, 
      module: 'staff' 
    },
    { 
      label: 'Finance & Reports', 
      path: '/reports', 
      icon: ReportsIcon, 
      module: 'reports' 
    },
    { 
      label: 'Returns', 
      path: '/returns', 
      icon: ReturnIcon, 
      module: 'returns' 
    },
    { 
      label: 'Supply Requests', 
      path: '/supply-requests', 
      icon: SupplyIcon, 
      module: 'supply-requests' 
    },
    { 
      label: 'Settings', 
      path: '/settings', 
      icon: SettingsIcon, 
      module: 'settings' 
    },
  ];

  // Filter menu items based on role permissions
  const visibleMenuItems = allMenuItems.filter(item => 
    canAccessModule(userRole, item.module)
  );

  return (
    <List>
      {visibleMenuItems.map((item) => (
        <ListItem key={item.path} button component={Link} to={item.path}>
          <ListItemIcon>
            <item.icon />
          </ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItem>
      ))}
    </List>
  );
};
```

---

### 3.3 Update Dashboard (Role-Based Widgets)

**File**: `kettan.client/src/features/dashboard/DashboardPage.tsx`

```typescript
import { isHqRole, isBranchRole } from '@/utils/roleHelpers';
import { useAuthStore } from '@/store/useAuthStore';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const role = user?.role ?? '';

  return (
    <Box sx={{ p: 3 }}>
      {/* Common widgets for all roles */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4">
            Welcome, {user?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getRoleDisplayName(role)}
          </Typography>
        </Grid>

        {/* Stat cards - all roles */}
        <Grid item xs={12}>
          <StatCards role={role} />
        </Grid>

        {/* HQ-specific widgets */}
        {isHqRole(role) && (
          <>
            <Grid item xs={12} md={8}>
              <OperationsTrendChart />
            </Grid>
            <Grid item xs={12} md={4}>
              <LowStockAlerts />
            </Grid>
            <Grid item xs={12}>
              <RecentOrdersTable />
            </Grid>
          </>
        )}

        {/* Branch-specific widgets */}
        {isBranchRole(role) && (
          <>
            <Grid item xs={12} md={6}>
              <MySupplyRequestsWidget />
            </Grid>
            <Grid item xs={12} md={6}>
              <MyConsumptionLogsWidget />
            </Grid>
            <Grid item xs={12}>
              <BranchPerformanceWidget />
            </Grid>
          </>
        )}

        {/* TenantAdmin-only widgets */}
        {role === 'TenantAdmin' && (
          <>
            <Grid item xs={12}>
              <BranchPerformanceRanking />
            </Grid>
            <Grid item xs={12} md={6}>
              <SubscriptionStatusWidget />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};
```

---

## Testing Guide

### Backend Testing

**Test 1: Login Endpoint**
```bash
# Request
POST /api/auth/login
{
  "email": "admin@dummycorp.local",
  "password": "password123"
}

# Expected Response
{
  "userId": 1,
  "email": "admin@dummycorp.local",
  "name": "Admin User",
  "role": "TenantAdmin",  // ✅ String, not number
  "token": "eyJhbGc..."
}
```

**Test 2: Get Current User**
```bash
# Request
GET /api/auth/me
Authorization: Bearer {token}

# Expected Response
{
  "id": "1",
  "email": "admin@dummycorp.local",
  "name": "Admin User",
  "role": "TenantAdmin",  // ✅ String, not number
  "branchId": null
}
```

---

### Frontend Testing

**Test 1: Role Display**
- Login as any user
- Check header/profile area
- Should display "Tenant Admin" (not "1")
- Badge should have correct color

**Test 2: Sidebar Navigation**
- Login as TenantAdmin → Should see all modules including Settings
- Login as HqManager → Should see HQ modules, no Settings
- Login as BranchManager → Should see only branch modules

**Test 3: Dashboard Widgets**
- Login as TenantAdmin → Should see all widgets
- Login as HqManager → Should see HQ operations widgets
- Login as BranchManager → Should see branch-specific widgets

---

## Common Issues & Solutions

### Issue 1: Role still shows as number
**Solution**: Clear localStorage and re-login to get fresh token with string role

### Issue 2: TypeScript errors on role property
**Solution**: Update User interface in `useAuthStore.ts` to have `role: string`

### Issue 3: Sidebar shows wrong items
**Solution**: Verify `canAccessModule()` logic matches permission matrix in plan.md

### Issue 4: Dashboard widgets not showing
**Solution**: Check role comparison logic - ensure using string comparison, not enum

---

## Completion Checklist

- [ ] All backend DTOs updated to use string for role
- [ ] All controllers convert role to string when mapping
- [ ] roleHelpers.ts created with all utility functions
- [ ] Layout updated to display role properly
- [ ] Sidebar filters menu items by role
- [ ] Dashboard shows role-appropriate widgets
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Documentation updated
