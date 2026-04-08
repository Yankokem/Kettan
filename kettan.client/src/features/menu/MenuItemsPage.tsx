import { Box, Typography, Grid } from '@mui/material';
import { useState } from 'react';
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

const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Iced Americano',
    category: 'Coffee',
    sellingPrice: 120.00,
    status: 'Active',
    variants: [
      { id: 'v1-1', name: '12oz', ingredients: [{ id: 'i1', itemId: '1', itemName: 'Arabica Coffee Beans', qtyPerUnit: 0.018, uom: 'kg' }] },
      { id: 'v1-2', name: '16oz', ingredients: [{ id: 'i1', itemId: '1', itemName: 'Arabica Coffee Beans', qtyPerUnit: 0.020, uom: 'kg' }] },
      { id: 'v1-3', name: '22oz', ingredients: [{ id: 'i1', itemId: '1', itemName: 'Arabica Coffee Beans', qtyPerUnit: 0.024, uom: 'kg' }] },
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
      { id: 'v2-1', name: 'Hot', ingredients: [{ id: 'i3', itemId: '2', itemName: 'Espresso Blend', qtyPerUnit: 0.02, uom: 'kg' }] },
      { id: 'v2-2', name: 'Iced', ingredients: [{ id: 'i3', itemId: '2', itemName: 'Espresso Blend', qtyPerUnit: 0.02, uom: 'kg' }] },
    ],
    createdAt: '2026-03-14',
  },
  {
    id: '3',
    name: 'Caramel Frappe',
    category: 'Frappe',
    sellingPrice: 180.00,
    status: 'Active',
    variants: [
      { id: 'v3-1', name: 'Medium', ingredients: [] },
      { id: 'v3-2', name: 'Large', ingredients: [] },
    ],
    createdAt: '2026-03-13',
  },
  {
    id: '4',
    name: 'Matcha Green Tea',
    category: 'Tea',
    sellingPrice: 140.00,
    status: 'Active',
    variants: [
      { id: 'v4-1', name: 'Hot', ingredients: [] },
      { id: 'v4-2', name: 'Iced', ingredients: [] },
    ],
    createdAt: '2026-03-12'
  },
  {
    id: '5',
    name: 'Strawberry Croissant',
    category: 'Pastry',
    sellingPrice: 95.00,
    status: 'Out of Stock',
    variants: [],
    createdAt: '2026-03-11'
  },
  {
    id: '6',
    name: 'Cafe Mocha',
    category: 'Coffee with Milk',
    sellingPrice: 145.00,
    status: 'Active',
    variants: [
      { id: 'v6-1', name: 'Hot', ingredients: [] },
      { id: 'v6-2', name: 'Iced', ingredients: [] },
    ],
    createdAt: '2026-03-10'
  },
  {
    id: '7',
    name: 'Cold Brew',
    category: 'Coffee',
    sellingPrice: 130.00,
    status: 'Active',
    variants: [
      { id: 'v7-1', name: '16oz', ingredients: [] },
      { id: 'v7-2', name: '22oz', ingredients: [] },
    ],
    createdAt: '2026-03-09'
  },
  {
    id: '8',
    name: 'Blueberry Cheesecake',
    category: 'Pastry',
    sellingPrice: 160.00,
    status: 'Active',
    variants: [
      { id: 'v8-1', name: 'Slice', ingredients: [] },
      { id: 'v8-2', name: 'Whole', ingredients: [] },
    ],
    createdAt: '2026-03-08'
  },
  {
    id: '9',
    name: 'Mango Smoothie',
    category: 'Smoothie',
    sellingPrice: 170.00,
    status: 'Inactive',
    variants: [
      { id: 'v9-1', name: '16oz', ingredients: [] },
      { id: 'v9-2', name: '22oz', ingredients: [] },
    ],
    createdAt: '2026-03-07'
  },
  {
    id: '10',
    name: 'Avocado Graham',
    category: 'Smoothie',
    sellingPrice: 185.00,
    status: 'Active',
    variants: [
      { id: 'v10-1', name: '16oz', ingredients: [] },
      { id: 'v10-2', name: '22oz', ingredients: [] },
    ],
    createdAt: '2026-03-06'
  },
  {
    id: '11',
    name: 'Espresso Shot',
    category: 'Coffee',
    sellingPrice: 90.00,
    status: 'Active',
    variants: [
      { id: 'v11-1', name: 'Single', ingredients: [] },
      { id: 'v11-2', name: 'Double', ingredients: [] },
    ],
    createdAt: '2026-03-05'
  },
  {
    id: '12',
    name: 'Grilled Cheese Sandwich',
    category: 'Food',
    sellingPrice: 150.00,
    status: 'Active',
    variants: [
      { id: 'v12-1', name: 'Solo', ingredients: [] },
      { id: 'v12-2', name: 'Combo', ingredients: [] },
    ],
    createdAt: '2026-03-04'
  },
  {
    id: '13',
    name: 'Earl Grey Tea',
    category: 'Tea',
    sellingPrice: 110.00,
    status: 'Out of Stock',
    variants: [
      { id: 'v13-1', name: 'Hot', ingredients: [] },
      { id: 'v13-2', name: 'Iced', ingredients: [] },
    ],
    createdAt: '2026-03-03'
  },
  {
    id: '14',
    name: 'Iced Macchiato',
    category: 'Coffee',
    sellingPrice: 160.00,
    status: 'Active',
    variants: [
      { id: 'v14-1', name: '16oz', ingredients: [] },
      { id: 'v14-2', name: '22oz', ingredients: [] },
    ],
    createdAt: '2026-03-02'
  },
  {
    id: '15',
    name: 'Seasonal Fruit Tart',
    category: 'Pastry',
    sellingPrice: 125.00,
    status: 'Inactive',
    variants: [],
    createdAt: '2026-03-01'
  }
];

export function MenuItemsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = MOCK_MENU_ITEMS.filter(item => {
    const matchSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const activeCount = MOCK_MENU_ITEMS.filter(item => item.status === 'Active').length;
  const inactiveCount = MOCK_MENU_ITEMS.filter(item => item.status === 'Inactive').length;
  const outOfStockCount = MOCK_MENU_ITEMS.filter(item => item.status === 'Out of Stock').length;

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Items"
            value={MOCK_MENU_ITEMS.length.toString()}
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
          <Button variant="outlined" startIcon={<CategoryRoundedIcon />}>Categories</Button>
          <Link to="/menu/add" style={{ textDecoration: 'none' }}>
            <Button startIcon={<LocalCafeRoundedIcon />}>Add Menu Item</Button>
          </Link>
        </Box>
      </Box>

      {filteredItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">No menu items found.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3} columns={60}>
          {filteredItems.map(item => (
            <Grid key={item.id} size={{ xs: 60, sm: 30, md: 20, lg: 12 }}>
              <MenuItemCard item={item} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
