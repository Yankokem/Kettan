import { Box, Typography } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import { InventoryTable } from '../inventory/components/InventoryTable';
import type { InventoryItem } from '../inventory/types';
import { StatCard } from '../../components/UI/StatCard';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { BackButton } from '../../components/UI/BackButton';

// Mock Branch Stock
const MOCK_BRANCH_STOCK: Record<string, InventoryItem[]> = {
  '1': [
    { id: '1', sku: 'BN-ESA-01', name: 'Espresso Blend A', category: 'beans', stockCount: 5, reorderPoint: 10, unit: 'kg', status: 'Low Stock', supplier: 'HQ Transfer', lastRestocked: '2026-03-29' },
    { id: '2', sku: 'SY-VAN-02', name: 'Vanilla Syrup (1L)', category: 'syrup', stockCount: 15, reorderPoint: 5, unit: 'L', status: 'In Stock', supplier: 'HQ Transfer', lastRestocked: '2026-03-20' },
  ],
  '2': [
    { id: '1', sku: 'BN-ESA-01', name: 'Espresso Blend A', category: 'beans', stockCount: 12, reorderPoint: 8, unit: 'kg', status: 'In Stock', supplier: 'HQ Transfer', lastRestocked: '2026-03-30' },
    { id: '4', sku: 'MK-OAT-01', name: 'Oat Milk (1L)', category: 'milk', stockCount: 8, reorderPoint: 15, unit: 'L', status: 'Low Stock', supplier: 'HQ Transfer', lastRestocked: '2026-04-01' },
  ]
};

export function BranchInventoryDetailPage() {
  const { branchId } = useParams({ from: '/layout/branch-inventory/$branchId' });

  const items = MOCK_BRANCH_STOCK[branchId] || [];
  const lowStock = items.filter(i => i.stockCount <= i.reorderPoint).length;

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/branch-inventory" />
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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 3,
          mb: 4
        }}
      >
        <StatCard
          label="Total Branch SKUs"
          value={items.length.toString()}
          icon={<Inventory2RoundedIcon />}
          accentClass="stat-accent-primary"
          iconBg="rgba(201, 168, 77, 0.15)"
        />
        <StatCard
          label="Low Stock SKUs"
          value={lowStock.toString()}
          icon={<WarningRoundedIcon />}
          trend={lowStock > 0 ? "down" : null}
          trendValue={lowStock > 0 ? "Needs fulfillment" : undefined}
          accentClass={lowStock > 0 ? 'stat-accent-error' : 'stat-accent-success'}
          iconBg={lowStock > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'}
        />
      </Box>

      <InventoryTable 
        items={items} 
        hideAddButton={true} 
      />
    </Box>
  );
}