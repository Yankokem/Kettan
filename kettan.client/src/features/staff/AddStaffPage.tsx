import { Box, Typography, Paper, Grid } from '@mui/material';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';

export function AddStaffPage() {
  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/staff" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Add Staff Member
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Create a new employee profile and assign their system role.
          </Typography>
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
              value=""
              displayEmpty
              options={[
                { value: '', label: 'Select a role...' },
                { value: 'hq', label: 'HQ Executive' },
                { value: 'manager', label: 'Branch Manager' },
                { value: 'staff', label: 'Store Staff' }
              ]}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Branch Assignment"
              value=""
              displayEmpty
              options={[
                { value: '', label: 'Select a branch...' },
                { value: '1', label: 'Makati HQ' },
                { value: '2', label: 'BGC High Street' },
              ]}
            />
          </Grid>
        </Grid>

        <FormActions 
          cancelTo="/staff" 
          saveText="Create Profile" 
          saveIcon={<PersonAddAlt1RoundedIcon />} 
        />
      </Paper>
    </Box>
  );
}
