import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import CloseRoundedIcon from '@/components/icons/lucide-mui/CloseRoundedIcon';
import TuneRoundedIcon from '@/components/icons/lucide-mui/TuneRoundedIcon';
import ArrowForwardRoundedIcon from '@/components/icons/lucide-mui/ArrowForwardRoundedIcon';
import { Button } from '../../../components/UI/Button';
import { FormTextField } from '../../../components/Form/FormTextField';
import type { Batch, InventoryItem, AdjustmentFormData } from '../types';

interface AdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: AdjustmentFormData) => void;
  batch: Batch | null;
  item: InventoryItem | null;
}

export function AdjustmentModal({ open, onClose, onConfirm, batch, item }: AdjustmentModalProps) {
  const [draftByBatch, setDraftByBatch] = useState<Record<string, AdjustmentFormData>>({});

  if (!batch || !item) return null;

  const defaultFormData: AdjustmentFormData = {
    batchId: batch.id,
    newQuantity: batch.currentQuantity,
    reason: '',
    remarks: '',
  };

  const formData = draftByBatch[batch.id] ?? defaultFormData;

  const updateFormData = (patch: Partial<AdjustmentFormData>) => {
    setDraftByBatch((previous) => ({
      ...previous,
      [batch.id]: {
        ...(previous[batch.id] ?? defaultFormData),
        ...patch,
      },
    }));
  };

  const clearCurrentDraft = () => {
    setDraftByBatch((previous) => {
      if (!(batch.id in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[batch.id];
      return next;
    });
  };

  const difference = formData.newQuantity - batch.currentQuantity;
  const differenceText = difference > 0 ? `+${difference}` : `${difference}`;
  const isNoChange = difference === 0;

  const handleConfirm = () => {
    if (isNoChange || !formData.reason) return;
    onConfirm(formData);
    clearCurrentDraft();
    onClose();
  };

  const handleDialogClose = () => {
    clearCurrentDraft();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="xs"
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
            bgcolor: 'warning.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TuneRoundedIcon sx={{ color: 'warning.dark', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Adjust Quantity</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Physical count correction
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleDialogClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Item & Batch Info */}
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{item.name}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace', mt: 0.5 }}>
              Batch: {batch.batchNumber}
            </Typography>
          </Box>

          {/* Current → New Quantity Display */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>Current</Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
                {batch.currentQuantity}
                <Typography component="span" sx={{ fontSize: 14, fontWeight: 500, color: 'text.secondary', ml: 0.5 }}>
                  {item.unit?.symbol}
                </Typography>
              </Typography>
            </Box>

            <ArrowForwardRoundedIcon sx={{ color: 'text.disabled', fontSize: 28 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>New</Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 700, color: isNoChange ? 'text.primary' : (difference > 0 ? 'success.main' : 'error.main') }}>
                {formData.newQuantity}
                <Typography component="span" sx={{ fontSize: 14, fontWeight: 500, color: 'text.secondary', ml: 0.5 }}>
                  {item.unit?.symbol}
                </Typography>
              </Typography>
            </Box>
          </Box>

          {/* Difference Chip */}
          {!isNoChange && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Chip
                label={`${differenceText} ${item.unit?.symbol}`}
                sx={{
                  fontWeight: 700,
                  fontSize: 13,
                  bgcolor: difference > 0 ? 'success.light' : 'error.light',
                  color: difference > 0 ? 'success.dark' : 'error.dark',
                }}
              />
            </Box>
          )}

          <FormTextField
            label={`New Quantity (${item.unit?.symbol})`}
            type="number"
            value={formData.newQuantity}
            onChange={(e) => updateFormData({ newQuantity: parseFloat(e.target.value) || 0 })}
            placeholder="Enter actual quantity"
          />

          <FormTextField
            label="Reason"
            value={formData.reason}
            onChange={(e) => updateFormData({ reason: e.target.value })}
            placeholder="e.g., Physical count, Inventory audit"
          />

          <FormTextField
            label="Remarks (Optional)"
            value={formData.remarks || ''}
            onChange={(e) => updateFormData({ remarks: e.target.value })}
            placeholder="Additional notes"
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={handleDialogClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isNoChange || !formData.reason}
        >
          Save Adjustment
        </Button>
      </DialogActions>
    </Dialog>
  );
}


