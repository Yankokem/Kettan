import { Box, Typography, CircularProgress, Button as MuiButton } from '@mui/material';
import { EmptyState } from './EmptyState';

interface DataStateWrapperProps {
  loading: boolean;
  error: Error | null;
  isEmpty: boolean;
  notAvailable?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  notAvailableMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DataStateWrapper({
  loading,
  error,
  isEmpty,
  notAvailable = false,
  loadingMessage = 'Loading...',
  emptyTitle,
  emptyMessage = 'No data available.',
  emptyIcon,
  notAvailableMessage = 'Feature not available in this environment.',
  onRetry,
  children,
}: DataStateWrapperProps) {
  if (notAvailable) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 500 }}>
          {notAvailableMessage}
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 300, gap: 2 }}>
        <CircularProgress size={32} thickness={4} sx={{ color: '#6B4C2A' }} />
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
          {loadingMessage}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 300, bgcolor: 'error.lighter', borderRadius: 2, p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: 'error.main', fontSize: 14, fontWeight: 500, mb: onRetry ? 2 : 0 }}>
          {error.message || 'An error occurred while loading data.'}
        </Typography>
        {onRetry && (
          <MuiButton 
            variant="outlined" 
            size="small" 
            onClick={onRetry}
            sx={{ borderColor: 'error.main', color: 'error.main', '&:hover': { bgcolor: 'error.lighter', borderColor: 'error.dark' } }}
          >
            Try Again
          </MuiButton>
        )}
      </Box>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        icon={emptyIcon}
      />
    );
  }

  return <>{children}</>;
}
