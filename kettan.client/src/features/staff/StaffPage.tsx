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
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { IconButton, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Divider } from '@mui/material';
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
import { fetchStaffStats, type StaffStatsDto, type StatMetricDto } from '../reports/reportsApi';

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
  const [staffStats, setStaffStats] = useState<StaffStatsDto | null>(null);

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title: string;
    icon: React.ReactNode;
    data: StatMetricDto | null;
  }>({ open: false, title: '', icon: null, data: null });

  const openDetail = (title: string, data: StatMetricDto | null | undefined, icon: React.ReactNode) => {
    if (!data) return;
    setDetailModal({ open: true, title, icon, data });
  };

  const closeDetail = () => setDetailModal(prev => ({ ...prev, open: false }));

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

    const loadData = async () => {
      try {
        setLoading(true);
        const [employees, stats] = await Promise.all([
          fetchEmployees(),
          fetchStaffStats()
        ]);
        setStaffMembers(employees.map(toStaffMember));
        setStaffStats(stats);
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
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
          value={staffStats?.totalStaff.currentValue ?? stats.total}
          trend={staffStats?.totalStaff.trend ?? 'up'}
          trendValue={`${staffStats?.totalStaff.percentageChange ?? 0}% vs last week`}
          icon={<Groups2RoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="#B08B5A"
          onClick={() => openDetail('Total Staff', staffStats?.totalStaff, <Groups2RoundedIcon />)}
        />
        <StatCard
          label="Active Staff"
          value={staffStats?.activeStaff.currentValue ?? stats.active}
          trend={staffStats?.activeStaff.trend ?? 'up'}
          trendValue={`${staffStats?.activeStaff.percentageChange ?? 0}% vs last week`}
          icon={<VerifiedUserRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="#C2AA6B"
          onClick={() => openDetail('Active Staff', staffStats?.activeStaff, <VerifiedUserRoundedIcon />)}
        />
        <StatCard
          label="Inactive Staff"
          value={staffStats?.inactiveStaff.currentValue ?? stats.inactive}
          trend={staffStats?.inactiveStaff.trend ?? 'down'}
          trendValue={`${staffStats?.inactiveStaff.percentageChange ?? 0}% vs last week`}
          icon={<PersonOffRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="#7EAD6D"
          onClick={() => openDetail('Inactive Staff', staffStats?.inactiveStaff, <PersonOffRoundedIcon />)}
        />
        <StatCard
          label="Archived Staff"
          value={staffStats?.archivedStaff.currentValue ?? stats.archived}
          trend={staffStats?.archivedStaff.trend ?? 'down'}
          trendValue={`${staffStats?.archivedStaff.percentageChange ?? 0}% vs last week`}
          icon={<ArchiveRoundedIcon />}
          accentClass="stat-accent-error"
          iconBg="#EC6666"
          onClick={() => openDetail('Archived Staff', staffStats?.archivedStaff, <ArchiveRoundedIcon />)}
        />
      </Box>

      {/* ── Detail Modal ── */}
      <Dialog 
        open={detailModal.open} 
        onClose={closeDetail}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: '#FCF9F6',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ 
          m: 0, p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(107, 76, 42, 0.08)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              color: '#6B4C2A', 
              opacity: 0.8,
              '& svg': { fontSize: 20 }
            }}>
              {detailModal.icon}
            </Box>
            <Typography sx={{ fontWeight: 800, color: '#6B4C2A', fontSize: '0.95rem' }}>
              {detailModal.title} Breakdown
            </Typography>
          </Box>
          <IconButton onClick={closeDetail} sx={{ color: '#6B4C2A' }}>
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List sx={{ py: 0 }}>
            {!detailModal.data || detailModal.data.items.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No records to display for this metric.
                </Typography>
              </Box>
            ) : (
              detailModal.data.items.map((item, idx) => (
                <Box key={item.id}>
                  <ListItem 
                    sx={{ 
                      py: 1.2, px: 3, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(107, 76, 42, 0.04)' }
                    }}
                    onClick={() => {
                      closeDetail();
                      const staffId = item.id.replace('USR-', '');
                      navigate({ to: '/staff/$staffId', params: { staffId } });
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 700, color: '#6B4C2A', fontSize: '0.82rem' }}>
                          {item.id} — {item.title}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {item.subtitle} {item.date && `• ${new Date(item.date).toLocaleDateString()}`}
                        </Typography>
                      }
                    />
                    <ArrowForwardIosRoundedIcon sx={{ fontSize: 12, color: 'rgba(107, 76, 42, 0.3)' }} />
                  </ListItem>
                  {idx < (detailModal.data?.items.length ?? 0) - 1 && <Divider sx={{ opacity: 0.5 }} />}
                </Box>
              ))
            )}
          </List>
        </DialogContent>
      </Dialog>

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
