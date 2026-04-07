import { Box, Typography, Paper, Grid, Avatar, Chip, Divider, IconButton } from '@mui/material';
import { useState, useRef } from 'react';
import { useParams } from '@tanstack/react-router';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { FormActions } from '../../components/Form/FormActions';
import { VariantsBuilder } from './components/VariantsBuilder';
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

  const [formData, setFormData] = useState<MenuItemFormData>({
    name: menuItem?.name || '',
    category: menuItem?.category || '',
    sellingPrice: menuItem?.sellingPrice || 0,
    status: menuItem?.status || 'Active',
    image: menuItem?.image,
    variants: menuItem?.variants || [],
  });

  const handleVariantsChange = (variants: MenuVariant[]) => {
    setFormData(prev => ({ ...prev, variants }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!menuItem) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Typography color="error">Menu item not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      <Box sx={{ mb: 4, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <BackButton to="/menu" />
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={formData.image}
            variant="rounded"
            sx={{ width: 88, height: 88, bgcolor: 'primary.main', borderRadius: 4, color: 'primary.contrastText' }}
          >
            {!formData.image && <LocalCafeRoundedIcon sx={{ fontSize: 44 }} />}
          </Avatar>
          <IconButton
            onClick={handleImageClick}
            sx={{
              position: 'absolute',
              bottom: -8,
              right: -8,
              bgcolor: 'primary.main',
              color: 'white',
              width: 36,
              height: 36,
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <CameraAltRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            {menuItem.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
            <Chip
              label={menuItem.category}
              size="small"
              sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 28 }}
            />
            <Chip
              label={menuItem.status}
              size="small"
              sx={{
                bgcolor: menuItem.status === 'Active' ? 'success.main' : 'warning.main',
                color: 'white',
                borderRadius: 2,
                height: 28,
                fontWeight: 700,
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              ₱{menuItem.sellingPrice.toFixed(2)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Button variant="outlined">
            Delete Menu Item
          </Button>
          <Button>
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* SECTION 1: Basic Information */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Section 1: Basic Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              label="Menu Item Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDropdown
              label="Category"
              value={formData.category}
              options={MENU_CATEGORIES}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as string }))}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormTextField
              label="Selling Price"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={formData.sellingPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormDropdown
              label="Status"
              value={formData.status}
              options={STATUS_OPTIONS}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* SECTION 2: Menu Variants */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Section 2: Menu Variants
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Manage different sizes and variations of this menu item with their specific ingredients.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <VariantsBuilder
              variants={formData.variants}
              onVariantsChange={handleVariantsChange}
            />
          </Grid>
        </Grid>

        <FormActions
          cancelTo="/menu"
          saveText="Save Changes"
          saveIcon={<LocalCafeRoundedIcon />}
        />
      </Paper>
    </Box>
  );
}