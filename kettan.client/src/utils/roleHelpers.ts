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
