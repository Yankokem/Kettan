import { Box } from '@mui/material';
import Inventory2RoundedIcon from '@/components/icons/lucide-mui/Inventory2RoundedIcon';
import WarningRoundedIcon from '@/components/icons/lucide-mui/WarningRoundedIcon';
import LocalShippingRoundedIcon from '@/components/icons/lucide-mui/LocalShippingRoundedIcon';
import TrendingUpRoundedIcon from '@/components/icons/lucide-mui/TrendingUpRoundedIcon';
import { InventoryTable } from './components/InventoryTable';
import { StatCard } from '../../components/UI/StatCard';
import {
  MOCK_INVENTORY_ITEMS,
  MOCK_TRANSACTIONS,
} from './mockData';

export function InventoryPage() {
  return (
    <Box sx={{ pb: 3 }}>
      {/* KPI Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4,
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

      {/* Inventory Table */}
      <InventoryTable
        items={MOCK_INVENTORY_ITEMS}
        transactions={MOCK_TRANSACTIONS}
      />
    </Box>
  );
}

