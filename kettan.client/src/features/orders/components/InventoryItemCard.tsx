import { Box, Typography, CardActionArea, Chip } from '@mui/material';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  hqStock: number;
  unit: string;
}

interface InventoryItemCardProps {
  item: InventoryItem;
  isSelected: boolean;
  onClick: () => void;
}

export function InventoryItemCard({ item, isSelected, onClick }: InventoryItemCardProps) {
  const isOutOfStock = item.hqStock === 0;

  return (
    <CardActionArea
      onClick={onClick}
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
            {item.name}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace' }}>
            {item.sku}
          </Typography>
          <Chip label={item.category} size="small" sx={{ width: 'max-content', height: 20, fontSize: 10, mt: 0.5 }} />
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: isOutOfStock ? 'error.main' : 'success.main',
            }}
          >
            {item.hqStock} {item.unit}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Available</Typography>
        </Box>
      </Box>
    </CardActionArea>
  );
}
