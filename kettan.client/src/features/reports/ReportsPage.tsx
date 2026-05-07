import { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Grid, Skeleton, Card } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { Button } from '../../components/UI/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { isBranchRole } from '../../utils/roleHelpers';

// ── Components ───────────────────────────────────────────────────────────────
import { HqOverviewTab } from './components/HqOverviewTab';
import { HqInventoryReportsTab } from './components/HqInventoryReportsTab';
import { HqBranchPerformanceTab } from './components/HqBranchPerformanceTab';
import { HqReturnsLossTab } from './components/HqReturnsLossTab';
import { BranchPerformanceTab } from './components/BranchPerformanceTab';
import { InventoryAnalyticsTab } from './components/InventoryAnalyticsTab';
import { ExportModal } from './components/ExportModal';

import { 
  fetchBranchOverview, 
  fetchHqOverview,
  type BranchOverviewDto, 
  type HqOverviewDto 
} from './reportsApi';
import { StatCard } from '../../components/UI/StatCard';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
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

type HqTab = 'overview' | 'inventory' | 'performance' | 'returns';

function HqReportsView({
  startDate, endDate, onExportClick,
}: {
  startDate: string; endDate: string;
  onExportClick: () => void;
}) {
  const [tab, setTab] = useState<HqTab>('overview');
  const [overview, setOverview] = useState<HqOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchHqOverview(startDate, endDate)
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const getCards = () => {
    const ov = overview;
    if (!ov) return [];

    switch (tab) {
      case 'overview':
        return [
          { label: 'Total Fulfillment Cost', value: toPeso(ov.totalFulfillmentCost), sub: 'Chain-wide supply spend', icon: <MonetizationOnRoundedIcon />, accent: 'stat-accent-brown' },
          { label: 'Chain Inventory Value', value: toPeso(ov.totalChainInventoryValue), sub: 'HQ + All Branches', icon: <InventoryRoundedIcon />, accent: 'stat-accent-gold' },
          { label: 'Total Wastage Loss', value: toPeso(ov.totalWastageLoss), sub: 'Spoilage & adjustments', icon: <DeleteSweepRoundedIcon />, accent: 'stat-accent-sage' },
          { label: 'Returns Credit Loss', value: toPeso(ov.totalReturnLoss), sub: 'Branch/Customer credits', icon: <AssignmentReturnRoundedIcon />, accent: 'stat-accent-rust' },
        ];
      case 'inventory':
        return [
          { label: 'Chain Inventory Value', value: toPeso(ov.totalChainInventoryValue), sub: 'Total asset valuation', icon: <InventoryRoundedIcon />, accent: 'stat-accent-gold' },
          { label: 'Fulfillment Rate', value: `${ov.fulfillmentRate.toFixed(1)}%`, sub: 'Order success percentage', icon: <TrendingUpRoundedIcon />, accent: 'stat-accent-sage' },
          { label: 'Total Orders', value: ov.totalOrders.toLocaleString(), sub: 'Fulfillment volume', icon: <CategoryRoundedIcon />, accent: 'stat-accent-brown' },
          { label: 'Wastage Loss', value: toPeso(ov.totalWastageLoss), sub: 'Inventory write-offs', icon: <DeleteSweepRoundedIcon />, accent: 'stat-accent-rust' },
        ];
      case 'performance':
        return [
          { label: 'Avg Fulfillment Rate', value: `${ov.fulfillmentRate.toFixed(1)}%`, sub: 'Chain-wide efficiency', icon: <TrendingUpRoundedIcon />, accent: 'stat-accent-sage' },
          { label: 'Top Performer', value: ov.topPerformerName || '—', sub: 'Highest scoring branch', icon: <EmojiEventsRoundedIcon />, accent: 'stat-accent-gold' },
          { label: 'Total Orders', value: ov.totalOrders.toLocaleString(), sub: 'Volume this period', icon: <CategoryRoundedIcon />, accent: 'stat-accent-brown' },
          { label: 'Top Score', value: `${ov.topPerformerScore.toFixed(1)}%`, sub: 'Leaderboard benchmark', icon: <TrendingUpRoundedIcon />, accent: 'stat-accent-gold' },
        ];
      case 'returns':
        return [
          { label: 'Total Return Loss', value: toPeso(ov.totalReturnLoss), sub: 'Monetary credits issued', icon: <AssignmentReturnRoundedIcon />, accent: 'stat-accent-rust' },
          { label: 'Total Wastage Loss', value: toPeso(ov.totalWastageLoss), sub: 'Spoilage valuation', icon: <DeleteSweepRoundedIcon />, accent: 'stat-accent-sage' },
          { label: 'Return Rate', value: '2.4%', sub: 'Avg vs total orders', icon: <TrendingUpRoundedIcon />, accent: 'stat-accent-brown' },
          { label: 'Total Monetary Loss', value: toPeso(ov.totalReturnLoss + ov.totalWastageLoss), sub: 'Combined risk value', icon: <MonetizationOnRoundedIcon />, accent: 'stat-accent-rust' },
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
            cards.map((c, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  label={c.label}
                  value={c.value}
                  trend="neutral"
                  trendValue={c.sub}
                  icon={c.icon}
                  accentClass={c.accent}
                  iconBg={i % 2 === 0 ? "linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)" : "linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"}
                />
              </Grid>
            ))
          )}
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
          <Tab label="Overview" value="overview" />
          <Tab label="Inventory Reports" value="inventory" />
          <Tab label="Branch Performance" value="performance" />
          <Tab label="Returns & Losses" value="returns" />
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
        {tab === 'performance' && (
          <HqBranchPerformanceTab startDate={startDate} endDate={endDate} />
        )}
        {tab === 'returns' && (
          <HqReturnsLossTab startDate={startDate} endDate={endDate} />
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