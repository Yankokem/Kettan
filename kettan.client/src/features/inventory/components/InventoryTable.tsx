import { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useNavigate } from '@tanstack/react-router';
import type { InventoryItem } from '../types';
import { SearchInput } from '../../../components/UI/SearchInput';
import { Button } from '../../../components/UI/Button';
import { ViewToggle } from '../../../components/UI/ViewToggle';
import { FilterDropdown } from '../../../components/UI/FilterAndSort';
import { TablePaginationFooter } from '../../../components/UI/TablePaginationFooter';

interface InventoryTableProps {
  items: InventoryItem[];
  onAddClick?: () => void;
  onRowClick?: (id: string | number) => void;
  hideAddButton?: boolean;
}

type ViewMode = 'default' | 'levels' | 'supply';

export function InventoryTable({ items, onAddClick, onRowClick, hideAddButton = false }: InventoryTableProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const handleChangePage = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1);
  };

  const handleChangeRowsPerPage = (event: SelectChangeEvent<number>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  };

  const viewOptions = [
    { value: 'default' as const, label: 'General Default', icon: <ViewListRoundedIcon fontSize="small" /> },
    { value: 'levels' as const, label: 'Stock Levels', icon: <BarChartRoundedIcon fontSize="small" /> },
    { value: 'supply' as const, label: 'Distributor', icon: <LocalShippingRoundedIcon fontSize="small" /> },
  ];

  const filteredItems = useMemo(() => {
    let result = items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterCategory) {
      result = result.filter(item => item.category === filterCategory);
    }

    if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'stock_asc') {
      result.sort((a, b) => a.stockCount - b.stockCount);
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => b.stockCount - a.stockCount);
    }

    return result;
  }, [items, searchQuery, filterCategory, sortBy]);

  const displayedItems = filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {/* Toolbar / Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ width: 280 }}>
            <SearchInput 
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
            />
          </Box>
          <FilterDropdown
            label="Sort"
            icon={<SortRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />}
            value={sortBy}
            onChange={(val) => { setSortBy(val); setPage(0); }}
            options={[
              { value: 'name_asc', label: 'Name (A-Z)' },
              { value: 'name_desc', label: 'Name (Z-A)' },
              { value: 'stock_desc', label: 'Highest Stock' },
              { value: 'stock_asc', label: 'Lowest Stock' },
            ]}
          />
          <FilterDropdown
            label="Filter"
            icon={<TuneRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />}
            value={filterCategory}
            onChange={(val) => { setFilterCategory(val); setPage(0); }}
            options={[
              { value: 'beans', label: 'Coffee Beans' },
              { value: 'syrup', label: 'Syrups' },
              { value: 'milk', label: 'Milk & Dairy' },
              { value: 'packaging', label: 'Packaging' },
              { value: 'equipment', label: 'Equipment' },
            ]}
          />
        </Box>

        {/* View Toggle & Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ViewToggle 
            value={viewMode} 
            options={viewOptions as any} 
            onChange={(newView: ViewMode) => setViewMode(newView)} 
          />
          {!hideAddButton && (
            <Button 
              startIcon={<AddRoundedIcon />} 
              onClick={() => onAddClick ? onAddClick() : navigate({ to: '/inventory/add' })}
            >
              Add Stock Item
            </Button>
          )}
        </Box>
      </Box>

      {/* Table Container */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ 
            background: 'linear-gradient(135deg, rgba(107, 76, 42, 0.08) 0%, rgba(201, 168, 77, 0.08) 100%)',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <TableRow>
              {viewMode === 'default' && (
                <>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Stock</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Unit</TableCell>
                </>
              )}
              {viewMode === 'levels' && (
                <>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Item Info</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Stock Capacity</TableCell>
                </>
              )}
              {viewMode === 'supply' && (
                <>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Item Info</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Supplier</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', fontSize: 13 }}>Last Restocked</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedItems.map((item) => {
              const isLowStock = item.stockCount <= item.reorderPoint;
              const stockPercentage = Math.min((item.stockCount / (item.reorderPoint * 3)) * 100, 100);

              return (
                <TableRow 
                  key={item.id}
                  hover
                  onClick={() => onRowClick ? onRowClick(item.id) : navigate({ to: '/inventory/$itemId', params: { itemId: item.id.toString() } })}
                  sx={{ 
                    cursor: 'pointer',
                    '&:last-child td, &:last-child th': { border: 0 },
                    ...(isLowStock && viewMode === 'levels' ? { bgcolor: '#FFFafA' } : {})
                  }}
                >
                  {/* Default View Mode */}
                  {viewMode === 'default' && (
                    <>
                      <TableCell><Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>{item.id}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 500, color: 'text.secondary', fontSize: 14 }}>{item.name}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 400, color: 'text.secondary', fontSize: 13 }}>{item.sku}</Typography></TableCell>
                      <TableCell>
                        <Chip label={item.category} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 500, textTransform: 'capitalize', bgcolor: 'background.default' }} />
                      </TableCell>
                      <TableCell align="right">
                         <Typography sx={{ fontWeight: 500, color: isLowStock ? 'error.main' : 'text.secondary', fontSize: 14 }}>
                           {item.stockCount}
                         </Typography>
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.unit}</Typography></TableCell>
                    </>
                  )}

                  {/* Stock Levels View Mode */}
                  {viewMode === 'levels' && (
                    <>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, color: 'text.secondary', fontSize: 14 }}>{item.name}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, textTransform: 'capitalize' }}>{item.category}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 400, color: 'text.secondary', fontSize: 13 }}>{item.sku}</Typography>
                      </TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Chip icon={<WarningRoundedIcon fontSize="small" />} label="Low Stock" size="small" sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 500, height: 24 }} />
                        ) : (
                          <Chip label="In Stock" size="small" sx={{ bgcolor: 'success.light', color: 'success.dark', fontWeight: 500, height: 24 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ minWidth: 300, py: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: isLowStock ? 'error.main' : 'text.primary' }}>
                            {item.stockCount} <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>{item.unit}</Typography>
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
                            Reorder at {item.reorderPoint}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={stockPercentage} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: isLowStock ? 'error.main' : 'primary.main',
                              borderRadius: 3
                            }
                          }} 
                        />
                      </TableCell>
                    </>
                  )}

                  {/* Supply View Mode */}
                  {viewMode === 'supply' && (
                    <>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, color: 'text.secondary', fontSize: 14 }}>{item.name}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, textTransform: 'capitalize' }}>{item.category}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 400, color: 'text.secondary', fontSize: 13 }}>{item.sku}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, color: 'text.secondary', fontSize: 14 }}>{item.supplier}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.lastRestocked}</Typography>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePaginationFooter
        totalItems={filteredItems.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}