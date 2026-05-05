import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
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
import { HqConsumptionAnalyticsTab } from './components/HqConsumptionAnalyticsTab';
import { HqReturnsLossTab } from './components/HqReturnsLossTab';

// ── Branch Tabs ───────────────────────────────────────────────────────────────
import { BranchOverviewTab } from './components/BranchOverviewTab';
import { BranchInventoryTab } from './components/BranchInventoryTab';
import { HqConsumptionAnalyticsTab as BranchConsumptionTab } from './components/HqConsumptionAnalyticsTab';
import { BranchSupplyHistoryTab } from './components/BranchSupplyHistoryTab';
import { BranchMyPerformanceTab } from './components/BranchMyPerformanceTab';

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

type HqTab = 'overview' | 'inventory' | 'performance' | 'consumption' | 'returns';

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
      {/* Top bar */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={TAB_SX}>
          <Tab label="Overview" value="overview" />
          <Tab label="Inventory Reports" value="inventory" />
          <Tab label="Branch Performance" value="performance" />
          <Tab label="Consumption Analytics" value="consumption" />
          <Tab label="Returns & Losses" value="returns" />
        </Tabs>
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
      {tab === 'consumption' && (
        <HqConsumptionAnalyticsTab
          startDate={startDate}
          endDate={endDate}
          branchId={branchFilter}
        />
      )}
      {tab === 'returns' && (
        <HqReturnsLossTab startDate={startDate} endDate={endDate} />
      )}
    </Box>
  );
}

// ── Branch View ───────────────────────────────────────────────────────────────

type BranchTab = 'overview' | 'inventory' | 'consumption' | 'supply' | 'performance';

function BranchReportsView({
  startDate, endDate, onStartDate, onEndDate,
  exportFormat, onExportFormat,
}: {
  startDate: string; endDate: string;
  onStartDate: (v: string) => void; onEndDate: (v: string) => void;
  exportFormat: string; onExportFormat: (v: string) => void;
}) {
  const [tab, setTab] = useState<BranchTab>('overview');

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={TAB_SX}>
          <Tab label="Overview" value="overview" />
          <Tab label="My Inventory" value="inventory" />
          <Tab label="Consumption Analytics" value="consumption" />
          <Tab label="Supply History" value="supply" />
          <Tab label="My Performance" value="performance" />
        </Tabs>
      </Box>

      {/* Tab content */}
      {tab === 'overview' && (
        <BranchOverviewTab startDate={startDate} endDate={endDate} />
      )}
      {tab === 'inventory' && (
        <BranchInventoryTab startDate={startDate} endDate={endDate} />
      )}
      {tab === 'consumption' && (
        // Reusing HqConsumptionAnalyticsTab — it accepts an optional branchId.
        // When called from branch view, no branchId needed — backend scopes by auth.
        <BranchConsumptionTab startDate={startDate} endDate={endDate} />
      )}
      {tab === 'supply' && (
        <BranchSupplyHistoryTab startDate={startDate} endDate={endDate} />
      )}
      {tab === 'performance' && (
        <BranchMyPerformanceTab startDate={startDate} endDate={endDate} />
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