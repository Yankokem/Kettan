import { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { InventoryTable } from './components/InventoryTable';
import { StatCard } from '../../components/UI/StatCard';
import { IconButton, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Divider, Grid } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { useNavigate } from '@tanstack/react-router';
import type { InventoryItem, InventoryTransaction } from './types';
import {
  fetchInventoryItems,
  fetchGlobalTransactions,
} from './hqInventoryApi';
import { fetchInventoryStats, type InventoryStatsDto, type StatMetricDto } from '../reports/reportsApi';
import { useAuthStore } from '../../store/useAuthStore';

export function InventoryPage() {
  const { user } = useAuthStore();
  const isBranchUser = user?.branchId != null;
  const branchId = user?.branchId ?? undefined;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStatsDto | null>(null);
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

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [liveItems, globalTransactions, stats] = await Promise.all([
        fetchInventoryItems(undefined, isBranchUser && branchId ? { branchId } : undefined),
        fetchGlobalTransactions(isBranchUser && branchId ? { branchId } : undefined),
        fetchInventoryStats(isBranchUser && branchId ? branchId : undefined)
      ]);
      
      setItems(liveItems);
      setTransactions(globalTransactions);
      setInventoryStats(stats);
    } catch {
      setItems([]);
      setTransactions([]);
      setErrorMessage('Unable to load inventory data from the API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, [branchId, isBranchUser]);

  const handleRefresh = () => {
    void loadInventory();
  };

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
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Total Active SKUs"
              value={isLoading ? '...' : (inventoryStats?.totalActiveSkus.currentValue.toString() ?? stats.totalSkus.toString())}
              trend={inventoryStats?.totalActiveSkus.trend ?? 'up'}
              trendValue={`${inventoryStats?.totalActiveSkus.percentageChange ?? 0}% vs last week`}
              icon={<Inventory2RoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
              onClick={() => openDetail('Active SKUs', inventoryStats?.totalActiveSkus, <Inventory2RoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Low Stock Alerts"
              value={isLoading ? '...' : (inventoryStats?.lowStockAlerts.currentValue.toString() ?? stats.lowStockAlerts.toString())}
              trend={inventoryStats?.lowStockAlerts.trend ?? 'down'}
              trendValue={`${inventoryStats?.lowStockAlerts.percentageChange ?? 0}% vs last week`}
              icon={<WarningRoundedIcon />}
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
              onClick={() => openDetail('Low Stock Alerts', inventoryStats?.lowStockAlerts, <WarningRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Pending Restocks"
              value={isLoading ? '...' : (inventoryStats?.pendingRestocks.currentValue.toString() ?? stats.pendingRestocks.toString())}
              trend={inventoryStats?.pendingRestocks.trend ?? 'up'}
              trendValue={`${inventoryStats?.pendingRestocks.percentageChange ?? 0}% vs last week`}
              icon={<LocalShippingRoundedIcon />}
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
              onClick={() => openDetail('Pending Restocks', inventoryStats?.pendingRestocks, <LocalShippingRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Inventory Value"
              value={isLoading ? '...' : (inventoryStats ? `₱${inventoryStats.inventoryValue.currentValue.toLocaleString()}` : stats.inventoryValue)}
              trend={inventoryStats?.inventoryValue.trend ?? 'up'}
              trendValue={`${inventoryStats?.inventoryValue.percentageChange ?? 0}% vs last week`}
              icon={<TrendingUpRoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
              onClick={() => openDetail('Inventory Value', inventoryStats?.inventoryValue, <TrendingUpRoundedIcon />)}
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
                      if (item.id.startsWith('SKU-')) {
                        // Navigate to specific item?
                        const itemId = item.id.replace('SKU-', '');
                        navigate({ to: '/hq-inventory/$itemId', params: { itemId } });
                      } else if (item.id.startsWith('ORD-')) {
                        const orderId = item.id.replace('ORD-', '');
                        navigate({ to: '/orders/$orderId', params: { orderId } });
                      } else {
                         navigate({ to: '/hq-inventory' });
                      }
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
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
    </Box>
  );
}