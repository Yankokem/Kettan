import { Box } from '@mui/material';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import type { StaffMember } from './types';
import { StaffCard } from './components/StaffCard';
import { CustomButton } from '../../components/UI/CustomButton';
import { SearchInput } from '../../components/UI/SearchInput';
import { Dropdown } from '../../components/UI/Dropdown';

const MOCK_STAFF: StaffMember[] = [
  { id: 1, name: 'Sarah Jenkins', email: 's.jenkins@kettan.co', role: 'Branch Manager', location: 'Makati Headquarters', status: 'active', avatar: 'SJ' },
  { id: 2, name: 'Miguel Santos', email: 'm.santos@kettan.co', role: 'Branch Manager', location: 'BGC High Street', status: 'active', avatar: 'MS' },
  { id: 3, name: 'Anna Cruz', email: 'a.cruz@kettan.co', role: 'HQ Executive', location: 'Global HQ', status: 'active', avatar: 'AC' },
  { id: 4, name: 'David Lee', email: 'd.lee@kettan.co', role: 'Barista', location: 'Ortigas Center', status: 'inactive', avatar: 'DL' },
];

export function StaffPage() {
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

        <CustomButton startIcon={<PersonAddAlt1RoundedIcon />}>
          Invite Staff
        </CustomButton>
      </Box>
      
      {/* Staff Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {MOCK_STAFF.map((staff) => (
          <StaffCard key={staff.id} staff={staff} />
        ))}
      </Box>
    </Box>
  );
}
