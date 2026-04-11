import { Box, Chip, IconButton, Paper, Typography } from '@mui/material';
import DeleteOutlineRoundedIcon from '@/components/icons/lucide-mui/DeleteOutlineRoundedIcon';
import EditRoundedIcon from '@/components/icons/lucide-mui/EditRoundedIcon';
import CallMadeRoundedIcon from '@/components/icons/lucide-mui/CallMadeRoundedIcon';
import CallReceivedRoundedIcon from '@/components/icons/lucide-mui/CallReceivedRoundedIcon';
import TuneRoundedIcon from '@/components/icons/lucide-mui/TuneRoundedIcon';
import type { InventoryTransactionKind, TransactionLineItem } from './transactionModels';

interface TransactionItemsReviewProps {
  items: TransactionLineItem[];
  transactionType: InventoryTransactionKind;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

function getTypeChip(transactionType: InventoryTransactionKind) {
  if (transactionType === 'Stock-Out') {
    return {
      icon: <CallMadeRoundedIcon sx={{ fontSize: 14 }} />,
      label: 'Stock-Out',
      color: '#991B1B',
      bg: 'rgba(220, 38, 38, 0.08)',
    };
  }

  if (transactionType === 'Adjustment') {
    return {
      icon: <TuneRoundedIcon sx={{ fontSize: 14 }} />,
      label: 'Adjustment',
      color: '#92400E',
      bg: 'rgba(217, 119, 6, 0.1)',
    };
  }

  return {
    icon: <CallReceivedRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Stock-In',
    color: '#166534',
    bg: 'rgba(22, 163, 74, 0.08)',
  };
}

export function TransactionItemsReview({ items, transactionType, onEdit, onRemove }: TransactionItemsReviewProps) {
  const typeChip = getTypeChip(transactionType);

  const estimatedValue = items.reduce((sum, item) => {
    if (!item.unitCost) return sum;
    return sum + item.quantity * item.unitCost;
  }, 0);

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 2.5 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary' }}>
          Transaction Items ({items.length})
        </Typography>
        <Chip
          icon={typeChip.icon}
          label={typeChip.label}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 600,
            color: typeChip.color,
            bgcolor: typeChip.bg,
            '& .MuiChip-icon': { color: typeChip.color },
          }}
        />
      </Box>

      {items.length === 0 ? (
        <Box
          sx={{
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            py: 4,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>No items yet</Typography>
          <Typography sx={{ fontSize: 12.5, mt: 0.5 }}>Use the form above to add transaction lines.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {items.map((item, index) => {
            const signedQuantity = transactionType === 'Stock-Out' ? -item.quantity : item.quantity;

            return (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  p: 1.75,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
                      {item.itemName}
                    </Typography>
                    {item.isNewItem && (
                      <Chip
                        label="New"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10.5,
                          fontWeight: 600,
                          bgcolor: 'rgba(84, 107, 63, 0.12)',
                          color: '#546B3F',
                        }}
                      />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace', mt: 0.35 }}>
                    {item.itemSku}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.35 }}>
                    Current Stock: {item.currentStock} {item.unitSymbol || 'unit'}
                    {item.reason ? ` • ${item.reason}` : ''}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right', minWidth: 130 }}>
                  <Typography
                    sx={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: signedQuantity < 0 ? 'error.main' : 'text.primary',
                    }}
                  >
                    {signedQuantity > 0 ? '+' : ''}
                    {signedQuantity} {item.unitSymbol || 'unit'}
                  </Typography>
                  {item.unitCost !== undefined && (
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                      @ ₱{item.unitCost.toFixed(2)}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton size="small" onClick={() => onEdit(index)} sx={{ color: 'text.secondary' }}>
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onRemove(index)} sx={{ color: 'error.main' }}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Estimated total value</Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
          ₱{estimatedValue.toFixed(2)}
        </Typography>
      </Box>
    </Paper>
  );
}


