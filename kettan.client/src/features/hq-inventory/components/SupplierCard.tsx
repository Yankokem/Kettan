import { Box, Chip, IconButton, Paper, Typography } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import type { Supplier } from '../supplierApi';

interface SupplierCardProps {
  supplier: Supplier;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SupplierCard({ supplier, selected, onSelect, onDelete }: SupplierCardProps) {
  return (
    <Paper
      elevation={0}
      onClick={onSelect}
      sx={{
        p: 2,
        borderRadius: '14px',
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
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', lineHeight: 1.2, display: 'flex', alignItems: 'center', mb: 0.5 }}>
            {supplier.name}
            <Box
              component="span"
              sx={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'text.secondary',
                ml: 1.2,
                px: 0.8,
                py: 0.2,
                borderRadius: '4px',
                bgcolor: 'action.hover',
                fontFamily: 'monospace',
                letterSpacing: '0.02em'
              }}
            >
              #{supplier.supplierId}
            </Box>
          </Typography>

          {supplier.contactPerson && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
              <PersonRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>
                {supplier.contactPerson}
              </Typography>
            </Box>
          )}
        </Box>

        <IconButton
          size="small"
          aria-label={`Delete ${supplier.name}`}
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

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.5 }}>
        {supplier.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <EmailRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {supplier.email}
            </Typography>
          </Box>
        )}
        {supplier.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <PhoneRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
              {supplier.phone}
            </Typography>
          </Box>
        )}
      </Box>

      {supplier.address && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1.2 }}>
          <PlaceRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {supplier.address}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.8 }}>
        <Chip
          size="small"
          label={supplier.isActive ? 'Active' : 'Inactive'}
          sx={{
            height: 24,
            fontSize: 11.5,
            fontWeight: 700,
            bgcolor: supplier.isActive ? 'rgba(84,107,63,0.12)' : 'rgba(148, 163, 184, 0.16)',
            color: supplier.isActive ? '#546B3F' : '#475569',
            border: `1px solid ${supplier.isActive ? 'rgba(84,107,63,0.22)' : 'rgba(148, 163, 184, 0.28)'}`,
          }}
        />
        <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
          Added {new Date(supplier.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      </Box>
    </Paper>
  );
}
