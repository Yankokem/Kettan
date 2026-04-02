import { Box, Typography, Grid } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import type { Branch } from './types';
import { BranchCard } from './components/BranchCard';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { Dropdown } from '../../components/UI/Dropdown';
import { StatCard } from '../../components/UI/StatCard';

interface BranchInventoryStat extends Branch {
  lowStockItems: number;
  totalItems: number;
}

// Mock Data
const MOCK_BRANCHES: BranchInventoryStat[] = [
  { id: 1, name: 'Makati HQ', location: 'Ayala Triangle, Makati City', manager: 'Sarah Jenkins', staff: 14, status: 'active', lowStockItems: 2, totalItems: 140 },
  { id: 2, name: 'BGC High Street', location: '5th Ave, Taguig', manager: 'Miguel Santos', staff: 8, status: 'active', lowStockItems: 5, totalItems: 110 },
  { id: 3, name: 'Ortigas Center', location: 'Emerald Ave, Pasig', manager: 'Anna Cruz', staff: 6, status: 'active', lowStockItems: 0, totalItems: 95 },
  { id: 4, name: 'Quezon City Circle', location: 'Tomas Morato, QC', manager: 'Pending Assignment', staff: 0, status: 'setup', lowStockItems: 0, totalItems: 0 },
];

export function BranchesPage() {
  const navigate = useNavigate();

  const activeBranches = MOCK_BRANCHES.filter(b => b.status === 'active').length;
  const criticalStockBranches = MOCK_BRANCHES.filter(b => b.lowStockItems > 0).length;

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* KPI Stats */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              label="Monitored Branches" 
              value={activeBranches.toString()} 
              trend="up"
              trendValue="1.5%"
              icon={<ViewModuleRoundedIcon />} 
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              label="Branches Low on Stock" 
              value={criticalStockBranches.toString()} 
              trend="down"
              trendValue="2.4%"
              icon={<TuneRoundedIcon />} 
              accentClass="stat-accent-error"
              iconBg="linear-gradient(135deg, #E65C5C 0%, #F89696 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              label="Total Tracked SKUs" 
              value={MOCK_BRANCHES.reduce((acc, b) => acc + b.totalItems, 0).toString()} 
              trend="up"
              trendValue="3.1%"
              icon={<Inventory2RoundedIcon />} 
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              label="Pending Installations" 
              value={MOCK_BRANCHES.filter(b => b.status !== 'active').length.toString()} 
              trend="down"
              trendValue="1.0%"
              icon={<HourglassEmptyRoundedIcon />} 
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 17, minWidth: 'max-content' }}>
          Branch and Inventory ({MOCK_BRANCHES.length})
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
          <BranchCard key={branch.id} branch={branch} alertCount={branch.lowStockItems} />
        ))}
      </Box>
    </Box>
  );
}
