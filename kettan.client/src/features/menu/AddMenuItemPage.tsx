import { Box, Typography, Paper, Divider, Button } from '@mui/material';
import { useState } from 'react';
import LocalCafeRoundedIcon from '@/components/icons/lucide-mui/LocalCafeRoundedIcon';
import ImageRoundedIcon from '@/components/icons/lucide-mui/ImageRoundedIcon';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';
import { ImageUpload } from '../../components/UI/ImageUpload';
import { VariantsBuilder } from './components/VariantsBuilder';
import { PriceSuggestion } from './components/PriceSuggestion';
import type { MenuItemFormData, MenuVariant } from './types';

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
    description: '',
    sellingPrice: 0,
    status: 'Active',
    image: undefined,
    variants: [],
  });

  const handleVariantChange = (variants: MenuVariant[]) => {
    setFormData(prev => ({ ...prev, variants }));
  };

  const handleImageUpload = (file: File) => {
    // Convert file to base64 string for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    // Validate form
    if (!formData.name.trim()) {
      alert('Please enter a menu item name');
      return;
    }
    if (!formData.category) {
      alert('Please select a category');
      return;
    }
    if (formData.variants.length === 0) {
      alert('Please add at least one variant');
      return;
    }
    if (formData.sellingPrice <= 0) {
      alert('Please enter a valid selling price');
      return;
    }

    // TODO: Submit to API
    console.log('Submitting menu item:', formData);
    alert('Menu item saved successfully! (Mock)');
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/menu" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Add Menu Item
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Create a new menu item with variants, ingredients, and pricing.
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* LEFT SECTION: Image & Basic Info */}
          <Box sx={{ 
            width: { xs: '100%', md: '40%' }, 
            p: 4,
            borderRight: { xs: 'none', md: '1px solid' },
            borderBottom: { xs: '1px solid', md: 'none' },
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Basic Information
            </Typography>

              {/* Image Upload */}
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'text.secondary', 
                    textTransform: 'uppercase', 
                    fontSize: 11, 
                    letterSpacing: '0.5px',
                    display: 'block',
                    mb: 1.5
                  }}
                >
                  <ImageRoundedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  Menu Item Image
                </Typography>
                
                {formData.image ? (
                  <Box sx={{ position: 'relative', maxWidth: 250 }}>
                    <Box
                      component="img"
                      src={formData.image}
                      alt="Menu item preview"
                      sx={{
                        width: '100%',
                        aspectRatio: '1/1',
                        objectFit: 'cover',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setFormData(prev => ({ ...prev, image: undefined }))}
                      sx={{ mt: 1, width: '100%' }}
                    >
                      Remove Image
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ maxWidth: 250 }}>
                    <ImageUpload
                      onUpload={handleImageUpload}
                      label="Upload Menu Item Image"
                      helperText="PNG or JPG up to 5MB"
                    />
                  </Box>
                )}
              </Box>

              {/* Name */}
              <Box sx={{ mb: 2.5 }}>
                <FormTextField 
                  label="Menu Item Name" 
                  placeholder="e.g. Iced Americano"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                />
              </Box>

              {/* Category */}
              <Box sx={{ mb: 2.5 }}>
                <FormDropdown
                  label="Category"
                  value={formData.category}
                  displayEmpty
                  options={[
                    { value: '', label: 'Select a category' },
                    ...MENU_CATEGORIES,
                  ]}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as string }))}
                  fullWidth
                />
              </Box>

              {/* Description */}
              <Box sx={{ mb: 2.5 }}>
                <FormTextField 
                  label="Description (Optional)" 
                  placeholder="Describe your menu item..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>

              {/* Status */}
              <Box>
                <FormDropdown
                  label="Status"
                  value={formData.status}
                  options={STATUS_OPTIONS}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
                  fullWidth
                />
            </Box>
          </Box>

          {/* RIGHT SECTION: Variants & Pricing */}
          <Box sx={{ width: { xs: '100%', md: '60%' }, p: 4 }}>
            {/* Variants Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                  Variants & Ingredients
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, mb: 3 }}>
                  Add size or type variants (e.g., Small, Medium, Large) with specific ingredient quantities.
                </Typography>
                
                <VariantsBuilder
                  variants={formData.variants}
                  onVariantsChange={handleVariantChange}
                />
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Pricing Section */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
                  Pricing
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <FormTextField 
                      label="Selling Price (₱)" 
                      type="number"
                      placeholder="e.g. 120.00"
                      inputProps={{ step: '0.01', min: '0' }}
                      value={formData.sellingPrice || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                      fullWidth
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <PriceSuggestion
                      variants={formData.variants}
                    />
                  </Box>
                </Box>
              </Box>
          </Box>
        </Box>

        {/* Form Actions */}
        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <FormActions 
            cancelTo="/menu" 
            saveText="Save Menu Item" 
            saveIcon={<LocalCafeRoundedIcon />}
            onSave={handleSubmit}
          />
        </Box>
      </Paper>
    </Box>
  );
}

