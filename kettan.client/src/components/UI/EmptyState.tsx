import { Box, Typography } from '@mui/material';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  minHeight?: number | string;
}

export function EmptyState({
  title = 'No records found',
  message,
  icon,
  minHeight = 360,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight,
        p: 4,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {/* Visual focal point */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'rgba(201,168,77,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
            color: '#8C6B43',
            border: '1px solid rgba(201,168,77,0.15)',
          }}
        >
          {icon ? (
            // Clone the icon to fix its size
            <Box sx={{ '& svg': { fontSize: 40 } }}>{icon}</Box>
          ) : (
            <InboxRoundedIcon sx={{ fontSize: 40 }} />
          )}
        </Box>

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: '#2E1F0C',
              letterSpacing: '-0.01em',
              mb: 0.5,
              '.dark &': { color: '#E8D3A9' },
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: 14.5,
              color: 'text.secondary',
              maxWidth: 320,
              mx: 'auto',
              lineHeight: 1.5,
            }}
          >
            {message}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
