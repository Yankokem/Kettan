import { useState } from 'react';
import { Box } from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { InventoryTable } from './components/InventoryTable';
import { StockInModal } from './components/StockInModal';
import { StockOutModal } from './components/StockOutModal';
import { StatCard } from '../../components/UI/StatCard';
import {
  MOCK_INVENTORY_ITEMS,
  MOCK_UNITS,
  MOCK_BATCHES,
  MOCK_TRANSACTIONS,
} from './mockData';
import type { StockInItem, StockOutFormData } from './types';

export function InventoryPage() {
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);

  const handleStockInComplete = (items: StockInItem[]) => {
    console.log('Stock-In completed:', items);
    // TODO: API call to save stock-in
  };

  const handleStockOutConfirm = (data: StockOutFormData) => {
    console.log('Stock-Out confirmed:', data);
    // TODO: API call to save stock-out
  };

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
        onStockIn={() => setStockInOpen(true)}
        onStockOut={() => setStockOutOpen(true)}
      />

      {/* Stock-In Modal */}
      <StockInModal
        open={stockInOpen}
        onClose={() => setStockInOpen(false)}
        onComplete={handleStockInComplete}
        inventoryItems={MOCK_INVENTORY_ITEMS}
        units={MOCK_UNITS}
      />

      {/* Stock-Out Modal */}
      <StockOutModal
        open={stockOutOpen}
        onClose={() => setStockOutOpen(false)}
        onConfirm={handleStockOutConfirm}
        inventoryItems={MOCK_INVENTORY_ITEMS}
        batches={MOCK_BATCHES}
      />
    </Box>
  );
}