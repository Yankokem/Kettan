import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from '@tanstack/react-router';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { SearchInput } from '../../components/UI/SearchInput';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import {
  MOCK_INVENTORY_ITEMS,
  MOCK_CATEGORIES,
  MOCK_UNITS,
  generateBatchNumber,
} from './mockData';
import type { InventoryItem, StockInItem, Unit } from './types';

type StockInMode = 'existing' | 'new';

interface NewItemFormData {
  name: string;
  sku: string;
  categoryId: string;
  unitId: string;
  defaultThreshold: number;
}

const StyledConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.divider,
    borderTopWidth: 2,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.primary.main,
  },
}));

export function StockInPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [mode, setMode] = useState<StockInMode | null>(null);

  // Existing item mode states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // New item mode states
  const [newItemForm, setNewItemForm] = useState<NewItemFormData>({
    name: '',
    sku: '',
    categoryId: '',
    unitId: '',
    defaultThreshold: 0,
  });

  // Stock-in details (shared between modes)
  const [stockInDetails, setStockInDetails] = useState<{
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    unitCost: number;
    remarks: string;
  }>({
    batchNumber: '',
    quantity: 0,
    expiryDate: '',
    unitCost: 0,
    remarks: '',
  });

  // Cart for multiple items (existing mode)
  const [stockInCart, setStockInCart] = useState<StockInItem[]>([]);

  // Generate batch number when entering stock details
  useEffect(() => {
    if (activeStep === 2 && !stockInDetails.batchNumber) {
      setStockInDetails(prev => ({
        ...prev,
        batchNumber: generateBatchNumber(),
      }));
    }
  }, [activeStep, stockInDetails.batchNumber]);

  // Filter inventory items
  const filteredItems = MOCK_INVENTORY_ITEMS.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || item.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = MOCK_CATEGORIES.map(cat => ({ value: cat.id, label: cat.name }));
  const unitOptions = MOCK_UNITS.map(unit => ({ value: unit.id, label: `${unit.name} (${unit.symbol})` }));

  const steps = mode === 'new'
    ? ['Choose Option', 'Item Details', 'Stock Details', 'Review']
    : ['Choose Option', 'Select Item', 'Stock Details', 'Review'];

  const handleModeSelect = (selectedMode: StockInMode) => {
    setMode(selectedMode);
    setActiveStep(1);
  };

  const handleAddToCart = () => {
    if (!selectedItem || stockInDetails.quantity <= 0) return;

    const newEntry: StockInItem = {
      id: `temp-${Date.now()}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemSku: selectedItem.sku,
      batchNumber: stockInDetails.batchNumber,
      quantity: stockInDetails.quantity,
      expiryDate: stockInDetails.expiryDate,
      unitCost: stockInDetails.unitCost,
      previousUnitCost: selectedItem.unitCost,
      unit: selectedItem.unit,
      remarks: stockInDetails.remarks,
    };

    setStockInCart([...stockInCart, newEntry]);
    setSelectedItem(null);
    setStockInDetails({
      batchNumber: generateBatchNumber(selectedItem.sku),
      quantity: 0,
      expiryDate: '',
      unitCost: 0,
      remarks: '',
    });
    setActiveStep(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setStockInCart(stockInCart.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    // TODO: API call to save stock-in
    console.log('Stock-In completed:', mode === 'new' ? { newItem: newItemForm, stockIn: stockInDetails } : stockInCart);
    navigate({ to: '/hq-inventory' });
  };

  const getSelectedUnit = (): Unit | undefined => {
    if (mode === 'existing' && selectedItem) return selectedItem.unit;
    if (mode === 'new') return MOCK_UNITS.find(u => u.id === newItemForm.unitId);
    return undefined;
  };

  const renderModeSelection = () => (
    <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 4 }}>
      {/* Add to Existing Item */}
      <Paper
        onClick={() => handleModeSelect('existing')}
        sx={{
          p: 4,
          width: 320,
          cursor: 'pointer',
          borderRadius: 3,
          border: '2px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'rgba(107,76,42,0.02)',
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          },
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            bgcolor: 'rgba(107,76,42,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <LocalShippingRoundedIcon sx={{ fontSize: 32, color: '#6B4C2A' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Stock-In Existing Item
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
          Add stock to items that already exist in your inventory catalog. Select the item and enter the quantity received.
        </Typography>
      </Paper>

      {/* Create New Item */}
      <Paper
        onClick={() => handleModeSelect('new')}
        sx={{
          p: 4,
          width: 320,
          cursor: 'pointer',
          borderRadius: 3,
          border: '2px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'secondary.main',
            bgcolor: 'rgba(84,107,63,0.02)',
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          },
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            bgcolor: 'rgba(84,107,63,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <AddRoundedIcon sx={{ fontSize: 32, color: '#546B3F' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Add New Inventory Item
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
          Create a new item in your inventory catalog and add the initial stock at the same time.
        </Typography>
      </Paper>
    </Box>
  );

  const renderItemSelection = () => (
    <Box>
      {/* Search & Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Box sx={{ flex: 1, maxWidth: 360 }}>
          <SearchInput
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
        <FilterDropdown
          label="Category"
          icon={<TuneRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />}
          value={filterCategory}
          onChange={setFilterCategory}
          options={categoryOptions}
        />
      </Box>

      {/* Items Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 2,
          maxHeight: 420,
          overflowY: 'auto',
          pr: 1,
        }}
      >
        {filteredItems.map((item) => {
          const isSelected = selectedItem?.id === item.id;
          const isLow = item.totalStock <= item.defaultThreshold;
          return (
            <Paper
              key={item.id}
              onClick={() => setSelectedItem(item)}
              sx={{
                p: 2,
                cursor: 'pointer',
                borderRadius: 2.5,
                border: '1.5px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? 'rgba(107,76,42,0.04)' : 'background.paper',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: 'primary.light',
                  bgcolor: 'rgba(107,76,42,0.02)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, color: 'text.primary' }}>
                    {item.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>
                    {item.sku}
                  </Typography>
                </Box>
                {isSelected && (
                  <CheckCircleRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={item.category?.name || 'Uncategorized'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 600,
                    bgcolor: 'rgba(107,76,42,0.06)',
                    color: '#6B4C2A',
                    border: 'none',
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isLow ? 'error.main' : 'text.primary',
                  }}
                >
                  {item.totalStock} {item.unit?.symbol}
                  {isLow && <WarningAmberRoundedIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle', color: 'error.main' }} />}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Cart Summary */}
      {stockInCart.length > 0 && (
        <Paper sx={{ mt: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>
            Items in this Stock-In ({stockInCart.length})
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Batch</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Cost</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockInCart.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{entry.itemName}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{entry.itemSku}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, fontFamily: 'monospace' }}>{entry.batchNumber}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                      {entry.quantity} {entry.unit?.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontSize: 13 }}>₱{entry.unitCost.toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleRemoveFromCart(idx)}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: 'error.main' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => { setMode(null); setActiveStep(0); }}>
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {stockInCart.length > 0 && (
            <Button onClick={() => setActiveStep(3)}>
              Review ({stockInCart.length} items)
            </Button>
          )}
          <Button disabled={!selectedItem} onClick={() => setActiveStep(2)}>
            Continue with Selected
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderNewItemForm = () => (
    <Box>
      <Paper sx={{ p: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 3 }}>New Item Details</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
          <FormTextField
            label="Item Name"
            required
            value={newItemForm.name}
            onChange={(e) => setNewItemForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Espresso Beans - Premium"
          />
          <FormTextField
            label="SKU"
            required
            value={newItemForm.sku}
            onChange={(e) => setNewItemForm(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
            placeholder="e.g., BN-ESP-001"
          />
          <FormDropdown
            label="Category"
            required
            value={newItemForm.categoryId}
            onChange={(e) => setNewItemForm(prev => ({ ...prev, categoryId: String(e.target.value) }))}
            options={[{ value: '', label: 'Select category' }, ...categoryOptions]}
          />
          <FormDropdown
            label="Unit of Measure"
            required
            value={newItemForm.unitId}
            onChange={(e) => setNewItemForm(prev => ({ ...prev, unitId: String(e.target.value) }))}
            options={[{ value: '', label: 'Select unit' }, ...unitOptions]}
          />
          <FormTextField
            label="Reorder Threshold"
            type="number"
            value={newItemForm.defaultThreshold || ''}
            onChange={(e) => setNewItemForm(prev => ({ ...prev, defaultThreshold: parseFloat(e.target.value) || 0 }))}
            placeholder="e.g., 10"
            helperText="Alert when stock falls below this level"
          />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => { setMode(null); setActiveStep(0); }}>
          Back
        </Button>
        <Button
          disabled={!newItemForm.name || !newItemForm.sku || !newItemForm.categoryId || !newItemForm.unitId}
          onClick={() => setActiveStep(2)}
        >
          Continue to Stock Details
        </Button>
      </Box>
    </Box>
  );

  const renderStockDetails = () => {
    const unit = getSelectedUnit();
    const previousCost = mode === 'existing' && selectedItem ? selectedItem.unitCost : 0;
    const costDiff = stockInDetails.unitCost && previousCost ? stockInDetails.unitCost - previousCost : 0;
    const costDiffPct = previousCost ? (costDiff / previousCost) * 100 : 0;

    return (
      <Box>
        <Paper sx={{ p: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          {/* Selected Item Info (Existing mode) */}
          {mode === 'existing' && selectedItem && (
            <Box sx={{ mb: 3, pb: 3, borderBottom: '1px dashed', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>Selected Item</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 18, color: 'text.primary' }}>
                {selectedItem.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip
                  label={selectedItem.sku}
                  size="small"
                  sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: 'rgba(107,76,42,0.06)', color: '#6B4C2A', border: 'none' }}
                />
                <Chip
                  label={selectedItem.category?.name}
                  size="small"
                  sx={{ fontSize: 11, bgcolor: 'rgba(84,107,63,0.06)', color: '#546B3F', border: 'none' }}
                />
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  Current: <strong>{selectedItem.totalStock} {selectedItem.unit?.symbol}</strong>
                </Typography>
              </Box>
            </Box>
          )}

          {/* New Item Summary (New mode) */}
          {mode === 'new' && (
            <Box sx={{ mb: 3, pb: 3, borderBottom: '1px dashed', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>New Item</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 18, color: 'text.primary' }}>
                {newItemForm.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip
                  label={newItemForm.sku}
                  size="small"
                  sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: 'rgba(107,76,42,0.06)', color: '#6B4C2A', border: 'none' }}
                />
                <Chip
                  label={MOCK_CATEGORIES.find(c => c.id === newItemForm.categoryId)?.name}
                  size="small"
                  sx={{ fontSize: 11, bgcolor: 'rgba(84,107,63,0.06)', color: '#546B3F', border: 'none' }}
                />
              </Box>
            </Box>
          )}

          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 3 }}>Stock-In Details</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
            <FormTextField
              label="Batch Number"
              value={stockInDetails.batchNumber}
              onChange={(e) => setStockInDetails(prev => ({ ...prev, batchNumber: e.target.value }))}
              helperText="Auto-generated, but can be modified"
            />
            <FormTextField
              label="Quantity"
              type="number"
              required
              value={stockInDetails.quantity || ''}
              onChange={(e) => setStockInDetails(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              InputProps={{
                endAdornment: unit && <InputAdornment position="end">{unit.symbol}</InputAdornment>,
              }}
            />
            <FormTextField
              label="Expiry Date"
              type="date"
              value={stockInDetails.expiryDate}
              onChange={(e) => setStockInDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <Box>
              <FormTextField
                label="Unit Cost"
                type="number"
                value={stockInDetails.unitCost || ''}
                onChange={(e) => setStockInDetails(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                }}
              />
              {/* Cost comparison indicator */}
              {previousCost > 0 && stockInDetails.unitCost > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {costDiff !== 0 ? (
                    <>
                      {costDiff > 0 ? (
                        <TrendingUpRoundedIcon sx={{ fontSize: 16, color: 'error.main' }} />
                      ) : (
                        <TrendingDownRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      )}
                      <Typography sx={{ fontSize: 12, color: costDiff > 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>
                        {costDiff > 0 ? '+' : ''}{costDiffPct.toFixed(1)}% vs last cost (₱{previousCost.toFixed(2)})
                      </Typography>
                    </>
                  ) : (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                      Same as last cost
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FormTextField
                label="Remarks"
                multiline
                rows={2}
                value={stockInDetails.remarks}
                onChange={(e) => setStockInDetails(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Optional notes about this stock-in..."
              />
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={() => setActiveStep(1)}>
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {mode === 'existing' && (
              <Button variant="outlined" onClick={handleAddToCart} disabled={stockInDetails.quantity <= 0}>
                Add & Select Another
              </Button>
            )}
            <Button
              onClick={() => {
                if (mode === 'existing') handleAddToCart();
                setActiveStep(3);
              }}
              disabled={stockInDetails.quantity <= 0}
            >
              Review
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderReview = () => {
    const itemsToReview = mode === 'existing' ? stockInCart : [{
      itemName: newItemForm.name,
      itemSku: newItemForm.sku,
      ...stockInDetails,
      unit: MOCK_UNITS.find(u => u.id === newItemForm.unitId),
    }];
    const totalValue = itemsToReview.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    return (
      <Box>
        <Paper sx={{ p: 3, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 3 }}>Review Stock-In</Typography>

          {mode === 'new' && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(84,107,63,0.04)', borderRadius: 2, border: '1px solid rgba(84,107,63,0.12)' }}>
              <Typography sx={{ fontSize: 12, color: '#546B3F', fontWeight: 600, mb: 1 }}>
                NEW ITEM WILL BE CREATED
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{newItemForm.name}</Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  SKU: <strong>{newItemForm.sku}</strong>
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  Category: <strong>{MOCK_CATEGORIES.find(c => c.id === newItemForm.categoryId)?.name}</strong>
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  Threshold: <strong>{newItemForm.defaultThreshold} {MOCK_UNITS.find(u => u.id === newItemForm.unitId)?.symbol}</strong>
                </Typography>
              </Box>
            </Box>
          )}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>ITEM</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>BATCH</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>QTY</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>UNIT COST</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>TOTAL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsToReview.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{item.itemName}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>{item.itemSku}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12, fontFamily: 'monospace' }}>{item.batchNumber}</Typography>
                    {item.expiryDate && (
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                        Exp: {new Date(item.expiryDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                      {item.quantity} {item.unit?.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontSize: 13 }}>₱{item.unitCost.toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                      ₱{(item.quantity * item.unitCost).toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
              Total Value: ₱{totalValue.toFixed(2)}
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={() => setActiveStep(2)}>
            Back
          </Button>
          <Button onClick={handleComplete}>
            Confirm Stock-In
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ pb: 4, pt: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/hq-inventory" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Stock-In
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Add stock to existing items or create new inventory items
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        connector={<StyledConnector />}
        sx={{ mb: 4 }}
      >
        {steps.map((label, index) => (
          <Step key={label} completed={index < activeStep}>
            <StepLabel
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: 12,
                  fontWeight: index === activeStep ? 700 : 500,
                  color: index === activeStep ? 'primary.main' : 'text.secondary',
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Content */}
      {activeStep === 0 && renderModeSelection()}
      {activeStep === 1 && mode === 'existing' && renderItemSelection()}
      {activeStep === 1 && mode === 'new' && renderNewItemForm()}
      {activeStep === 2 && renderStockDetails()}
      {activeStep === 3 && renderReview()}
    </Box>
  );
}
