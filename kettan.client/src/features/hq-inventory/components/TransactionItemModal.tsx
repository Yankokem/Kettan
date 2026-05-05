import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import { Button } from '../../../components/UI/Button';
import { FormTextField } from '../../../components/Form/FormTextField';
import { FormDropdown } from '../../../components/Form/FormDropdown';
import { SearchInput } from '../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../components/UI/FilterAndSort';
import type { InventoryItem, InventoryCategory } from '../types';
import type { TransactionItemDraft, InventoryTransactionKind, TransactionLineItem } from './transactionModels';

interface TransactionItemModalProps {
  open: boolean;
  onClose: () => void;
  transactionType: InventoryTransactionKind;
  catalogItems: InventoryItem[];
  categories: InventoryCategory[];
  unitOptions: { value: string; label: string }[];
  onAdd: (draft: TransactionItemDraft) => void;
  editingLine?: TransactionLineItem | null;
}

export function TransactionItemModal({
  open,
  onClose,
  transactionType,
  catalogItems,
  categories,
  unitOptions,
  onAdd,
  editingLine,
}: TransactionItemModalProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  
  // Right side state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [threshold, setThreshold] = useState('10');

  // Quick create state
  const [newItemName, setNewItemName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newUnit, setNewUnit] = useState('pc');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync with editingLine
  useMemo(() => {
    if (editingLine) {
      setMode(editingLine.isNewItem ? 'new' : 'existing');
      if (editingLine.isNewItem) {
        setNewItemName(editingLine.itemName);
        setNewSku(editingLine.itemSku);
        setNewCategoryId(editingLine.newCategoryId || '');
        setNewUnit(editingLine.newUnit || 'pc');
      } else {
        const item = catalogItems.find(i => i.id === editingLine.itemId);
        if (item) setSelectedItem(item);
      }
      setQuantity(editingLine.quantity.toString());
      setUnitCost(editingLine.unitCost?.toString() || '');
      setExpiryDate(editingLine.expiryDate || '');
      setThreshold(editingLine.defaultThreshold?.toString() || '10');
    } else {
      setMode('existing');
      setSelectedItem(null);
      setQuantity('1');
      setUnitCost('');
      setExpiryDate('');
      setThreshold('10');
      setNewItemName('');
      setNewSku('');
      setNewCategoryId('');
      setNewUnit('pc');
    }
  }, [editingLine, catalogItems]);

  const filteredItems = useMemo(() => {
    return catalogItems.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !filterCategory || item.categoryId === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalogItems, searchQuery, filterCategory]);

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setUnitCost(item.unitCost?.toString() || '');
    setError(null);
  };

  const handleModeChange = (_: any, newMode: 'existing' | 'new') => {
    if (newMode) {
      setMode(newMode);
      setSelectedItem(null);
      setError(null);
    }
  };

  const handleQuickCreateProceed = () => {
    if (!newItemName.trim()) {
      setError('Item name is required.');
      return;
    }
    setError(null);
    // In "Quick Create" mode, we don't have a selectedItem, 
    // but the right side will still show inputs.
  };

  const handleSubmit = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Enter a valid quantity.');
      return;
    }

    if (mode === 'existing' && !selectedItem) {
      setError('Please select an item first.');
      return;
    }

    if (mode === 'new' && !newItemName.trim()) {
      setError('Item name is required.');
      return;
    }

    const draft: TransactionItemDraft = {
      mode,
      searchQuery: '',
      selectedItemId: selectedItem?.id || '',
      newItemName: mode === 'new' ? newItemName : '',
      newSku: mode === 'new' ? newSku : '',
      newCategoryId: mode === 'new' ? newCategoryId : '',
      newUnit: mode === 'new' ? newUnit : '',
      quantity,
      unitCost: unitCost || '0',
      expiryDate,
      defaultThreshold: threshold,
      reason: 'Wastage', // Default
    };

    onAdd(draft);
    // Reset state for next add
    setSelectedItem(null);
    setQuantity('1');
    setUnitCost('');
    setExpiryDate('');
    setThreshold('10');
    setNewItemName('');
    setNewSku('');
    setNewCategoryId('');
    setNewUnit('pc');
    setError(null);
  };

  const categoryOptions = useMemo(
    () => [{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))],
    [categories]
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: '20px', 
          overflow: 'hidden',
          maxWidth: '960px' // Slightly larger than standard md
        }
      }}
    >
      <DialogTitle sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(201, 168, 77, 0.12)', color: 'primary.main', display: 'flex' }}>
            <Inventory2RoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700 }}>Add Item Entry</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.disabled' }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', height: '620px' }}>
          {/* LEFT SIDE: Selection / Form */}
          <Box sx={{ flex: 1.2, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Tabs 
                value={mode} 
                onChange={handleModeChange}
                variant="fullWidth"
                sx={{ 
                  minHeight: 40,
                  '& .MuiTab-root': { minHeight: 40, fontSize: 13, fontWeight: 600, textTransform: 'none' }
                }}
              >
                <Tab label="Select Existing" value="existing" icon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
                {transactionType === 'Stock-In' && (
                  <Tab label="Quick Create" value="new" icon={<AddCircleRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
                )}
              </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {mode === 'existing' ? (
                <>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <SearchInput 
                      placeholder="Search items..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <FilterDropdown
                      label=""
                      icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
                      value={filterCategory}
                      onChange={setFilterCategory}
                      options={categoryOptions}
                      minWidth={140}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredItems.map(item => (
                      <Paper
                        key={item.id}
                        elevation={0}
                        onClick={() => handleSelectItem(item)}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          borderRadius: '12px',
                          border: '1px solid',
                          borderColor: selectedItem?.id === item.id ? 'primary.main' : 'divider',
                          bgcolor: selectedItem?.id === item.id ? 'rgba(201, 168, 77, 0.05)' : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: 'text.primary' }}>{item.name}</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.disabled', fontFamily: 'monospace' }}>{item.sku}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{item.category?.name || 'Uncategorized'}</Typography>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: item.totalStock <= item.defaultThreshold ? 'error.main' : 'success.main' }}>
                            {item.totalStock} {item.unit}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    {filteredItems.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                        <Inventory2RoundedIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                        <Typography sx={{ fontSize: 13 }}>No items found</Typography>
                      </Box>
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                  <FormTextField 
                    label="Item Name" 
                    placeholder="Enter item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                  <FormTextField 
                    label="SKU (Optional)" 
                    placeholder="Will be auto-generated if blank"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                  />
                  <FormDropdown 
                    label="Category" 
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(String(e.target.value))}
                    options={categoryOptions.filter(o => o.value !== '')}
                  />
                  <FormDropdown 
                    label="Unit" 
                    value={newUnit}
                    onChange={(e) => setNewUnit(String(e.target.value))}
                    options={unitOptions}
                  />
                  <Button variant="outlined" onClick={handleQuickCreateProceed}>
                    Confirm Selection
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* RIGHT SIDE: Entry Details */}
          <Box sx={{ flex: 1, p: 3, bgcolor: 'rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary', mb: 1 }}>Entry Details</Typography>
              {selectedItem ? (
                <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider', mb: 2 }}>
                   <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selectedItem.name}</Typography>
                   <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{selectedItem.sku}</Typography>
                </Box>
              ) : mode === 'new' && newItemName ? (
                <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddCircleRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{newItemName} (New)</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{newSku || 'Auto-SKU'}</Typography>
                </Box>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center', border: '1.5px dashed', borderColor: 'divider', borderRadius: '12px', color: 'text.disabled' }}>
                   <Typography sx={{ fontSize: 12.5 }}>Select or create an item on the left</Typography>
                </Box>
              )}
            </Box>

            <FormTextField 
              label={transactionType === 'Stock-Out' ? 'Quantity Deducted' : transactionType === 'Adjustment' ? 'Adjusted Quantity' : 'Quantity Received'} 
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputProps={{ min: 1 }}
            />
            
            {transactionType === 'Stock-In' && (
              <>
                <FormTextField 
                  label="Unit Cost" 
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder={selectedItem ? selectedItem.unitCost.toString() : '0.00'}
                />

                <FormTextField 
                  label="Low Stock Threshold" 
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="10"
                />

                <FormTextField 
                  label="Expiry Date (Optional)" 
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}

            {error && (
              <Typography sx={{ fontSize: 12, color: 'error.main', textAlign: 'center' }}>{error}</Typography>
            )}

            <Box sx={{ mt: 'auto' }}>
              <Button 
                fullWidth 
                onClick={handleSubmit} 
                disabled={(!selectedItem && mode === 'existing') || (mode === 'new' && !newItemName)}
              >
                Add to Transaction
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}