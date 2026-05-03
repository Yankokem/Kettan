import { Box, Chip, Paper, Typography } from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
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
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isOutOfStock
          ? 'rgba(185,28,28,0.28)'
          : isLowStock
            ? 'rgba(180,83,9,0.28)'
            : 'divider',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        bgcolor: isOutOfStock
          ? 'rgba(254,242,242,0.58)'
          : isLowStock
            ? 'rgba(255,251,235,0.58)'
            : 'background.paper',
        '&:hover': {
          borderColor: '#6B4C2A',
          boxShadow: '0 12px 28px rgba(107,76,42,0.08)',
          transform: 'translateY(-6px)',
        },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Visual Container */}
      <Box sx={{ p: 1.5, pb: 0 }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '100%',
            bgcolor: '#FAF5EF',
            borderRadius: '14px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.15,
            }}
          >
            <Inventory2RoundedIcon sx={{ fontSize: 64, color: '#6B4C2A' }} />
          </Box>

          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <Chip
              label={item.category}
              size="small"
              sx={{
                height: 22,
                bgcolor: 'rgba(255,255,255,0.9)',
                color: '#6B4C2A',
                fontWeight: 800,
                fontSize: 10,
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Content Section */}
      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{ fontSize: 15, fontWeight: 800, color: 'text.primary', mb: 0.5, lineHeight: 1.2 }}>
          {item.name}
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace', fontWeight: 700, mb: 1.5 }}>
          {item.sku}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#2E1F14' }}>{item.stockCount}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 700 }}>{item.unit}</Typography>
          </Box>
          <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: -0.2 }}>
            Reorder point: {item.reorderPoint}
          </Typography>
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Box
            sx={{
              width: '100%',
              height: 5,
              borderRadius: 999,
              bgcolor: 'rgba(107, 76, 42, 0.08)',
              overflow: 'hidden',
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: `${coveragePercent}%`,
                height: '100%',
                bgcolor: isOutOfStock ? '#DC2626' : isLowStock ? '#D97706' : '#16A34A',
                transition: 'width 0.5s ease-out',
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 1.5,
              borderTop: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Chip
              label={STATUS_LABEL_MAP[item.status]}
              size="small"
              sx={{
                height: 22,
                borderRadius: 1,
                bgcolor: isOutOfStock ? '#FEE2E2' : isLowStock ? '#FEF3C7' : '#DCFCE7',
                color: isOutOfStock ? '#991B1B' : isLowStock ? '#92400E' : '#166534',
                fontWeight: 800,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            />
            <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 600 }}>
              {formatDate(item.lastRestocked)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

