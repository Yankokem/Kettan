import { useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { StatCard } from '../../components/UI/StatCard';
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { BranchCard } from './components/BranchCard';
import { mapBranch } from './branchProfileData';
import { fetchBranches, type BranchDto } from './branchesApi';

export function BranchesPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    setLoading(true);
    fetchBranches()
      .then(setBranches)
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);

  const activeBranches = branches.filter((b) => b.isActive).length;
  const inactiveBranches = branches.filter((b) => !b.isActive).length;
  const lowStockBranches = branches.filter((b) => (b as any).lowStockItems > 0).length;

  const filteredBranches = branches.filter((b) => {
    const matchSearch = !searchTerm || b.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && b.isActive) ||
      (statusFilter === 'setup' && !b.isActive);
    return matchSearch && matchStatus;
  });

  const sortedBranches = [...filteredBranches].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  return (
    <Box sx={{ pb: 3 }}>
      {/* KPI Stats */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Monitored Branches"
              value={activeBranches.toString()}
              trend="up"
              trendValue="Active"
              icon={<ViewModuleRoundedIcon />}
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Branches Low on Stock"
              value={lowStockBranches.toString()}
              trend={lowStockBranches > 0 ? "up" : "neutral"}
              trendValue="Needs attention"
              icon={<TuneRoundedIcon />}
              accentClass="stat-accent-error"
              iconBg="linear-gradient(135deg, #E65C5C 0%, #F89696 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Branches"
              value={branches.length.toString()}
              trend="neutral"
              trendValue="Network size"
              icon={<Inventory2RoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Inactive Branches"
              value={inactiveBranches.toString()}
              trend="neutral"
              trendValue="In setup"
              icon={<HourglassEmptyRoundedIcon />}
              accentClass="stat-accent-tan"
              iconBg="linear-gradient(135deg, #A89078 0%, #D2B496 100%)"
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <SearchInput
            placeholder="Find a specific branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 420, flex: 1 }}
          />

          <FilterDropdown
            label="Status"
            icon={<TuneRoundedIcon sx={{ fontSize: 18, color: '#8C6B43' }} />}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active Branches' },
              { value: 'setup', label: 'Inactive / Setup' },
            ]}
          />

          <FilterDropdown
            label="Sort"
            icon={<SortRoundedIcon sx={{ fontSize: 18, color: '#8C6B43' }} />}
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'name-asc', label: 'Name (A-Z)' },
              { value: 'name-desc', label: 'Name (Z-A)' },
              { value: 'oldest', label: 'Oldest First' },
            ]}
          />
        </Box>

        <Button startIcon={<AddRoundedIcon />} onClick={() => navigate({ to: '/branches/add' })} sx={{ px: 3 }}>
          Add Branch
        </Button>
      </Box>

      <DataStateWrapper
        loading={loading}
        error={error}
        isEmpty={sortedBranches.length === 0}
        emptyTitle={searchTerm ? 'No matches found' : 'No branches yet'}
        emptyMessage={searchTerm ? 'We couldn\'t find any branches matching your search criteria.' : 'Start expanding your network by adding your first branch location.'}
        emptyIcon={<StoreRoundedIcon />}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {sortedBranches.map((branchDto) => {
            const branch = mapBranch(branchDto);
            return (
              <BranchCard
                key={branch.id}
                branch={branch}
                onClick={(id) => navigate({ to: '/branches/$branchId', params: { branchId: id.toString() } })}
              />
            );
          })}
        </Box>
      </DataStateWrapper>
    </Box>
  );
}
