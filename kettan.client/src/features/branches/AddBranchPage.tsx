import { Box, Typography, Paper, Grid } from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';

export function AddBranchPage() {
  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/branches" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Register New Branch
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Establish a new storefront or operations center in the system.
          </Typography>
        </Box>
      </Box>

      {/* Form Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField label="Branch Name" placeholder="e.g. BGC Reserve" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Status"
              value="setup"
              options={[
                { value: 'active', label: 'Active (Operational)' },
                { value: 'setup', label: 'Setup Pending' },
              ]}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormTextField label="Location Address" placeholder="e.g. 5th Avenue, Bonifacio Global City, Taguig" />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Assign Manager"
              value=""
              displayEmpty
              options={[
                { value: '', label: 'Select a manager...' },
                { value: '1', label: 'Miguel Santos' },
                { value: '2', label: 'Sarah Jenkins' },
              ]}
            />
          </Grid>
        </Grid>

        <FormActions 
          cancelTo="/branches" 
          saveText="Register Branch" 
          saveIcon={<BusinessRoundedIcon />} 
        />
      </Paper>
    </Box>
  );
}
