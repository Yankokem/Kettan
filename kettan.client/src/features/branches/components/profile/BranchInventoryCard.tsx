import { Box, Chip, Paper, Typography } from '@mui/material';
import { PackageCheck, Store } from 'lucide-react';
import type { BranchInventoryItem, BranchInventoryStatus } from '../../types';
import { formatDate } from '../../branchProfileData';

const STATUS_LABEL_MAP: Record<BranchInventoryStatus, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

interface BranchInventoryCardProps {
  item: BranchInventoryItem;
}

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
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.2 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: 'text.primary' }} noWrap title={item.name}>
            {item.name}
          </Typography>
          <Typography sx={{ mt: 0.35, fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>{item.sku}</Typography>
        </Box>

        <Chip
          icon={<PackageCheck size={13} />}
          label={STATUS_LABEL_MAP[item.status]}
          size="small"
          sx={{
            height: 24,
            borderRadius: 1.5,
            bgcolor: isOutOfStock ? '#FEE2E2' : isLowStock ? '#FEF3C7' : '#DCFCE7',
            color: isOutOfStock ? '#991B1B' : isLowStock ? '#92400E' : '#166534',
            border: '1px solid',
            borderColor: isOutOfStock ? '#FECACA' : isLowStock ? '#FCD34D' : '#86EFAC',
            fontWeight: 800,
            fontSize: 10.5,
            '& .MuiChip-icon': {
              color: isOutOfStock ? '#991B1B' : isLowStock ? '#92400E' : '#166534',
            },
          }}
        />
      </Box>

      <Box sx={{ mt: 1.1, display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
        <Chip
          label={item.category}
          size="small"
          sx={{
            height: 21,
            bgcolor: 'rgba(107,76,42,0.1)',
            color: '#6B4C2A',
            fontWeight: 700,
            fontSize: 10.5,
          }}
        />
        <Chip
          label={item.supplier}
          size="small"
          sx={{
            height: 21,
            bgcolor: 'rgba(59,130,246,0.1)',
            color: '#1E40AF',
            fontWeight: 700,
            fontSize: 10.5,
            maxWidth: '100%',
            '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
          }}
        />
      </Box>

      <Box sx={{ mt: 1.4, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{item.stockCount}</Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
          {item.unit} units
        </Typography>
      </Box>

      <Typography sx={{ mt: 0.35, fontSize: 11, color: 'text.disabled' }}>
        Reorder point: {item.reorderPoint}
      </Typography>

      <Box sx={{ mt: 1.25 }}>
        <Box
          sx={{
            width: '100%',
            height: 6,
            borderRadius: 999,
            bgcolor: 'rgba(148,163,184,0.22)',
            overflow: 'hidden',
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
      </Box>

      <Typography sx={{ mt: 1.1, fontSize: 11.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
        <Store size={12} />
        Restocked {formatDate(item.lastRestocked)}
      </Typography>
    </Paper>
  );
}
