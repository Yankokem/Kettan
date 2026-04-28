import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';
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
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { fetchEmployees, createEmployee, createUser, type EmployeeDto } from './staffApi';

const ROLE_LABEL_MAP: Record<Exclude<AddStaffFormValues['role'], ''>, string> = {
  TenantAdmin: 'Tenant Admin',
  HqManager: 'HQ Manager',
  HqStaff: 'HQ Staff',
  BranchOwner: 'Branch Owner',
  BranchManager: 'Branch Manager',
  StoreStaff: 'Store Staff',
};

function toStaffMember(e: EmployeeDto): StaffMember {
  return {
    id: e.employeeId,
    name: `${e.firstName} ${e.lastName}`.trim(),
    email: e.email ?? '',
    role: e.position,
    location: e.branchName ?? 'Unassigned',
    status: e.isActive ? 'active' : 'inactive',
    avatar: `${e.firstName.charAt(0)}${e.lastName.charAt(0)}`.toUpperCase(),
    imageUrl: e.imageUrl ?? null,
  };
}

type StaffViewMode = 'card' | 'table';
type StaffStatusFilter = 'all' | StaffMember['status'];
type SortOption = 'name-asc' | 'name-desc' | 'recent';

export function StaffPage() {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<StaffViewMode>('card');

  useEffect(() => {
    setLoading(true);
    fetchEmployees()
      .then((employees: EmployeeDto[]) => {
        setStaffMembers(employees.map(toStaffMember));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateStaff = async (formValues: AddStaffFormValues) => {
    const roleValue = formValues.role;

    if (roleValue === '') {
      return;
    }

    let uploadedImageUrl = null;
    if (formValues.imageFile) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formValues.imageFile);
        const uploadRes = await api.post('/api/uploads/image', uploadFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (uploadRes.status >= 200 && uploadRes.status < 300) {
          const uploadData = uploadRes.data;
          // Backend returns { Url, PublicId } (PascalCase)
          uploadedImageUrl = uploadData.Url ?? uploadData.url ?? null;
          console.log('[Upload] Cloudinary URL:', uploadedImageUrl);
        } else {
          const errData = uploadRes.data;
          console.error('[Upload] Image upload failed:', uploadRes.status, errData);
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
      }
    }

    try {
      // Map AddStaffFormValues role to backend position string
      const position = ROLE_LABEL_MAP[roleValue] || roleValue;

      // 1. Create User account so they can log in
      await createUser({
        email: formValues.email,
        password: formValues.password,
        role: roleValue,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        birthday: formValues.birthday,
        contactNo: formValues.contactNo,
      });
      
      // 2. Save Employee record for directory/payroll
      const newEmployee = await createEmployee({
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        position: position,
        isActive: true,
        email: formValues.email,
        imageUrl: uploadedImageUrl,
      });

      // Update local state with the saved data
      setStaffMembers((previous) => [toStaffMember(newEmployee), ...previous]);
    } catch (err) {
      console.error('Failed to create staff member:', err);
      alert('An error occurred while creating the staff member.');
    }
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
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Staff"
              value={stats.total}
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
            { value: 'card', label: '', icon: <ViewModuleRoundedIcon sx={{ fontSize: 16 }} /> },
            { value: 'table', label: '', icon: <TableRowsRoundedIcon sx={{ fontSize: 16 }} /> },
          ]}
        />

        <Button startIcon={<PersonAddAlt1RoundedIcon />} onClick={() => setIsAddStaffModalOpen(true)}>
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
      </DataStateWrapper>

      <AddStaffModal
        open={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        onSave={handleCreateStaff}
      />
    </Box>
  );
}
