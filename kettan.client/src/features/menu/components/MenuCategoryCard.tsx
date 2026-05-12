import { Box, Chip, IconButton, Paper, Typography } from '@mui/material';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import UnarchiveRoundedIcon from '@mui/icons-material/UnarchiveRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import type { MenuCategory } from '../menuCategoryApi';

interface MenuCategoryCardProps {
  category: MenuCategory;
  selected: boolean;
  onSelect: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}

export function MenuCategoryCard({ category, selected, onSelect, onArchive, onUnarchive }: MenuCategoryCardProps) {
  const isArchived = category.isDeleted;

  return (
    <Paper
      elevation={0}
      onClick={onSelect}
      sx={{
        p: 2,
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              {category.name}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mt: 0.9 }}>
            <DragIndicatorRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
              Order #{category.displayOrder}
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          aria-label={isArchived ? `Restore ${category.name}` : `Archive ${category.name}`}
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.4 }}>
        <Chip
          size="small"
          label={category.isActive ? 'Active' : 'Inactive'}
          sx={{
            height: 24,
            fontSize: 11.5,
            fontWeight: 700,
            bgcolor: category.isActive ? 'rgba(84,107,63,0.12)' : 'rgba(148, 163, 184, 0.16)',
            color: category.isActive ? '#546B3F' : '#475569',
            border: `1px solid ${category.isActive ? 'rgba(84,107,63,0.22)' : 'rgba(148, 163, 184, 0.28)'}`,
          }}
        />
        <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
          Created {new Date(category.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      </Box>
    </Paper>
  );
}
