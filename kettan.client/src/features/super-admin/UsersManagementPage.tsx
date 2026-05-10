import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { SearchInput } from '../../components/UI/SearchInput';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import { StatCard } from '../../components/UI/StatCard';
import { fetchPlatformUsers, updateUserStatus, archiveUser, type PlatformUserRow } from './usersManagementApi';

function ActionsMenu({ row, onRefresh }: { row: PlatformUserRow; onRefresh: () => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleToggleStatus = async () => {
    try {
      await updateUserStatus(row.userId, !row.isActive);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      handleClose();
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this user?')) return;
    try {
      await archiveUser(row.userId);
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
        <MenuItem onClick={() => { handleClose(); /* Navigate to profile */ }}>
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="View Profile" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          <ListItemIcon><BlockRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText 
            primary={row.isActive ? "Set Inactive" : "Set Active"} 
            primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} 
          />
        </MenuItem>
        <MenuItem onClick={handleArchive}>
          <ListItemIcon><ArchiveRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="Archive" primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: 'error.main' }} />
        </MenuItem>
      </Menu>
    </>
  );
}

export function UsersManagementPage() {
  const [users, setUsers] = useState<PlatformUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const loadUsers = () => {
    setLoading(true);
    fetchPlatformUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const inactive = total - active;
    
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = users.filter(u => new Date(u.createdAt) >= firstOfMonth).length;

    // Optional: Calculate HQ vs Branch
    const hqCount = users.filter(u => u.tenantName === 'Kettan HQ').length;

    return { total, active, inactive, newThisMonth, hqCount };
  }, [users]);

  const COMPANY_OPTIONS = useMemo(() => {
    const companies = Array.from(new Set(users.map(u => u.tenantName))).filter(Boolean).sort();
    return [
      { value: '', label: 'All Companies' },
      ...companies.map(c => ({ value: c, label: c }))
    ];
  }, [users]);

  // Filter and sort users locally
  const sortedAndFilteredUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.tenantName.toLowerCase().includes(q) ||
        u.userId.toString().includes(q)
      );
    }

    if (roleFilter) {
      result = result.filter(u => u.role === roleFilter);
    }

    if (statusFilter) {
      if (statusFilter === 'Active') result = result.filter(u => u.isActive);
      if (statusFilter === 'Inactive') result = result.filter(u => !u.isActive);
    }

    if (companyFilter) {
      result = result.filter(u => u.tenantName === companyFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name-asc') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === 'name-desc') return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      // newest by default
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [users, searchQuery, roleFilter, statusFilter, companyFilter, sortBy]);

  const theme = useTheme();

  const columns: ColumnDef<PlatformUserRow>[] = [
    {
      key: 'userId',
      label: 'User ID',
      sortable: true,
      width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6B4C2A', fontFamily: 'monospace' }}>
          #{row.userId}
        </Typography>
      ),
    },
    {
      key: 'tenantName',
      label: 'Company',
      sortable: true,
      gridWidth: '1.2fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
          {row.tenantName}
        </Typography>
      ),
    },
    {
      key: 'branchName',
      label: 'Branch',
      sortable: true,
      gridWidth: '1fr',
      render: (row) => {
        let branch = row.branchName;
        // If it's an HQ-based role and branch is N/A or empty, show HQ
        if (!branch || branch === 'N/A') {
          const hqRoles = ['SuperAdmin', 'TenantAdmin', 'HqManager', 'HqStaff'];
          if (hqRoles.includes(row.role)) {
            branch = 'HQ';
          }
        }
        return (
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {branch}
          </Typography>
        );
      },
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      gridWidth: '1.8fr',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
            {row.firstName} {row.lastName}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.2 }}>
            {row.email}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      gridWidth: '1fr',
      render: (row) => {
        const roleStyle = theme.custom?.roles?.[row.role] || { bg: 'transparent', text: '#374151' };
        return (
          <Typography sx={{ 
            fontSize: 13,
            fontWeight: 500,
            color: roleStyle.text,
            whiteSpace: 'nowrap'
          }}>
            {row.role.replace(/([A-Z])/g, ' $1').trim()}
          </Typography>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 100,
      render: (row) => {
        const isActive = row.isActive;
        const color = isActive ? '#047857' : (row.status === 'Archived' ? '#6B7280' : '#B91C1C');
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>
            {isActive ? 'Active' : row.status}
          </Typography>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Date Added',
      sortable: true,
      sortAccessor: (row) => new Date(row.createdAt).getTime(),
      width: 180,
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
      render: (row) => <ActionsMenu row={row} onRefresh={loadUsers} />,
    },
  ];

  return (
    <Box sx={{ pb: 3, display: 'grid', gap: 3 }}>
      <LoadingOverlay open={loading} />

      {/* Row 1: StatCards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' },
          gap: 2.5,
          mb: 1,
        }}
      >
        <StatCard
          label="Total Users"
          value={stats.total}
          sub={`${stats.hqCount} HQ staff`}
          icon={<GroupRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Active Users"
          value={stats.active}
          sub={`of ${stats.total} total`}
          icon={<CheckCircleOutlineRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Inactive / Suspended"
          value={stats.inactive}
          sub="Requires review"
          icon={<BlockRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="New Signups"
          value={stats.newThisMonth}
          sub="This month"
          icon={<TrendingUpRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      {/* Row 2: Filters & Search */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1.2, flexWrap: 'wrap' }}>
        <SearchInput
          placeholder="Search by name, email, company..."
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
          minWidth={140}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive / Suspended' },
          ]}
        />

        <FilterDropdown
          label="Company"
          icon={<BusinessRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={companyFilter}
          onChange={setCompanyFilter}
          minWidth={180}
          options={COMPANY_OPTIONS}
        />

        <FilterDropdown
          label="Role"
          icon={<BadgeRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={roleFilter}
          onChange={setRoleFilter}
          minWidth={160}
          options={[
            { value: '', label: 'All Roles' },
            { value: 'SuperAdmin', label: 'Super Admin' },
            { value: 'TenantAdmin', label: 'Tenant Admin' },
            { value: 'HqManager', label: 'HQ Manager' },
            { value: 'HqStaff', label: 'HQ Staff' },
            { value: 'BranchOwner', label: 'Branch Owner' },
            { value: 'BranchManager', label: 'Branch Manager' },
          ]}
        />
      </Box>

      {/* Row 3: DataTable */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataTable
          data={sortedAndFilteredUsers}
          columns={columns}
          keyExtractor={(row) => String(row.userId)}
          emptyMessage={loading ? 'Loading users...' : 'No users found matching your filters.'}
          defaultRowsPerPage={10}
          pageSizes={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
}
