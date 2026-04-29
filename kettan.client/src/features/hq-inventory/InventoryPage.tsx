import { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { InventoryTable } from './components/InventoryTable';
import { StatCard } from '../../components/UI/StatCard';
import type { InventoryItem, InventoryTransaction } from './types';
import {
  fetchInventoryItems,
  fetchInventoryItemTransactions,
} from './hqInventoryApi';
import { useAuthStore } from '../../store/useAuthStore';

export function InventoryPage() {
  const { user } = useAuthStore();
  const isBranchUser = user?.branchId != null;
  const branchId = user?.branchId ?? undefined;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const liveItems = await fetchInventoryItems(
          undefined,
          isBranchUser && branchId ? { branchId } : undefined
        );
        if (!isMounted) {
          return;
        }

        setItems(liveItems);

        const transactionsByItem = await Promise.all(
          liveItems.map(async (item) => {
            try {
              return await fetchInventoryItemTransactions(item.id, { item });
            } catch {
              return [];
            }
          })
        );

        if (!isMounted) {
          return;
        }

        const mergedTransactions = transactionsByItem
          .flat()
          .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
          .slice(0, 300);

        setTransactions(mergedTransactions);
      } catch {
        if (!isMounted) {
          return;
        }

        setItems([]);
        setTransactions([]);
        setErrorMessage('Unable to load inventory data from the API.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, [branchId, isBranchUser]);

  const stats = useMemo(() => {
    const totalSkus = items.length;
    const lowStockAlerts = items.filter((item) => item.totalStock <= item.defaultThreshold).length;
    const pendingRestocks = lowStockAlerts;
    const totalInventoryValue = items.reduce((sum, item) => sum + item.totalStock * item.unitCost, 0);

    return {
      totalSkus,
      lowStockAlerts,
      pendingRestocks,
      inventoryValue: new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
      }).format(totalInventoryValue),
    };
  }, [items]);

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
          value={isLoading ? '...' : stats.totalSkus}
          trend="up"
          trendValue="Live"
          icon={<Inventory2RoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Low Stock Alerts"
          value={isLoading ? '...' : stats.lowStockAlerts}
          trend="down"
          trendValue="Live"
          icon={<WarningRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Pending Restocks"
          value={isLoading ? '...' : stats.pendingRestocks}
          trend="up"
          trendValue="Live"
          icon={<LocalShippingRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Inventory Value"
          value={isLoading ? '...' : stats.inventoryValue}
          trend="up"
          trendValue="Live"
          icon={<TrendingUpRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      {errorMessage && (
        <Typography sx={{ fontSize: 13, color: 'error.main', mb: 2 }}>
          {errorMessage}
        </Typography>
      )}

      {/* Inventory Table */}
      <InventoryTable
        items={items}
        transactions={transactions}
        isBranchView={isBranchUser}
      />
    </Box>
  );
}