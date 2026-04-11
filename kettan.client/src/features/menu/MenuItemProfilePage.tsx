import { Box, Typography, Paper, Divider, Avatar, IconButton, Chip } from '@mui/material';
import { useState, useRef } from 'react';
import { useParams } from '@tanstack/react-router';
import LocalCafeRoundedIcon from '@/components/icons/lucide-mui/LocalCafeRoundedIcon';
import CameraAltRoundedIcon from '@/components/icons/lucide-mui/CameraAltRoundedIcon';
import ImageRoundedIcon from '@/components/icons/lucide-mui/ImageRoundedIcon';
import EditRoundedIcon from '@/components/icons/lucide-mui/EditRoundedIcon';
import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { VariantsBuilder } from './components/VariantsBuilder';
import { PriceSuggestion } from './components/PriceSuggestion';
import type { MenuItemFormData, MenuItem, MenuVariant } from './types';

const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Iced Americano',
    category: 'Coffee',
    sellingPrice: 120.00,
    status: 'Active',
    variants: [
      {
        id: 'v1',
        name: 'Small',
        ingredients: [
          { id: 'i1', itemId: '1', itemName: 'Arabica Coffee Beans', qtyPerUnit: 0.015, uom: 'kg' },
          { id: 'i2', itemId: '3', itemName: 'Ice', qtyPerUnit: 150, uom: 'ml' },
        ],
      },
      {
        id: 'v2',
        name: 'Medium',
        ingredients: [
          { id: 'i1', itemId: '1', itemName: 'Arabica Coffee Beans', qtyPerUnit: 0.018, uom: 'kg' },
          { id: 'i2', itemId: '3', itemName: 'Ice', qtyPerUnit: 200, uom: 'ml' },
        ],
      },
    ],
    createdAt: '2026-03-15',
  },
  {
    id: '2',
    name: 'Vanilla Latte',
    category: 'Coffee with Milk',
    sellingPrice: 150.00,
    status: 'Active',
    variants: [
      {
        id: 'v3',
        name: 'Regular',
        ingredients: [
          { id: 'i3', itemId: '2', itemName: 'Espresso Blend', qtyPerUnit: 0.02, uom: 'kg' },
          { id: 'i4', itemId: '3', itemName: 'Almond Milk', qtyPerUnit: 0.3, uom: 'L' },
          { id: 'i5', itemId: '4', itemName: 'Vanilla Syrup', qtyPerUnit: 0.03, uom: 'L' },
        ],
      },
    ],
    createdAt: '2026-03-14',
  },
];

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

export function MenuItemProfilePage() {
  const { menuItemId } = useParams({ strict: false });
  const menuItem = MOCK_MENU_ITEMS.find(item => item.id === menuItemId as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: menuItem?.name || '',
    category: menuItem?.category || '',
    description: menuItem?.description || '',
    sellingPrice: menuItem?.sellingPrice || 0,
    status: menuItem?.status || 'Active',
    image: menuItem?.image,
    variants: menuItem?.variants || [],
  });

  const handleVariantsChange = (variants: MenuVariant[]) => {
    setFormData(prev => ({ ...prev, variants }));
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
    console.log('Updating menu item:', formData);
    alert('Menu item updated successfully! (Mock)');
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to original menu item
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        category: menuItem.category,
        description: menuItem.description,
        sellingPrice: menuItem.sellingPrice,
        status: menuItem.status,
        image: menuItem.image,
        variants: menuItem.variants,
      });
    }
    setIsEditing(false);
  };

  if (!menuItem) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Typography color="error">Menu item not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/menu" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {menuItem.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
            <Chip
              label={menuItem.category}
              size="small"
              sx={{ 
                bgcolor: 'background.default', 
                border: '1px solid', 
                borderColor: 'divider', 
                fontSize: 11, 
                height: 22,
                fontWeight: 600
              }}
            />
            <Chip
              label={menuItem.status}
              size="small"
              sx={{
                bgcolor: menuItem.status === 'Active' ? 'success.main' : 'warning.main',
                color: 'white',
                fontSize: 11,
                height: 22,
                fontWeight: 700,
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12 }}>
              • ₱{menuItem.sellingPrice.toFixed(2)}
            </Typography>
          </Box>
        </Box>
        {!isEditing && (
          <Button
            variant="outlined"
            startIcon={<EditRoundedIcon />}
            onClick={() => setIsEditing(true)}
          >
            Edit Menu Item
          </Button>
        )}
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
                    alt="Menu item"
                    sx={{
                      width: '100%',
                      aspectRatio: '1/1',
                      objectFit: 'cover',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                  {isEditing && (
                    <IconButton
                      onClick={handleImageClick}
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        bgcolor: 'primary.main',
                        color: 'white',
                        width: 44,
                        height: 44,
                        '&:hover': { bgcolor: 'primary.dark' },
                        boxShadow: 2,
                      }}
                    >
                      <CameraAltRoundedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  )}
                </Box>
              ) : (
                <Box
                  onClick={handleImageClick}
                  sx={{
                    maxWidth: 250,
                    aspectRatio: '1/1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    cursor: isEditing ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': isEditing ? {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    } : {},
                  }}
                >
                  <Avatar
                    sx={{ width: 64, height: 64, bgcolor: 'primary.main', mb: 2 }}
                  >
                    <LocalCafeRoundedIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {isEditing ? 'Upload Image' : 'No Image'}
                  </Typography>
                  {isEditing && (
                    <Typography variant="caption" color="text.secondary">
                      Click to browse files
                    </Typography>
                  )}
                </Box>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </Box>

            {/* Name */}
            <Box sx={{ mb: 2.5 }}>
              <FormTextField 
                label="Menu Item Name" 
                placeholder="e.g. Iced Americano"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                fullWidth
              />
            </Box>

            {/* Category */}
            <Box sx={{ mb: 2.5 }}>
              <FormDropdown
                label="Category"
                value={formData.category}
                options={MENU_CATEGORIES}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as string }))}
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                Manage different sizes and variations with their specific ingredients.
              </Typography>
              
              <VariantsBuilder
                variants={formData.variants}
                onVariantsChange={handleVariantsChange}
                readOnly={!isEditing}
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
                    disabled={!isEditing}
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

        {/* Form Actions - Only show when editing */}
        {isEditing && (
          <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
              <Button startIcon={<LocalCafeRoundedIcon />} onClick={handleSubmit}>
                Save Changes
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

