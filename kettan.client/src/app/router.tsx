import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Box, Typography, Chip } from '@mui/material';
import { AppLayout } from '../components/Layout/AppLayout';
import TrendingUpRoundedIcon       from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon     from '@mui/icons-material/TrendingDownRounded';
import LocalShippingRoundedIcon    from '@mui/icons-material/LocalShippingRounded';
import Inventory2RoundedIcon       from '@mui/icons-material/Inventory2Rounded';
import StoreRoundedIcon            from '@mui/icons-material/StoreRounded';
import WarningAmberRoundedIcon     from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded';

// ── Stat Card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | null;
  trendValue?: string;
  icon: React.ReactNode;
  accentClass: string;
  iconBg: string;
}

function StatCard({ label, value, sub, trend, trendValue, icon, accentClass, iconBg }: StatCardProps) {
  return (
    <Box
      className={`hover-lift glass-card ${accentClass}`}
      sx={{
        borderRadius: '14px',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        cursor: 'default',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              mb: 0.5,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          {sub && (
            <Typography sx={{ fontSize: 12, color: '#9CA3AF', mt: 0.5 }}>
              {sub}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '11px',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            '& svg': { fontSize: 22, color: '#FAF5EF' },
          }}
        >
          {icon}
        </Box>
      </Box>

      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          {trend === 'up'
            ? <TrendingUpRoundedIcon sx={{ fontSize: 14, color: '#546B3F' }} />
            : <TrendingDownRoundedIcon sx={{ fontSize: 14, color: '#B91C1C' }} />
          }
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: trend === 'up' ? '#546B3F' : '#B91C1C',
            }}
          >
            {trendValue}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: '#9CA3AF' }}>
            vs last week
          </Typography>
        </Box>
      )}
    </Box>
  );
}

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
];

const STATUS_MAP = {
  completed:  { label: 'Completed',  color: '#546B3F', bg: 'rgba(84,107,63,0.12)',  icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 12 }} /> },
  'in-transit': { label: 'In Transit', color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)', icon: <LocalShippingRoundedIcon sx={{ fontSize: 12 }} /> },
  pending:    { label: 'Pending',    color: '#B45309', bg: 'rgba(180,83,9,0.12)',   icon: <RadioButtonCheckedRoundedIcon sx={{ fontSize: 12 }} /> },
  returned:   { label: 'Returned',   color: '#B91C1C', bg: 'rgba(185,28,28,0.10)', icon: <WarningAmberRoundedIcon sx={{ fontSize: 12 }} /> },
};

// ── Dashboard Component ────────────────────────────────────────────────────
function Dashboard() {
  return (
    <Box sx={{ pb: 3 }}>

      {/* Page header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.02em',
          }}
        >
          Good morning 👋
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: '#6B7280', mt: 0.25 }}>
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
      <Box
        className="glass-card"
        sx={{
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
            Recent Order Activity
          </Typography>
          <Chip
            label="View all"
            size="small"
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              background: '#F3F4F6',
              color: '#374151',
              border: '1px solid #E5E7EB',
              cursor: 'pointer',
              '&:hover': { background: '#E5E7EB' },
            }}
          />
        </Box>

        {/* Table header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '130px 1fr 160px 120px 90px',
            px: 3,
            py: 1,
            background: '#F9FAFB',
          }}
        >
          {['Order ID', 'Branch', 'Type', 'Status', 'Time'].map((h) => (
            <Typography
              key={h}
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#9CA3AF',
              }}
            >
              {h}
            </Typography>
          ))}
        </Box>

        {/* Rows */}
        {RECENT_ACTIVITY.map((row) => {
          const st = STATUS_MAP[row.status];
          return (
            <Box
              key={row.id}
              className="hover-lift"
              sx={{
                display: 'grid',
                gridTemplateColumns: '130px 1fr 160px 120px 90px',
                px: 3,
                py: 1.75,
                alignItems: 'center',
                borderTop: '1px solid #F3F4F6',
                cursor: 'pointer',
                '&:hover': { background: '#F9FAFB' },
              }}
            >
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
                {row.id}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>
                {row.branch}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
                {row.type}
              </Typography>
              <Box>
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
              </Box>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
                {row.time}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ── Router Setup ───────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
