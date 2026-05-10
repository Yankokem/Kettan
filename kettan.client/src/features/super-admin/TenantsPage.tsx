import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { SearchInput } from '../../components/UI/SearchInput';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import { StatCard } from '../../components/UI/StatCard';
import { fetchTenants, toggleTenantStatus, type TenantRow } from './tenantsApi';
import { api } from '../../utils/api';

function ActionsMenu({ row, onRefresh }: { row: TenantRow; onRefresh: () => void }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleToggleStatus = async () => {
    try {
      await toggleTenantStatus(String(row.tenantId), !row.isActive);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      handleClose();
    }
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick} sx={{ color: 'text.secondary' }}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <MenuItem onClick={() => { 
          handleClose(); 
          navigate({ to: '/tenants/$tenantId', params: { tenantId: String(row.tenantId) } });
        }}>
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          <ListItemIcon>
            {row.isActive ? 
              <BlockRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /> : 
              <CheckCircleRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            }
          </ListItemIcon>
          <ListItemText 
            primary={row.isActive ? "Deactivate Tenant" : "Activate Tenant"} 
            primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} 
          />
        </MenuItem>
      </Menu>
    </>
  );
}

export function TenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchTenants(),
      api.get('/api/admin/dashboard').then(res => res.data)
    ])
      .then(([tenantData, dashboardData]) => {
        setTenants(tenantData);
        setStats(dashboardData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAndSortedTenants = useMemo(() => {
    let result = [...tenants];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(q) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        t.tenantId.toString().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter(t => t.subscriptionStatus === statusFilter);
    }

    if (planFilter) {
      result = result.filter(t => t.subscriptionTier === planFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [tenants, searchQuery, statusFilter, planFilter, sortBy]);

  const PLAN_OPTIONS = useMemo(() => {
    const plans = Array.from(new Set(tenants.map(t => t.subscriptionTier))).filter(Boolean).sort();
    return [
      { value: '', label: 'All Plans' },
      ...plans.map(p => ({ value: p, label: p }))
    ];
  }, [tenants]);

  const columns: ColumnDef<TenantRow>[] = [
    {
      key: 'tenantId',
      label: 'Tenant ID',
      width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', letterSpacing: '-0.02em' }}>
          #{row.tenantId}
        </Typography>
      ),
    },
    {
      key: 'name',
      label: 'Tenant Name',
      gridWidth: '1.5fr',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{row.name}</Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.2 }}>
            {row.email || 'No email provided'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'subscriptionTier',
      label: 'Plan',
      gridWidth: '1fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#6B4C2A' }}>
          {row.subscriptionTier}
        </Typography>
      ),
    },
    {
      key: 'branchCount',
      label: 'Branches',
      gridWidth: '0.8fr',
      align: 'left',
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{row.branchCount}</Typography>,
    },
    {
      key: 'userCount',
      label: 'Users',
      gridWidth: '0.8fr',
      align: 'left',
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{row.userCount}</Typography>,
    },
    {
      key: 'subscriptionStatus',
      label: 'Status',
      gridWidth: '1fr',
      render: (row) => {
        const colors: Record<string, string> = {
          Active: '#047857',
          PendingPayment: '#B45309',
          Suspended: '#B91C1C',
        };
        const color = colors[row.subscriptionStatus] || '#64748B';
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>
            {row.subscriptionStatus}
          </Typography>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'DATE AND TIME JOINED',
      gridWidth: '1.6fr',
      align: 'left',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {new Date(row.createdAt).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 60,
      align: 'right',
      render: (row) => <ActionsMenu row={row} onRefresh={loadData} />,
    },
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
            mb: 0.5,
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

      {/* Filter Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 1.2, flexWrap: 'wrap' }}>
        <SearchInput
          placeholder="Search by name, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 240, md: 300 }, maxWidth: { sm: 420 }, flexShrink: 1 }}
        />

        <FilterDropdown
          label="Sort"
          icon={<SortRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={sortBy}
          onChange={(v) => setSortBy(v as string)}
          minWidth={160}
          options={[
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
            { value: 'name-asc', label: 'Name A-Z' },
            { value: 'name-desc', label: 'Name Z-A' },
          ]}
        />

        <FilterDropdown
          label="Status"
          icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={statusFilter}
          onChange={setStatusFilter}
          minWidth={160}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'PendingPayment', label: 'Pending Payment' },
            { value: 'Suspended', label: 'Suspended' },
          ]}
        />

        <FilterDropdown
          label="Plan"
          icon={<WorkspacePremiumRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={planFilter}
          onChange={setPlanFilter}
          minWidth={160}
          options={PLAN_OPTIONS}
        />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataTable
          data={filteredAndSortedTenants}
          columns={columns}
          keyExtractor={(row) => String(row.tenantId)}
          onRowClick={(row) => navigate({ to: '/tenants/$tenantId', params: { tenantId: String(row.tenantId) } })}
          emptyMessage={loading ? ' ' : 'No tenants found.'}
          defaultRowsPerPage={10}
          pageSizes={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
}
