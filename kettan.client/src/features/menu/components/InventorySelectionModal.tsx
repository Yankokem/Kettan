import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import CheckCircleRoundedIcon from '@/components/icons/lucide-mui/CheckCircleRoundedIcon';
import CategoryRoundedIcon from '@/components/icons/lucide-mui/CategoryRoundedIcon';
import SortRoundedIcon from '@/components/icons/lucide-mui/SortRoundedIcon';
import { Button } from '../../../components/UI/Button';
import { SearchInput } from '../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../components/UI/FilterAndSort';
import { FormTextField } from '../../../components/Form/FormTextField';
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
  const [selectedItem, setSelectedItem] = useState<InventoryItemOption | null>(null);
  const [quantity, setQuantity] = useState<number>(0);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(inventoryOptions.map(opt => opt.category));
    return Array.from(cats).map(cat => ({ value: cat, label: cat }));
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

  const handleItemClick = (item: InventoryItemOption) => {
    setSelectedItem(item);
    setQuantity(0);
  };

  const handleConfirm = () => {
    if (!selectedItem || quantity <= 0) {
      alert('Please select an item and enter a valid quantity');
      return;
    }

    const ingredient: RecipeIngredient = {
      id: `ingredient-${Date.now()}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      qtyPerUnit: quantity,
      uom: selectedItem.uom,
      unitCost: selectedItem.unitCost,
    };

    onSelect(ingredient);
    
    // Reset for next selection
    setSelectedItem(null);
    setQuantity(0);
  };

  const handleClose = () => {
    setSelectedItem(null);
    setQuantity(0);
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 2 }}>
        Select Inventory Item
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Search & Filter Bar */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <SearchInput
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FilterDropdown
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories}
              icon={<CategoryRoundedIcon sx={{ fontSize: 18 }} />}
              minWidth={160}
            />
            <FilterDropdown
              label="Sort"
              value={sortBy}
              onChange={(val) => setSortBy(val as SortOption)}
              options={sortOptions}
              icon={<SortRoundedIcon sx={{ fontSize: 18 }} />}
              minWidth={150}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', height: 400 }}>
          {/* Left: Inventory List */}
          <Box sx={{ 
            width: '60%', 
            overflow: 'auto', 
            borderRight: '1px solid', 
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            {filteredInventory.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No inventory items found
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredInventory.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isAlreadyAdded = selectedItemIds.includes(item.id);
                  
                  return (
                    <ListItem 
                      key={item.id} 
                      disablePadding
                      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <ListItemButton
                        onClick={() => handleItemClick(item)}
                        selected={isSelected}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&.Mui-selected': {
                            bgcolor: 'rgba(107, 76, 42, 0.08)',
                            borderLeft: '3px solid #6B4C2A',
                          },
                          '&.Mui-selected:hover': {
                            bgcolor: 'rgba(107, 76, 42, 0.12)',
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                {item.name}
                              </Typography>
                              {isAlreadyAdded && (
                                <CheckCircleRoundedIcon 
                                  sx={{ fontSize: 18, color: 'success.main' }} 
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.sku}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                • {item.category}
                              </Typography>
                              {item.stockCount !== undefined && (
                                <Typography variant="caption" color="text.secondary">
                                  • Stock: {item.stockCount} {item.uom}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>

          {/* Right: Quantity Input */}
          <Box sx={{ 
            width: '40%', 
            p: 3, 
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {selectedItem ? (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Selected Item
                </Typography>
                
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {selectedItem.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedItem.sku} • {selectedItem.category}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      Unit:
                    </Typography>
                    <Chip 
                      label={selectedItem.uom} 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        fontSize: 11, 
                        fontWeight: 700,
                        bgcolor: 'primary.main',
                        color: 'white'
                      }} 
                    />
                  </Box>
                  {selectedItem.unitCost !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Cost per {selectedItem.uom}:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        ₱{selectedItem.unitCost.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                </Paper>

                <FormTextField
                  label={`Quantity (${selectedItem.uom})`}
                  type="number"
                  inputProps={{ step: '0.001', min: '0' }}
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  placeholder="Enter quantity"
                  fullWidth
                />

                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Button 
                    onClick={handleConfirm} 
                    fullWidth
                    disabled={quantity <= 0}
                  >
                    Confirm & Add
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="text.secondary">
                  ← Select an item from the list to set quantity
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="outlined" onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}


