import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Box, Typography, Card, Grid } from '@mui/material';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';

import { StatCard } from '../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#6B4C2A', '#047857', '#B08B5A', '#2563EB', '#7C3AED'];

interface AnalyticsData {
  revenueTrend: { year: number; month: number; revenue: number }[];
  tenantGrowth: { year: number; month: number; count: number }[];
  planDistribution: { planName: string; count: number; revenue: number }[];
  topTenants: { tenantId: number; name: string; subscriptionTier: string; branchCount: number }[];
  totalRevenue: number;
  newThisMonth: number;
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await api.get('/api/admin/analytics');
  
  return res.data;
}

async function fetchDashboardKPIs(): Promise<{ activeTenants: number; monthlyRecurringRevenue: number; totalTenants: number; totalUsers: number; totalBranches: number }> {
  const res = await api.get('/api/admin/dashboard');
  
  return res.data;
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [kpis, setKPIs] = useState<{ activeTenants: number; monthlyRecurringRevenue: number; totalTenants: number; totalUsers: number; totalBranches: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchDashboardKPIs()])
      .then(([analytics, dashboard]) => {
        setData(analytics);
        setKPIs(dashboard);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data || !kpis) {
    return <LoadingOverlay open={true} />;
  }

  const revenueChartData = data.revenueTrend.map(r => ({
    name: `${MONTH_NAMES[r.month - 1]} ${r.year}`,
    revenue: r.revenue,
  }));

  const growthChartData = data.tenantGrowth.map(g => ({
    name: `${MONTH_NAMES[g.month - 1]}`,
    signups: g.count,
  }));

  const pieData = data.planDistribution.map(p => ({
    name: p.planName,
    value: p.count,
  }));

  const topTenantColumns: ColumnDef<(typeof data.topTenants)[0]>[] = [
    {
      key: 'name', label: 'Tenant Name', sortable: true,
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.name}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>ID: {row.tenantId}</Typography>
        </Box>
      ),
    },
    {
      key: 'subscriptionTier', label: 'Plan', width: 130, sortable: true,
      render: (row) => (
        <Box sx={{ fontSize: 11.5, fontWeight: 700, color: '#6B4C2A', bgcolor: 'rgba(107,76,42,0.12)', px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block', border: '1px solid rgba(107,76,42,0.28)' }}>
          {row.subscriptionTier}
        </Box>
      ),
    },
    {
      key: 'branchCount', label: 'Branches', width: 120, align: 'right', sortable: true,
      render: (row) => <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{row.branchCount}</Typography>,
    },
  ];

  return (
    <Box sx={{ pb: 3 }}>


      {/* ── KPI Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 2.5, mb: 4 }}>
        <StatCard
          label="Monthly Recurring Revenue"
          value={`₱${kpis.monthlyRecurringRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub="Platform subscriptions"
          icon={<AssessmentRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Total Revenue (All-Time)"
          value={`₱${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub="Cumulative earnings"
          icon={<TrendingUpRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Active Subscribers"
          value={kpis.activeTenants}
          sub={`of ${kpis.totalTenants} total`}
          icon={<StorefrontRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Platform Users"
          value={kpis.totalUsers}
          sub={`Across ${kpis.totalBranches} branches`}
          icon={<GroupAddRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      {/* ── Charts ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Revenue Trend */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '14px', height: 400 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 3 }}>Revenue Trend (Last 6 Months)</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B4C2A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6B4C2A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <RechartsTooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6B4C2A" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Plan Distribution */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '14px', height: 400 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 3 }}>Plan Distribution</Typography>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={90} paddingAngle={4} strokeWidth={2} stroke="#fff">
                    {pieData.map((_e, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" iconSize={10} formatter={(v: string) => <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{v}</span>} />
                  <RechartsTooltip formatter={(v: unknown, n: unknown) => [`${v} subscribers`, String(n)]} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '85%' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>No subscription data</Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ── Tenant Growth & Top Tenants ── */}
      <Grid container spacing={3}>
        {/* Growth Chart */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '14px', height: 380 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 3 }}>New Signups Per Month</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={growthChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="signups" fill="#047857" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Top Tenants */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <DataTable
            title="Top Tenants by Branches"
            data={data.topTenants}
            columns={topTenantColumns}
            keyExtractor={(row) => String(row.tenantId)}
            emptyMessage="No tenant data available."
          />
        </Grid>
      </Grid>
    </Box>
  );
}
