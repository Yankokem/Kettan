import { Box, Typography, TextField, Button, Divider, Alert, Stack } from '@mui/material';
import type { InventoryItem } from './InventoryItemCard';
import ShoppingCartIcon from '@/components/icons/lucide-mui/ShoppingCartIcon';
import WarningAmberIcon from '@/components/icons/lucide-mui/WarningAmberIcon';
import { useState } from 'react';

interface InventoryItemDetailsProps {
  item: InventoryItem;
  onAddItem: (item: InventoryItem, quantity: number, notes: string) => void;
}

export function InventoryItemDetails({ item, onAddItem }: InventoryItemDetailsProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const isOutOfStock = item.hqStock === 0;

  const handleAddClick = () => {
    onAddItem(item, quantity, notes);
    setQuantity(1);
    setNotes('');
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: '1 1 auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{item.name}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace', mb: 2 }}>
          SKU: {item.sku}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Category</Typography>
            <Typography variant="body1" fontWeight={500}>{item.category}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Unit Size</Typography>
            <Typography variant="body1" fontWeight={500}>{item.unit}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Available HQ Stock</Typography>
            <Typography variant="body1" fontWeight={700} color={isOutOfStock ? 'error.main' : 'success.main'}>
              {item.hqStock} {item.unit}
            </Typography>
          </Box>
        </Stack>

        {isOutOfStock && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
            This item is currently out of stock at HQ. You may still request it, but fulfillment may be delayed.
          </Alert>
        )}

        <Stack spacing={3}>
          <TextField
            label="Request Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
            fullWidth
            size="small"
          />
          <TextField
            label="Internal Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Needed for weekend promo, partial delivery ok."
            fullWidth
            size="small"
          />
        </Stack>
      </Box>

      <Box sx={{ mt: 'auto', pt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ShoppingCartIcon />}
          fullWidth
          size="large"
          onClick={handleAddClick}
          sx={{ py: 1.5, fontWeight: 700 }}
        >
          Add to Request
        </Button>
      </Box>
    </Box>
  );
}


