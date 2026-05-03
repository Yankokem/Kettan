import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  IconButton,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import { Button } from '../../../components/UI/Button';
import { SearchInput } from '../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../components/UI/FilterAndSort';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import type { InventoryItemOption, RecipeIngredient } from '../types';

interface InventorySelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (ingredient: RecipeIngredient) => void;
  inventoryOptions: InventoryItemOption[];
  selectedItemIds?: string[]; // IDs of already selected items to show checkmark
}

type SortOption = 'name-asc' | 'name-desc' | 'category' | 'stock';

export function InventorySelectionModal({
  open,
  onClose,
  onSelect,
  inventoryOptions,
  selectedItemIds = [],
}: InventorySelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(inventoryOptions.map(opt => opt.category));
    return [
      { value: '', label: 'All Categories' },
      ...Array.from(cats).map(cat => ({ value: cat, label: cat }))
    ];
  }, [inventoryOptions]);

  // Filter and sort inventory
  const filteredInventory = useMemo(() => {
    let filtered = inventoryOptions;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'category':
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        case 'stock':
          return (b.stockCount || 0) - (a.stockCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventoryOptions, searchQuery, categoryFilter, sortBy]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (quantity > 0) {
        next.set(itemId, quantity);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const items = Array.from(selectedItems.entries());
    
    if (items.length === 0) {
      alert('Please add at least one ingredient with quantity');
      return;
    }

    // Add each selected item
    items.forEach(([itemId, quantity]) => {
      const item = inventoryOptions.find(i => i.id === itemId);
      if (item) {
        const ingredient: RecipeIngredient = {
          id: `ingredient-${Date.now()}-${Math.random()}`,
          itemId: item.id,
          itemName: item.name,
          qtyPerUnit: quantity,
          uom: item.uom,
          unitCost: item.unitCost,
        };
        onSelect(ingredient);
      }
    });
    
    // Reset
    setSelectedItems(new Map());
    handleClose();
  };

  const handleClose = () => {
    setSelectedItems(new Map());
    setSearchQuery('');
    setCategoryFilter('');
    onClose();
  };

  const sortOptions = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'category', label: 'Category' },
    { value: 'stock', label: 'Stock Level' },
  ];

  const columns: ColumnDef<InventoryItemOption>[] = [
    {
      key: 'name',
      label: 'Item Name',
      sortable: true,
      render: (item) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary' }}>{item.name}</Typography>
            <Typography sx={{ fontSize: 11.5, fontFamily: 'monospace', color: 'text.secondary' }}>{item.sku}</Typography>
          </Box>
          {selectedItemIds.includes(item.id) && (
            <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
          )}
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
      key: 'uom',
      label: 'Unit',
      width: 80,
      align: 'center',
      render: (item) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{item.uom}</Typography>
      ),
    },
    {
      key: 'stockCount',
      label: 'Stock',
      width: 100,
      align: 'right',
      sortable: true,
      render: (item) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: (item.stockCount || 0) === 0 ? 'error.main' : 'success.main' }}>
          {item.stockCount || 0}
        </Typography>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      width: 100,
      align: 'center',
      render: (item) => (
        <TextField
          type="number"
          size="small"
          value={selectedItems.get(item.id) || ''}
          onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
          placeholder="0"
          inputProps={{ min: 0, step: 0.001, style: { textAlign: 'center' } }}
          sx={{ width: 70 }}
        />
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '70vh' } }}>
      <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InventoryRoundedIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
          <Typography sx={{ fontSize: 17, fontWeight: 700 }}>Select Inventory Items</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
          {/* Search & Filter Bar */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, flexShrink: 0 }}>
            <SearchInput
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 280, maxWidth: 420 }}
            />
            <FilterDropdown
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories}
              icon={<CategoryRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
              minWidth={165}
            />
            <FilterDropdown
              label="Sort"
              value={sortBy}
              onChange={(val) => setSortBy(val as SortOption)}
              options={sortOptions}
              icon={<SortRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
              minWidth={165}
            />
          </Box>

          {/* Table */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            <DataTable
              data={filteredInventory}
              columns={columns}
              keyExtractor={(item) => item.id}
              emptyMessage="No inventory items found"
              emptyIcon={<InventoryRoundedIcon />}
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
                <InventoryRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center' }}>
                  No items selected yet. Enter quantities in the table to add items.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Array.from(selectedItems.entries()).map(([itemId, quantity]) => {
                  const item = inventoryOptions.find(i => i.id === itemId);
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
                          label={`${quantity} ${item.uom}`}
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
            onClick={handleConfirm}
            disabled={selectedItems.size === 0}
          >
            Confirm & Add
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
