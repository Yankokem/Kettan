import { useMemo, useState } from 'react';
import { Box, Grid } from '@mui/material';
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
import type { StaffMember } from './types';
import { StaffCard } from './components/StaffCard';
import { AddStaffModal, type AddStaffFormValues } from './components/AddStaffModal';
import { StaffTableView } from './components/StaffTableView';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { ViewToggle } from '../../components/UI/ViewToggle';
import { StatCard } from '../../components/UI/StatCard';
import { BRANCHES_MOCK } from '../branches/mockData';

const MOCK_STAFF: StaffMember[] = [
  { id: 1, name: 'Sarah Jenkins', email: 's.jenkins@kettan.co', role: 'Branch Manager', location: 'Makati Headquarters', status: 'active', avatar: 'SJ', imageUrl: null },
  { id: 2, name: 'Miguel Santos', email: 'm.santos@kettan.co', role: 'Branch Manager', location: 'BGC High Street', status: 'active', avatar: 'MS', imageUrl: null },
  { id: 3, name: 'Anna Cruz', email: 'a.cruz@kettan.co', role: 'HQ Executive', location: 'Global HQ', status: 'active', avatar: 'AC', imageUrl: null },
  { id: 4, name: 'David Lee', email: 'd.lee@kettan.co', role: 'Store Staff', location: 'Ortigas Center', status: 'inactive', avatar: 'DL', imageUrl: null },
  { id: 5, name: 'Lea Robles', email: 'l.robles@kettan.co', role: 'Store Staff', location: 'Eastwood', status: 'archived', avatar: 'LR', imageUrl: null },
];

const ROLE_LABEL_MAP: Record<Exclude<AddStaffFormValues['role'], ''>, string> = {
  hq: 'HQ Executive',
  manager: 'Branch Manager',
  staff: 'Store Staff',
};

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();

type StaffViewMode = 'card' | 'table';
type StaffStatusFilter = 'all' | StaffMember['status'];
type SortOption = 'name-asc' | 'name-desc' | 'recent';

export function StaffPage() {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(MOCK_STAFF);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<StaffViewMode>('card');

  const branchOptions = useMemo(
    () =>
      BRANCHES_MOCK.map((branch) => ({
        value: branch.id.toString(),
        label: branch.name,
      })),
    []
  );

  const handleCreateStaff = (formValues: AddStaffFormValues) => {
    const roleValue = formValues.role;

    if (roleValue === '') {
      return;
    }

    const nextId = staffMembers.reduce((maxId, staff) => Math.max(maxId, staff.id), 0) + 1;
    const branchLabel = branchOptions.find((option) => option.value === formValues.branchAssignment)?.label ?? 'Unassigned';

    setStaffMembers((previous) => [
      {
        id: nextId,
        name: `${formValues.firstName} ${formValues.lastName}`,
        email: formValues.email,
        role: ROLE_LABEL_MAP[roleValue],
        location: branchLabel,
        status: 'active',
        avatar: getInitials(formValues.firstName, formValues.lastName),
        imageUrl: formValues.imagePreviewUrl,
      },
      ...previous,
    ]);
  };

  const handleOpenProfile = (staffId: number) => {
    navigate({ to: '/staff/$staffId', params: { staffId: staffId.toString() } });
  };

  const handleEditStaff = (staffId: number) => {
    console.log('Edit staff:', staffId);
  };

  const handleInactivateStaff = (staffId: number) => {
    setStaffMembers((previous) =>
      previous.map((staff) => (staff.id === staffId && staff.status !== 'archived' ? { ...staff, status: 'inactive' } : staff))
    );
  };

  const handleArchiveStaff = (staffId: number) => {
    setStaffMembers((previous) =>
      previous.map((staff) => (staff.id === staffId ? { ...staff, status: 'archived' } : staff))
    );
  };

  const roleOptions = useMemo(() => {
    const uniqueRoles = Array.from(new Set(staffMembers.map((staff) => staff.role))).sort();
    return uniqueRoles.map((role) => ({ value: role, label: role }));
  }, [staffMembers]);

  const filteredStaff = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const searched = staffMembers.filter((staff) => {
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
    const total = staffMembers.length;
    const active = staffMembers.filter((staff) => staff.status === 'active').length;
    const inactive = staffMembers.filter((staff) => staff.status === 'inactive').length;
    const archived = staffMembers.filter((staff) => staff.status === 'archived').length;

    return { total, active, inactive, archived };
  }, [staffMembers]);

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Staff"
              value={stats.total}
              sub="Across all branches"
              trend="up"
              trendValue="+1"
              icon={<Groups2RoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="#B08B5A"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Active Staff"
              value={stats.active}
              sub="Currently operational"
              trend="up"
              trendValue="+2"
              icon={<VerifiedUserRoundedIcon />}
              accentClass="stat-accent-gold"
              iconBg="#C2AA6B"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Inactive Staff"
              value={stats.inactive}
              sub="Temporarily unavailable"
              trend="down"
              trendValue="-1"
              icon={<PersonOffRoundedIcon />}
              accentClass="stat-accent-sage"
              iconBg="#7EAD6D"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Archived Staff"
              value={stats.archived}
              sub="No longer active records"
              trend="down"
              trendValue="-1"
              icon={<ArchiveRoundedIcon />}
              accentClass="stat-accent-error"
              iconBg="#EC6666"
            />
          </Grid>
        </Grid>
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
            { value: 'card', label: 'Card', icon: <ViewModuleRoundedIcon sx={{ fontSize: 16 }} /> },
            { value: 'table', label: 'Table', icon: <TableRowsRoundedIcon sx={{ fontSize: 16 }} /> },
          ]}
        />

        <Button startIcon={<PersonAddAlt1RoundedIcon />} onClick={() => setIsAddStaffModalOpen(true)}>
          Add Staff
        </Button>
      </Box>

      {viewMode === 'card' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          {filteredStaff.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              onEdit={handleEditStaff}
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
          onInactivate={handleInactivateStaff}
          onArchive={handleArchiveStaff}
        />
      )}

      <AddStaffModal
        open={isAddStaffModalOpen}
        branchOptions={branchOptions}
        onClose={() => setIsAddStaffModalOpen(false)}
        onSave={handleCreateStaff}
      />
    </Box>
  );
}
