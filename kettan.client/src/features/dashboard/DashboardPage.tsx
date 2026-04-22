import { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import LocalShippingRoundedIcon    from '@mui/icons-material/LocalShippingRounded';
import SettingsBackupRestoreRoundedIcon from '@mui/icons-material/SettingsBackupRestoreRounded';
import LocalMallRoundedIcon        from '@mui/icons-material/LocalMallRounded';
import WarningAmberRoundedIcon     from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import { StatCard } from '../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { useAuthStore } from '../../store/useAuthStore';
import { BranchPerformance } from './components/BranchPerformance';
import { InventoryAlerts } from './components/InventoryAlerts';
import { FulfillmentStepper } from './components/FulfillmentStepper';
import { DashboardChart } from './components/DashboardChart';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';

// ── Recent Activity Row ────────────────────────────────────────────────────
interface ActivityItem {
  id: string;
  branch: string;
  type: string;
  status: 'completed' | 'in-transit' | 'pending' | 'returned';
  time: string;
}

const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'ORD-0091', branch: 'BGC Branch',        type: 'Supplies Reorder',   status: 'completed',  time: '2 min ago' },
  { id: 'ORD-0090', branch: 'Makati HQ',         type: 'Batch Packing',      status: 'in-transit', time: '18 min ago' },
  { id: 'ORD-0089', branch: 'Ortigas Branch',    type: 'Urgent Restock',     status: 'pending',    time: '45 min ago' },
  { id: 'ORD-0088', branch: 'Alabang Branch',    type: 'Returns Processing', status: 'returned',   time: '1 hr ago' },
  { id: 'ORD-0087', branch: 'QC Branch',         type: 'Supplies Reorder',   status: 'completed',  time: '2 hr ago' },
  { id: 'ORD-0086', branch: 'Manila Branch',     type: 'Equipment Upgrade',  status: 'in-transit', time: '3 hr ago' },
  { id: 'ORD-0085', branch: 'Cebu Branch',       type: 'Supplies Reorder',   status: 'completed',  time: '4 hr ago' },
  { id: 'ORD-0084', branch: 'Davao Branch',      type: 'Urgent Restock',     status: 'pending',    time: '5 hr ago' },
  { id: 'ORD-0083', branch: 'Iloilo Branch',     type: 'Batch Packing',      status: 'in-transit', time: '6 hr ago' },
  { id: 'ORD-0082', branch: 'Bacolod Branch',    type: 'Supplies Reorder',   status: 'completed',  time: '7 hr ago' },
  { id: 'ORD-0081', branch: 'Clark HQ',          type: 'Returns Processing', status: 'returned',   time: '8 hr ago' },
];

const STATUS_MAP = {
  completed:  { label: 'Completed',  color: '#546B3F', bg: 'rgba(84,107,63,0.12)',  icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 12 }} /> },
  'in-transit': { label: 'In Transit', color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)', icon: <LocalShippingRoundedIcon sx={{ fontSize: 12 }} /> },
  pending:    { label: 'Pending',    color: '#B45309', bg: 'rgba(180,83,9,0.12)',   icon: <RadioButtonCheckedRoundedIcon sx={{ fontSize: 12 }} /> },
  returned:   { label: 'Returned',   color: '#B91C1C', bg: 'rgba(185,28,28,0.10)', icon: <WarningAmberRoundedIcon sx={{ fontSize: 12 }} /> },
};

const activityColumns: ColumnDef<ActivityItem>[] = [
  {
    key: 'id',
    label: 'Order ID',
    width: 130,
    render: (row) => (
      <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: '#6B4C2A', fontFamily: 'monospace' }}>
        {row.id}
      </Typography>
    ),
  },
  {
    key: 'branch',
    label: 'Branch',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
        {row.branch}
      </Typography>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    width: 170,
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        {row.type}
      </Typography>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 130,
    render: (row) => {
      const st = STATUS_MAP[row.status];
      return (
        <Chip
          icon={st.icon}
          label={st.label}
          size="small"
          sx={{
            fontSize: 11.5,
            fontWeight: 600,
            background: st.bg,
            color: st.color,
            border: `1px solid ${st.color}28`,
            '& .MuiChip-icon': { color: st.color, ml: 0.5 },
          }}
        />
      );
    },
  },
  {
    key: 'time',
    label: 'Time',
    width: 100,
    align: 'right' as const,
    render: (row) => (
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        {row.time}
      </Typography>
    ),
  },
];

