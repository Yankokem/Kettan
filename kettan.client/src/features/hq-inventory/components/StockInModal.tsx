import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import { Button } from '../../../components/UI/Button';
import { FormTextField } from '../../../components/Form/FormTextField';
import { FormDropdown } from '../../../components/Form/FormDropdown';
import type { InventoryItem, StockInItem, Unit } from '../types';
import { generateBatchNumber } from '../mockData';

interface StockInModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (items: StockInItem[]) => void;
  inventoryItems: InventoryItem[];
  units: Unit[];
}

const initialFormState = {
  itemId: '',
  batchNumber: '',
  quantity: 0,
  expiryDate: '',
  unitCost: 0,
  remarks: '',
};

export function StockInModal({ open, onClose, onComplete, inventoryItems }: StockInModalProps) {
  const [stockInItems, setStockInItems] = useState<StockInItem[]>([]);
  const [currentItem, setCurrentItem] = useState(initialFormState);
  const [showForm, setShowForm] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStockInItems([]);
      setCurrentItem(initialFormState);
      setShowForm(true);
    }
  }, [open]);

  const selectedInventoryItem = inventoryItems.find(i => i.id === currentItem.itemId);

  const handleItemSelect = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (item) {
      setCurrentItem(prev => ({
        ...prev,
        itemId,
        batchNumber: generateBatchNumber(item.sku),
        unitCost: item.unitCost,
      }));
    }
  };

  const handleGenerateBatchNumber = () => {
    if (selectedInventoryItem) {
      setCurrentItem(prev => ({
        ...prev,
        batchNumber: generateBatchNumber(selectedInventoryItem.sku),
      }));
    }
  };

  const handleAddItem = () => {
    if (!currentItem.itemId || !currentItem.quantity || !currentItem.expiryDate) return;

    const newItem: StockInItem = {
      id: `temp-${Date.now()}`,
      ...currentItem,
      itemName: selectedInventoryItem?.name,
      unitSymbol: selectedInventoryItem?.unit?.symbol,
    };

    setStockInItems(prev => [...prev, newItem]);
    setCurrentItem(initialFormState);
    setShowForm(false);
  };

  const handleRemoveItem = (id: string) => {
    setStockInItems(prev => prev.filter(item => item.id !== id));
  };

  const handleComplete = () => {
    if (stockInItems.length === 0) return;
    onComplete(stockInItems);
    onClose();
  };

  const handleClose = () => {
    setStockInItems([]);
    setCurrentItem(initialFormState);
    onClose();
  };

  const costDiff = selectedInventoryItem && selectedInventoryItem.previousUnitCost
    ? ((currentItem.unitCost - selectedInventoryItem.previousUnitCost) / selectedInventoryItem.previousUnitCost) * 100
    : 0;

  const itemOptions = inventoryItems.map(item => ({
    value: item.id,
    label: `${item.name} (${item.sku})`,
  }));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' },
        elevation: 0,
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'success.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <InventoryRoundedIcon sx={{ color: 'success.dark', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Stock-In</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Record incoming inventory from suppliers
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {/* Added Items List */}
        {stockInItems.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
              Items to Stock-In ({stockInItems.length})
            </Typography>
            <Table size="small" sx={{ '& td, & th': { py: 1, px: 1.5 } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Batch #</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">Cost</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }} width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockInItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{item.itemName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: 'text.secondary' }}>
                        {item.batchNumber}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {item.quantity} {item.unitSymbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 13 }}>₱{item.unitCost.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleRemoveItem(item.id)} sx={{ color: 'error.main' }}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Add Item Form */}
        {showForm ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormDropdown
              label="Select Item"
              value={currentItem.itemId}
              onChange={(e) => handleItemSelect(e.target.value as string)}
              options={itemOptions}
            />

            {selectedInventoryItem && (
              <>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <FormTextField
                      label="Batch Number"
                      value={currentItem.batchNumber}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, batchNumber: e.target.value }))}
                      placeholder="Auto-generated"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
                    <IconButton
                      onClick={handleGenerateBatchNumber}
                      sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
                    >
                      <AutorenewRoundedIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <FormTextField
                      label={`Quantity (${selectedInventoryItem.unit?.symbol || ''})`}
                      type="number"
                      value={currentItem.quantity || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      placeholder="Enter quantity"
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormTextField
                      label="Expiry Date"
                      type="date"
                      value={currentItem.expiryDate}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, expiryDate: e.target.value }))}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>
                </Box>

                <Box>
                  <FormTextField
                    label={`Unit Cost (₱ per ${selectedInventoryItem.unit?.symbol || 'unit'})`}
                    type="number"
                    value={currentItem.unitCost || ''}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter cost"
                  />
                  {costDiff !== 0 && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        Previous: ₱{selectedInventoryItem.previousUnitCost?.toFixed(2)}
                      </Typography>
                      <Chip
                        label={`${costDiff > 0 ? '+' : ''}${costDiff.toFixed(1)}%`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          bgcolor: costDiff > 0 ? 'error.light' : 'success.light',
                          color: costDiff > 0 ? 'error.dark' : 'success.dark',
                        }}
                      />
                    </Box>
                  )}
                </Box>

                <FormTextField
                  label="Remarks (Optional)"
                  value={currentItem.remarks}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="e.g., Delivery from supplier #4521"
                  multiline
                  rows={2}
                />
              </>
            )}

            {selectedInventoryItem && (
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={handleAddItem}
                disabled={!currentItem.quantity || !currentItem.expiryDate}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add to List
              </Button>
            )}
          </Box>
        ) : (
          <Button
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={() => setShowForm(true)}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Add Another Item
          </Button>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleComplete}
          disabled={stockInItems.length === 0}
        >
          Complete Stock-In ({stockInItems.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
