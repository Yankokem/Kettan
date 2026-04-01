import { Box, Typography } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import type { Branch } from './types';
import { TenantRibbon } from './components/TenantRibbon';
import { BranchCard } from './components/BranchCard';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { Dropdown } from '../../components/UI/Dropdown';

// Mock Data
const MOCK_BRANCHES: Branch[] = [
  { id: 1, name: 'Makati HQ', location: 'Ayala Triangle, Makati City', manager: 'Sarah Jenkins', staff: 14, status: 'active' },
  { id: 2, name: 'BGC High Street', location: '5th Ave, Taguig', manager: 'Miguel Santos', staff: 8, status: 'active' },
  { id: 3, name: 'Ortigas Center', location: 'Emerald Ave, Pasig', manager: 'Anna Cruz', staff: 6, status: 'active' },
  { id: 4, name: 'Quezon City Circle', location: 'Tomas Morato, QC', manager: 'Pending Assignment', staff: 0, status: 'setup' },
];

export function BranchesPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Tenant Profile Overview Ribbon */}
      <TenantRibbon />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 17, minWidth: 'max-content' }}>
          Branch Locations ({MOCK_BRANCHES.length})
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'flex-end' }}>
          <SearchInput placeholder="Find a specific branch..." sx={{ maxWidth: 300, flex: 'none' }} />
          
          <Dropdown
            value="all"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active Branches' },
              { value: 'setup', label: 'Setup Pending' }
            ]}
          />

          <Button startIcon={<AddRoundedIcon />} onClick={() => navigate({ to: '/branches/add' })}>
            Add Branch
          </Button>
        </Box>
      </Box>
      
      {/* Branch Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {MOCK_BRANCHES.map((branch) => (
          <BranchCard key={branch.id} branch={branch} />
        ))}
      </Box>
    </Box>
  );
}
