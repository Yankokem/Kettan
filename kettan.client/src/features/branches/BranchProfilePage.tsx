import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Paper, Avatar, Chip, Tabs, Tab, Divider } from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import { Dropdown } from '../../components/UI/Dropdown';
import { TimePicker } from '../../components/UI/TimePicker';
import { TabPanel } from '../../components/UI/TabPanel';
import {
  BRANCH_OWNER_OPTIONS,
  BRANCH_MANAGER_OPTIONS,
  getBranchById,
  getBranchEmployeesById,
} from './mockData';
import { StaffRosterTable } from './components/StaffRosterTable';
import type { Branch, BranchFormData, BranchStatus } from './types';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Operational)' },
  { value: 'setup', label: 'Setup Pending' },
];

const OWNER_OPTIONS = [
  { value: '', label: 'Unassigned (Optional)' },
  ...BRANCH_OWNER_OPTIONS,
];

const MANAGER_OPTIONS = [
  { value: '', label: 'Select a manager...' },
  ...BRANCH_MANAGER_OPTIONS,
];

const toBranchFormData = (branch: Branch): BranchFormData => ({
  name: branch.name,
  address: branch.address,
  city: branch.city,
  contactNumber: branch.contactNumber,
  openTime: branch.openTime,
  closeTime: branch.closeTime,
  ownerUserId: branch.ownerUserId ?? '',
  managerUserId: branch.managerUserId,
  status: branch.status,
  picture: branch.imageUrl,
  notes: branch.notes ?? '',
});

export function BranchProfilePage() {
  const navigate = useNavigate();
  const { branchId } = useParams({ from: '/layout/branches/$branchId' });

  const parsedBranchId = Number(branchId);
  const selectedBranch = useMemo(() => getBranchById(parsedBranchId), [parsedBranchId]);
  const employees = useMemo(() => getBranchEmployeesById(parsedBranchId), [parsedBranchId]);

  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<BranchFormData | null>(
    selectedBranch ? toBranchFormData(selectedBranch) : null
  );

  useEffect(() => {
    setFormData(selectedBranch ? toBranchFormData(selectedBranch) : null);
  }, [selectedBranch]);

  if (!selectedBranch || !formData) {
    return (
      <Box sx={{ pb: 4, pt: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
          Branch not found
        </Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 3 }}>
          The requested branch profile could not be loaded.
        </Typography>
        <Button onClick={() => navigate({ to: '/branches' })}>Back to Branches</Button>
      </Box>
    );
  }

  const branchCode = `BR-${selectedBranch.id.toString().padStart(5, '0')}`;

  const handleSave = () => {
    console.log('Saving branch profile:', {
      branchId: selectedBranch.id,
      ...formData,
    });
    alert('Branch profile updated successfully! (Mock)');
  };

  return (
    <Box sx={{ pb: 5, pt: 1 }}>
      {/* Header Profile Title */}
      <Box sx={{ mb: 4, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Avatar
          variant="rounded"
          src={selectedBranch.imageUrl}
          sx={{ width: 88, height: 88, bgcolor: 'primary.main', borderRadius: 4, color: 'primary.contrastText' }}
        >
          {!selectedBranch.imageUrl && <BusinessRoundedIcon sx={{ fontSize: 44 }} />}
        </Avatar>

        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            {formData.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<MapRoundedIcon fontSize="small" />}
              label={formData.city || 'No city assigned'}
              size="small"
              sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 28 }}
            />
            <Chip
              label={formData.status === 'active' ? 'Active' : 'Setup Pending'}
              size="small"
              sx={{
                bgcolor: formData.status === 'active' ? 'success.light' : '#F3F4F6',
                color: formData.status === 'active' ? 'success.dark' : '#4B5563',
                borderRadius: 2,
                height: 28,
                fontWeight: 700,
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              ID: {branchCode}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<Inventory2RoundedIcon />}
            onClick={() =>
              navigate({
                to: '/branch-inventory/$branchId',
                params: { branchId: selectedBranch.id.toString() },
              })
            }
          >
            View Inventory
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(_event, nextValue) => setTabValue(nextValue)}
          sx={{
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 14,
              minHeight: 52,
              color: 'text.secondary',
            },
            '& .Mui-selected': {
              color: '#6B4C2A !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#C9A84C',
            },
          }}
        >
          <Tab label="Settings" />
          <Tab label={`Staff Roster (${employees.length})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0} disablePadding>
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
              Branch Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Branch Name
                </Typography>
                <TextField
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => prev ? { ...prev, name: event.target.value } : prev)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Status
                </Typography>
                <Dropdown
                  value={formData.status}
                  fullWidth
                  options={STATUS_OPTIONS}
                  onChange={(event) =>
                    setFormData((prev) => prev ? { ...prev, status: event.target.value as BranchStatus } : prev)
                  }
                  sx={{ width: '100%', minWidth: 'auto' }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Address
                </Typography>
                <TextField
                  value={formData.address}
                  onChange={(event) => setFormData((prev) => prev ? { ...prev, address: event.target.value } : prev)}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  City
                </Typography>
                <TextField
                  value={formData.city}
                  onChange={(event) => setFormData((prev) => prev ? { ...prev, city: event.target.value } : prev)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Contact Number
                </Typography>
                <TextField
                  value={formData.contactNumber}
                  onChange={(event) =>
                    setFormData((prev) => prev ? { ...prev, contactNumber: event.target.value } : prev)
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Open Time
                </Typography>
                <TimePicker
                  value={formData.openTime}
                  onChange={(event) => setFormData((prev) => prev ? { ...prev, openTime: event.target.value } : prev)}
                  size="small"
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Close Time
                </Typography>
                <TimePicker
                  value={formData.closeTime}
                  onChange={(event) => setFormData((prev) => prev ? { ...prev, closeTime: event.target.value } : prev)}
                  size="small"
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Assigned Owner
                </Typography>
                <Dropdown
                  value={formData.ownerUserId}
                  fullWidth
                  options={OWNER_OPTIONS}
                  onChange={(event) =>
                    setFormData((prev) => prev ? { ...prev, ownerUserId: String(event.target.value) } : prev)
                  }
                  sx={{ width: '100%', minWidth: 'auto' }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Assigned Manager
                </Typography>
                <Dropdown
                  value={formData.managerUserId}
                  fullWidth
                  options={MANAGER_OPTIONS}
                  onChange={(event) =>
                    setFormData((prev) => prev ? { ...prev, managerUserId: String(event.target.value) } : prev)
                  }
                  sx={{ width: '100%', minWidth: 'auto' }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{
                p: 2.5,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary', mb: 0.35 }}>
                  Inventory Access
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  Open the branch inventory page to review stock levels and alerts.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<Inventory2RoundedIcon />}
                onClick={() =>
                  navigate({
                    to: '/branch-inventory/$branchId',
                    params: { branchId: selectedBranch.id.toString() },
                  })
                }
              >
                Open Branch Inventory
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1} disablePadding>
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Staff Roster
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
              Read-only employee records assigned to this branch.
            </Typography>

            <StaffRosterTable employees={employees} />
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}
