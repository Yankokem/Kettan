import { Box, Typography, Grid } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import type { LegacyInventoryItem } from '../hq-inventory/types';
import { StatCard } from '../../components/UI/StatCard';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import { BackButton } from '../../components/UI/BackButton';
import { KettanTable, type KettanColumnDef } from '../../components/UI/KettanTable';
import { Chip } from '@mui/material';

// Mock Branch Stock (using legacy format for branch inventory)
const MOCK_BRANCH_STOCK: Record<string, LegacyInventoryItem[]> = {
  '1': [
    { id: '1', sku: 'BN-ESA-01', name: 'Espresso Blend A', category: 'beans', stockCount: 5, reorderPoint: 10, unit: 'kg', status: 'Low Stock', supplier: 'HQ Transfer', lastRestocked: '2026-03-29' },
    { id: '2', sku: 'SY-VAN-02', name: 'Vanilla Syrup (1L)', category: 'syrup', stockCount: 15, reorderPoint: 5, unit: 'L', status: 'In Stock', supplier: 'HQ Transfer', lastRestocked: '2026-03-20' },
  ],
  '2': [
    { id: '1', sku: 'BN-ESA-01', name: 'Espresso Blend A', category: 'beans', stockCount: 12, reorderPoint: 8, unit: 'kg', status: 'In Stock', supplier: 'HQ Transfer', lastRestocked: '2026-03-30' },
    { id: '4', sku: 'MK-OAT-01', name: 'Oat Milk (1L)', category: 'milk', stockCount: 8, reorderPoint: 15, unit: 'L', status: 'Low Stock', supplier: 'HQ Transfer', lastRestocked: '2026-04-01' },
  ]
};

const columns: KettanColumnDef<LegacyInventoryItem>[] = [
  {
    key: 'name',
    label: 'Item Name',
    render: (row) => (
      <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>{row.name}</Typography>
    ),
  },
  {
    key: 'sku',
    label: 'SKU',
    render: (row) => (
      <Typography sx={{ fontSize: 12.5, fontFamily: 'monospace', color: 'text.secondary' }}>{row.sku}</Typography>
    ),
  },
  {
    key: 'category',
    label: 'Category',
    render: (row) => (
      <Chip
        label={row.category}
        size="small"
        sx={{ height: 22, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', bgcolor: 'rgba(107,76,42,0.08)', color: '#6B4C2A' }}
      />
    ),
  },
  {
    key: 'stockCount',
    label: 'Stock',
    align: 'right',
    render: (row) => {
      const isLow = row.stockCount <= row.reorderPoint;
      return (
        <Typography sx={{ fontWeight: 700, color: isLow ? 'error.main' : 'text.primary', fontSize: 14 }}>
          {row.stockCount} {row.unit}
        </Typography>
      );
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <Chip
        label={row.status}
        size="small"
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 600,
          bgcolor: row.status === 'Low Stock' ? 'error.light' : 'success.light',
          color: row.status === 'Low Stock' ? 'error.dark' : 'success.dark',
        }}
      />
    ),
  },
];

export function BranchInventoryDetailPage() {
  const { branchId } = useParams({ from: '/layout/branch-inventory/$branchId' });

  const items = MOCK_BRANCH_STOCK[branchId] || [];
  const lowStock = items.filter(i => i.stockCount <= i.reorderPoint).length;

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/branches" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Branch Inventory
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Viewing stock levels for branch #{branchId}
          </Typography>
        </Box>
      </Box>

      {/* KPI Stats */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Branch SKUs"
              value={items.length.toString()}
              trend="up"
              trendValue="1.2%"
              icon={<Inventory2RoundedIcon />}
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Low Stock SKUs"
              value={lowStock.toString()}
              trend={lowStock > 0 ? "down" : "up"}
              trendValue={lowStock > 0 ? "5.0%" : "0.0%"}
              icon={<WarningRoundedIcon />}
              accentClass={lowStock > 0 ? 'stat-accent-error' : 'stat-accent-sage'}
              iconBg={lowStock > 0 ? 'linear-gradient(135deg, #E65C5C 0%, #F89696 100%)' : 'linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Healthy Stock SKUs"
              value={(items.length - lowStock).toString()}
              trend="up"
              trendValue="2.0%"
              icon={<CheckCircleOutlineRoundedIcon />}
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Items in Stock"
              value={items.reduce((acc, curr) => acc + curr.stockCount, 0).toString()}
              trend="up"
              trendValue="0.8%"
              icon={<LocalShippingRoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
        </Grid>
      </Box>

      <KettanTable
        columns={columns}
        data={items}
        keyExtractor={(row) => row.id}
        emptyMessage="No inventory items for this branch"
        defaultRowsPerPage={15}
      />
    </Box>
  );
}