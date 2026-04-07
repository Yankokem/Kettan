import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Typography, Box } from '@mui/material';

const ROLES = ['TenantAdmin', 'HQ Manager', 'HQ Staff', 'Branch Owner', 'Branch Manager'];
const MODULES = ['Dashboard', 'Orders', 'HQ Inventory', 'Branches', 'Staff', 'Menu Recipes', 'Consumption', 'Returns', 'Reports', 'Settings'];

export function AccessMatrix() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Role Access Matrix</Typography>
        <Typography variant="body2" color="text.secondary">Global permission rules mapping roles to specific system modules.</Typography>
      </Box>
      
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Module</TableCell>
              {ROLES.map(role => (
                <TableCell key={role} align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>{role}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {MODULES.map((module) => (
              <TableRow key={module} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                  {module}
                </TableCell>
                {ROLES.map(role => {
                  // Hardcoded visual representation of permissions logic based on Option A blueprint decisions
                  const isTenantAdmin = role === 'TenantAdmin';
                  const isDashboard = module === 'Dashboard';
                  const isSettings = module === 'Settings';
                  const hasAccess = isTenantAdmin || isDashboard || (!isSettings && role.includes('HQ'));
                  
                  return (
                    <TableCell key={`${module}-${role}`} align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                        <Checkbox 
                          size="small" 
                          checked={hasAccess} 
                          disabled={!hasAccess && !isTenantAdmin}
                          color="success" 
                          sx={{ p: 0.25 }} 
                        />
                        <Checkbox 
                          size="small" 
                          checked={hasAccess && !role.includes('Owner')} 
                          disabled={!hasAccess && !isTenantAdmin}
                          color="info" 
                          sx={{ p: 0.25 }} 
                        />
                        <Checkbox 
                          size="small" 
                          checked={hasAccess && !role.includes('Owner')} 
                          disabled={!hasAccess && !isTenantAdmin}
                          color="warning" 
                          sx={{ p: 0.25 }} 
                        />
                        <Checkbox 
                          size="small" 
                          checked={isTenantAdmin} 
                          disabled={!isTenantAdmin}
                          color="error" 
                          sx={{ p: 0.25 }} 
                        />
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
