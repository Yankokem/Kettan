import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Box, Tabs, Tab, Grid, Skeleton, Card } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { Button } from '../../components/UI/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { isBranchRole } from '../../utils/roleHelpers';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { IconButton, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Divider, Typography } from '@mui/material';

// ── Components ───────────────────────────────────────────────────────────────
import { HqOverviewTab } from './components/HqOverviewTab';
import { HqInventoryReportsTab } from './components/HqInventoryReportsTab';
import { BranchPerformanceTab } from './components/BranchPerformanceTab';
import { InventoryAnalyticsTab } from './components/InventoryAnalyticsTab';
import { ExportModal } from './components/ExportModal';

import { 
  fetchBranchOverview, 
  fetchHqOverview,
  type BranchOverviewDto, 
  type HqOverviewDto,
  fetchFinanceStats,
  type FinanceStatsDto,
  type StatMetricDto
} from './reportsApi';
import { StatCard } from '../../components/UI/StatCard';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

// ── Shared tab styles ─────────────────────────────────────────────────────────

const TAB_SX = {
  minHeight: 48,
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: 13.5,
    minHeight: 48,
    color: 'text.secondary',
    '&.Mui-selected': { color: 'text.primary' },
  },
  '& .MuiTabs-indicator': { backgroundColor: '#C9A84C' },
};

// ── Default date range: last 30 days ─────────────────────────────────────────

function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── HQ View ───────────────────────────────────────────────────────────────────

type HqTab = 'overview' | 'inventory';

