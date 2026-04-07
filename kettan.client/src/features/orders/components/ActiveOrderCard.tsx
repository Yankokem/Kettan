import { CardActionArea, Box, Typography, Chip } from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';

export interface ActiveOrder {
  id: string;
  branch: string;
  items: number;
  status: 'In Transit' | 'Out for Delivery';
  eta: string;
  courier: string;
  lastUpdated: string;
  coordinates: [number, number];
}

interface ActiveOrderCardProps {
  order: ActiveOrder;
  isSelected: boolean;
  onSelect: () => void;
}

export function ActiveOrderCard({ order, isSelected, onSelect }: ActiveOrderCardProps) {
  return (
    <CardActionArea
      onClick={onSelect}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
          {order.id}
        </Typography>
        <Chip
          label={order.status}
          icon={<LocalShippingRoundedIcon sx={{ fontSize: 14 }} />}
          size="small"
          color="warning"
          variant="outlined"
          sx={{
            fontWeight: 600,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 },
            }
          }}
        />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
        {order.branch}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Courier: {order.courier}
      </Typography>
    </CardActionArea>
  );
}
