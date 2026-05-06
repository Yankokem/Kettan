import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  IconButton 
} from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { InventoryItem, InventoryTransaction, TransactionType } from '../types';
import { SearchInput } from '../../../components/UI/SearchInput';
import { Button } from '../../../components/UI/Button';
import { ViewToggle } from '../../../components/UI/ViewToggle';
import { FilterDropdown } from '../../../components/UI/FilterAndSort';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';

interface InventoryTableProps {
  items: InventoryItem[];
  transactions?: InventoryTransaction[];
  isBranchView?: boolean;
  onRefresh?: () => void;
}

type ViewMode = 'default' | 'transactions';

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

function ActionsMenu({ item, isBranchView, onThresholdEdit }: { item: InventoryItem, isBranchView?: boolean, onThresholdEdit: (item: InventoryItem) => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton size="small" onClick={handleClick} sx={{ color: 'text.secondary' }}>
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <MenuItem onClick={() => { handleClose(); navigate({ to: '/hq-inventory/$itemId', params: { itemId: String(item.id) } }); }}>
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>

        <MenuItem onClick={() => { handleClose(); onThresholdEdit(item); }}>
          <ListItemIcon><TuneRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="Set Low Stock Alert" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>

        {!isBranchView && (
          <MenuItem onClick={() => { handleClose(); }}>
            <ListItemIcon><ArchiveRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
            <ListItemText primary="Archive Item" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
          </MenuItem>
        )}
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { handleClose(); navigator.clipboard.writeText(item.sku); }}>
          <ListItemIcon><ContentCopyRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="Copy SKU" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
      </Menu>
    </>
  );
}

