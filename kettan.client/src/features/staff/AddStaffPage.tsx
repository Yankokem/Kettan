import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { useSearch } from '@tanstack/react-router';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';
import { BRANCHES_MOCK } from '../branches/mockData';

export function AddStaffPage() {
  const search = useSearch({ strict: false }) as {
    branchId?: string;
    branchName?: string;
    returnTo?: string;
  };

  const initialBranchId = typeof search.branchId === 'string' ? search.branchId : '';
  const returnTo =
    typeof search.returnTo === 'string' && search.returnTo.trim().length > 0
      ? search.returnTo
      : '/staff';

  const [role, setRole] = useState('');
  const [branchAssignment, setBranchAssignment] = useState(initialBranchId);

  useEffect(() => {
    if (initialBranchId) {
      setBranchAssignment(initialBranchId);
    }
  }, [initialBranchId]);

  const branchOptions = useMemo(
    () => [
      { value: '', label: 'Select a branch...' },
      ...BRANCHES_MOCK.map((branch) => ({
        value: branch.id.toString(),
        label: branch.name,
      })),
    ],
    []
  );

  const prefilledBranchName =
    typeof search.branchName === 'string' && search.branchName.trim().length > 0
      ? search.branchName
      : branchOptions.find((option) => option.value === branchAssignment)?.label;

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to={returnTo} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Add Staff Member
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Create a new employee profile and assign their system role.
          </Typography>
          {prefilledBranchName ? (
            <Chip
              size="small"
              label={`Branch preselected: ${prefilledBranchName}`}
              sx={{
                mt: 1.25,
                height: 24,
                borderRadius: 999,
                bgcolor: 'rgba(107,76,42,0.12)',
                color: '#6B4C2A',
                fontWeight: 700,
                fontSize: 11,
              }}
            />
          ) : null}
        </Box>
      </Box>

      {/* Form Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField label="First Name" placeholder="e.g. Juan" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField label="Last Name" placeholder="e.g. Dela Cruz" />
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <FormTextField label="Email Address" placeholder="juan@kettan.co" type="email" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Role"
              value={role}
              displayEmpty
              options={[
                { value: '', label: 'Select a role...' },
                { value: 'hq', label: 'HQ Executive' },
                { value: 'manager', label: 'Branch Manager' },
                { value: 'staff', label: 'Store Staff' }
              ]}
              onChange={(event) => setRole(String(event.target.value))}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Branch Assignment"
              value={branchAssignment}
              displayEmpty
              options={branchOptions}
              onChange={(event) => setBranchAssignment(String(event.target.value))}
            />
          </Grid>
        </Grid>

        <FormActions 
          cancelTo={returnTo} 
          saveText="Create Profile" 
          saveIcon={<PersonAddAlt1RoundedIcon />} 
        />
      </Paper>
    </Box>
  );
}
