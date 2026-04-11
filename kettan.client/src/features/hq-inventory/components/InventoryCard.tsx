import { Card, Box, Typography, Chip, LinearProgress } from '@mui/material';
import Inventory2RoundedIcon from '@/components/icons/lucide-mui/Inventory2RoundedIcon';
import WarningRoundedIcon from '@/components/icons/lucide-mui/WarningRoundedIcon';
import { useNavigate } from '@tanstack/react-router';
import type { InventoryItem } from '../types';

interface InventoryCardProps {
  item: InventoryItem;
}

export function InventoryCard({ item }: InventoryCardProps) {
  const navigate = useNavigate();
  
  const isLowStock = item.totalStock <= item.defaultThreshold;
  const stockPercentage = Math.min((item.totalStock / (item.defaultThreshold * 3)) * 100, 100);

  return (
    <Card
      onClick={() => navigate({ to: '/hq-inventory/$itemId', params: { itemId: item.id.toString() } })}
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: isLowStock ? 'rgba(220, 38, 38, 0.2)' : 'divider',
        bgcolor: isLowStock ? 'rgba(220, 38, 38, 0.02)' : 'background.paper',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          borderColor: isLowStock ? 'rgba(220, 38, 38, 0.4)' : 'primary.main',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: isLowStock ? 'rgba(220, 38, 38, 0.06)' : 'rgba(107,76,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLowStock ? '#991B1B' : '#6B4C2A' }}>
            <Inventory2RoundedIcon />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: 'text.primary', lineHeight: 1.2 }}>
              {item.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
              SKU: {item.sku}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: isLowStock ? '#991B1B' : 'text.primary', lineHeight: 1 }}>
              {item.totalStock} <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>{item.unit?.symbol || ''}</Typography>
            </Typography>
          </Box>
          {isLowStock ? (
            <Chip icon={<WarningRoundedIcon fontSize="small" />} label="Low Stock" size="small" sx={{ bgcolor: 'rgba(220, 38, 38, 0.08)', color: '#991B1B', fontWeight: 700, height: 24, '& .MuiChip-icon': { color: '#991B1B' }, border: '1px solid rgba(220, 38, 38, 0.15)' }} />
          ) : (
            <Chip label="In Stock" size="small" sx={{ bgcolor: 'rgba(84,107,63,0.08)', color: '#546B3F', fontWeight: 700, height: 24, border: '1px solid rgba(84,107,63,0.15)' }} />
          )}
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={stockPercentage} 
          sx={{ 
            height: 6, 
            borderRadius: 3,
            bgcolor: 'rgba(107,76,42,0.06)',
            '& .MuiLinearProgress-bar': {
              bgcolor: isLowStock ? '#DC2626' : '#6B4C2A',
              borderRadius: 3
            }
          }} 
        />
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, mt: 1 }}>
          Reorder threshold: {item.defaultThreshold} {item.unit?.symbol || ''}
        </Typography>
      </Box>
    </Card>
  );
}

