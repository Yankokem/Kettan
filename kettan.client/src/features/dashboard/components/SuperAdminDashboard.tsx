import { useEffect, useState } from 'react';
import { api } from '../../../utils/api';
import { Box, Typography, Card } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded';
import { useNavigate } from '@tanstack/react-router';
import {
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { StatCard } from '../../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import { LoadingOverlay } from '../../../components/UI/LoadingOverlay';
import { SubscriberTrendChart } from './SubscriberTrendChart';


const PIE_COLORS = ['#6B4C2A', '#047857', '#B08B5A', '#2563EB', '#7C3AED'];

interface DashboardData {
  totalTenants: number;
  activeTenants: number;
  pendingPaymentTenants: number;
  totalBranches: number;
  totalUsers: number;
  monthlyRecurringRevenue: number;
  planDistribution: { planName: string; count: number; revenue: number }[];
  recentSignups: { tenantId: number; name: string; subscriptionTier: string; subscriptionStatus: string; createdAt: string }[];
  subscriberTrend: { year: number; month: number; planName: string; count: number }[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await api.get('/api/admin/dashboard');
  
  return res.data;
}

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeScope, setTimeScope] = useState('monthly');

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingOverlay open={true} />;
  }

  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Unable to load dashboard data.</Typography>
      </Box>
    );
  }

  const pieData = data.planDistribution.map((p) => ({
    name: p.planName,
    value: p.count,
    revenue: p.revenue,
  }));

  const signupColumns: ColumnDef<(typeof data.recentSignups)[0]>[] = [
    {
      key: 'tenantId',
      label: 'Tenant ID',
      width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
          #{row.tenantId}
        </Typography>
      ),
    },
    {
      key: 'name',
      label: 'Tenant Name',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{row.name}</Typography>
        </Box>
      ),
    },
    {
      key: 'subscriptionTier',
      label: 'Plan',
      width: 140,
      render: (row) => (
        <Box
          sx={{
            fontSize: 11.5, fontWeight: 700,
            color: '#6B4C2A', bgcolor: 'rgba(107,76,42,0.12)',
            px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block',
            border: '1px solid rgba(107,76,42,0.28)',
          }}
        >
          {row.subscriptionTier}
        </Box>
      ),
    },
    {
      key: 'subscriptionStatus',
      label: 'Status',
      width: 150,
      align: 'center',
      render: (row) => {
        const isActive = row.subscriptionStatus === 'Active';
        return (
          <Typography
            sx={{
              fontSize: 13, fontWeight: 700,
              color: isActive ? '#047857' : '#B45309',
            }}
          >
            {row.subscriptionStatus}
          </Typography>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Joined',
      width: 150,
      align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* ── KPI Cards ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' },
          gap: 2.5,
        }}
      >
        <StatCard
          label="Total Tenants"
          value={data.totalTenants}
          sub={`${data.pendingPaymentTenants} pending payment`}
          icon={<StorefrontRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Active Subscribers"
          value={data.activeTenants}
          sub={`of ${data.totalTenants} total`}
          icon={<CheckCircleOutlineRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Monthly Revenue (MRR)"
          value={`₱${data.monthlyRecurringRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub="Platform subscriptions"
          icon={<AccountBalanceWalletRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Total Platform Users"
          value={data.totalUsers}
          sub={`Across ${data.totalBranches} branches`}
          icon={<GroupRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      {/* ── Charts Row ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        
        {/* Subscriber Trend (New Chart) */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SubscriberTrendChart 
            data={data.subscriberTrend || []} 
            timeScope={timeScope}
            onTimeScopeChange={setTimeScope}
          />
        </Box>

        {/* Plan Distribution (Moved to Right) */}
        <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '14px', width: { xs: '100%', lg: 340 }, flexShrink: 0, bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
            <PieChartRoundedIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#3E2723' }}>Plan Distribution</Typography>
          </Box>
          
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  strokeWidth={0}
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: unknown, name: unknown) => [`${value} subscribers`, String(name)]}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px' }}
                  itemStyle={{ fontSize: 12, fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>No active subscriptions</Typography>
            </Box>
          )}

          {/* Custom Legend for Pie */}
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pieData.map((p, i) => (
              <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#3E2723' }}>{p.name}</Typography>
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: PIE_COLORS[i % PIE_COLORS.length] }}>
                  {p.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>

      {/* ── Recent Signups Table ── */}
      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <GroupAddRoundedIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#3E2723' }}>Recent Tenant Signups</Typography>
          </Box>
        }
        data={data.recentSignups}
        columns={signupColumns}
        keyExtractor={(row) => String(row.tenantId)}
        onRowClick={(row) => navigate({ to: '/tenants/$tenantId', params: { tenantId: String(row.tenantId) } })}
        defaultRowsPerPage={5}
      />
    </Box>
  );
}
