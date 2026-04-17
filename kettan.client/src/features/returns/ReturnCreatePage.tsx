import { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import { createReturn } from '../branch-operations/api';
import { recordAuditLog } from '../audit-logs/auditLogStore';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

export function ReturnCreatePage() {
  const navigate = useNavigate();

  const [orderId, setOrderId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantityReturned, setQuantityReturned] = useState('');
  const [reason, setReason] = useState('');
  const [photoUrls, setPhotoUrls] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const parsedOrderId = Number(orderId);
    const parsedItemId = Number(itemId);
    const parsedQty = Number(quantityReturned);

    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      setError('Order ID must be a positive whole number.');
      return;
    }

    if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
      setError('Item ID must be a positive whole number.');
      return;
    }

    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setError('Returned quantity must be greater than zero.');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const created = await createReturn({
        orderId: parsedOrderId,
        reason: reason.trim(),
        photoUrls: photoUrls || undefined,
        items: [
          {
            itemId: parsedItemId,
            quantityReturned: parsedQty,
            reason: reason.trim(),
          },
        ],
      });

      recordAuditLog({
        action: 'ReturnFiled',
        entityName: 'Return',
        entityId: created.returnId,
        details: `Filed return RT-${created.returnId} for order #${created.orderId}.`,
      });

      navigate({ to: '/returns/$returnId', params: { returnId: String(created.returnId) } });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ pb: 3, pt: 1, display: 'grid', gap: 2.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <BackButton to="/returns" />
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>File Return</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Create a return record linked to one delivered order.</Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 2.25, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.25,
            mb: 1.25,
          }}
        >
          <TextField label="Order ID" value={orderId} onChange={(event) => setOrderId(event.target.value)} />
          <TextField label="Item ID" value={itemId} onChange={(event) => setItemId(event.target.value)} />
          <TextField label="Qty Returned" type="number" value={quantityReturned} onChange={(event) => setQuantityReturned(event.target.value)} />
        </Box>

        <TextField label="Return Reason" value={reason} onChange={(event) => setReason(event.target.value)} sx={{ mb: 1.25 }} />
        <TextField label="Photo URLs (comma separated)" value={photoUrls} onChange={(event) => setPhotoUrls(event.target.value)} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
          <Button onClick={() => void handleCreate()} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Submit Return'}
          </Button>
        </Box>

        {error ? (
          <Typography sx={{ color: 'error.main', fontSize: 12.5, mt: 1.2 }}>{error}</Typography>
        ) : null}
      </Paper>
    </Box>
  );
}