const ACTIVITY_QUICK_FILTERS = [
  { value: 'completed',  label: 'Completed' },
  { value: 'in-transit', label: 'In Transit' },
  { value: 'pending',    label: 'Pending' },
  { value: 'returned',   label: 'Returned' },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const isBranchManager = user?.role === 'BranchManager';
  const [activityStatusFilter, setActivityStatusFilter] = useState('');
  const [activityBranchFilter, setActivityBranchFilter] = useState('');

  const baseActivity = isBranchManager ? RECENT_ACTIVITY.slice(0, 4) : RECENT_ACTIVITY;
  const filteredActivity = baseActivity.filter((row) => {
    const matchesStatus = !activityStatusFilter || row.status === activityStatusFilter;
    const matchesBranch = !activityBranchFilter || row.branch === activityBranchFilter;
    return matchesStatus && matchesBranch;
  });

  if (user?.role === 'SuperAdmin') {
    return <SuperAdminDashboard />;
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* ── Stat Cards ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' },
          gap: 2.5,
          mb: 3.5,
        }}
      >
        <StatCard
          label="Pending Supply Orders"
          value={14}
          sub="Requires fulfillment"
          trend="up"
          trendValue="+3"
          icon={<LocalMallRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Low Stock Items"
          value={12}
          sub="3 at critical levels"
          trend="up"
          trendValue="+2"
          icon={<WarningAmberRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Active Shipments"
          value={8}
          sub="In transit today"
          trend="up"
          trendValue="+5"
          icon={<LocalShippingRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Pending Returns"
          value={2}
          sub="Awaiting review"
          trend="down"
          trendValue="-2"
          icon={<SettingsBackupRestoreRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      {/* ── Main Dashboard Grid ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        
        {/* Top Row: Chart & Performance/Stepper */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'stretch' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <DashboardChart />
          </Box>
          <Box sx={{ width: { xs: '100%', xl: 340, lg: 300 }, flexShrink: 0 }}>
            {!isBranchManager ? <BranchPerformance /> : <FulfillmentStepper />}
          </Box>
        </Box>

        {/* Bottom Row: Activity Table & Alerts */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'stretch' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <DataTable
              title="Recent Operations"
              data={filteredActivity}
              columns={activityColumns}
              keyExtractor={(row) => row.id}
              defaultRowsPerPage={5}
              rowsPerPageOptions={[5, 10, 25]}
              quickFilters={ACTIVITY_QUICK_FILTERS}
              activeQuickFilter={activityStatusFilter}
              onQuickFilterChange={setActivityStatusFilter}
              rightAction={
                <FilterDropdown
                  label="Branch"
                  icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
                  value={activityBranchFilter}
                  onChange={setActivityBranchFilter}
                  minWidth={110}
                  compact
                  options={[
                    { value: 'BGC Branch',     label: 'BGC Branch' },
                    { value: 'Makati HQ',      label: 'Makati HQ' },
                    { value: 'Ortigas Branch', label: 'Ortigas Branch' },
                    { value: 'Alabang Branch', label: 'Alabang Branch' },
                    { value: 'QC Branch',      label: 'QC Branch' },
                    { value: 'Manila Branch',  label: 'Manila Branch' },
                    { value: 'Cebu Branch',    label: 'Cebu Branch' },
                    { value: 'Davao Branch',   label: 'Davao Branch' },
                    { value: 'Iloilo Branch',  label: 'Iloilo Branch' },
                    { value: 'Bacolod Branch', label: 'Bacolod Branch' },
                    { value: 'Clark HQ',       label: 'Clark HQ' },
                  ]}
                />
              }
            />
          </Box>
          <Box sx={{ width: { xs: '100%', xl: 340, lg: 300 }, flexShrink: 0 }}>
            <InventoryAlerts />
          </Box>
        </Box>
        
      </Box>
    </Box>
  );
}

