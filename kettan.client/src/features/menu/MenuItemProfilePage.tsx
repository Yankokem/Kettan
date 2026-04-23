import { Box, Typography, Paper, Divider, Avatar, IconButton, Chip } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { useParams } from '@tanstack/react-router';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { VariantsBuilder } from './components/VariantsBuilder';
import { PriceSuggestion } from './components/PriceSuggestion';
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { fetchMenuItem, updateMenuItem, type MenuItemDto, type CreateMenuItemDto } from './menuItemsApi';
import { listMenuCategories, type MenuCategory } from './menuCategoryApi';
import { fetchInventoryItems } from '../hq-inventory/hqInventoryApi';
import type { InventoryItemOption, MenuItemFormData, MenuVariant } from './types';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

export function MenuItemProfilePage() {
  const { menuItemId } = useParams({ strict: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [menuItem, setMenuItem] = useState<MenuItemDto | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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

  const fetchData = async () => {
    if (!menuItemId) return;
    setLoading(true);
    try {
      const [item, cats, invItems] = await Promise.all([
        fetchMenuItem(parseInt(menuItemId as string)),
        listMenuCategories(),
        fetchInventoryItems()
      ]);

      setMenuItem(item);
      setCategories(cats);
      
      const options: InventoryItemOption[] = invItems.map(inv => ({
        id: inv.id,
        name: inv.name,
        sku: inv.sku,
        uom: inv.unit?.symbol || '',
        category: inv.category?.name || 'Uncategorized',
        unitCost: inv.unitCost,
        stockCount: inv.totalStock
      }));
      setInventoryItems(options);

      // Map API DTO to Form State
      setFormData({
        name: item.name,
        category: String(item.categoryId || ''),
        description: item.description || '',
        sellingPrice: item.basePrice,
        status: item.status as 'Active' | 'Inactive',
        image: item.imageUrl || undefined,
        variants: item.variants.map(v => ({
          id: String(v.variantId),
          name: v.name,
          ingredients: v.ingredients.map(ing => ({
            id: String(ing.variantIngredientId),
            itemId: String(ing.itemId),
            itemName: ing.itemName,
            qtyPerUnit: ing.quantity,
            uom: '', // We could resolve this if needed
            unitCost: options.find(o => o.id === String(ing.itemId))?.unitCost || 0
          }))
        }))
      });
    } catch (err) {
      console.error('Failed to fetch menu item detail:', err);
      setError(err instanceof Error ? err : new Error('An error occurred while fetching data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [menuItemId]);

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

    setIsSubmitting(true);
    try {
      const payload: CreateMenuItemDto = {
        name: formData.name,
        categoryId: parseInt(formData.category),
        description: formData.description,
        imageUrl: formData.image,
        basePrice: formData.sellingPrice,
        status: formData.status,
        ingredients: [],
        variants: formData.variants.map((v, idx) => ({
          name: v.name,
          pricingMode: 'absolute',
          price: formData.sellingPrice,
          displayOrder: idx,
          isActive: true,
          ingredients: v.ingredients.map(ing => ({
            itemId: parseInt(ing.itemId),
            quantity: ing.qtyPerUnit
          }))
        })),
        tagIds: []
      };

      await updateMenuItem(parseInt(menuItemId as string), payload);
      alert('Menu item updated successfully!');
      setIsEditing(false);
      fetchData();
    } catch (err) {
      console.error('Failed to update menu item:', err);
      alert(err instanceof Error ? err.message : 'Failed to update menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (menuItem) {
      // Re-map from original item
      setFormData({
        name: menuItem.name,
        category: String(menuItem.categoryId || ''),
        description: menuItem.description || '',
        sellingPrice: menuItem.basePrice,
        status: menuItem.status as 'Active' | 'Inactive',
        image: menuItem.imageUrl || undefined,
        variants: menuItem.variants.map(v => ({
          id: String(v.variantId),
          name: v.name,
          ingredients: v.ingredients.map(ing => ({
            id: String(ing.variantIngredientId),
            itemId: String(ing.itemId),
            itemName: ing.itemName,
            qtyPerUnit: ing.quantity,
            uom: '',
            unitCost: inventoryItems.find(o => o.id === String(ing.itemId))?.unitCost || 0
          }))
        }))
      });
    }
    setIsEditing(false);
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      <DataStateWrapper
        loading={loading}
        error={error}
        isEmpty={!menuItem}
        emptyMessage="Menu item not found"
        onRetry={fetchData}
      >
        {menuItem && (
          <>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
              <BackButton to="/menu" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                  {menuItem.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                  <Chip
                    label={menuItem.categoryName}
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
                      bgcolor: menuItem.status === 'Active' ? 'rgba(84,107,63,0.12)' : 'rgba(148, 163, 184, 0.16)',
                      color: menuItem.status === 'Active' ? '#546B3F' : '#475569',
                      fontSize: 11,
                      height: 22,
                      fontWeight: 700,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12 }}>
                    • ₱{menuItem.basePrice.toFixed(2)}
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
                options={categories.map(c => ({ value: String(c.categoryId), label: c.name }))}
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
                inventoryOptions={inventoryItems}
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
              <Button variant="outlined" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                startIcon={<LocalCafeRoundedIcon />} 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
          </>
        )}
      </DataStateWrapper>
    </Box>
  );
}