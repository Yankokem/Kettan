import { Box, Chip, CircularProgress, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { VariantsBuilder } from './components/VariantsBuilder';
import { ProfileImageUploader } from '../../components/UI/ProfileImageUploader';
import { fetchMenuItem, updateMenuItem, type MenuItemDto, type CreateMenuItemDto } from './menuItemsApi';
import { listMenuCategories, type MenuCategory } from './menuCategoryApi';
import { fetchInventoryItems } from '../hq-inventory/hqInventoryApi';
import type { InventoryItemOption, MenuItemFormData, MenuVariant } from './types';

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

function toProfileFormData(item: MenuItemDto, options: InventoryItemOption[] = []): MenuItemFormData {
  const normalizedStatus: 'Active' | 'Inactive' = item.status === 'Active' ? 'Active' : 'Inactive';
  const mappedVariants: MenuVariant[] = item.variants.map((variant) => {
    const pricedIngredients = variant.ingredients.map((ingredient) => {
      const inventoryOption = options.find((option) => option.id === String(ingredient.itemId));

      return {
        id: String(ingredient.variantIngredientId),
        itemId: String(ingredient.itemId),
        itemName: ingredient.itemName,
        qtyPerUnit: ingredient.quantity,
        uom: inventoryOption?.uom || '',
        unitCost: inventoryOption?.unitCost || 0,
      };
    });

    return {
      id: String(variant.variantId),
      name: variant.name,
      price: Number(variant.price) || 0,
      ingredients: pricedIngredients,
    };
  });

  return {
    name: item.name,
    category: String(item.categoryId || ''),
    description: item.description || '',
    sellingPrice: getLowestVariantPrice(mappedVariants) || Number(item.basePrice) || 0,
    status: normalizedStatus,
    image: item.imageUrl || undefined,
    variants: mappedVariants,
  };
}

export function MenuItemProfilePage() {
  const { menuItemId } = useParams({ strict: false });

  const [menuItem, setMenuItem] = useState<MenuItemDto | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
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
    if (!menuItemId) {
      setError(new Error('Menu item ID is missing.'));
      setIsDataReady(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsDataReady(false);
      setError(null);

      const parsedId = parseInt(menuItemId as string);
      const [item, cats, invItems] = await Promise.all([
        fetchMenuItem(parsedId),
        listMenuCategories(),
        fetchInventoryItems(),
      ]);

      const options: InventoryItemOption[] = invItems.map((inv) => ({
        id: inv.id,
        name: inv.name,
        sku: inv.sku,
        uom: inv.unit || '',
        category: inv.category?.name || 'Uncategorized',
        unitCost: inv.unitCost,
        stockCount: inv.totalStock,
        defaultThreshold: inv.defaultThreshold,
      }));

      setMenuItem(item);
      setCategories(cats);
      setInventoryItems(options);
      setFormData(toProfileFormData(item, options));
      setIsDataReady(true);
    } catch (err) {
      console.error('Failed to fetch menu item detail:', err);
      setError(err instanceof Error ? err : new Error('An error occurred while fetching data'));
      setIsDataReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [menuItemId]);

  const handleVariantsChange = (variants: MenuVariant[]) => {
    setFormData((prev) => ({ ...prev, variants }));
  };

  const handleImageChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, imageFile: file }));
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
        const uploadRes = await fetch('/api/uploads/image', {
          method: 'POST',
          credentials: 'include',
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedImageUrl = uploadData.Url ?? uploadData.url ?? null;
          console.log('[Upload] Menu item image updated URL:', uploadedImageUrl);
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
        ingredients: [],
        variants: formData.variants.map((variant, idx) => ({
          name: variant.name,
          pricingMode: 'absolute',
          price: variant.price,
          displayOrder: idx,
          isActive: true,
          ingredients: variant.ingredients.map((ingredient) => ({
            itemId: parseInt(ingredient.itemId),
            quantity: ingredient.qtyPerUnit,
          })),
        })),
        tagIds: [],
      };

      await updateMenuItem(parseInt(menuItemId as string), payload);
      alert('Menu item updated successfully!');
      setIsEditing(false);
      void fetchData();
    } catch (err) {
      console.error('Failed to update menu item:', err);
      alert(err instanceof Error ? err.message : 'Failed to update menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (menuItem) {
      setFormData(toProfileFormData(menuItem, inventoryItems));
    }
    setIsEditing(false);
  };

  const displayCategoryName = categories.find((category) => String(category.categoryId) === formData.category)?.name
    ?? menuItem?.categoryName
    ?? 'Uncategorized';
  const displayStatus = formData.status || 'Inactive';
  const displayBasePrice = getLowestVariantPrice(formData.variants) || Number(menuItem?.basePrice || 0);
  const displayTitle = formData.name || menuItem?.name || 'Unnamed menu item';
  
  const totalIngredients = formData.variants.reduce((sum, variant) => sum + variant.ingredients.length, 0);
  const priceRange = formData.variants.length > 1 
    ? `₱${Math.min(...formData.variants.map(v => v.price)).toFixed(2)} - ₱${Math.max(...formData.variants.map(v => v.price)).toFixed(2)}`
    : null;

  const header = (
    <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
      <BackButton to="/menu" />
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
          {displayTitle}
        </Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
          Review menu item details, variant pricing, and ingredient stock levels.
        </Typography>
      </Box>
      {!isEditing && !isLoading && isDataReady && menuItem && (
        <Button variant="contained" startIcon={<EditRoundedIcon />} onClick={() => setIsEditing(true)}>
          Edit Menu Item
        </Button>
      )}
    </Box>
  );

  if (isLoading) {
    return (
      <Box sx={{ pb: 3 }}>
        {header}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, minHeight: 300, display: 'grid', placeItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={32} thickness={4} sx={{ color: '#6B4C2A' }} />
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              Loading menu item profile...
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (error || !isDataReady || !menuItem) {
    return (
      <Box sx={{ pb: 3 }}>
        {header}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography sx={{ color: 'error.main', fontSize: 13 }}>
              {error?.message || 'Menu item data is unavailable.'}
            </Typography>
            <Button variant="outlined" onClick={() => { void fetchData(); }}>
              Retry
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {header}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left card — Item Details */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '38%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 3.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <Box sx={{ mb: 3.2 }}>
            <Box sx={{ width: '100%', maxWidth: 280 }}>
              {isEditing ? (
                <ProfileImageUploader
                  imageFile={formData.imageFile ?? undefined}
                  imageUrl={formData.imagePreviewUrl || formData.image}
                  onFileChange={handleImageChange}
                  shape="square"
                />
              ) : (
                <Box
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    bgcolor: 'background.default',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(165deg, rgba(46,31,20,0.22) 0%, rgba(58,39,24,0.15) 100%)'
                        : 'linear-gradient(165deg, rgba(250,245,239,1) 0%, rgba(240,230,211,0.95) 100%)',
                  }}
                >
                  {formData.image ? (
                    <Box
                      component="img"
                      src={formData.image}
                      alt={formData.name || 'Menu item image'}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                      <ImageRoundedIcon sx={{ fontSize: 32, mb: 0.6, opacity: 0.8 }} />
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>No image uploaded</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {isEditing ? (
            <>
              <Box sx={{ mb: 2.5 }}>
                <FormTextField
                  label="Menu Item Name"
                  placeholder="e.g. Iced Americano"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  fullWidth
                />
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <FormDropdown
                  label="Category"
                  value={formData.category}
                  options={categories.map((category) => ({ value: String(category.categoryId), label: category.name }))}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as string }))}
                  fullWidth
                />
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <FormTextField
                  label="Description (Optional)"
                  placeholder="Describe your menu item..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>

              <Box sx={{ mb: 0.5 }}>
                <FormDropdown
                  label="Status"
                  value={formData.status}
                  options={STATUS_OPTIONS}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
                  fullWidth
                />
              </Box>
            </>
          ) : (
            <>
              {/* Item Name */}
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', mb: 1.5, lineHeight: 1.3 }}>
                {displayTitle}
              </Typography>

              {/* Category */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
                <CategoryRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#6B4C2A' }}>
                  {displayCategoryName}
                </Typography>
              </Box>

              {/* Status Chip */}
              <Box sx={{ mb: 2.5 }}>
                <Chip
                  label={displayStatus}
                  size="small"
                  sx={{
                    bgcolor: displayStatus === 'Active' ? 'success.main' : 'action.disabledBackground',
                    color: displayStatus === 'Active' ? 'success.contrastText' : 'text.secondary',
                    fontWeight: 600,
                    fontSize: 12,
                    height: 24,
                  }}
                />
              </Box>

              {/* Description */}
              {formData.description?.trim() && (
                <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                    {formData.description}
                  </Typography>
                </Box>
              )}

              {/* Price */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', mb: 0.5 }}>
                  Starts At
                </Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                  ₱{displayBasePrice.toFixed(2)}
                </Typography>
              </Box>

              {/* Summary Box */}
              <Box
                sx={{
                  mt: 'auto',
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: 'text.primary', mb: 1.75 }}>
                  Item Summary
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 1.25, columnGap: 1.5 }}>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Total Variants</Typography>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right' }}>{formData.variants.length}</Typography>

                  {priceRange && (
                    <>
                      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Price Range</Typography>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right' }}>{priceRange}</Typography>
                    </>
                  )}

                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Total Ingredients</Typography>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right' }}>{totalIngredients}</Typography>
                </Box>
              </Box>
            </>
          )}
        </Paper>

        {/* Right card — Variants */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '2px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 3.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <VariantsBuilder
            variants={formData.variants}
            onVariantsChange={handleVariantsChange}
            inventoryOptions={inventoryItems}
            readOnly={!isEditing}
          />

          {isEditing && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
              <Button variant="outlined" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button startIcon={<LocalCafeRoundedIcon />} onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
