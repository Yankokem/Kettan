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
import type { MenuItem } from './types';
import { MenuItemCard } from './components/MenuItemCard';
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { fetchMenuItems, type MenuItemDto } from './menuItemsApi';

function toMenuCardItem(dto: MenuItemDto): MenuItem {
  const safePrice = Number(dto.basePrice);
  const status = dto.status === 'Active' || dto.status === 'Inactive' || dto.status === 'Out of Stock'
    ? dto.status
    : 'Inactive';

  return {
    id: String(dto.menuItemId),
    name: dto.name,
    category: dto.categoryName || 'Uncategorized',
    description: dto.description ?? undefined,
    sellingPrice: Number.isFinite(safePrice) ? safePrice : 0,
    status,
    image: dto.imageUrl ?? undefined,
    createdAt: dto.createdAt,
    variants: (dto.variants ?? []).map((variant) => ({
      id: String(variant.variantId),
      name: variant.name,
      price: Number(variant.price) || 0,
      ingredients: (variant.ingredients ?? []).map((ingredient) => ({
        id: String(ingredient.variantIngredientId),
        itemId: String(ingredient.itemId),
        itemName: ingredient.itemName,
        qtyPerUnit: Number(ingredient.quantity) || 0,
        uom: '',
      })),
    })),
  };
}

export function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchMenuItems()
      .then(setMenuItems)
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
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
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Items"
            value={menuItems.length.toString()}
            trend="up"
            trendValue="+1"
            icon={<LocalCafeRoundedIcon />}
            accentClass="stat-accent-brown"
            iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Active"
            value={activeCount.toString()}
            trend="up"
            trendValue="+2"
            icon={<CheckCircleRoundedIcon />}
            accentClass="stat-accent-sage"
            iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Inactive"
            value={inactiveCount.toString()}
            trend="down"
            trendValue="-1"
            icon={<CancelRoundedIcon />}
            accentClass="stat-accent-gold"
            iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Out of Stock"
            value={outOfStockCount.toString()}
            trend="up"
            trendValue="+3"
            icon={<ErrorOutlineRoundedIcon />}
            accentClass="stat-accent-error"
            iconBg="linear-gradient(135deg, #E65C5C 0%, #F58B8B 100%)"
          />
        </Grid>
      </Grid>

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
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Link to="/menu/categories" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" startIcon={<CategoryRoundedIcon />}>Categories</Button>
          </Link>
          <Link to="/menu/add" style={{ textDecoration: 'none' }}>
            <Button startIcon={<LocalCafeRoundedIcon />}>Add Menu Item</Button>
          </Link>
        </Box>
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
          {filteredItems.map(item => (
            <Grid key={item.menuItemId} size={{ xs: 60, sm: 20, md: 20, lg: 12 }}>
              <MenuItemCard item={toMenuCardItem(item)} />
            </Grid>
          ))}
        </Grid>
      </DataStateWrapper>
    </Box>
  );
}
