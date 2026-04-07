import { Box, Typography, Paper, Grid } from '@mui/material';
import { useState } from 'react';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';
import { RecipeBuilder } from './components/RecipeBuilder';
import type { MenuItemFormData, RecipeIngredient } from './types';

const MENU_CATEGORIES = [
  { value: 'Coffee', label: 'Coffee' },
  { value: 'Coffee with Milk', label: 'Coffee with Milk' },
  { value: 'Frappe', label: 'Frappe' },
  { value: 'Non-Coffee', label: 'Non-Coffee' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

export function AddMenuItemPage() {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    category: '',
    sellingPrice: 0,
    status: 'Active',
    ingredients: [],
  });

  const handleIngredientChange = (ingredients: RecipeIngredient[]) => {
    setFormData(prev => ({ ...prev, ingredients }));
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/menu" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Add Menu Item
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Create a new coffee or food item with ingredients and pricing.
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              Basic Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField 
              label="Menu Item Name" 
              placeholder="e.g. Iced Americano (Medium)"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Category"
              value={formData.category}
              displayEmpty
              options={[
                { value: '', label: 'Select a category' },
                ...MENU_CATEGORIES,
              ]}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as string }))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField 
              label="Selling Price" 
              type="number"
              placeholder="e.g. 120.00"
              inputProps={{ step: '0.01', min: '0' }}
              value={formData.sellingPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Status"
              value={formData.status}
              options={STATUS_OPTIONS}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <RecipeBuilder
              ingredients={formData.ingredients}
              onIngredientsChange={handleIngredientChange}
            />
          </Grid>
        </Grid>

        <FormActions 
          cancelTo="/menu" 
          saveText="Save Menu Item" 
          saveIcon={<LocalCafeRoundedIcon />} 
        />
      </Paper>
    </Box>
  );
}