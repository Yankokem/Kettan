import { useEffect, useState } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { Dropdown } from '../../components/UI/Dropdown';
import { StatCard } from '../../components/UI/StatCard';
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { fetchBranches, type BranchDto } from './branchesApi';

export function BranchesPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetchBranches()
      .then(setBranches)
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);

  const activeBranches = branches.filter((b) => b.isActive).length;
  const inactiveBranches = branches.filter((b) => !b.isActive).length;

  const filteredBranches = branches.filter((b) => {
    const matchSearch = !searchTerm || b.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && b.isActive) ||
      (statusFilter === 'setup' && !b.isActive);
    return matchSearch && matchStatus;
  });

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
              value="—"
              trend="down"
              trendValue="2.4%"
              icon={<TuneRoundedIcon />}
              accentClass="stat-accent-error"
              iconBg="linear-gradient(135deg, #E65C5C 0%, #F89696 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Branches"
              value={branches.length.toString()}
              trend="up"
              trendValue="3.1%"
              icon={<Inventory2RoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Inactive Branches"
              value={inactiveBranches.toString()}
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
          Branch and Inventory ({filteredBranches.length})
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'flex-end' }}>
          <SearchInput
            placeholder="Find a specific branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 300, flex: 'none' }}
          />

          <Dropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as string)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active Branches' },
              { value: 'setup', label: 'Inactive / Setup' },
            ]}
          />

          <Button startIcon={<AddRoundedIcon />} onClick={() => navigate({ to: '/branches/add' })}>
            Add Branch
          </Button>
        </Box>
      </Box>

      <DataStateWrapper
        loading={loading}
        error={error}
        isEmpty={filteredBranches.length === 0}
        emptyMessage={searchTerm ? 'No branches match your search.' : 'No branches found. Add your first branch to get started.'}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {filteredBranches.map((branch) => (
            <Box
              key={branch.branchId}
              onClick={() => navigate({ to: '/branches/$branchId', params: { branchId: branch.branchId.toString() } })}
              sx={{ cursor: 'pointer' }}
            >
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  p: 2.5,
                  bgcolor: 'background.paper',
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, color: 'text.primary' }}>
                    {branch.name}
                  </Typography>
                  <Box
                    sx={{
                      px: 1.2,
                      py: 0.3,
                      borderRadius: 999,
                      bgcolor: branch.isActive ? 'rgba(113,143,88,0.15)' : 'rgba(230,92,92,0.12)',
                      color: branch.isActive ? '#4A7C3F' : '#C0392B',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>
                  {branch.location ?? 'No location set'}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                  ID: BR-{String(branch.branchId).padStart(5, '0')}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </DataStateWrapper>
    </Box>
  );
}
