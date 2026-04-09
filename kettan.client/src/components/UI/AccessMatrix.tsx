import { Box, Checkbox, Typography } from '@mui/material';
import { DataTable, type ColumnDef } from './DataTable';

const ROLES = ['TenantAdmin', 'HQ Manager', 'HQ Staff', 'Branch Owner', 'Branch Manager'] as const;
const MODULES = ['Dashboard', 'Orders', 'HQ Inventory', 'Branches', 'Staff', 'Menu Recipes', 'Consumption', 'Returns', 'Reports', 'Settings'] as const;

type RoleName = (typeof ROLES)[number];

interface PermissionState {
  view: boolean;
  create: boolean;
  update: boolean;
  remove: boolean;
  disabled: boolean;
}

interface AccessMatrixRow {
  id: string;
  module: string;
  permissions: Record<RoleName, PermissionState>;
}

function getPermissionState(module: string, role: RoleName): PermissionState {
  const isTenantAdmin = role === 'TenantAdmin';
  const isDashboard = module === 'Dashboard';
  const isSettings = module === 'Settings';
  const hasAccess = isTenantAdmin || isDashboard || (!isSettings && role.includes('HQ'));

  return {
    view: hasAccess,
    create: hasAccess && !role.includes('Owner'),
    update: hasAccess && !role.includes('Owner'),
    remove: isTenantAdmin,
    disabled: !hasAccess && !isTenantAdmin,
  };
}

const rows: AccessMatrixRow[] = MODULES.map((module) => {
  const permissions = {} as Record<RoleName, PermissionState>;

  ROLES.forEach((role) => {
    permissions[role] = getPermissionState(module, role);
  });

  return {
    id: module,
    module,
    permissions,
  };
});

const columns: ColumnDef<AccessMatrixRow>[] = [
  {
    key: 'module',
    label: 'Module',
    gridWidth: 'minmax(180px, 1.2fr)',
    render: (row) => (
      <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13 }}>
        {row.module}
      </Typography>
    ),
  },
  ...ROLES.map((role) => ({
    key: role,
    label: role,
    align: 'center' as const,
    gridWidth: 'minmax(155px, 1fr)',
    render: (row: AccessMatrixRow) => {
      const permission = row.permissions[role];

      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
          <Checkbox
            size="small"
            checked={permission.view}
            disabled={permission.disabled}
            color="success"
            sx={{ p: 0.25 }}
          />
          <Checkbox
            size="small"
            checked={permission.create}
            disabled={permission.disabled}
            color="info"
            sx={{ p: 0.25 }}
          />
          <Checkbox
            size="small"
            checked={permission.update}
            disabled={permission.disabled}
            color="warning"
            sx={{ p: 0.25 }}
          />
          <Checkbox
            size="small"
            checked={permission.remove}
            disabled={!permission.remove}
            color="error"
            sx={{ p: 0.25 }}
          />
        </Box>
      );
    },
  })),
];

export function AccessMatrix() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Role Access Matrix</Typography>
        <Typography variant="body2" color="text.secondary">Global permission rules mapping roles to specific system modules.</Typography>
      </Box>

      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.id}
        defaultRowsPerPage={10}
        rowsPerPageOptions={[10, 25, 50]}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3, px: 2, py: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox size="small" checked disabled color="success" sx={{ p: 0 }} /> 
          <Typography variant="body2" fontWeight={600} color="text.secondary">View Access</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox size="small" checked disabled color="info" sx={{ p: 0 }} /> 
          <Typography variant="body2" fontWeight={600} color="text.secondary">Create Access</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox size="small" checked disabled color="warning" sx={{ p: 0 }} /> 
          <Typography variant="body2" fontWeight={600} color="text.secondary">Update Access</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox size="small" checked disabled color="error" sx={{ p: 0 }} /> 
          <Typography variant="body2" fontWeight={600} color="text.secondary">Delete Access (TenantAdmin Only)</Typography>
        </Box>
      </Box>
    </Box>
  );
}
