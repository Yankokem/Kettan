import { Box, Typography, Chip, Paper } from '@mui/material';
import { Link } from '@tanstack/react-router';
import type { MenuItem } from '../types';

interface Props {
  item: MenuItem;
}

export function MenuItemCard({ item }: Props) {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'Active': return 'Available';
      case 'Inactive': return 'Unavailable';
      case 'Out of Stock': return 'Out of Stock';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success.main';
      case 'Inactive': return 'text.secondary';
      case 'Out of Stock': return 'error.main';
      default: return 'text.primary';
    }
  };

  // Predefined pill colors for variants
  const variantColors = ['#E2D5C4', '#D4E2C4', '#C4D6E2', '#E2C4CA', '#E2c4E1'];
  const variantTextColors = ['#5A4D3B', '#4D5A3B', '#3B4D5A', '#5A3B45', '#5A3B59'];

  // Count total ingredients across all variants
  const totalIngredients = item.variants?.reduce((sum, v) => sum + (v.ingredients?.length || 0), 0) || 0;

  return (
    <Link
      to="/menu/$menuItemId"
      params={{ menuItemId: item.id }}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <Paper
        sx={{
          display: 'block',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s',
          bgcolor: 'background.paper',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            transform: 'translateY(-4px)'
          }
        }}
        elevation={0}
      >
        {/* Top container with padding and grey square */}
        <Box sx={{ position: 'relative', p: 1.5, pb: 0 }}>
          <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', bgcolor: 'grey.100', borderRadius: 2, overflow: 'hidden' }}>
            {/* Variants stacked in top right corner */}
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
              {item.variants?.map((variant, idx) => (
                <Chip
                  key={variant.id}
                  label={variant.name}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: 11,
                    bgcolor: variantColors[idx % variantColors.length],
                    color: variantTextColors[idx % variantTextColors.length],
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    height: 22
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.name}
          </Typography>

          {/* Row for Type/Category and Ingredients count */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Chip
              label={item.category}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {item.variants.length} variant{item.variants.length !== 1 ? 's' : ''}{totalIngredients > 0 ? ` • ${totalIngredients} ingredient${totalIngredients !== 1 ? 's' : ''}` : ''}
            </Typography>
          </Box>

          {/* Selling Price / Status Line */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed', borderColor: 'divider', pt: 1.5 }}>
            <Chip
              label={getStatusText(item.status)}
              size="small"
              sx={{
                height: 22,
                fontSize: 10,
                fontWeight: 800,
                bgcolor: item.status === 'Active' ? 'success.50' : item.status === 'Out of Stock' ? 'error.50' : 'grey.100',
                color: getStatusColor(item.status),
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderRadius: 1
              }}
            />
            <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
              ₱{item.sellingPrice.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Link>
  );
}