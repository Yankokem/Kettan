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
import { IconButton, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Divider, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { StatCard } from '../../components/UI/StatCard';
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { BranchCard } from './components/BranchCard';
import { mapBranch } from './branchProfileData';
import { fetchBranches, type BranchDto } from './branchesApi';
import { fetchBranchStats, type BranchStatsDto, type StatMetricDto } from '../reports/reportsApi';

export function BranchesPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [branchStats, setBranchStats] = useState<BranchStatsDto | null>(null);

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

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBranches(), fetchBranchStats()])
      .then(([branchesData, statsData]) => {
        setBranches(branchesData);
        setBranchStats(statsData);
      })
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
              value={branchStats?.monitoredBranches.currentValue.toString() ?? activeBranches.toString()}
              trend={branchStats?.monitoredBranches.trend ?? 'up'}
              trendValue={`${branchStats?.monitoredBranches.percentageChange ?? 0}% vs last week`}
              icon={<ViewModuleRoundedIcon />}
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
              onClick={() => openDetail('Monitored Branches', branchStats?.monitoredBranches, <ViewModuleRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Branches Low on Stock"
              value={branchStats?.branchesLowOnStock.currentValue.toString() ?? lowStockBranches.toString()}
              trend={branchStats?.branchesLowOnStock.trend ?? 'neutral'}
              trendValue={`${branchStats?.branchesLowOnStock.percentageChange ?? 0}% vs last week`}
              icon={<TuneRoundedIcon />}
              accentClass="stat-accent-error"
              iconBg="linear-gradient(135deg, #E65C5C 0%, #F89696 100%)"
              onClick={() => openDetail('Branches Low Stock', branchStats?.branchesLowOnStock, <TuneRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Branches"
              value={branchStats?.totalBranches.currentValue.toString() ?? branches.length.toString()}
              trend={branchStats?.totalBranches.trend ?? 'neutral'}
              trendValue={`${branchStats?.totalBranches.percentageChange ?? 0}% vs last week`}
              icon={<Inventory2RoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
              onClick={() => openDetail('Total Branches', branchStats?.totalBranches, <Inventory2RoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Inactive Branches"
              value={branchStats?.inactiveBranches.currentValue.toString() ?? inactiveBranches.toString()}
              trend={branchStats?.inactiveBranches.trend ?? 'neutral'}
              trendValue={`${branchStats?.inactiveBranches.percentageChange ?? 0}% vs last week`}
              icon={<HourglassEmptyRoundedIcon />}
              accentClass="stat-accent-tan"
              iconBg="linear-gradient(135deg, #A89078 0%, #D2B496 100%)"
              onClick={() => openDetail('Inactive Branches', branchStats?.inactiveBranches, <HourglassEmptyRoundedIcon />)}
            />
          </Grid>
        </Grid>
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
                      navigate({ 
                        to: '/branches/$branchId', 
                        params: { branchId: item.id.replace('BR-', '') } 
                      });
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
