import { useState } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';
import { MOCK_CATEGORIES, MOCK_UNITS } from './mockData';

export function AddInventoryPage() {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    unitId: '',
    defaultThreshold: 10,
    unitCost: 0,
  });

  const categoryOptions = [
    { value: '', label: 'Select a category' },
    ...MOCK_CATEGORIES.map(c => ({ value: c.id, label: c.name })),
  ];

  const unitOptions = [
    { value: '', label: 'Select a unit' },
    ...MOCK_UNITS.map(u => ({ value: u.id, label: `${u.name} (${u.symbol})` })),
  ];

  const handleSave = () => {
    console.log('Saving item:', formData);
    // TODO: API call to save item
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/hq-inventory" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            New Inventory Item
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Add a new item to the inventory catalog
          </Typography>
        </Box>
      </Box>

      {/* Form Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              label="Item Name"
              placeholder="e.g. Vanilla Syrup"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              label="SKU"
              placeholder="e.g. SY-VAN-02"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Category"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value as string }))}
              options={categoryOptions}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Unit of Measure"
              value={formData.unitId}
              onChange={(e) => setFormData(prev => ({ ...prev, unitId: e.target.value as string }))}
              options={unitOptions}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              label="Reorder Threshold"
              type="number"
              value={formData.defaultThreshold}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultThreshold: parseInt(e.target.value) || 0 }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              label="Unit Cost (₱)"
              type="number"
              value={formData.unitCost || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
              placeholder="Cost per unit"
            />
          </Grid>
        </Grid>

        <FormActions
          cancelTo="/hq-inventory"
          saveText="Save Item"
          saveIcon={<Inventory2RoundedIcon />}
          onSave={handleSave}
        />
      </Paper>
    </Box>
  );
}