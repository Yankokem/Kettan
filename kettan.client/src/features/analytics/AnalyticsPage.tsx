import { Box, Typography, Card, Grid } from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

import { StatCard } from '../../components/UI/StatCard';

const MONTHLY_REVENUE = [
  { name: 'Jan', revenue: 4000, cost: 2400 },
  { name: 'Feb', revenue: 3000, cost: 1398 },
  { name: 'Mar', revenue: 2000, cost: 9800 },
  { name: 'Apr', revenue: 2780, cost: 3908 },
  { name: 'May', revenue: 1890, cost: 4800 },
  { name: 'Jun', revenue: 2390, cost: 3800 },
  { name: 'Jul', revenue: 3490, cost: 4300 },
];

const ORDER_VOLUME = [
  { name: 'Mon', orders: 120 },
  { name: 'Tue', orders: 132 },
  { name: 'Wed', orders: 101 },
  { name: 'Thu', orders: 143 },
  { name: 'Fri', orders: 210 },
  { name: 'Sat', orders: 250 },
  { name: 'Sun', orders: 190 },
];

export function AnalyticsPage() {
  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* ── Header ── */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          Platform Analytics
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
          High-level metrics and historical trends across the platform.
        </Typography>
      </Box>

      {/* ── Stat Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 2.5, mb: 4 }}>
        <StatCard label="Total Revenue (Platform)" value="$45,231" trend="up" trendValue="+12%" icon={<AssessmentRoundedIcon />} accentClass="stat-accent-brown" iconBg="none" />
        <StatCard label="Total Fulfillment Cost" value="$12,400" trend="up" trendValue="+4%" icon={<TrendingUpRoundedIcon />} accentClass="stat-accent-sage" iconBg="none" />
        <StatCard label="Average Order Value" value="$420" trend="down" trendValue="-2%" icon={<AssessmentRoundedIcon />} accentClass="stat-accent-gold" iconBg="none" />
        <StatCard label="Platform Uptime" value="99.9%" icon={<AssessmentRoundedIcon />} accentClass="stat-accent-brown" iconBg="none" />
      </Box>

      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: 400 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 3 }}>Revenue vs Cost (6 Months)</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={MONTHLY_REVENUE} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B4C2A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6B4C2A" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#047857" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6B4C2A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="cost" stroke="#047857" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Volume Chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: 400 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 3 }}>Weekly Order Volume</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={ORDER_VOLUME} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
