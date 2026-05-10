import { useEffect, useState } from 'react';
import { api } from '../../../utils/api';
import { Box, Typography, Card } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { useNavigate } from '@tanstack/react-router';
import {
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { StatCard } from '../../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import { LoadingOverlay } from '../../../components/UI/LoadingOverlay';


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
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await api.get('/api/admin/dashboard');
  
  return res.data;
}

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
      key: 'name',
      label: 'Tenant Name',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{row.name}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace', mt: 0.2 }}>ID: {row.tenantId}</Typography>
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
          <Box
            sx={{
              fontSize: 11.5, fontWeight: 700,
              color: isActive ? '#047857' : '#B45309',
              bgcolor: isActive ? 'rgba(4,120,87,0.12)' : 'rgba(180,83,9,0.12)',
              px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block',
            }}
          >
            {row.subscriptionStatus}
          </Box>
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
    <Box sx={{ pb: 3 }}>
      {/* ── KPI Cards ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' },
          gap: 2.5,
          mb: 3.5,
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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, mb: 3.5 }}>
        {/* Plan Distribution Donut */}
        <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '14px', width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1 }}>Plan Distribution</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2 }}>Subscribers per plan tier</Typography>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  iconSize={10}
                  formatter={(value: string) => <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{value}</span>}
                />
                <RechartsTooltip
                  formatter={(value: unknown, name: unknown) => [`${value} subscribers`, String(name)]}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>No active subscriptions yet</Typography>
            </Box>
          )}
        </Card>

        {/* Revenue per Plan Breakdown */}
        <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '14px', flex: 1 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1 }}>Revenue by Plan</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 3 }}>Monthly recurring revenue per subscription tier</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data.planDistribution.map((plan, i) => {
              const maxRevenue = Math.max(...data.planDistribution.map(p => p.revenue), 1);
              const pct = (plan.revenue / maxRevenue) * 100;
              return (
                <Box key={plan.planName}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{plan.planName}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: PIE_COLORS[i % PIE_COLORS.length] }}>
                      ₱{plan.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${pct}%`,
                        bgcolor: PIE_COLORS[i % PIE_COLORS.length],
                        borderRadius: 4,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.3 }}>
                    {plan.count} subscriber{plan.count !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              );
            })}
            {data.planDistribution.length === 0 && (
              <Typography sx={{ color: 'text.secondary', fontSize: 13, textAlign: 'center', py: 4 }}>
                No subscription data available
              </Typography>
            )}
          </Box>
        </Card>
      </Box>

      {/* ── Recent Signups Table ── */}
      <DataTable
        title="Recent Tenant Signups"
        data={data.recentSignups}
        columns={signupColumns}
        keyExtractor={(row) => String(row.tenantId)}
        onRowClick={(row) => navigate({ to: '/tenants/$tenantId', params: { tenantId: String(row.tenantId) } })}
        defaultRowsPerPage={5}
      />
    </Box>
  );
}