export function InventoryTable({ items, transactions = [], isBranchView = false, onRefresh }: InventoryTableProps) {
  const navigate = useNavigate();
  const search = useSearch({ from: '/layout/hq-inventory' }) as { search?: string };
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [searchQuery, setSearchQuery] = useState(search.search || '');
  const [sortBy, setSortBy] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Sync search query from URL if it changes
  useEffect(() => {
    if (search.search !== undefined) {
      setSearchQuery(search.search);
    }
  }, [search.search]);

  // Threshold Dialog State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newThreshold, setNewThreshold] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenThreshold = (item: InventoryItem) => {
    setEditingItem(item);
    setNewThreshold(String(item.defaultThreshold));
  };

  const handleCloseThreshold = () => {
    setEditingItem(null);
    setNewThreshold('');
  };

  const handleSaveThreshold = async () => {
    if (!editingItem) return;
    try {
      setIsSaving(true);
      const val = parseFloat(newThreshold);
      if (isNaN(val) || val < 0) return;
      
      const { setBranchThreshold, setGlobalThreshold } = await import('../hqInventoryApi');
      
      if (isBranchView) {
        await setBranchThreshold(editingItem.id, val);
      } else {
        await setGlobalThreshold(editingItem.id, val);
      }
      
      handleCloseThreshold();
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to save threshold', err);
    } finally {
      setIsSaving(false);
    }
  };

  const viewOptions = [
    { value: 'default' as const, label: 'General', icon: <ViewListRoundedIcon fontSize="small" /> },
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


  const formatQuantity = (qty: number, unit?: string) => {
    const absQty = Math.abs(qty);
    const formatted = absQty < 1 ? absQty.toFixed(3) : absQty.toFixed(absQty % 1 === 0 ? 0 : 2);
    return `${qty > 0 ? '+' : '-'}${formatted} ${unit || ''}`;
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
      key: 'name',
      label: 'ITEM NAME',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13 }}>{row.name}</Typography>
      ),
    },
    {
      key: 'category',
      label: 'CATEGORY',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>
          {row.category?.name || 'Uncategorized'}
        </Typography>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {row.sku}
        </Typography>
      ),
    },
    {
      key: 'totalStock',
      label: 'STOCK',
      align: 'right',
      sortable: true,
      render: (row) => {
        const isLow = row.totalStock <= row.defaultThreshold;
        return (
          <Typography sx={{ fontWeight: 700, color: isLow ? '#B91C1C' : 'text.primary', fontSize: 14 }}>
            {row.totalStock} {row.unit}
          </Typography>
        );
      },
    },
    {
      key: 'defaultThreshold',
      label: 'THRESHOLD',
      align: 'right',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
            {row.defaultThreshold} {row.unit}
          </Typography>
          {row.isBranchThreshold && (
            <Typography sx={{ fontSize: 10, color: '#B08B5A', fontWeight: 700, letterSpacing: 0.5, mt: -0.5 }}>
              BRANCH OVERRIDE
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      render: (row) => {
        const isLow = row.totalStock <= row.defaultThreshold;
        const isOut = row.totalStock <= 0;
        let color = '#166534'; // In Stock
        if (isOut) color = '#B91C1C';
        else if (isLow) color = '#D97706';

        return (
          <Typography sx={{ fontSize: 13, fontWeight: 600, color }}>
            {row.status}
          </Typography>
        );
      },
    },
    {
      key: 'unitCost',
      label: 'PRICE',
      align: 'right',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
          {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(row.unitCost)}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (row) => (
        <ActionsMenu 
          item={row} 
          isBranchView={isBranchView} 
          onThresholdEdit={handleOpenThreshold} 
        />
      ),
    },
  ];


  const transactionColumns: ColumnDef<InventoryTransaction>[] = [
    {
      key: 'timestamp',
      label: 'DATE AND TIME',
      width: 140,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {new Date(row.timestamp).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Typography>
      ),
    },
    {
      key: 'transactionType',
      label: 'TYPE',
      width: 110,
      render: (row) => {
        const config = TYPE_CONFIG[row.transactionType];
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: config.color }}>
            {config.label}
          </Typography>
        );
      },
    },
    {
      key: 'item',
      label: 'ITEM',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
            {row.item?.name || 'Unknown Item'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace', fontWeight: 500 }}>
            {row.batch?.batchNumber || ''}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'quantityChange',
      label: 'QTY',
      align: 'right',
      width: 100,
      render: (row) => {
        const isPositive = row.quantityChange > 0;
        return (
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: isPositive ? '#166534' : '#B91C1C',
            }}
          >
            {formatQuantity(row.quantityChange, row.item?.unit)}
          </Typography>
        );
      },
    },
    {
      key: 'userName',
      label: 'BY',
      width: 110,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: row.userName === 'Auto' ? '#0288D1' : 'text.primary' }}>
          {row.userName || 'Unknown'}
        </Typography>
      ),
    },
    {
      key: 'referenceId',
      label: 'REFERENCE',
      width: 120,
      render: (row) => (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace', fontWeight: 500 }}>
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
        {!isBranchView && (
          <>
            <Button
              variant="outlined"
              startIcon={<CategoryRoundedIcon />}
              onClick={() => navigate({ to: '/hq-inventory/categories' })}
            >
              Item Categories
            </Button>
            <Button
              variant="outlined"
              startIcon={<BusinessRoundedIcon />}
              onClick={() => navigate({ to: '/hq-inventory/suppliers' })}
            >
              Suppliers
            </Button>
            <Button
              startIcon={<CallReceivedRoundedIcon />}
              onClick={() => navigate({ to: '/hq-inventory/transaction' })}
            >
              New Transaction
            </Button>
          </>
        )}
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
        emptyTitle="No transactions found"
        emptyMessage={searchQuery ? "We couldn't find any transactions matching your search." : "There are no inventory movements recorded yet."}
        emptyIcon={<ReceiptLongRoundedIcon />}
        defaultRowsPerPage={15}
        rowsPerPageOptions={[15, 25, 50]}
      />
    );
  }

  return (
    <>
      <DataTable
        columns={defaultColumns}
        data={filteredItems}
        keyExtractor={(row) => row.id.toString()}
        toolbar={toolbar}
        emptyTitle="No items found"
        emptyMessage={searchQuery ? "We couldn't find any inventory items matching your search." : "The inventory catalog is currently empty."}
        emptyIcon={<Inventory2RoundedIcon />}
        defaultRowsPerPage={15}
        rowsPerPageOptions={[15, 25, 50]}
      />

    <Dialog open={!!editingItem} onClose={handleCloseThreshold} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Set Low Stock Alert</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.5 }}>
          {isBranchView 
            ? `When the stock level for ${editingItem?.name} falls below this value in your branch, it will trigger an alert on your dashboard.`
            : `Set the specific threshold for the HQ warehouse. This will trigger alerts on the HQ dashboard without affecting branch baselines.`
          }
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Low Stock Threshold"
          type="number"
          value={newThreshold}
          onChange={(e) => setNewThreshold(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">{editingItem?.unit}</InputAdornment>,
          }}
          helperText="Set to 0 to disable alerts for this item."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleCloseThreshold} variant="text" sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button onClick={handleSaveThreshold} loading={isSaving} disabled={!newThreshold || isNaN(parseFloat(newThreshold))}>
          Save Threshold
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
