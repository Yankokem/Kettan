import { Box, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { Link } from '@tanstack/react-router';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { IconButton, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Divider, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { useNavigate } from '@tanstack/react-router';
import type { MenuItem } from './types';
import { MenuItemCard } from './components/MenuItemCard';
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { fetchMenuItems, type MenuItemDto } from './menuItemsApi';
import { fetchMenuStats, type MenuStatsDto, type StatMetricDto } from '../reports/reportsApi';
import { fetchInventoryItems } from '../hq-inventory/hqInventoryApi';
import { useAuthStore } from '../../store/useAuthStore';
import { isHqRole } from '../../utils/roleHelpers';
import type { InventoryItem } from '../hq-inventory/types';

function toMenuCardItem(dto: MenuItemDto, inventory: InventoryItem[]): MenuItem & { isInsufficientStock: boolean } {
  const safePrice = Number(dto.basePrice);
  
  // Standardize status: If it's 'Active' in DB, we show 'Active'.
  const status = dto.status === 'Active' ? 'Active' : 'Inactive';

  // Support both variants and Variants (case-sensitivity safety)
  const rawVariants = (dto as any).variants || (dto as any).Variants || [];
  
  const variants = rawVariants.map((variant: any) => ({
    id: String(variant.variantId || variant.VariantId),
    name: variant.name || variant.Name,
    price: Number(variant.price || variant.Price) || 0,
    ingredients: (variant.ingredients || variant.Ingredients || []).map((ingredient: any) => ({
      id: String(ingredient.variantIngredientId || ingredient.VariantIngredientId),
      itemId: String(ingredient.itemId || ingredient.ItemId),
      itemName: ingredient.itemName || ingredient.ItemName,
      qtyPerUnit: Number(ingredient.quantity || ingredient.Quantity) || 0,
      uom: '',
    })),
  }));

  // Check stock availability
  let isInsufficientStock = false;
  
  // A menu item is insufficient if ANY of its variants' ingredients exceed branch stock
  for (const variant of variants) {
    for (const ingredient of variant.ingredients) {
      const invItem = inventory.find(i => String(i.id) === String(ingredient.itemId));
      const availableStock = invItem?.totalStock ?? 0;
      if (ingredient.qtyPerUnit > availableStock) {
        isInsufficientStock = true;
        break;
      }
    }
    if (isInsufficientStock) break;
  }

  // Also check base ingredients if any (though usually they are in variants)
  const rawIngredients = (dto as any).ingredients || (dto as any).Ingredients || [];
  if (!isInsufficientStock && rawIngredients.length > 0) {
    for (const ing of rawIngredients) {
      const invItem = inventory.find(i => String(i.id) === String(ing.itemId || ing.ItemId));
      const availableStock = invItem?.totalStock ?? 0;
      const qty = Number(ing.quantityPerUnit || ing.QuantityPerUnit || 0);
      if (qty > availableStock) {
        isInsufficientStock = true;
        break;
      }
    }
  }

  return {
    id: String(dto.menuItemId),
    name: dto.name,
    category: dto.categoryName || 'Uncategorized',
    description: dto.description ?? undefined,
    sellingPrice: Number.isFinite(safePrice) ? safePrice : 0,
    status,
    image: dto.imageUrl ?? undefined,
    createdAt: dto.createdAt,
    variants,
    isInsufficientStock
  };
}

export function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuStats, setMenuStats] = useState<MenuStatsDto | null>(null);
  const { user } = useAuthStore();
  const showAdminActions = user?.role ? isHqRole(user.role) : false;
  const navigate = useNavigate();

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title: string;
    icon: React.ReactNode;
    data: StatMetricDto | null;
  }>({ open: false, title: '', icon: null, data: null });

  const openDetail = (title: string, data: StatMetricDto | null | undefined, icon: React.ReactNode) => {
    if (!data) return;
    setDetailModal({ open: true, title, icon, data });
  };

  const closeDetail = () => setDetailModal(prev => ({ ...prev, open: false }));

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [menuRows, invRows, stats] = await Promise.all([
          fetchMenuItems(),
          fetchInventoryItems(undefined, { hqOnly: false }),
          fetchMenuStats()
        ]);
        setMenuItems(menuRows);
        setInventory(invRows);
        setMenuStats(stats);
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const activeCount = menuItems.filter(item => item.status === 'Active').length;
  const inactiveCount = menuItems.filter(item => item.status === 'Inactive').length;
  const outOfStockCount = menuItems.filter(item => item.status === 'Out of Stock').length;

  return (
    <Box sx={{ pb: 3 }}>
      {/* Stat Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Items"
              value={menuStats?.totalItems.currentValue.toString() ?? menuItems.length.toString()}
              trend={menuStats?.totalItems.trend ?? 'up'}
              trendValue={`${menuStats?.totalItems.percentageChange ?? 0}% vs last week`}
              icon={<LocalCafeRoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
              onClick={() => openDetail('Total Menu Items', menuStats?.totalItems, <LocalCafeRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Active"
              value={menuStats?.activeItems.currentValue.toString() ?? activeCount.toString()}
              trend={menuStats?.activeItems.trend ?? 'up'}
              trendValue={`${menuStats?.activeItems.percentageChange ?? 0}% vs last week`}
              icon={<CheckCircleRoundedIcon />}
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
              onClick={() => openDetail('Active Items', menuStats?.activeItems, <CheckCircleRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Inactive"
              value={menuStats?.inactiveItems.currentValue.toString() ?? inactiveCount.toString()}
              trend={menuStats?.inactiveItems.trend ?? 'down'}
              trendValue={`${menuStats?.inactiveItems.percentageChange ?? 0}% vs last week`}
              icon={<CancelRoundedIcon />}
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
              onClick={() => openDetail('Inactive Items', menuStats?.inactiveItems, <CancelRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Out of Stock"
              value={menuStats?.outOfStockItems.currentValue.toString() ?? outOfStockCount.toString()}
              trend={menuStats?.outOfStockItems.trend ?? 'up'}
              trendValue={`${menuStats?.outOfStockItems.percentageChange ?? 0}% vs last week`}
              icon={<ErrorOutlineRoundedIcon />}
              accentClass="stat-accent-error"
              iconBg="linear-gradient(135deg, #E65C5C 0%, #F58B8B 100%)"
              onClick={() => openDetail('Out of Stock Menu', menuStats?.outOfStockItems, <ErrorOutlineRoundedIcon />)}
            />
          </Grid>
        </Grid>
      </Box>

      {/* ── Detail Modal ── */}
      <Dialog 
        open={detailModal.open} 
        onClose={closeDetail}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: '#FCF9F6',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ 
          m: 0, p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(107, 76, 42, 0.08)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              color: '#6B4C2A', 
              opacity: 0.8,
              '& svg': { fontSize: 20 }
            }}>
              {detailModal.icon}
            </Box>
            <Typography sx={{ fontWeight: 800, color: '#6B4C2A', fontSize: '0.95rem' }}>
              {detailModal.title} Breakdown
            </Typography>
          </Box>
          <IconButton onClick={closeDetail} sx={{ color: '#6B4C2A' }}>
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List sx={{ py: 0 }}>
            {!detailModal.data || detailModal.data.items.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No records to display for this metric.
                </Typography>
              </Box>
            ) : (
              detailModal.data.items.map((item, idx) => (
                <Box key={item.id}>
                  <ListItem 
                    sx={{ 
                      py: 1.2, px: 3, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(107, 76, 42, 0.04)' }
                    }}
                    onClick={() => {
                      closeDetail();
                      const menuItemId = item.id.replace('MNU-', '');
                      navigate({ to: '/menu/$menuItemId', params: { menuItemId } });
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 700, color: '#6B4C2A', fontSize: '0.82rem' }}>
                          {item.id} — {item.title}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {item.subtitle} {item.date && `• ${new Date(item.date).toLocaleDateString()}`}
                        </Typography>
                      }
                    />
                    <ArrowForwardIosRoundedIcon sx={{ fontSize: 12, color: 'rgba(107, 76, 42, 0.3)' }} />
                  </ListItem>
                  {idx < (detailModal.data?.items.length ?? 0) - 1 && <Divider sx={{ opacity: 0.5 }} />}
                </Box>
              ))
            )}
          </List>
        </DialogContent>
      </Dialog>

      {/* Filter and Grid */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ width: 320 }}>
          <SearchInput
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
        <FilterDropdown
          value=""
          onChange={() => {}}
          options={[ { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' } ]}
          label="Filter "
          icon={<TuneRoundedIcon fontSize="small" />}
        />
        <FilterDropdown
          value=""
          onChange={() => {}}
          options={[ { value: 'asc', label: 'A-Z' } ]}
          label="Sort "
          icon={<SortRoundedIcon fontSize="small" />}
        />
        {showAdminActions && (
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Link to="/menu/categories" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" startIcon={<CategoryRoundedIcon />}>Categories</Button>
            </Link>
            <Link to="/menu/add" style={{ textDecoration: 'none' }}>
              <Button startIcon={<LocalCafeRoundedIcon />}>Add Menu Item</Button>
            </Link>
          </Box>
        )}
      </Box>

      <DataStateWrapper
        loading={loading}
        error={error}
        isEmpty={filteredItems.length === 0}
        emptyTitle={searchTerm ? 'No results found' : 'Your menu is empty'}
        emptyMessage={searchTerm ? 'We couldn\'t find any menu items matching your search.' : 'Start building your coffee and food selection to get things brewing.'}
        emptyIcon={<LocalCafeRoundedIcon />}
      >
        <Grid container spacing={3} columns={60}>
          {filteredItems.map(item => {
            const cardItem = toMenuCardItem(item, inventory);
            return (
              <Grid key={item.menuItemId} size={{ xs: 60, sm: 20, md: 20, lg: 12 }}>
                <MenuItemCard 
                  item={cardItem} 
                  isInsufficientStock={cardItem.isInsufficientStock}
                />
              </Grid>
            );
          })}
        </Grid>
      </DataStateWrapper>
    </Box>
  );
}
