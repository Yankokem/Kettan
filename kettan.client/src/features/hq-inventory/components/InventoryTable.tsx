import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
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
import { KettanTable, type KettanColumnDef } from '../../../components/UI/KettanTable';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const viewOptions = [
    { value: 'default' as const, label: 'General', icon: <ViewListRoundedIcon fontSize="small" /> },
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

  // ── Column definitions per view mode ───────────────────────────────────────

  const defaultColumns: KettanColumnDef<InventoryItem>[] = [
    {
      key: 'id',
      label: 'ID',
      width: 80,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.disabled', fontWeight: 500 }}>{row.id}</Typography>
      ),
    },
    {
      key: 'name',
      label: 'Item Name',
      render: (row) => (
        <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13.5 }}>{row.name}</Typography>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => (
        <Typography sx={{ fontWeight: 400, color: 'text.secondary', fontSize: 12.5, fontFamily: 'monospace' }}>{row.sku}</Typography>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <Chip
          label={row.category}
          size="small"
          sx={{ height: 22, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', bgcolor: 'rgba(107,76,42,0.08)', color: '#6B4C2A', border: '1px solid rgba(107,76,42,0.15)' }}
        />
      ),
    },
    {
      key: 'stockCount',
      label: 'Stock',
      align: 'right',
      render: (row) => {
        const isLow = row.stockCount <= row.reorderPoint;
        return (
          <Typography sx={{ fontWeight: 700, color: isLow ? 'error.main' : 'text.primary', fontSize: 14 }}>
            {row.stockCount}
          </Typography>
        );
      },
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.unit}</Typography>
      ),
    },
  ];

  const levelsColumns: KettanColumnDef<InventoryItem>[] = [
    {
      key: 'name',
      label: 'Item Info',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13.5 }}>{row.name}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12, textTransform: 'capitalize', mt: 0.25 }}>{row.category}</Typography>
        </Box>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => (
        <Typography sx={{ fontWeight: 400, color: 'text.secondary', fontSize: 12.5, fontFamily: 'monospace' }}>{row.sku}</Typography>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const isLow = row.stockCount <= row.reorderPoint;
        return isLow ? (
          <Chip
            icon={<WarningRoundedIcon fontSize="small" />}
            label="Low Stock"
            size="small"
            sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 600, height: 24, '& .MuiChip-icon': { color: 'white' } }}
          />
        ) : (
          <Chip
            label="In Stock"
            size="small"
            sx={{ bgcolor: 'rgba(84,107,63,0.12)', color: '#546B3F', fontWeight: 600, height: 24, border: '1px solid rgba(84,107,63,0.2)' }}
          />
        );
      },
    },
    {
      key: 'stockCount',
      label: 'Stock Capacity',
      width: 300,
      render: (row) => {
        const isLow = row.stockCount <= row.reorderPoint;
        const pct = Math.min((row.stockCount / (row.reorderPoint * 3)) * 100, 100);
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: isLow ? 'error.main' : 'text.primary' }}>
                {row.stockCount}{' '}
                <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 400 }}>{row.unit}</Typography>
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500 }}>
                Reorder at {row.reorderPoint}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: isLow ? 'error.main' : '#6B9B5A',
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        );
      },
    },
  ];

  const supplyColumns: KettanColumnDef<InventoryItem>[] = [
    {
      key: 'name',
      label: 'Item Info',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13.5 }}>{row.name}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12, textTransform: 'capitalize', mt: 0.25 }}>{row.category}</Typography>
        </Box>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => (
        <Typography sx={{ fontWeight: 400, color: 'text.secondary', fontSize: 12.5, fontFamily: 'monospace' }}>{row.sku}</Typography>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (row) => (
        <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13.5 }}>{row.supplier}</Typography>
      ),
    },
    {
      key: 'lastRestocked',
      label: 'Last Restocked',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.lastRestocked}</Typography>
      ),
    },
  ];

  const columnsByView: Record<ViewMode, KettanColumnDef<InventoryItem>[]> = {
    default: defaultColumns,
    levels: levelsColumns,
    supply: supplyColumns,
  };

  // ── Toolbar ────────────────────────────────────────────────────────────────
  const toolbar = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
      {/* Left: search + filters */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ width: 280 }}>
          <SearchInput
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
        <FilterDropdown
          label="Sort"
          icon={<SortRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />}
          value={sortBy}
          onChange={(val) => setSortBy(val)}
          options={[
            { value: 'name_asc', label: 'Name (A–Z)' },
            { value: 'name_desc', label: 'Name (Z–A)' },
            { value: 'stock_desc', label: 'Highest Stock' },
            { value: 'stock_asc', label: 'Lowest Stock' },
          ]}
        />
        <FilterDropdown
          label="Filter"
          icon={<TuneRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />}
          value={filterCategory}
          onChange={(val) => setFilterCategory(val)}
          options={[
            { value: 'beans', label: 'Coffee Beans' },
            { value: 'syrup', label: 'Syrups' },
            { value: 'milk', label: 'Milk & Dairy' },
            { value: 'packaging', label: 'Packaging' },
            { value: 'equipment', label: 'Equipment' },
          ]}
        />
      </Box>

      {/* Right: view toggle + action */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ViewToggle
          value={viewMode}
          options={viewOptions as never}
          onChange={(newView: ViewMode) => setViewMode(newView)}
        />
        {!hideAddButton && (
          <Button
            startIcon={<AddRoundedIcon />}
            onClick={() => onAddClick ? onAddClick() : navigate({ to: '/hq-inventory/add' })}
          >
            Add Stock Item
          </Button>
        )}
      </Box>
    </Box>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KettanTable
      columns={columnsByView[viewMode]}
      data={filteredItems}
      keyExtractor={(row) => row.id.toString()}
      toolbar={toolbar}
      onRowClick={(row) => onRowClick ? onRowClick(row.id) : navigate({ to: '/hq-inventory/$itemId', params: { itemId: row.id.toString() } })}
      emptyMessage="No inventory items match your search or filter."
      defaultRowsPerPage={15}
      rowsPerPageOptions={[15, 25, 50]}
    />
  );
}