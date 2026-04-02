import { Box, Typography, Paper, Grid } from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';

export function AddInventoryPage() {
  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/hq-inventory" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Add Inventory Item
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Register new coffee, syrups, packaging, or equipment into the system.
          </Typography>
        </Box>
      </Box>

      {/* Form Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField label="Item Name" placeholder="e.g. Vanilla Syrup" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField label="SKU" placeholder="e.g. SY-VAN-02" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Category"
              value=""
              displayEmpty
              options={[
                { value: '', label: 'Select a category' },
                { value: 'beans', label: 'Coffee Beans' },
                { value: 'syrup', label: 'Syrups' },
                { value: 'milk', label: 'Milk & Dairy' },
                { value: 'packaging', label: 'Cups & Packaging' },
                { value: 'equipment', label: 'Equipment & Machinery' }
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Supplier"
              value=""
              displayEmpty
              options={[
                { value: '', label: 'Select a primary supplier' },
                { value: 'roasters', label: 'Origin Roasters' },
                { value: 'monin', label: 'Monin Dist.' },
                { value: 'packtech', label: 'PackTech Co.' },
              ]}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormDropdown
              label="Unit Type"
              value="kg"
              options={[
                { value: 'kg', label: 'Kilograms (kg)' },
                { value: 'L', label: 'Liters (L)' },
                { value: 'pcs', label: 'Pieces (pcs)' },
                { value: 'units', label: 'Units' },
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormTextField label="Reorder Point" type="number" defaultValue="10" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormTextField label="Initial Headquarter Stock" type="number" defaultValue="0" />
          </Grid>
        </Grid>

        <FormActions 
          cancelTo="/hq-inventory" 
          saveText="Save Item" 
          saveIcon={<Inventory2RoundedIcon />} 
        />
      </Paper>
    </Box>
  );
}