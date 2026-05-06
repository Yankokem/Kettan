import { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Grid, Skeleton } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { useAuthStore } from '../../store/useAuthStore';
import { isBranchRole } from '../../utils/roleHelpers';

// ── HQ Tabs ───────────────────────────────────────────────────────────────────
import { HqOverviewTab } from './components/HqOverviewTab';
import { HqInventoryReportsTab } from './components/HqInventoryReportsTab';
import { HqBranchPerformanceTab } from './components/HqBranchPerformanceTab';
import { HqReturnsLossTab } from './components/HqReturnsLossTab';

// ── Branch Tabs ───────────────────────────────────────────────────────────────
import { BranchPerformanceTab } from './components/BranchPerformanceTab';
import { InventoryAnalyticsTab } from './components/InventoryAnalyticsTab';
import { fetchBranchOverview, type BranchOverviewDto } from './reportsApi';
import { StatCard } from '../../components/UI/StatCard';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';

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

// ── HQ View ───────────────────────────────────────────────────────────────────

type HqTab = 'overview' | 'inventory' | 'performance' | 'returns';

function HqReportsView({
  startDate, endDate, onStartDate, onEndDate,
  exportFormat, onExportFormat,
}: {
  startDate: string; endDate: string;
  onStartDate: (v: string) => void; onEndDate: (v: string) => void;
  exportFormat: string; onExportFormat: (v: string) => void;
}) {
  const [tab, setTab] = useState<HqTab>('overview');

  // Branch filter only relevant for Inventory & Consumption tabs
  const [branchFilter] = useState<number | undefined>(undefined);

  return (
    <Box sx={{ pb: 3 }}>
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 0.5 }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => { onStartDate(s); onEndDate(e); }}
          />
          <Dropdown
            value={exportFormat}
            onChange={(e) => onExportFormat(e.target.value as string)}
            options={[
              { value: 'pdf', label: 'PDF Format' },
              { value: 'csv', label: 'CSV Spreadsheet' },
            ]}
            sx={{ minWidth: 140 }}
          />
          <Button startIcon={<DownloadRoundedIcon />}>Export</Button>
        </Box>
      </Box>

      {/* Tab content */}
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
  );
}

// ── Branch View ───────────────────────────────────────────────────────────────

type BranchTab = 'performance' | 'inventory';

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const EMPTY_OVERVIEW: BranchOverviewDto = {
  inventoryValue: 0, totalSkus: 0, totalSupplySpendReceived: 0,
  wastageLoss: 0, performanceScore: 0, rankInChain: 0, totalBranchesInChain: 0,
};

function BranchReportsView({
  startDate, endDate, onStartDate, onEndDate,
  exportFormat, onExportFormat,
}: {
  startDate: string; endDate: string;
  onStartDate: (v: string) => void; onEndDate: (v: string) => void;
  exportFormat: string; onExportFormat: (v: string) => void;
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 0.5 }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => { onStartDate(s); onEndDate(e); }}
          />
          <Dropdown
            value={exportFormat}
            onChange={(e) => onExportFormat(e.target.value as string)}
            options={[
              { value: 'pdf', label: 'PDF Format' },
              { value: 'csv', label: 'CSV Spreadsheet' },
            ]}
            sx={{ minWidth: 140 }}
          />
          <Button startIcon={<DownloadRoundedIcon />}>Export</Button>
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
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [exportFormat, setExportFormat] = useState('pdf');

  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? '';

  const sharedProps = {
    startDate,
    endDate,
    onStartDate: setStartDate,
    onEndDate: setEndDate,
    exportFormat,
    onExportFormat: setExportFormat,
  };

  if (isBranchRole(role)) {
    return <BranchReportsView {...sharedProps} />;
  }

  // HQ roles (TenantAdmin, HqManager, HqStaff) + fallback
  return <HqReportsView {...sharedProps} />;
}