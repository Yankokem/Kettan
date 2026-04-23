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
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Items"
            value={menuItems.length.toString()}
            sub="Currently configured"
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
            sub="Available for order"
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
            sub="Disabled items"
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
            sub="Needs replenishment"
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
        emptyMessage={searchTerm ? 'No menu items match your search.' : 'No menu items found. Add your first item.'}
      >
        <Grid container spacing={3} columns={60}>
          {filteredItems.map(item => (
            <Grid key={item.menuItemId} size={{ xs: 60, sm: 30, md: 20, lg: 12 }}>
              <MenuItemCard item={item as unknown as MenuItem} />
            </Grid>
          ))}
        </Grid>
      </DataStateWrapper>
    </Box>
  );
}
