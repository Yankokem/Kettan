import { Box } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import { useNavigate } from '@tanstack/react-router';

import { StatCard } from '../../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';

interface MockTenant {
  id: string;
  name: string;
  subscription: 'Starter' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Suspended';
  branches: number;
}

const MOCK_TENANTS: MockTenant[] = [
  { id: 'T-001', name: 'Downtown Cafe Network', subscription: 'Pro', status: 'Active', branches: 4 },
  { id: 'T-002', name: 'Sunside Roasters', subscription: 'Starter', status: 'Active', branches: 1 },
  { id: 'T-003', name: 'Metro Bakery & Coffee', subscription: 'Enterprise', status: 'Active', branches: 12 },
  { id: 'T-004', name: 'Local Brews Corp', subscription: 'Starter', status: 'Suspended', branches: 2 },
];

export function SuperAdminDashboard() {
  const navigate = useNavigate();

  const columns: ColumnDef<MockTenant>[] = [
    {
      key: 'name',
      label: 'Tenant Name',
      render: (row) => <Box sx={{ fontSize: 13, fontWeight: 600 }}>{row.name}</Box>,
    },
    {
      key: 'subscription',
      label: 'Plan',
      width: 150,
      render: (row) => <Box sx={{ fontSize: 13 }}>{row.subscription}</Box>,
    },
    {
      key: 'status',
      label: 'Status',
      width: 150,
      render: (row) => (
        <Box
          sx={{
            fontSize: 11.5,
            fontWeight: 700,
            color: row.status === 'Active' ? '#047857' : '#B91C1C',
            bgcolor: row.status === 'Active' ? 'rgba(4,120,87,0.12)' : 'rgba(185,28,28,0.1)',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            display: 'inline-block',
          }}
        >
          {row.status}
        </Box>
      ),
    },
    {
      key: 'branches',
      label: 'Branches',
      width: 100,
      align: 'right',
      render: (row) => <Box sx={{ fontSize: 13 }}>{row.branches}</Box>,
    },
  ];

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
          label="Total Tenants"
          value={42}
          sub="Across all regions"
          trend="up"
          trendValue="+3"
          icon={<StorefrontRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Active Users"
          value={1280}
          sub="Branch & HQ staff"
          trend="up"
          trendValue="+45"
          icon={<GroupRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Monthly MRR"
          value="$124,500"
          sub="Platform subscriptions"
          trend="up"
          trendValue="+$4.2k"
          icon={<AccountBalanceWalletRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Open Tickets"
          value={8}
          sub="Support requests"
          trend="down"
          trendValue="-2"
          icon={<ConfirmationNumberRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      {/* ── Tenants Table ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <DataTable
          title="Recent Tenants"
          data={MOCK_TENANTS}
          columns={columns}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate({ to: '/tenants/$tenantId', params: { tenantId: row.id } })}
        />
      </Box>
    </Box>
  );
}
