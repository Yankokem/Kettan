import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';

import { DataTable, type ColumnDef, type QuickFilter } from '../../components/UI/DataTable';
import { SearchInput } from '../../components/UI/SearchInput';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import { StatCard } from '../../components/UI/StatCard';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import { fetchTenants, type TenantRow } from './tenantsApi';
import { api } from '../../utils/api';

export function TenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTenants(searchQuery, statusFilter),
      api.get('/api/admin/dashboard').then(res => res.data)
    ])
      .then(([tenantData, dashboardData]) => {
        setTenants(tenantData);
        setStats(dashboardData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, statusFilter]);

  const columns: ColumnDef<TenantRow>[] = [
    {
      key: 'name',
      label: 'Tenant Name',
      sortable: true,
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{row.name}</Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace', mt: 0.2 }}>
            {row.email || `Tenant #${row.tenantId}`}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'subscriptionTier',
      label: 'Plan',
      sortable: true,
      width: 130,
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
      key: 'branchCount',
      label: 'Branches',
      sortable: true,
      width: 100,
      align: 'right',
      render: (row) => <Typography sx={{ fontSize: 13 }}>{row.branchCount}</Typography>,
    },
    {
      key: 'userCount',
      label: 'Users',
      sortable: true,
      width: 90,
      align: 'right',
      render: (row) => <Typography sx={{ fontSize: 13 }}>{row.userCount}</Typography>,
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      width: 140,
      align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      ),
    },
    {
      key: 'subscriptionStatus',
      label: 'Status',
      width: 150,
      align: 'center',
      render: (row) => {
        const colors: Record<string, { color: string; bg: string }> = {
          Active: { color: '#047857', bg: 'rgba(4,120,87,0.12)' },
          PendingPayment: { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
          Suspended: { color: '#B91C1C', bg: 'rgba(185,28,28,0.1)' },
        };
        const style = colors[row.subscriptionStatus] || { color: '#64748B', bg: 'rgba(100,116,139,0.12)' };
        return (
          <Box
            sx={{
              fontSize: 11.5, fontWeight: 700,
              color: style.color, bgcolor: style.bg,
              px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block',
            }}
          >
            {row.subscriptionStatus}
          </Box>
        );
      },
    },
  ];

  const quickFilters: QuickFilter[] = [
    { label: 'Active', value: 'Active' },
    { label: 'Pending Payment', value: 'PendingPayment' },
    { label: 'Suspended', value: 'Suspended' },
  ];

  return (
    <Box sx={{ pb: 3, display: 'grid', gap: 3 }}>
      <LoadingOverlay open={loading} />

      {stats && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' },
            gap: 2.5,
            mb: 1,
          }}
        >
          <StatCard
            label="Total Tenants"
            value={stats.totalTenants}
            sub={`${stats.pendingPaymentTenants} pending payment`}
            icon={<StorefrontRoundedIcon />}
            accentClass="stat-accent-brown"
            iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
          />
          <StatCard
            label="Active Subscribers"
            value={stats.activeTenants}
            sub={`of ${stats.totalTenants} total`}
            icon={<CheckCircleOutlineRoundedIcon />}
            accentClass="stat-accent-sage"
            iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
          />
          <StatCard
            label="Pending Payment"
            value={stats.pendingPaymentTenants}
            sub="Requires attention"
            icon={<PaymentRoundedIcon />}
            accentClass="stat-accent-gold"
            iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
          />
          <StatCard
            label="Total Platform Users"
            value={stats.totalUsers}
            sub={`Across ${stats.totalBranches} branches`}
            icon={<GroupRoundedIcon />}
            accentClass="stat-accent-brown"
            iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
          />
        </Box>
      )}


      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataTable
          data={tenants}
          columns={columns}
          keyExtractor={(row) => String(row.tenantId)}
          quickFilters={quickFilters}
          activeQuickFilter={statusFilter}
          onQuickFilterChange={setStatusFilter}
          onRowClick={(row) => navigate({ to: '/tenants/$tenantId', params: { tenantId: String(row.tenantId) } })}
          emptyMessage={loading ? ' ' : 'No tenants found.'}
          toolbar={
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <SearchInput
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 300 }}
              />
            </Box>
          }
        />
      </Box>
    </Box>
  );
}
