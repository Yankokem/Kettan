import { Box } from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { InventoryTable } from './components/InventoryTable';
import { StatCard } from '../../components/UI/StatCard';
import type { InventoryItem } from './types';

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', sku: 'BN-ESA-01', name: 'Espresso Blend A', category: 'beans', stockCount: 15, reorderPoint: 20, unit: 'kg', status: 'Low Stock', supplier: 'Origin Roasters', lastRestocked: '2026-03-28' },
  { id: '2', sku: 'SY-VAN-02', name: 'Vanilla Syrup (1L)', category: 'syrup', stockCount: 45, reorderPoint: 15, unit: 'L', status: 'In Stock', supplier: 'Monin Dist.', lastRestocked: '2026-03-15' },
  { id: '3', sku: 'PK-CP-12', name: 'Takeaway Cups (12oz)', category: 'packaging', stockCount: 800, reorderPoint: 1000, unit: 'pcs', status: 'Low Stock', supplier: 'PackTech Co.', lastRestocked: '2026-03-10' },
  { id: '4', sku: 'MK-OAT-01', name: 'Oat Milk (1L)', category: 'milk', stockCount: 60, reorderPoint: 30, unit: 'L', status: 'In Stock', supplier: 'Oatly Pacific', lastRestocked: '2026-04-01' },
  { id: '5', sku: 'EQ-FLT-2', name: 'Grouphead Filters', category: 'equipment', stockCount: 20, reorderPoint: 5, unit: 'units', status: 'In Stock', supplier: 'Origin Roasters', lastRestocked: '2025-12-10' }
];

export function InventoryPage() {
  return (
    <Box sx={{ pb: 3 }}>
      {/* KPI Stats */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, 
          gap: 3, 
          mb: 4 
        }}
      >
        <StatCard
          label="Total Active SKUs"
          value="1,204"
          trend="up"
          trendValue="1.2%"
          icon={<Inventory2RoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Low Stock Alerts"
          value="14"
          trend="down"
          trendValue="5.0%"
          icon={<WarningRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Pending Restocks"
          value="8"
          trend="up"
          trendValue="2.0%"
          icon={<LocalShippingRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Inventory Value"
          value="$45,210"
          trend="up"
          trendValue="0.8%"
          icon={<TrendingUpRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      {/* Roster Table */}
      <InventoryTable items={MOCK_INVENTORY} />
    </Box>
  );
}