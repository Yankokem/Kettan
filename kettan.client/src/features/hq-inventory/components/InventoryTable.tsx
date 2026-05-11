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
  isLoading?: boolean;
}

type ViewMode = 'default' | 'transactions';

interface GroupedTransaction {
  id: string;
  referenceId?: string;
  type: string;
  timestamp: string;
  userName: string;
  itemsCount: number;
  totalQuantity: number;
  remarks?: string;
  items: InventoryTransaction[];
}

const TYPE_CONFIG: Record<TransactionType, { icon: React.ReactNode; label: string; color: string }> = {
  Restock: {
    icon: <CallReceivedRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Stock-in',
    color: '#16A34A',
  },
  Consumption: {
    icon: <CallMadeRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Stock-out',
    color: '#DC2626',
  },
  Sales_Auto: {
    icon: <ShoppingCartRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Sale',
    color: '#3B82F6',
  },
  Adjustment: {
    icon: <TuneRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Adjust',
    color: '#D97706',
  },
  Transfer: {
    icon: <SyncAltRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Transfer',
    color: '#6B4C2A',
  },
};

function TransactionActionsMenu({ transaction }: { transaction: GroupedTransaction }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleExport = async () => {
    handleClose();
    try {
      const ref = transaction.referenceId || transaction.id;
      // If it's a numeric ref, we can use our new endpoint
      const isNumeric = /^\d+$/.test(String(transaction.referenceId));
      
      const token = localStorage.getItem('token');
      // For now, if it's not numeric, we might need a different approach, but we'll try the reference endpoint
      const url = isNumeric 
        ? `/api/reports/transactions/${transaction.referenceId}/export?format=pdf`
        : `/api/reports/inventory/export?format=pdf`; // Fallback

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `transaction_${ref}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Export Error:', error);
    }
  };

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
            minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <MenuItem onClick={() => { handleClose(); navigate({ to: '/hq-inventory/transactions/$transactionId', params: { transactionId: transaction.id } }); }}>
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
        <MenuItem onClick={handleExport}>
          <ListItemIcon><ArchiveRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="Export to PDF" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
      </Menu>
    </>
  );
}

function ActionsMenu({ item, isBranchView, onThresholdEdit, onRefresh }: { item: InventoryItem, isBranchView?: boolean, onThresholdEdit: (item: InventoryItem) => void, onRefresh?: () => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleArchiveAction = async () => {
    handleClose();
    try {
      const { archiveInventoryItem, unarchiveInventoryItem } = await import('../hqInventoryApi');
      if (item.isDeleted) {
        await unarchiveInventoryItem(item.id);
      } else {
        const confirmed = window.confirm(`Are you sure you want to archive ${item.name}? It will be hidden from transactions.`);
        if (!confirmed) return;
        await archiveInventoryItem(item.id);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to toggle archive status', err);
    }
  };

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
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" sx={{ color: '#3B82F6' }} /></ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: '#3B82F6' }} />
        </MenuItem>

        <MenuItem onClick={() => { handleClose(); onThresholdEdit(item); }}>
          <ListItemIcon><TuneRoundedIcon fontSize="small" sx={{ color: '#16A34A' }} /></ListItemIcon>
          <ListItemText primary="Set Low Stock Alert" primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: '#16A34A' }} />
        </MenuItem>

        {!isBranchView && (
          <MenuItem onClick={handleArchiveAction}>
            <ListItemIcon><ArchiveRoundedIcon fontSize="small" sx={{ color: '#DC2626' }} /></ListItemIcon>
            <ListItemText 
              primary={item.isDeleted ? "Unarchive Item" : "Archive Item"} 
              primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: '#DC2626' }} 
            />
          </MenuItem>
        )}
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { handleClose(); navigator.clipboard.writeText(item.sku); }}>
          <ListItemIcon><ContentCopyRoundedIcon fontSize="small" sx={{ color: '#64748B' }} /></ListItemIcon>
          <ListItemText primary="Copy SKU" primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: '#64748B' }} />
        </MenuItem>
      </Menu>
    </>
  );
}

export function InventoryTable({ items, transactions = [], isBranchView = false, onRefresh, isLoading = false }: InventoryTableProps) {
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

  const groupTransactions = (txs: InventoryTransaction[]): GroupedTransaction[] => {
    const groups = new Map<string, GroupedTransaction>();

    txs.forEach(t => {
      // Grouping key: ReferenceId if available, otherwise try to extract from remarks (e.g. "Ref INV-123")
      let ref = t.referenceId;
      if (!ref && t.remarks?.startsWith('Ref ')) {
        const match = t.remarks.match(/^Ref ([\w-]+)/);
        if (match) ref = match[1];
      }

      const key = ref 
        ? `REF-${ref}` 
        : `TX-${t.timestamp}-${t.userId}-${t.transactionType}`;
      
      const existing = groups.get(key);
      if (existing) {
        existing.itemsCount += 1;
        existing.totalQuantity += Math.abs(t.quantityChange);
        existing.items.push(t);
        // Take the longest remarks
        if (t.remarks && (!existing.remarks || t.remarks.length > existing.remarks.length)) {
          existing.remarks = t.remarks;
        }
      } else {
        groups.set(key, {
          id: key,
          referenceId: t.referenceId,
          type: t.transactionType,
          timestamp: t.timestamp,
          userName: t.userName || 'System',
          itemsCount: 1,
          totalQuantity: Math.abs(t.quantityChange),
          remarks: t.remarks,
          items: [t]
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const groupedTransactions = useMemo(() => {
    const txs = searchQuery 
      ? transactions.filter(t =>
          (t.itemName || t.item?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.batch?.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.referenceId || '').toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.remarks || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : transactions;

    return groupTransactions(txs);
  }, [transactions, searchQuery]);





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
        <Typography sx={{ 
          fontWeight: 600, 
          color: row.isDeleted ? 'text.disabled' : 'text.primary', 
          fontSize: 13,
          textDecoration: row.isDeleted ? 'line-through' : 'none'
        }}>
          {row.name} {row.isDeleted && '(Archived)'}
        </Typography>
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
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.defaultThreshold} {row.unit}
        </Typography>
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
          onRefresh={onRefresh}
        />
      ),
    },
  ];


  const transactionColumns: ColumnDef<GroupedTransaction>[] = [
    {
      key: 'id',
      label: 'ID / REFERENCE',
      width: '1.2fr',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
            {row.referenceId ? `REF-${row.referenceId}` : row.id.substring(0, 12)}
          </Typography>
          {row.remarks && (
            <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary', maxWidth: 180 }}>
              {row.remarks.length > 30 ? row.remarks.substring(0, 30) + '...' : row.remarks}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'type',
      label: 'TYPE',
      width: '1fr',
      render: (row) => {
        const config = TYPE_CONFIG[row.type as TransactionType] || TYPE_CONFIG['Adjustment'];
        let label = config.label;
        const remarks = (row.remarks || '').toLowerCase();

        if (row.type === 'Restock') {
          if (remarks.includes('return')) label = 'Stock-in (Return)';
          else label = 'Stock-in (Restock)';
        } else if (row.type === 'Consumption') {
          if (remarks.includes('order')) label = 'Stock-out (Order)';
          else if (remarks.includes('waste') || remarks.includes('expire')) label = 'Stock-out (Wastage)';
          else label = 'Stock-out';
        } else if (row.type === 'Adjustment') {
          if (remarks.includes('return')) label = 'Adjust (Return)';
        }

        return (
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 1,
            color: config.color
          }}>
            {config.icon}
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
              {label}
            </Typography>
          </Box>
        );
      },
    },
    {
      key: 'itemsCount',
      label: 'ITEMS',
      width: '1fr',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
            {row.itemsCount} {row.itemsCount === 1 ? 'item' : 'items'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            Total: {row.totalQuantity.toFixed(row.totalQuantity % 1 === 0 ? 0 : 2)} units
          </Typography>
        </Box>
      ),
    },
    {
      key: 'timestamp',
      label: 'DATE AND TIME',
      width: '1.2fr',
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
      key: 'userName',
      label: 'BY',
      width: '1fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
          {row.userName}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      width: 80,
      render: (row) => (
        <TransactionActionsMenu transaction={row} />
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
        data={groupedTransactions}
        isLoading={isLoading}
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
        isLoading={isLoading}
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