function HqReportsView({
  startDate, endDate, onExportClick,
}: {
  startDate: string; endDate: string;
  onExportClick: () => void;
}) {
  const [tab, setTab] = useState<HqTab>('overview');
  const [overview, setOverview] = useState<HqOverviewDto | null>(null);
  const [financeStats, setFinanceStats] = useState<FinanceStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title: string;
    icon: ReactNode;
    data: StatMetricDto | null;
  }>({ open: false, title: '', icon: null, data: null });

  const openDetail = (title: string, data: StatMetricDto | null | undefined, icon: ReactNode) => {
    if (!data) return;
    setDetailModal({ open: true, title, icon, data });
  };

  const closeDetail = () => setDetailModal(prev => ({ ...prev, open: false }));

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ov, fin] = await Promise.all([
          fetchHqOverview(startDate, endDate),
          fetchFinanceStats()
        ]);
        setOverview(ov);
        setFinanceStats(fin);
      } catch (err) {
        console.error('Failed to load HQ reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [startDate, endDate]);

  const getCards = () => {
    const ov = overview;
    if (!ov) return [];

    switch (tab) {
      case 'overview':
        return [
          { 
            label: 'Total Fulfillment Cost', 
            value: toPeso(financeStats?.totalFulfillmentCost.currentValue ?? ov.totalFulfillmentCost), 
            trend: financeStats?.totalFulfillmentCost.trend ?? 'neutral',
            sub: `${financeStats?.totalFulfillmentCost.percentageChange ?? 0}% vs last week`,
            icon: <MonetizationOnRoundedIcon />, 
            accent: 'stat-accent-brown',
            onClick: () => openDetail('Total Fulfillment Cost', financeStats?.totalFulfillmentCost, <MonetizationOnRoundedIcon />)
          },
          { 
            label: 'Chain Inventory Value', 
            value: toPeso(financeStats?.chainInventoryValue.currentValue ?? ov.totalChainInventoryValue), 
            trend: financeStats?.chainInventoryValue.trend ?? 'neutral',
            sub: `${financeStats?.chainInventoryValue.percentageChange ?? 0}% vs last week`,
            icon: <InventoryRoundedIcon />, 
            accent: 'stat-accent-gold',
            onClick: () => openDetail('Chain Inventory Value', financeStats?.chainInventoryValue, <InventoryRoundedIcon />)
          },
          { 
            label: 'Total Wastage Loss', 
            value: toPeso(financeStats?.totalWastageLoss.currentValue ?? ov.totalWastageLoss), 
            trend: financeStats?.totalWastageLoss.trend ?? 'neutral',
            sub: `${financeStats?.totalWastageLoss.percentageChange ?? 0}% vs last week`,
            icon: <DeleteSweepRoundedIcon />, 
            accent: 'stat-accent-sage',
            onClick: () => openDetail('Total Wastage Loss', financeStats?.totalWastageLoss, <DeleteSweepRoundedIcon />)
          },
          { 
            label: 'Returns Credit Loss', 
            value: toPeso(financeStats?.returnsCreditLoss.currentValue ?? ov.totalReturnLoss), 
            trend: financeStats?.returnsCreditLoss.trend ?? 'neutral',
            sub: `${financeStats?.returnsCreditLoss.percentageChange ?? 0}% vs last week`,
            icon: <TrendingUpRoundedIcon />, 
            accent: 'stat-accent-rust',
            onClick: () => openDetail('Returns Credit Loss', financeStats?.returnsCreditLoss, <TrendingUpRoundedIcon />)
          },
        ];
      case 'inventory':
        return [
          { label: 'Chain Inventory Value', value: toPeso(ov.totalChainInventoryValue), trend: 'neutral', sub: 'Total asset valuation', icon: <InventoryRoundedIcon />, accent: 'stat-accent-gold' },
          { label: 'Fulfillment Rate', value: `${ov.fulfillmentRate.toFixed(1)}%`, trend: 'neutral', sub: 'Order success percentage', icon: <TrendingUpRoundedIcon />, accent: 'stat-accent-sage' },
          { label: 'Total Orders', value: ov.totalOrders.toLocaleString(), trend: 'neutral', sub: 'Fulfillment volume', icon: <CategoryRoundedIcon />, accent: 'stat-accent-brown' },
          { label: 'Wastage Loss', value: toPeso(ov.totalWastageLoss), trend: 'neutral', sub: 'Inventory write-offs', icon: <DeleteSweepRoundedIcon />, accent: 'stat-accent-rust' },
        ];
      default:
        return [];
    }
  };

  const cards = getCards();

  return (
    <Box sx={{ pb: 3 }}>
      {/* ── KPI Row (Top) ── */}
      <Box sx={{ mb: 4, opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
        <Grid container spacing={2.5}>
          {loading || !overview ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: 110 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={32} />
                  <Skeleton variant="text" width="50%" />
                </Card>
              </Grid>
            ))
          ) : (
            cards.map((c: any, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  label={c.label}
                  value={c.value}
                  trend={c.trend ?? 'neutral'}
                  trendValue={c.sub}
                  icon={c.icon}
                  accentClass={c.accent}
                  iconBg={i % 2 === 0 ? "linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)" : "linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"}
                  onClick={c.onClick}
                />
              </Grid>
            ))
          )}
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
                      if (item.id.startsWith('ORD-')) {
                        navigate({ to: '/orders' });
                      } else if (item.id.startsWith('BATCH-')) {
                        navigate({ to: '/hq-inventory' });
                      } else if (item.id.startsWith('LOG-')) {
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

      {/* ── Tabs & Controls Row ── */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={TAB_SX}>
          <Tab label="Overview" value="overview" />
          <Tab label="Inventory Reports" value="inventory" />
        </Tabs>

        <Box sx={{ pb: 0.5 }}>
          <Button 
            variant="contained" 
            startIcon={<DownloadRoundedIcon />}
            onClick={onExportClick}
          >
            Export Center
          </Button>
        </Box>
      </Box>

      {/* Tab content */}
      <Box sx={{ mt: 2 }}>
        {tab === 'overview' && (
          <HqOverviewTab startDate={startDate} endDate={endDate} />
        )}
        {tab === 'inventory' && (
          <HqInventoryReportsTab startDate={startDate} endDate={endDate} />
        )}
      </Box>
    </Box>
  );
}

// ── Branch View ───────────────────────────────────────────────────────────────

type BranchTab = 'performance' | 'inventory';

const EMPTY_OVERVIEW: BranchOverviewDto = {
  inventoryValue: 0, totalSkus: 0, totalSupplySpendReceived: 0,
  wastageLoss: 0, performanceScore: 0, rankInChain: 0, totalBranchesInChain: 0,
};

function BranchReportsView({
  startDate, endDate, onExportClick,
}: {
  startDate: string; endDate: string;
  onExportClick: () => void;
}) {
  const [tab, setTab] = useState<BranchTab>('performance');
  const [overview, setOverview] = useState<BranchOverviewDto>(EMPTY_OVERVIEW);
  const [loadingOverview, setLoadingOverview] = useState(true);

  useEffect(() => {
    setLoadingOverview(true);
    fetchBranchOverview(startDate, endDate)
      .then(setOverview)
      .catch(() => setOverview(EMPTY_OVERVIEW))
      .finally(() => setLoadingOverview(false));
  }, [startDate, endDate]);

  return (
    <Box sx={{ pb: 3 }}>
      {/* ── KPI Row (Toppest) ── */}
      <Box sx={{ mb: 4, opacity: loadingOverview ? 0.7 : 1, transition: 'opacity 0.2s' }}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="My Inventory Value"
              value={loadingOverview ? <Skeleton width={100} /> : toPeso(overview.inventoryValue)}
              trend="neutral"
              trendValue={loadingOverview ? <Skeleton width={80} /> : `${overview.totalSkus} SKUs on hand`}
              icon={<InventoryRoundedIcon />}
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Supply Spend Received"
              value={loadingOverview ? <Skeleton width={100} /> : toPeso(overview.totalSupplySpendReceived)}
              trend="neutral"
              trendValue="Total HQ fulfillment cost"
              icon={<MonetizationOnRoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Wastage Loss"
              value={loadingOverview ? <Skeleton width={100} /> : toPeso(overview.wastageLoss)}
              trend={overview.wastageLoss > 0 ? 'down' : 'neutral'}
              trendValue="Adjustment write-offs"
              icon={<DeleteSweepRoundedIcon />}
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="My Performance Score"
              value={loadingOverview ? <Skeleton width={100} /> : `${overview.performanceScore.toFixed(1)} pts`}
              trend={overview.rankInChain === 1 ? 'up' : 'neutral'}
              trendValue={
                loadingOverview ? <Skeleton width={120} /> : (overview.totalBranchesInChain > 0
                  ? `Rank #${overview.rankInChain} of ${overview.totalBranchesInChain} branches`
                  : 'No ranking data')
              }
              icon={<EmojiEventsRoundedIcon />}
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
            />
          </Grid>
        </Grid>
      </Box>

      {/* ── Tabs & Controls Row ── */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={TAB_SX}>
          <Tab label="Branch Performance" value="performance" />
          <Tab label="Inventory & Stock Analytics" value="inventory" />
        </Tabs>

        <Box sx={{ pb: 0.5 }}>
          <Button 
            variant="contained" 
            startIcon={<DownloadRoundedIcon />}
            onClick={onExportClick}
          >
            Export Center
          </Button>
        </Box>
      </Box>

      {/* Tab content */}
      {tab === 'performance' && (
        <BranchPerformanceTab startDate={startDate} endDate={endDate} />
      )}
      {tab === 'inventory' && (
        <InventoryAnalyticsTab startDate={startDate} endDate={endDate} />
      )}
    </Box>
  );
}

// ── Root Page ─────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { start, end } = defaultDates();
  const [startDate] = useState(start);
  const [endDate] = useState(end);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? '';

  const sharedProps = {
    startDate,
    endDate,
    onExportClick: () => setExportModalOpen(true),
  };

  return (
    <>
      {isBranchRole(role) ? (
        <BranchReportsView {...sharedProps} />
      ) : (
        <HqReportsView {...sharedProps} />
      )}

      <ExportModal 
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        defaultStartDate={startDate}
        defaultEndDate={endDate}
      />
    </>
  );
}