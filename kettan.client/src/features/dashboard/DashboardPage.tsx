import { Box, Typography, Chip } from '@mui/material';
import LocalShippingRoundedIcon    from '@mui/icons-material/LocalShippingRounded';
import Inventory2RoundedIcon       from '@mui/icons-material/Inventory2Rounded';
import StoreRoundedIcon            from '@mui/icons-material/StoreRounded';
import WarningAmberRoundedIcon     from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded';

import { StatCard } from '../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';

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
    gridWidth: '130px',
    render: (row) => (
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
        {row.id}
      </Typography>
    ),
  },
  {
    key: 'branch',
    label: 'Branch',
    gridWidth: '1fr',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
        {row.branch}
      </Typography>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    gridWidth: '160px',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        {row.type}
      </Typography>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    gridWidth: '120px',
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
    gridWidth: '90px',
    render: (row) => (
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        {row.time}
      </Typography>
    ),
  },
];

export function DashboardPage() {
  return (
    <Box sx={{ pb: 3 }}>
      {/* Page header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 700,
            color: 'text.primary',
            letterSpacing: '-0.02em',
          }}
        >
          Good morning 👋
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.25 }}>
          Here's what's happening across your café chain today.
        </Typography>
      </Box>

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
          label="Active Branches"
          value={12}
          sub="3 pending onboarding"
          trend="up"
          trendValue="+2"
          icon={<StoreRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Open Orders"
          value={47}
          sub="10 urgent flagged"
          trend="up"
          trendValue="+12%"
          icon={<Inventory2RoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Deliveries Today"
          value={23}
          sub="18 completed"
          trend="up"
          trendValue="+5"
          icon={<LocalShippingRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Low Stock Alerts"
          value={3}
          sub="Across 2 branches"
          trend="down"
          trendValue="-1"
          icon={<WarningAmberRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      {/* ── Recent Activity ── */}
      <DataTable
        title="Recent Order Activity"
        data={RECENT_ACTIVITY}
        columns={activityColumns}
        keyExtractor={(row) => row.id}
      />
    </Box>
  );
}
