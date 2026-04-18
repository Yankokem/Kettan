import { Box, Typography } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useState } from 'react';

import { DataTable, type ColumnDef, type QuickFilter } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';

export interface TenantRow {
  id: string;
  name: string;
  plan: string;
  status: 'Active' | 'Suspended';
  branches: number;
  joined: string;
}

const MOCK_TENANTS: TenantRow[] = [
  { id: 'T-001', name: 'Downtown Cafe Network', plan: 'Pro', status: 'Active', branches: 4, joined: '2025-11-20' },
  { id: 'T-002', name: 'Sunside Roasters', plan: 'Starter', status: 'Active', branches: 1, joined: '2026-01-15' },
  { id: 'T-003', name: 'Metro Bakery & Coffee', plan: 'Enterprise', status: 'Active', branches: 12, joined: '2024-06-10' },
  { id: 'T-004', name: 'Local Brews Corp', plan: 'Starter', status: 'Suspended', branches: 2, joined: '2026-03-05' },
  { id: 'T-005', name: 'Brew Hub Inc', plan: 'Pro', status: 'Active', branches: 3, joined: '2026-02-28' },
];

export function TenantsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredData = MOCK_TENANTS.filter((tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<TenantRow>[] = [
    {
      key: 'name',
      label: 'Tenant Name',
      sortable: true,
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{row.name}</Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace', mt: 0.2 }}>{row.id}</Typography>
        </Box>
      ),
    },
    {
      key: 'plan',
      label: 'Subscription',
      sortable: true,
      width: 150,
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.plan}</Typography>,
    },
    {
      key: 'branches',
      label: 'Branches',
      sortable: true,
      width: 120,
      align: 'right',
      render: (row) => <Typography sx={{ fontSize: 13 }}>{row.branches}</Typography>,
    },
    {
      key: 'joined',
      label: 'Joined Date',
      sortable: true,
      width: 150,
      align: 'right',
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.joined}</Typography>,
    },
    {
      key: 'status',
      label: 'Status',
      width: 150,
      align: 'center',
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
  ];

  const quickFilters: QuickFilter[] = [
    { label: 'Active', value: 'Active' },
    { label: 'Suspended', value: 'Suspended' },
  ];

  return (
    <Box sx={{ pb: 3, pt: 1, display: 'grid', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Tenant Management
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            Manage platform subscribers, their plans, and multi-branch structures.
          </Typography>
        </Box>
        <Button startIcon={<AddRoundedIcon />}>Onboard New Tenant</Button>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataTable
          data={filteredData}
          columns={columns}
          keyExtractor={(row) => row.id}
          quickFilters={quickFilters}
          activeQuickFilter={statusFilter}
          onQuickFilterChange={setStatusFilter}
          onRowClick={(row) => navigate({ to: '/tenants/$tenantId', params: { tenantId: row.id } })}
          toolbar={
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <SearchInput
                placeholder="Search tenants..."
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
