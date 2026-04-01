import { useState, useMemo } from 'react';
import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Pagination, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { StatCard } from '../../components/UI/StatCard';
import { BranchCard } from '../branches/components/BranchCard';
import type { Branch } from '../branches/types';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import { ViewToggle } from '../../components/UI/ViewToggle';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { SearchInput } from '../../components/UI/SearchInput';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

// Reusing MOCK_BRANCHES for listing, maybe enriching with inventory stats
interface BranchInventoryStat extends Branch {
  lowStockItems: number;
  totalItems: number;
}

const MOCK_BRANCH_STATS: BranchInventoryStat[] = [
  { id: 1, name: 'Makati HQ', location: 'Ayala Triangle, Makati City', manager: 'Sarah Jenkins', staff: 14, status: 'active', lowStockItems: 2, totalItems: 140 },
  { id: 2, name: 'BGC High Street', location: '5th Ave, Taguig', manager: 'Miguel Santos', staff: 8, status: 'active', lowStockItems: 5, totalItems: 110 },
  { id: 3, name: 'Ortigas Center', location: 'Emerald Ave, Pasig', manager: 'Anna Cruz', staff: 6, status: 'active', lowStockItems: 0, totalItems: 95 },
  { id: 4, name: 'Quezon City Circle', location: 'Tomas Morato, QC', manager: 'Pending Assignment', staff: 0, status: 'setup', lowStockItems: 0, totalItems: 0 },
];

export function BranchInventoryListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const handleChangePage = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1);
  };

  const handleChangeRowsPerPage = (event: SelectChangeEvent<number>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  };

  const viewOptions = [
    { value: 'cards' as const, label: 'Cards View', icon: <ViewModuleRoundedIcon fontSize="small" /> },
    { value: 'table' as const, label: 'Data List', icon: <TableRowsRoundedIcon fontSize="small" /> },
  ];

  const filteredBranches = useMemo(() => {
    let result = MOCK_BRANCH_STATS.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'low_stock_desc') {
      result.sort((a, b) => b.lowStockItems - a.lowStockItems);
    }
    return result;
  }, [searchQuery, sortBy]);

  const activeBranches = MOCK_BRANCH_STATS.filter(b => b.status === 'active').length;
  const criticalStockBranches = MOCK_BRANCH_STATS.filter(b => b.lowStockItems > 0).length;

  const displayedBranches = useMemo(() => {
    return filteredBranches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredBranches, page, rowsPerPage]);

  const handleBranchClick = (id: string | number) => {
    navigate({ to: '/branch-inventory/$branchId', params: { branchId: id.toString() } });
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
          Branch Inventory Management
        </Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
          Monitor stock levels, track reorder points, and manage fulfillment across all physical retail locations within your tenant.
        </Typography>
      </Box>

      {/* KPI Stats */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              label="Monitored Branches" 
              value={activeBranches.toString()} 
              icon={<ViewModuleRoundedIcon />} 
              accentClass="stat-accent-primary"
              iconBg="rgba(201, 168, 77, 0.15)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              label="Branches Low on Stock" 
              value={criticalStockBranches.toString()} 
              icon={<TuneRoundedIcon />} 
              trend="down"
              trendValue="Needs attention"
              accentClass="stat-accent-error"
              iconBg="rgba(239, 68, 68, 0.1)"
            />
          </Grid>
          {/* Add more stats if needed */}
        </Grid>
      </Box>

      {/* Toolbar / Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ width: 280 }}>
            <SearchInput 
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Box>
          <FilterDropdown
            label="Sort"
            icon={<SortRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />}
            value={sortBy}
            onChange={(val: string) => setSortBy(val)}
            options={[
              { value: 'name_asc', label: 'Name (A-Z)' },
              { value: 'name_desc', label: 'Name (Z-A)' },
              { value: 'low_stock_desc', label: 'Highest Low Stock Alerts' },
            ]}
          />
        </Box>

        {/* View Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ViewToggle 
            value={viewMode} 
            options={viewOptions as any} 
            onChange={(newView: 'cards' | 'table') => setViewMode(newView)} 
          />
        </Box>
      </Box>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <Grid container spacing={3}>
          {displayedBranches.map(branch => (
             <Grid size={{ xs: 12, sm: 6, md: 4 }} key={branch.id}>
               <BranchCard branch={branch as Branch} onClick={handleBranchClick} alertCount={branch.lowStockItems} />
             </Grid>
          ))}
        </Grid>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ 
              background: 'linear-gradient(135deg, rgba(107, 76, 42, 0.08) 0%, rgba(201, 168, 77, 0.08) 100%)',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Total Skus tracked</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Low Stock Alerts</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedBranches.map((branch) => (
                <TableRow 
                  key={branch.id}
                  hover
                  onClick={() => handleBranchClick(branch.id)}
                  sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 14 }}>{branch.name}</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>Manager: {branch.manager}</Typography>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{branch.location}</Typography></TableCell>
                  <TableCell>
                    <Chip 
                      label={branch.status === 'active' ? 'Active' : 'Setup Pending'} 
                      size="small" 
                      sx={{ 
                        height: 22, fontSize: 11, fontWeight: 700, 
                        bgcolor: branch.status === 'active' ? '#FEF3C7' : '#F3F4F6', 
                        color: branch.status === 'active' ? '#92400E' : '#4B5563',
                        borderRadius: 1 
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right"><Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{branch.totalItems || '-'}</Typography></TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: branch.lowStockItems > 0 ? 'error.main' : 'text.secondary' }}>
                      {branch.lowStockItems || '0'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination Footer */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pt: 2,
        mt: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredBranches.length > 0 ? page * rowsPerPage + 1 : 0} to {Math.min((page + 1) * rowsPerPage, filteredBranches.length)} of {filteredBranches.length} entries
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              size="small"
              sx={{ 
                height: 32,
                '& .MuiSelect-select': { py: 0.5, px: 1.5, fontSize: 13, fontWeight: 600 }
              }}
            >
              {[10, 25, 50].map((pageSize) => (
                <MenuItem key={pageSize} value={pageSize} sx={{ fontSize: 13 }}>
                  {pageSize}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
        
        <Pagination 
          count={Math.ceil(filteredBranches.length / rowsPerPage)} 
          page={page + 1} 
          onChange={handleChangePage} 
          color="primary"
          shape="rounded"
          sx={{
            '& .MuiPaginationItem-root': {
              fontWeight: 600,
              fontSize: 13,
            }
          }}
        />
      </Box>
    </Box>
  );
}