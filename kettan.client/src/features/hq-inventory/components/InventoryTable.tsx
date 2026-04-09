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
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import { useNavigate } from '@tanstack/react-router';
import type { InventoryItem, InventoryTransaction, TransactionType } from '../types';
import { SearchInput } from '../../../components/UI/SearchInput';
import { Button } from '../../../components/UI/Button';
import { ViewToggle } from '../../../components/UI/ViewToggle';
import { FilterDropdown } from '../../../components/UI/FilterAndSort';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';

interface InventoryTableProps {
  items: InventoryItem[];
  transactions?: InventoryTransaction[];
  onRowClick?: (id: string | number) => void;
}

type ViewMode = 'default' | 'levels' | 'transactions';

const TYPE_CONFIG: Record<TransactionType, { icon: React.ReactNode; label: string; color: string; bgcolor: string }> = {
  Restock: {
    icon: <CallReceivedRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Stock-In',
    color: '#166534',
    bgcolor: 'rgba(22, 163, 74, 0.08)',
  },
  Consumption: {
    icon: <CallMadeRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Stock-Out',
    color: '#991B1B',
    bgcolor: 'rgba(220, 38, 38, 0.08)',
  },
  Sales_Auto: {
    icon: <ShoppingCartRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Sale',
    color: '#1E40AF',
    bgcolor: 'rgba(59, 130, 246, 0.08)',
  },
  Adjustment: {
    icon: <TuneRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Adjust',
    color: '#92400E',
    bgcolor: 'rgba(217, 119, 6, 0.08)',
  },
  Transfer: {
    icon: <SyncAltRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Transfer',
    color: '#3D5029',
    bgcolor: 'rgba(84,107,63,0.08)',
  },
};

