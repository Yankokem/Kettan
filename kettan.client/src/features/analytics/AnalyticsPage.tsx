import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Box, Typography, Card, Grid } from '@mui/material';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';

import { StatCard } from '../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import { Dropdown } from '../../components/UI/Dropdown';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface AnalyticsData {
  revenueTrend: { year: number; month: number; revenue: number }[];
  tenantGrowth: { year: number; month: number; count: number }[];
  planDistribution: { planName: string; count: number; revenue: number }[];
  topTenants: { tenantId: number; name: string; subscriptionTier: string; branchCount: number; adminName: string; tenantScore: number }[];
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
  const [rangeFilter, setRangeFilter] = useState<'6months' | '12months'>('6months');

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

  const generateTrendData = (months: number) => {
    const result = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      
      const found = data.revenueTrend.find(r => r.year === year && r.month === month);
      result.push({
        name: `${MONTH_NAMES[month - 1]} ${year}`,
        revenue: found ? found.revenue : 0
      });
    }
    return result;
  };

  const revenueChartData = generateTrendData(rangeFilter === '6months' ? 6 : 12);

  const generateGrowthData = (months: number) => {
    const result = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      
      const found = data.tenantGrowth.find(g => g.year === year && g.month === month);
      result.push({
        name: `${MONTH_NAMES[month - 1]} ${year}`,
        signups: found ? found.count : 0
      });
    }
    return result;
  };

  const growthChartData = generateGrowthData(rangeFilter === '6months' ? 6 : 12);

  const topTenantColumns: ColumnDef<(typeof data.topTenants)[0]>[] = [
    {
      key: 'tenantId', label: 'ID', width: 80, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>{row.tenantId}</Typography>,
    },
    {
      key: 'name', label: 'Tenant Name', sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#3E2723' }}>{row.name}</Typography>,
    },
    {
      key: 'adminName', label: 'Tenant Admin', sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>{row.adminName}</Typography>,
    },
    {
      key: 'tenantScore', label: 'Score', width: 100, align: 'center', sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: row.tenantScore >= 90 ? '#047857' : (row.tenantScore >= 80 ? '#B45309' : '#B91C1C') }}>
          {row.tenantScore}
        </Typography>
      ),
    },
    {
      key: 'subscriptionTier', label: 'Plan', width: 130, sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          {row.subscriptionTier}
        </Typography>
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
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '14px', height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Revenue Trend</Typography>
              <Dropdown
                value={rangeFilter}
                onChange={(e) => setRangeFilter(e.target.value as '6months' | '12months')}
                options={[
                  { value: '6months', label: 'Last 6 Months' },
                  { value: '12months', label: 'Last 12 Months' },
                ]}
                sx={{ minWidth: 140 }}
              />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
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
            </Box>
          </Card>
        </Grid>

        {/* Growth Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '14px', height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 3 }}>New Signups Per Month</Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="signups" fill="#047857" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Top Tenants ── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
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
