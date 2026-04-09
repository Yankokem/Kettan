import { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import type { StaffMember } from './types';
import { StaffCard } from './components/StaffCard';
import { AddStaffModal, type AddStaffFormValues } from './components/AddStaffModal';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { Dropdown } from '../../components/UI/Dropdown';
import { BRANCHES_MOCK } from '../branches/mockData';

const MOCK_STAFF: StaffMember[] = [
  { id: 1, name: 'Sarah Jenkins', email: 's.jenkins@kettan.co', role: 'Branch Manager', location: 'Makati Headquarters', status: 'active', avatar: 'SJ' },
  { id: 2, name: 'Miguel Santos', email: 'm.santos@kettan.co', role: 'Branch Manager', location: 'BGC High Street', status: 'active', avatar: 'MS' },
  { id: 3, name: 'Anna Cruz', email: 'a.cruz@kettan.co', role: 'HQ Executive', location: 'Global HQ', status: 'active', avatar: 'AC' },
  { id: 4, name: 'David Lee', email: 'd.lee@kettan.co', role: 'Barista', location: 'Ortigas Center', status: 'inactive', avatar: 'DL' },
];

const ROLE_LABEL_MAP: Record<Exclude<AddStaffFormValues['role'], ''>, string> = {
  hq: 'HQ Executive',
  manager: 'Branch Manager',
  staff: 'Store Staff',
};

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();

export function StaffPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(MOCK_STAFF);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);

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
      },
      ...previous,
    ]);
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Toolbox: Search / Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <SearchInput placeholder="Search employees by name, email, or role..." sx={{ flex: 1 }} />
        
        <Dropdown 
          value="all" 
          options={[
            { value: 'all', label: 'All Roles' },
            { value: 'hq', label: 'HQ Executives' },
            { value: 'manager', label: 'Branch Managers' }
          ]} 
        />

        <Button startIcon={<PersonAddAlt1RoundedIcon />} onClick={() => setIsAddStaffModalOpen(true)}>
          Add Staff
        </Button>
      </Box>
      
      {/* Staff Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {staffMembers.map((staff) => (
          <StaffCard key={staff.id} staff={staff} />
        ))}
      </Box>

      <AddStaffModal
        open={isAddStaffModalOpen}
        branchOptions={branchOptions}
        onClose={() => setIsAddStaffModalOpen(false)}
        onSave={handleCreateStaff}
      />
    </Box>
  );
}
