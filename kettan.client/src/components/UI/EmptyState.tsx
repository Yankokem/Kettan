import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ 
  title, 
  message, 
  icon = <InboxRoundedIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.8 }} />,
  action 
}: EmptyStateProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: 10,
      px: 3,
      textAlign: 'center',
      bgcolor: 'background.default',
      borderRadius: 4,
      border: '1px dashed',
      borderColor: 'divider',
      minHeight: 250
    }}>
      <Box sx={{ mb: 2 }}>
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, letterSpacing: -0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 360, fontWeight: 500 }}>
        {message}
      </Typography>
      {action && (
        <Box>
          {action}
        </Box>
      )}
    </Box>
  );
}
