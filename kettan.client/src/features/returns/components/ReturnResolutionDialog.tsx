import { useEffect, useState } from 'react';
import { Box, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';

import { Button } from '../../../components/UI/Button';
import { Dropdown } from '../../../components/UI/Dropdown';
import { TextField } from '../../../components/UI/TextField';

interface ResolveReturnPayload {
  resolution: 'Credited' | 'Replaced' | 'Rejected';
  creditAmount?: number;
  remarks?: string;
}

interface ReturnResolutionDialogProps {
  open: boolean;
  isSaving: boolean;
  returnIdLabel?: string;
  onClose: () => void;
  onSubmit: (payload: ResolveReturnPayload) => void;
}

export function ReturnResolutionDialog({
  open,
  isSaving,
  returnIdLabel,
  onClose,
  onSubmit,
}: ReturnResolutionDialogProps) {
  const [resolution, setResolution] = useState<'Credited' | 'Replaced' | 'Rejected'>('Credited');
  const [creditAmount, setCreditAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setResolution('Credited');
    setCreditAmount('');
    setRemarks('');
    setError(null);
  }, [open]);

  const handleSubmit = () => {
    if (resolution === 'Rejected' && !remarks.trim()) {
      setError('Remarks are required when rejecting a return.');
      return;
    }

    const parsedCreditAmount = Number(creditAmount);
    if (
      resolution === 'Credited' &&
      creditAmount.trim() &&
      (!Number.isFinite(parsedCreditAmount) || parsedCreditAmount < 0)
    ) {
      setError('Credit amount must be a valid zero-or-positive number.');
      return;
    }

    setError(null);
    onSubmit({
      resolution,
      creditAmount: resolution === 'Credited' && creditAmount.trim() ? parsedCreditAmount : undefined,
      remarks: remarks.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' },
        elevation: 0,
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1.1 }}>Resolve Return {returnIdLabel || ''}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1.2, mt: 0.4 }}>
          <Dropdown
            value={resolution}
            onChange={(event) => setResolution(String(event.target.value) as 'Credited' | 'Replaced' | 'Rejected')}
            options={[
              { value: 'Credited', label: 'Credited' },
              { value: 'Replaced', label: 'Replaced' },
              { value: 'Rejected', label: 'Rejected' },
            ]}
            sx={{ width: '100%' }}
          />

          <TextField
            label="Credit Amount (optional)"
            type="number"
            value={creditAmount}
            onChange={(event) => setCreditAmount(event.target.value)}
            disabled={resolution !== 'Credited'}
          />

          <TextField
            label={resolution === 'Rejected' ? 'Remarks (required)' : 'Remarks (optional)'}
            multiline
            minRows={3}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />

          {error ? (
            <Typography sx={{ color: 'error.main', fontSize: 12.5 }}>{error}</Typography>
          ) : null}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.1, mt: 0.6 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Confirm Resolution'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
