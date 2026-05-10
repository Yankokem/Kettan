import { Dialog, DialogContent, DialogTitle, IconButton, Box, TextField, Typography, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import type { InventoryItem } from './InventoryItemCard';
import { useState, useMemo } from 'react';
import { Button } from '../../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import { SearchInput } from '../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../components/UI/FilterAndSort';

interface InventorySelectionModalProps {
  open: boolean;
  onClose: () => void;
  onItemsSelected: (items: { item: InventoryItem; quantity: number; notes: string }[]) => void;
  inventory: InventoryItem[];
  showStock?: boolean;
}

export function InventorySelectionModal({ open, onClose, onItemsSelected, inventory, showStock = true }: InventorySelectionModalProps) {
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<Map<string, { quantity: number; notes: string }>>(new Map());
  
  const [sortBy, setSortBy] = useState<string>('name_asc');
  const [filterInStock, setFilterInStock] = useState<string>('');

  const filteredInventory = useMemo(() => {
    let result = inventory.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );

    if (filterInStock === 'in_stock') {
      result = result.filter(item => item.hqStock > 0);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'stock_asc': return a.hqStock - b.hqStock;
        case 'stock_desc': return b.hqStock - a.hqStock;
        default: return 0;
      }
    });

    return result;
  }, [inventory, search, sortBy, filterInStock]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (quantity > 0) {
        next.set(itemId, { quantity, notes: prev.get(itemId)?.notes || '' });
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const items = Array.from(selectedItems.entries())
      .map(([itemId, { quantity, notes }]) => {
        const item = inventory.find(i => i.id === itemId);
        return item ? { item, quantity, notes } : null;
      })
      .filter((item): item is { item: InventoryItem; quantity: number; notes: string } => item !== null);

    if (items.length > 0) {
      onItemsSelected(items);
    }
    setSelectedItems(new Map());
    onClose();
  };

  const handleClose = () => {
    setSelectedItems(new Map());
    onClose();
  };

  const columns: ColumnDef<InventoryItem>[] = [
    {
      key: 'name',
      label: 'Item Name',
      sortable: true,
      render: (item) => (
        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary' }}>{item.name}</Typography>
          <Typography sx={{ fontSize: 11.5, fontFamily: 'monospace', color: 'text.secondary' }}>{item.sku}</Typography>
        </Box>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      width: 140,
      render: (item) => (
        <Chip label={item.category} size="small" sx={{ fontSize: 11, height: 22 }} />
      ),
    },
    {
      key: 'unit',
      label: 'Unit',
      width: 80,
      align: 'center',
      render: (item) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{item.unit}</Typography>
      ),
    },
    ...(showStock ? [{
      key: 'hqStock' as const,
      label: 'HQ Stock',
      width: 100,
      align: 'right' as const,
      sortable: true,
      render: (item: InventoryItem) => {
        const selectedQty = selectedItems.get(item.id)?.quantity || 0;
        const projectedStock = item.hqStock - selectedQty;
        const isOverdrawn = projectedStock < 0;

        return (
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              sx={{ 
                fontSize: 13, 
                fontWeight: 700, 
                color: isOverdrawn ? 'error.main' : 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 0.5
              }}
            >
              {projectedStock}
              {selectedQty > 0 && (
                <Typography component="span" sx={{ fontSize: 10, fontWeight: 500, color: 'text.secondary', opacity: 0.7 }}>
                  ({item.hqStock})
                </Typography>
              )}
            </Typography>
            {isOverdrawn && (
              <Typography sx={{ fontSize: 10, color: 'error.main', fontWeight: 500 }}>
                Insufficient Stock
              </Typography>
            )}
          </Box>
        );
      },
    }] : []),
    {
      key: 'quantity',
      label: 'Quantity',
      width: 100,
      align: 'center',
      render: (item) => (
        <TextField
          type="number"
          size="small"
          value={selectedItems.get(item.id)?.quantity || ''}
          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
          placeholder="0"
          inputProps={{ min: 0, style: { textAlign: 'center' } }}
          sx={{ width: 70 }}
        />
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '85vh' } }}>
      <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InventoryIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
          <Typography sx={{ fontSize: 17, fontWeight: 700 }}>Select Inventory Items</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
          {/* Search and Filters - Left side only */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, flexShrink: 0 }}>
            <SearchInput
              placeholder="Search by item name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 280, maxWidth: 420 }}
            />

            <FilterDropdown
              label="Sort"
              icon={<SortRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
              value={sortBy}
              onChange={setSortBy}
              minWidth={165}
              options={[
                { value: 'name_asc', label: 'Name (A-Z)' },
                { value: 'name_desc', label: 'Name (Z-A)' },
                ...(showStock ? [
                  { value: 'stock_desc', label: 'Stock (High to Low)' },
                  { value: 'stock_asc', label: 'Stock (Low to High)' },
                ] : []),
              ]}
            />

            {showStock && (
              <FilterDropdown
                label="Filter"
                icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
                value={filterInStock}
                onChange={setFilterInStock}
                minWidth={165}
                options={[
                  { value: '', label: 'All Items' },
                  { value: 'in_stock', label: 'In Stock Only' },
                ]}
              />
            )}
          </Box>

          {/* Table - Scrollable */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            <DataTable
              data={filteredInventory}
              columns={columns}
              keyExtractor={(item) => item.id}
              emptyMessage="No items found matching search criteria."
              emptyIcon={<InventoryIcon />}
              defaultRowsPerPage={10}
              pageSizes={[10, 25, 50]}
            />
          </Box>
        </Box>

        {/* Right side - Selected Items Summary */}
        <Box sx={{ width: 320, display: 'flex', flexDirection: 'column', bgcolor: 'rgba(107,76,42,0.02)' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#6B4C2A' }}>
              Selected Items ({selectedItems.size})
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {selectedItems.size === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
                <AddShoppingCartRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center' }}>
                  No items selected yet. Enter quantities in the table to add items.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Array.from(selectedItems.entries()).map(([itemId, { quantity }]) => {
                  const item = inventory.find(i => i.id === itemId);
                  if (!item) return null;
                  
                  return (
                    <Box
                      key={itemId}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                          {item.name}
                        </Typography>
                        <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>
                          {item.sku}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`${quantity} ${item.unit}`}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: 11.5,
                            fontWeight: 700,
                            bgcolor: 'rgba(201,168,76,0.15)',
                            color: '#6B4C2A',
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(itemId, 0)}
                          sx={{ 
                            width: 24, 
                            height: 24,
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.lighter' }
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
          {selectedItems.size} item(s) selected
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            startIcon={<AddShoppingCartRoundedIcon />}
            onClick={handleConfirm}
            disabled={selectedItems.size === 0}
          >
            Confirm Selection
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
