import { Box, Card, Chip, IconButton, Typography, Stack, Divider } from '@mui/material';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import UnarchiveRoundedIcon from '@mui/icons-material/UnarchiveRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import type { Supplier } from '../supplierApi';

interface SupplierCardProps {
  supplier: Supplier;
  selected: boolean;
  onSelect: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}

export function SupplierCard({ supplier, selected, onSelect, onArchive, onUnarchive }: SupplierCardProps) {
  const isArchived = supplier.isDeleted;

  return (
    <Card
      elevation={0}
      onClick={onSelect}
      sx={{
        p: 2.2,
        borderRadius: '14px',
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        background: (theme) => selected ? 'rgba(201, 168, 77, 0.08)' : theme.custom.gradients.card,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        opacity: isArchived ? 0.7 : 1,
        filter: isArchived ? 'grayscale(0.4)' : 'none',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 8px 22px rgba(0, 0, 0, 0.05)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              bgcolor: 'rgba(107, 76, 42, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B4C2A',
            }}
          >
            <BusinessRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                {supplier.name}
              </Typography>
              {isArchived && (
                <Chip 
                  label="Archived" 
                  size="small" 
                  sx={{ 
                    height: 18, 
                    fontSize: 10, 
                    fontWeight: 700,
                    bgcolor: 'rgba(107, 114, 128, 0.1)',
                    color: '#6B7280',
                    border: '1px solid rgba(107, 114, 128, 0.2)'
                  }} 
                />
              )}
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.5, fontWeight: 500 }}>
              SUPPLIER ID #{supplier.supplierId}
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          aria-label={isArchived ? `Restore ${supplier.name}` : `Archive ${supplier.name}`}
          onClick={(event) => {
            event.stopPropagation();
            if (isArchived) {
              onUnarchive();
            } else {
              onArchive();
            }
          }}
          sx={{
            width: 30,
            height: 30,
            color: isArchived ? '#059669' : '#D97706',
            border: '1px solid',
            borderColor: isArchived ? 'rgba(5, 150, 105, 0.25)' : 'rgba(217, 119, 6, 0.25)',
            bgcolor: isArchived ? 'rgba(5, 150, 105, 0.04)' : 'rgba(217, 119, 6, 0.04)',
            '&:hover': { bgcolor: isArchived ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)' },
          }}
        >
          {isArchived ? (
            <UnarchiveRoundedIcon sx={{ fontSize: 16 }} />
          ) : (
            <ArchiveRoundedIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Box>

      <Divider sx={{ mb: 1.8, opacity: 0.6 }} />

      <Stack spacing={1.2}>
        {supplier.contactPerson && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <PersonRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {supplier.contactPerson}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          {supplier.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <EmailRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                {supplier.email}
              </Typography>
            </Box>
          )}
          {supplier.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <PhoneRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                {supplier.phone}
              </Typography>
            </Box>
          )}
        </Box>

        {supplier.address && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
            <LocationOnRoundedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.4 }}>
              {supplier.address}
            </Typography>
          </Box>
        )}
      </Stack>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, pt: 1.8, borderTop: '1px solid', borderColor: 'divider', opacity: 0.8 }}>
        <Chip
          size="small"
          label={supplier.isActive ? 'Active' : 'Inactive'}
          sx={{
            height: 22,
            fontSize: 10.5,
            fontWeight: 700,
            bgcolor: supplier.isActive ? 'rgba(84,107,63,0.12)' : 'rgba(148, 163, 184, 0.16)',
            color: supplier.isActive ? '#546B3F' : '#475569',
            border: `1px solid ${supplier.isActive ? 'rgba(84,107,63,0.22)' : 'rgba(148, 163, 184, 0.28)'}`,
          }}
        />
        <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
          Added {new Date(supplier.createdAt).toLocaleDateString()}
        </Typography>
      </Box>
    </Card>
  );
}
