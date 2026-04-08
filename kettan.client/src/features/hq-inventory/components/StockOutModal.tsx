import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Button } from '../../../components/UI/Button';
import { FormTextField } from '../../../components/Form/FormTextField';
import { FormDropdown } from '../../../components/Form/FormDropdown';
import type { InventoryItem, Batch, StockOutFormData, StockOutReason } from '../types';

interface StockOutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: StockOutFormData) => void;
  inventoryItems: InventoryItem[];
  batches: Batch[];
}

const STOCK_OUT_REASONS: { value: StockOutReason; label: string }[] = [
  { value: 'Wastage', label: 'Wastage' },
  { value: 'Spillage', label: 'Spillage' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Transfer', label: 'Transfer to Branch' },
  { value: 'Other', label: 'Other' },
];

export function StockOutModal({ open, onClose, onConfirm, inventoryItems, batches }: StockOutModalProps) {
  const [formData, setFormData] = useState<StockOutFormData>({
    itemId: '',
    batchId: undefined,
    quantity: 0,
    reason: 'Wastage',
    remarks: '',
  });

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        itemId: '',
        batchId: undefined,
        quantity: 0,
        reason: 'Wastage',
        remarks: '',
      });
    }
  }, [open]);

  const selectedItem = inventoryItems.find(i => i.id === formData.itemId);

  // Get batches for selected item, sorted by expiry (FIFO)
  const itemBatches = useMemo(() => {
    if (!formData.itemId) return [];
    return batches
      .filter(b => b.itemId === formData.itemId && b.currentQuantity > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [batches, formData.itemId]);

  // Auto-select first batch (FIFO) when item changes
  useEffect(() => {
    if (itemBatches.length > 0 && !formData.batchId) {
      setFormData(prev => ({ ...prev, batchId: itemBatches[0].id }));
    }
  }, [itemBatches, formData.batchId]);

  const selectedBatch = batches.find(b => b.id === formData.batchId);

  const handleItemSelect = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      itemId,
      batchId: undefined,
      quantity: 0,
    }));
  };

  const handleConfirm = () => {
    if (!formData.itemId || !formData.quantity || !formData.reason) return;
    onConfirm(formData);
    onClose();
  };

  const isExpiringWithin7Days = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const itemOptions = inventoryItems.map(item => ({
    value: item.id,
    label: `${item.name} (${item.totalStock} ${item.unit?.symbol || ''} available)`,
  }));

  const reasonOptions = STOCK_OUT_REASONS.map(r => ({ value: r.value, label: r.label }));

  const isOverQuantity = selectedBatch && formData.quantity > selectedBatch.currentQuantity;

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            bgcolor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <RemoveCircleOutlineRoundedIcon sx={{ color: 'error.dark', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Stock-Out</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Record wastage, spillage, or manual consumption
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <FormDropdown
            label="Select Item"
            value={formData.itemId}
            onChange={(e) => handleItemSelect(e.target.value as string)}
            options={itemOptions}
          />

          {selectedItem && itemBatches.length > 0 && (
            <>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1.5, ml: 0.5 }}>
                  Select Batch (FIFO Recommended)
                </Typography>
                <Box sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <RadioGroup
                    value={formData.batchId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, batchId: e.target.value }))}
                  >
                    {itemBatches.map((batch, index) => {
                      const isExpiring = isExpiringWithin7Days(batch.expiryDate);
                      return (
                        <Box
                          key={batch.id}
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderBottom: index < itemBatches.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider',
                            bgcolor: formData.batchId === batch.id ? 'action.selected' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <FormControlLabel
                            value={batch.id}
                            control={<Radio size="small" />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                                      {batch.batchNumber}
                                    </Typography>
                                    {index === 0 && (
                                      <Chip
                                        label="FIFO"
                                        size="small"
                                        sx={{
                                          height: 18,
                                          fontSize: 10,
                                          fontWeight: 700,
                                          bgcolor: 'primary.main',
                                          color: 'white',
                                        }}
                                      />
                                    )}
                                    {isExpiring && (
                                      <Chip
                                        icon={<WarningAmberRoundedIcon sx={{ fontSize: 14 }} />}
                                        label="Expiring Soon"
                                        size="small"
                                        sx={{
                                          height: 18,
                                          fontSize: 10,
                                          fontWeight: 600,
                                          bgcolor: 'warning.light',
                                          color: 'warning.dark',
                                          '& .MuiChip-icon': { color: 'warning.dark' },
                                        }}
                                      />
                                    )}
                                  </Box>
                                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                                    {batch.currentQuantity} {selectedItem.unit?.symbol} available • Exp: {formatDate(batch.expiryDate)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                            sx={{ m: 0, width: '100%' }}
                          />
                        </Box>
                      );
                    })}
                  </RadioGroup>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormTextField
                    label={`Quantity to Remove (${selectedItem.unit?.symbol || ''})`}
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter quantity"
                    error={isOverQuantity}
                  />
                  {isOverQuantity && (
                    <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5, ml: 0.5 }}>
                      Exceeds available quantity in selected batch ({selectedBatch?.currentQuantity} {selectedItem.unit?.symbol})
                    </Typography>
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormDropdown
                    label="Reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value as StockOutReason }))}
                    options={reasonOptions}
                  />
                </Box>
              </Box>

              <FormTextField
                label="Remarks (Optional)"
                value={formData.remarks || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="e.g., Spilled during morning prep"
                multiline
                rows={2}
              />
            </>
          )}

          {selectedItem && itemBatches.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: 'text.secondary' }}>
                No batches available for this item
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!formData.itemId || !formData.quantity || isOverQuantity}
          sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
        >
          Confirm Stock-Out
        </Button>
      </DialogActions>
    </Dialog>
  );
}
