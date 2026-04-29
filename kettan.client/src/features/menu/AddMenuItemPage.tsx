import { createMenuItem, type CreateMenuItemDto } from './menuItemsApi';
import { listMenuCategories, type MenuCategory } from './menuCategoryApi';
import { fetchInventoryItems } from '../hq-inventory/hqInventoryApi';
import type { InventoryItemOption, MenuItemFormData, MenuVariant } from './types';

import { Box, Typography, Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { useNavigate } from '@tanstack/react-router';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BackButton } from '../../components/UI/BackButton';
import { FormActions } from '../../components/Form/FormActions';
import { ProfileImageUploader } from '../../components/UI/ProfileImageUploader';
import { VariantsBuilder } from './components/VariantsBuilder';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

function getLowestVariantPrice(variants: MenuVariant[]): number {
  if (variants.length === 0) {
    return 0;
  }

  return Math.min(...variants.map((variant) => Number(variant.price) || 0));
}

export function AddMenuItemPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    category: '',
    description: '',
    sellingPrice: 0,
    status: 'Active',
    image: undefined,
    variants: [],
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cats, items] = await Promise.all([
          listMenuCategories(),
          fetchInventoryItems()
        ]);
        setCategories(cats);
        
        // Map InventoryItem to InventoryItemOption
        const options: InventoryItemOption[] = items.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          uom: item.unit || '',
          category: item.category?.name || 'Uncategorized',
          unitCost: item.unitCost,
          stockCount: item.totalStock,
          defaultThreshold: item.defaultThreshold,
        }));
        setInventoryItems(options);
      } catch (err) {
        console.error('Failed to load menu setup data:', err);
      }
    }
    loadInitialData();
  }, []);

  const handleVariantChange = (variants: MenuVariant[]) => {
    setFormData(prev => ({ ...prev, variants }));
  };

  const handleImageChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, imageFile: file }));
  };

  const handleSubmit = async () => {
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
    if (formData.variants.some((variant) => !Number.isFinite(variant.price) || variant.price <= 0)) {
      alert('Each variant must have a valid price');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedImageUrl = formData.image;

      if (formData.imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.imageFile);
        const uploadRes = await api.post('/api/uploads/image', uploadFormData, { headers: { 'Content-Type': 'multipart/form-data' } });

        if (uploadRes.status >= 200 && uploadRes.status < 300) {
          const uploadData = uploadRes.data;
          uploadedImageUrl = uploadData.Url ?? uploadData.url ?? null;
          console.log('[Upload] Menu item image URL:', uploadedImageUrl);
        } else {
          console.error('[Upload] Menu item image upload failed:', uploadRes.status);
        }
      }

      const basePrice = getLowestVariantPrice(formData.variants);

      const payload: CreateMenuItemDto = {
        name: formData.name,
        categoryId: parseInt(formData.category),
        description: formData.description,
        imageUrl: uploadedImageUrl,
        basePrice,
        status: formData.status,
        ingredients: [], // Primary recipe can be added here if needed
        variants: formData.variants.map((v, idx) => ({
          name: v.name,
          pricingMode: 'absolute',
          price: v.price,
          displayOrder: idx,
          isActive: true,
          ingredients: v.ingredients.map(ing => ({
            itemId: parseInt(ing.itemId),
            quantity: ing.qtyPerUnit
          }))
        })),
        tagIds: []
      };

      await createMenuItem(payload);
      alert('Menu item saved successfully!');
      navigate({ to: '/menu' });
    } catch (err) {
      console.error('Failed to save menu item:', err);
      alert(err instanceof Error ? err.message : 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/menu" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Add Menu Item
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Create a new menu item with variant-specific pricing and ingredient usage.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* LEFT SECTION: Image & Basic Info */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '38%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 4,
          }}
        >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Basic Information
            </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#6B4C2A', 
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
                
                <Box sx={{ maxWidth: 280 }}>
                  <ProfileImageUploader
                    imageFile={formData.imageFile ?? undefined}
                    imageUrl={formData.imagePreviewUrl}
                    onFileChange={handleImageChange}
                  />
                </Box>
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
                    ...categories.map(c => ({ value: String(c.categoryId), label: c.name })),
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
          </Paper>

          {/* RIGHT SECTION: Variants & Pricing */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              p: 4,
            }}
          >
            {/* Variants Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                  Variants & Ingredients
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, mb: 3 }}>
                  Add size or type variants with their own ingredient quantities and prices.
                </Typography>
                
                <VariantsBuilder
                  variants={formData.variants}
                  onVariantsChange={handleVariantChange}
                  inventoryOptions={inventoryItems}
                />
              </Box>

            <Box sx={{ pt: 3, mt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <FormActions 
                cancelTo="/menu" 
                saveText={isSubmitting ? 'Saving...' : 'Save Menu Item'} 
                saveIcon={<LocalCafeRoundedIcon />}
                onSave={handleSubmit}
                saveDisabled={isSubmitting}
              />
            </Box>
          </Paper>
        </Box>
    </Box>
  );
}