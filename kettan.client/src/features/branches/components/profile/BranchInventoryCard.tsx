import { Box, Chip, Paper, Typography } from '@mui/material';
import { PackageCheck, Store } from 'lucide-react';
import type { BranchInventoryItem } from '../../types';
import { formatDate } from '../../branchProfileData';

interface BranchInventoryCardProps {
  item: BranchInventoryItem;
}

const STATUS_LABEL_MAP: Record<BranchInventoryItem['status'], string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

export function BranchInventoryCard({ item }: BranchInventoryCardProps) {
  const isLowStock = item.status === 'low-stock';
  const isOutOfStock = item.status === 'out-of-stock';

  const coveragePercent =
    item.reorderPoint > 0
      ? Math.max(0, Math.min(100, Math.round((item.stockCount / item.reorderPoint) * 100)))
      : 100;

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: isOutOfStock
          ? 'rgba(185,28,28,0.28)'
          : isLowStock
            ? 'rgba(180,83,9,0.28)'
            : 'divider',
        bgcolor: isOutOfStock
          ? 'rgba(254,242,242,0.58)'
          : isLowStock
            ? 'rgba(255,251,235,0.58)'
            : 'background.paper',
        borderRadius: 3,
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
          {item.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.8, flexWrap: 'wrap' }}>
          <Chip
            label={item.sku}
            size="small"
            sx={{
              height: 21,
              fontFamily: 'monospace',
              bgcolor: 'rgba(148,163,184,0.16)',
              fontWeight: 700,
              fontSize: 10,
            }}
          />
          <Chip
            label={item.category}
            size="small"
            sx={{
              height: 21,
              bgcolor: 'rgba(107,76,42,0.1)',
              color: '#6B4C2A',
              fontWeight: 700,
              fontSize: 10,
            }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 0.2 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{item.stockCount}</Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>
          units in stock ({item.unit})
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.2 }}>
          Reorder point: {item.reorderPoint}
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          height: 6,
          borderRadius: 999,
          bgcolor: 'rgba(148,163,184,0.22)',
          overflow: 'hidden',
          mt: 'auto',
        }}
      >
        <Box
          sx={{
            width: `${coveragePercent}%`,
            height: '100%',
            bgcolor: isOutOfStock ? '#DC2626' : isLowStock ? '#D97706' : '#16A34A',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.4 }}>
        <Typography
          sx={{
            fontSize: 11,
            color: 'text.secondary',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            minWidth: 0,
          }}
        >
          <Store size={12} />
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.supplier}
          </Box>
        </Typography>

        <Chip
          icon={<PackageCheck size={12} />}
          label={STATUS_LABEL_MAP[item.status]}
          size="small"
          sx={{
            height: 22,
            borderRadius: 1.5,
            bgcolor: isOutOfStock ? '#FEE2E2' : isLowStock ? '#FEF3C7' : '#DCFCE7',
            color: isOutOfStock ? '#991B1B' : isLowStock ? '#92400E' : '#166534',
            border: '1px solid',
            borderColor: isOutOfStock ? '#FECACA' : isLowStock ? '#FCD34D' : '#86EFAC',
            fontWeight: 800,
            fontSize: 10,
          }}
        />
      </Box>

      <Typography sx={{ fontSize: 10.5, color: 'text.disabled', mt: -0.2 }}>
        Restocked {formatDate(item.lastRestocked)}
      </Typography>
    </Paper>
  );
}
