import { Box, Typography, Chip, Paper } from '@mui/material';
import { Link } from '@tanstack/react-router';
import type { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  isInsufficientStock?: boolean;
}

export function MenuItemCard({ item, isInsufficientStock }: Props) {
  const safeSellingPrice = Number.isFinite(Number(item.sellingPrice)) ? Number(item.sellingPrice) : 0;

  const getStatusText = (status: string) => {
    if (isInsufficientStock) return 'Insufficient Stock';
    switch (status) {
      case 'Active': return 'Active';
      case 'Inactive': return 'Inactive';
      case 'Out of Stock': return 'Out of Stock';
      default: return status;
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
          borderRadius: '14px',
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
        {/* Top container with padding and image box */}
        <Box sx={{ position: 'relative', p: 1.5, pb: 0 }}>
          <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', bgcolor: '#FAF5EF', borderRadius: '11px', overflow: 'hidden' }}>
            {/* Image with fade-in */}
            <Box
              component="img"
              src={item.image || undefined}
              onLoad={(e) => (e.currentTarget.style.opacity = '1')}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: item.image ? 0 : 1,
                transition: 'opacity 0.4s ease-in-out',
                display: item.image ? 'block' : 'none'
              }}
            />
            
            {/* Fallback Icon if no image */}
            {!item.image && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 40, opacity: 0.2 }}>☕</Typography>
              </Box>
            )}

            {/* Insufficient Stock Overlay */}
            {isInsufficientStock && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  left: 8, 
                  zIndex: 20,
                  bgcolor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 800,
                  px: 1.2,
                  py: 0.5,
                  borderRadius: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
              >
                Insufficient Stock
              </Box>
            )}

            {/* Variants stacked in top right corner */}
            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
              {item.variants?.map((variant, idx) => (
                <Chip
                  key={variant.id}
                  label={variant.name}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: 10,
                    bgcolor: variantColors[idx % variantColors.length],
                    color: variantTextColors[idx % variantTextColors.length],
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    height: 20
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
              {item.variants?.length || 0} variant{(item.variants?.length || 0) !== 1 ? 's' : ''}{totalIngredients > 0 ? ` • ${totalIngredients} ing.` : ''}
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
                fontWeight: 700,
                bgcolor: isInsufficientStock ? '#DC2626' : item.status === 'Active' ? '#16A34A' : '#6B7280',
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                borderRadius: 1,
              }}
            />
            <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
              ₱{safeSellingPrice.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Link>
  );
}