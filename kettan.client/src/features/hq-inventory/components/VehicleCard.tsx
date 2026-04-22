import { Box, Chip, IconButton, Paper, Typography } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import type { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function VehicleCard({ vehicle, selected, onSelect, onDelete }: VehicleCardProps) {
  return (
    <Paper
      elevation={0}
      onClick={onSelect}
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'rgba(201, 168, 77, 0.08)' : 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 8px 22px rgba(0, 0, 0, 0.05)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
            {vehicle.plateNumber}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
            {vehicle.courier?.name || 'Unknown Courier'}
          </Typography>
        </Box>

        <IconButton
          size="small"
          aria-label={`Delete ${vehicle.plateNumber}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          sx={{
            width: 30,
            height: 30,
            color: '#B91C1C',
            border: '1px solid rgba(185, 28, 28, 0.25)',
            bgcolor: 'rgba(185, 28, 28, 0.04)',
            '&:hover': { bgcolor: 'rgba(185, 28, 28, 0.1)' },
          }}
        >
          <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1.2 }}>
        <LocalShippingRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
          {vehicle.vehicleType}
        </Typography>
      </Box>

      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 1.2, minHeight: 38 }}>
        {vehicle.description || 'No description provided.'}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.4 }}>
        <Chip
          size="small"
          label={vehicle.isActive ? 'Active' : 'Inactive'}
          sx={{
            height: 24,
            fontSize: 11.5,
            fontWeight: 700,
            bgcolor: vehicle.isActive ? 'rgba(84,107,63,0.12)' : 'rgba(148, 163, 184, 0.16)',
            color: vehicle.isActive ? '#546B3F' : '#475569',
            border: `1px solid ${vehicle.isActive ? 'rgba(84,107,63,0.22)' : 'rgba(148, 163, 184, 0.28)'}`,
          }}
        />
        <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
          Added {new Date(vehicle.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      </Box>
    </Paper>
  );
}
