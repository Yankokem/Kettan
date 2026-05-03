import { Box, Typography } from '@mui/material';
import { BackButton } from './BackButton';

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  action?: React.ReactNode;
}

/**
 * Standardized Page Header component.
 * Features a title, optional description, optional back button, and optional action buttons.
 */
export function PageHeader({ title, description, backTo, action }: PageHeaderProps) {
  return (
    <Box 
      sx={{ 
        mb: { xs: 3, sm: 4 }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: 2,
        flexWrap: 'wrap'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {backTo && <BackButton to={backTo} />}
        <Box>
          <Typography 
            variant="h1"
            sx={{ 
              fontSize: { xs: 16, sm: 18 }, 
              fontWeight: 800, 
              color: 'text.primary', 
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              m: 0
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography 
              sx={{ 
                fontSize: { xs: 11, sm: 12 }, 
                color: 'text.secondary', 
                mt: 0.3,
                lineHeight: 1.4,
                maxWidth: 600
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      
      {action && (
        <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', gap: 1.5 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}