export function InventoryTable({ items, transactions = [], onRowClick }: InventoryTableProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const viewOptions = [
    { value: 'default' as const, label: 'General', icon: <ViewListRoundedIcon fontSize="small" /> },
    { value: 'levels' as const, label: 'Stock Levels', icon: <BarChartRoundedIcon fontSize="small" /> },
    { value: 'transactions' as const, label: 'Transactions', icon: <ReceiptLongRoundedIcon fontSize="small" /> },
  ];

  const filteredItems = useMemo(() => {
    let result = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterCategory) {
      result = result.filter(item => item.categoryId === filterCategory);
    }

    if (sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'stock_asc') {
      result.sort((a, b) => a.totalStock - b.totalStock);
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => b.totalStock - a.totalStock);
    }

    return result;
  }, [items, searchQuery, filterCategory, sortBy]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter(t =>
      (t.item?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.batch?.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    if (isYesterday) {
      return `Yesterday`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatQuantity = (qty: number, unitSymbol?: string) => {
    const absQty = Math.abs(qty);
    const formatted = absQty < 1 ? absQty.toFixed(3) : absQty.toFixed(absQty % 1 === 0 ? 0 : 2);
    return `${qty > 0 ? '+' : '-'}${formatted} ${unitSymbol || ''}`;
  };

  // Get unique categories from items
  const categoryOptions = useMemo(() => {
    const categories = new Map<string, string>();
    items.forEach(item => {
      if (item.category) {
        categories.set(item.categoryId, item.category.name);
      }
    });
    return Array.from(categories.entries()).map(([value, label]) => ({ value, label }));
  }, [items]);

  // ── Column definitions per view mode ───────────────────────────────────────

  const defaultColumns: ColumnDef<InventoryItem>[] = [
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
          label={row.category?.name || 'Uncategorized'}
          size="small"
          sx={{ height: 22, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', bgcolor: 'rgba(107,76,42,0.08)', color: '#6B4C2A', border: '1px solid rgba(107,76,42,0.15)' }}
        />
      ),
    },
    {
      key: 'totalStock',
      label: 'Stock',
      align: 'right',
      render: (row) => {
        const isLow = row.totalStock <= row.defaultThreshold;
        return (
          <Typography sx={{ fontWeight: 700, color: isLow ? 'error.main' : 'text.primary', fontSize: 14 }}>
            {row.totalStock}
          </Typography>
        );
      },
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.unit?.symbol || ''}</Typography>
      ),
    },
  ];

  const levelsColumns: ColumnDef<InventoryItem>[] = [
    {
      key: 'name',
      label: 'Item Info',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13.5 }}>{row.name}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12, textTransform: 'capitalize', mt: 0.25 }}>{row.category?.name}</Typography>
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
        const isLow = row.totalStock <= row.defaultThreshold;
        return isLow ? (
          <Chip
            icon={<WarningRoundedIcon fontSize="small" />}
            label="Low Stock"
            size="small"
            sx={{ bgcolor: 'rgba(220, 38, 38, 0.08)', color: '#991B1B', fontWeight: 600, height: 24, '& .MuiChip-icon': { color: '#991B1B' }, border: '1px solid rgba(220, 38, 38, 0.15)' }}
          />
        ) : (
          <Chip
            label="In Stock"
            size="small"
            sx={{ bgcolor: 'rgba(84,107,63,0.08)', color: '#546B3F', fontWeight: 600, height: 24, border: '1px solid rgba(84,107,63,0.15)' }}
          />
        );
      },
    },
    {
      key: 'totalStock',
      label: 'Stock Capacity',
      width: 300,
      render: (row) => {
        const isLow = row.totalStock <= row.defaultThreshold;
        const pct = Math.min((row.totalStock / (row.defaultThreshold * 3)) * 100, 100);
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: isLow ? 'error.main' : 'text.primary' }}>
                {row.totalStock}{' '}
                <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 400 }}>{row.unit?.symbol}</Typography>
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500 }}>
                Reorder at {row.defaultThreshold}
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

  const transactionColumns: ColumnDef<InventoryTransaction>[] = [
    {
      key: 'timestamp',
      label: 'Date',
      width: 130,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {formatDate(row.timestamp)}
        </Typography>
      ),
    },
    {
      key: 'transactionType',
      label: 'Type',
      width: 110,
      render: (row) => {
        const config = TYPE_CONFIG[row.transactionType];
        return (
          <Chip
            icon={config.icon as React.ReactElement}
            label={config.label}
            size="small"
            sx={{
              height: 24,
              fontSize: 11,
              fontWeight: 600,
              bgcolor: config.bgcolor,
              color: config.color,
              '& .MuiChip-icon': { color: config.color },
            }}
          />
        );
      },
    },
    {
      key: 'item',
      label: 'Item',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            {row.item?.name || 'Unknown Item'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>
            {row.batch?.batchNumber || ''}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'quantityChange',
      label: 'Qty',
      align: 'right',
      width: 100,
      render: (row) => {
        const isPositive = row.quantityChange > 0;
        return (
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: isPositive ? 'success.main' : 'error.main',
            }}
          >
            {formatQuantity(row.quantityChange, row.item?.unit?.symbol)}
          </Typography>
        );
      },
    },
    {
      key: 'userName',
      label: 'By',
      width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: row.userName === 'Auto' ? 'info.main' : 'text.primary' }}>
          {row.userName || 'Unknown'}
        </Typography>
      ),
    },
    {
      key: 'referenceId',
      label: 'Reference',
      width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace' }}>
          {row.referenceId || row.remarks?.substring(0, 20) || '-'}
        </Typography>
      ),
    },
  ];

  // ── Toolbar ────────────────────────────────────────────────────────────────
  const toolbar = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
      {/* Left: search + filters */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ width: 280 }}>
          <SearchInput
            placeholder={viewMode === 'transactions' ? 'Search transactions...' : 'Search items...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
        {viewMode !== 'transactions' && (
          <>
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
              options={categoryOptions}
            />
          </>
        )}
      </Box>

      {/* Right: view toggle + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ViewToggle
          value={viewMode}
          options={viewOptions as never}
          onChange={(newView: ViewMode) => setViewMode(newView)}
        />
        <Button
          startIcon={<CallReceivedRoundedIcon />}
          onClick={() => navigate({ to: '/hq-inventory/transaction' })}
        >
          New Transaction
        </Button>
      </Box>
    </Box>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (viewMode === 'transactions') {
    return (
      <DataTable
        columns={transactionColumns}
        data={filteredTransactions}
        keyExtractor={(row) => row.id}
        toolbar={toolbar}
        emptyMessage="No transactions found"
        defaultRowsPerPage={15}
        rowsPerPageOptions={[15, 25, 50]}
      />
    );
  }

  return (
    <DataTable
      columns={viewMode === 'levels' ? levelsColumns : defaultColumns}
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
