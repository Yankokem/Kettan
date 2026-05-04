import { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import type { StaffMember } from './types';
import { StaffCard } from './components/StaffCard';
import { StaffTableView } from './components/StaffTableView';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { ViewToggle } from '../../components/UI/ViewToggle';
import { StatCard } from '../../components/UI/StatCard';
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { ConfirmationModal } from '../../components/UI/ConfirmationModal';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchEmployees, updateEmployeeStatus, type EmployeeDto } from './staffApi';

function toStaffMember(e: EmployeeDto): StaffMember {
  return {
    id: e.userId,
    name: `${e.firstName} ${e.lastName}`.trim(),
    email: e.email ?? '',
    role: e.role,
    location: e.branchName ?? 'Unassigned',
    status: e.status === 0 ? 'active' : e.status === 1 ? 'inactive' : 'archived',
    avatar: `${e.firstName.charAt(0)}${e.lastName.charAt(0)}`.toUpperCase(),
    imageUrl: e.imageUrl ?? null,
  };
}

type StaffViewMode = 'card' | 'table';
type StaffStatusFilter = 'all' | StaffMember['status'];
type SortOption = 'name-asc' | 'name-desc' | 'recent';

export function StaffPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('active');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<StaffViewMode>('card');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    staffId: number | null;
    staffName: string;
    action: 'inactivate' | 'archive';
  }>({
    open: false,
    staffId: null,
    staffName: '',
    action: 'inactivate',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // RBAC Check
  const isAuthorized = currentUser?.role === 'TenantAdmin' || currentUser?.role === 'HqManager';

  useEffect(() => {
    if (!isAuthorized) return;

    setLoading(true);
    fetchEmployees()
      .then((employees: EmployeeDto[]) => {
        setStaffMembers(employees.map(toStaffMember));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <Box sx={{ 
        height: '70vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2,
        color: 'text.secondary'
      }}>
        <SecurityRoundedIcon sx={{ fontSize: 64, opacity: 0.2 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Access Denied
        </Typography>
        <Typography sx={{ maxWidth: 400, textAlign: 'center', fontWeight: 500 }}>
          Only Tenant Administrators and HQ Managers have permission to access the Staff Directory. 
          Please contact your administrator if you believe this is an error.
        </Typography>
        <Button onClick={() => navigate({ to: '/' })} sx={{ mt: 2 }}>
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  const handleOpenProfile = (staffId: number) => {
    navigate({ to: '/staff/$staffId', params: { staffId: staffId.toString() } });
  };

  const handleEditStaff = (staffId: number) => {
    navigate({ to: '/staff/$staffId/edit', params: { staffId: staffId.toString() } });
  };

  const handleActivateStaff = async (staffId: number) => {
    try {
      await updateEmployeeStatus(staffId, 0); // 0 = Active
      setStaffMembers((previous) =>
        previous.map((staff) => (staff.id === staffId ? { ...staff, status: 'active' } : staff))
      );
    } catch (err) {
      console.error('Failed to activate staff:', err);
    }
  };

  const handleInactivateStaff = (staffId: number) => {
    if (String(staffId) === currentUser?.id) return;
    const staff = staffMembers.find(s => s.id === staffId);
    setConfirmModal({
      open: true,
      staffId,
      staffName: staff?.name || 'this staff member',
      action: 'inactivate',
    });
  };

  const handleArchiveStaff = (staffId: number) => {
    if (String(staffId) === currentUser?.id) return;
    const staff = staffMembers.find(s => s.id === staffId);
    setConfirmModal({
      open: true,
      staffId,
      staffName: staff?.name || 'this staff member',
      action: 'archive',
    });
  };

  const executeStatusChange = async () => {
    if (!confirmModal.staffId) return;

    setActionLoading(true);
    try {
      const newStatus = confirmModal.action === 'archive' ? 2 : 1;
      await updateEmployeeStatus(confirmModal.staffId, newStatus);
      
      setStaffMembers((previous) =>
        previous.map((staff) => 
          staff.id === confirmModal.staffId 
            ? { ...staff, status: confirmModal.action === 'archive' ? 'archived' : 'inactive' } 
            : staff
        )
      );
      setConfirmModal(prev => ({ ...prev, open: false }));
    } catch (err) {
      console.error(`Failed to ${confirmModal.action} staff:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const roleOptions = useMemo(() => {
    return [
      { value: 'TenantAdmin', label: 'Tenant Admin' },
      { value: 'HqManager', label: 'HQ Manager' },
      { value: 'HqStaff', label: 'HQ Staff' },
      { value: 'BranchOwner', label: 'Branch Owner' },
      { value: 'BranchManager', label: 'Branch Manager' },
    ];
  }, []);

  const filteredStaff = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const searched = staffMembers.filter((staff) => {
      // Hide Tenant Admins from the directory list
      if (staff.role === 'TenantAdmin') return false;

      if (!query) {
        return true;
      }

      return [staff.name, staff.email, staff.role, staff.location].some((value) => value.toLowerCase().includes(query));
    });

    const roleFiltered = searched.filter((staff) => (roleFilter === 'all' ? true : staff.role === roleFilter));
    const statusFiltered = roleFiltered.filter((staff) => (statusFilter === 'all' ? true : staff.status === statusFilter));

    if (sortBy === 'name-asc') {
      return [...statusFiltered].sort((left, right) => left.name.localeCompare(right.name));
    }

    if (sortBy === 'name-desc') {
      return [...statusFiltered].sort((left, right) => right.name.localeCompare(left.name));
    }

    return [...statusFiltered].sort((left, right) => right.id - left.id);
  }, [roleFilter, searchTerm, sortBy, staffMembers, statusFilter]);

  const stats = useMemo(() => {
    const visibleStaff = staffMembers.filter(s => s.role !== 'TenantAdmin');
    const total = visibleStaff.length;
    const active = visibleStaff.filter((staff) => staff.status === 'active').length;
    const inactive = visibleStaff.filter((staff) => staff.status === 'inactive').length;
    const archived = visibleStaff.filter((staff) => staff.status === 'archived').length;

    return { total, active, inactive, archived };
  }, [staffMembers]);

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        <StatCard
          label="Total Staff"
          value={stats.total}
          trend="up"
          trendValue="+1"
          icon={<Groups2RoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="#B08B5A"
        />
        <StatCard
          label="Active Staff"
          value={stats.active}
          trend="up"
          trendValue="+2"
          icon={<VerifiedUserRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="#C2AA6B"
        />
        <StatCard
          label="Inactive Staff"
          value={stats.inactive}
          trend="down"
          trendValue="-1"
          icon={<PersonOffRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="#7EAD6D"
        />
        <StatCard
          label="Archived Staff"
          value={stats.archived}
          trend="down"
          trendValue="-1"
          icon={<ArchiveRoundedIcon />}
          accentClass="stat-accent-error"
          iconBg="#EC6666"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1.2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchInput
          placeholder="Search staff by name, email, role, or branch..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          sx={{ minWidth: 240, flex: 1 }}
        />

        <FilterDropdown
          value={roleFilter === 'all' ? '' : roleFilter}
          onChange={(value) => setRoleFilter(value || 'all')}
          options={roleOptions}
          label="Role"
          icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={170}
        />

        <FilterDropdown
          value={statusFilter === 'all' ? '' : statusFilter}
          onChange={(value) => setStatusFilter((value || 'all') as StaffStatusFilter)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'archived', label: 'Archived' },
          ]}
          label="Status"
          icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={150}
        />

        <FilterDropdown
          value={sortBy}
          onChange={(value) => setSortBy(value as SortOption)}
          options={[
            { value: 'recent', label: 'Most Recent' },
            { value: 'name-asc', label: 'Name A-Z' },
            { value: 'name-desc', label: 'Name Z-A' },
          ]}
          label="Sort"
          icon={<SortRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={170}
        />

        <ViewToggle
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'card', label: '', icon: <ViewModuleRoundedIcon sx={{ fontSize: 16 }} /> },
            { value: 'table', label: '', icon: <TableRowsRoundedIcon sx={{ fontSize: 16 }} /> },
          ]}
        />

        <Button startIcon={<PersonAddAlt1RoundedIcon />} onClick={() => navigate({ to: '/staff/add' })}>
          Add Staff
        </Button>
      </Box>

      <DataStateWrapper
        loading={loading}
        error={error}
        isEmpty={filteredStaff.length === 0}
        emptyTitle={searchTerm ? 'No staff found' : 'Your directory is empty'}
        emptyMessage={searchTerm ? 'We couldn\'t find any staff members matching your search terms.' : 'Ready to onboard your team? Start by adding your first staff member to the directory.'}
        emptyIcon={<Groups2RoundedIcon />}
      >
        {viewMode === 'card' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {filteredStaff.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                onEdit={handleEditStaff}
                onActivate={handleActivateStaff}
                onInactivate={handleInactivateStaff}
                onArchive={handleArchiveStaff}
              />
            ))}
          </Box>
        ) : (
          <StaffTableView
            data={filteredStaff}
            onOpenProfile={handleOpenProfile}
            onEdit={handleEditStaff}
            onActivate={handleActivateStaff}
            onInactivate={handleInactivateStaff}
            onArchive={handleArchiveStaff}
          />
        )}
      </DataStateWrapper>

      <ConfirmationModal
        open={confirmModal.open}
        title={confirmModal.action === 'archive' ? 'Archive Staff Member?' : 'Inactivate Staff Member?'}
        message={
          confirmModal.action === 'archive'
            ? `Are you sure you want to archive ${confirmModal.staffName}? This will revoke all system access and hide them from active lists.`
            : `Are you sure you want to inactivate ${confirmModal.staffName}? They will no longer be able to log in until reactivated.`
        }
        confirmLabel={confirmModal.action === 'archive' ? 'Archive Staff' : 'Inactivate Staff'}
        severity={confirmModal.action === 'archive' ? 'danger' : 'warning'}
        onConfirm={executeStatusChange}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        loading={actionLoading}
      />
    </Box>
  );
}
