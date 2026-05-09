import { Box, Typography, CircularProgress, alpha } from '@mui/material';
import type { ReactNode } from 'react';

interface WorkflowStatusBannerProps {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  variant?: 'info' | 'error';
}

export function WorkflowStatusBanner({ 
  title, 
  description, 
  icon, 
  loading,
  variant = 'info' 
}: WorkflowStatusBannerProps) {
  const isError = variant === 'error';
  
  const BRAND_TAN = '#8C6B43';
  const SURFACE_TAN = '#F0E6D3';
  const TEXT_TAN = '#3E2723';

  const BRAND_RED = '#D32F2F';
  const SURFACE_RED = '#FFEBEE';
  const TEXT_RED = '#C62828';

  const mainColor = isError ? BRAND_RED : BRAND_TAN;
  const bgColor = isError ? SURFACE_RED : SURFACE_TAN;
  const textColor = isError ? TEXT_RED : TEXT_TAN;

  return (
    <Box 
      sx={{ 
        mb: 3, 
        p: 2.5, 
        bgcolor: alpha(bgColor, isError ? 0.6 : 0.4), 
        borderRadius: '12px', 
        border: '1px solid',
        borderColor: alpha(mainColor, 0.15),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'fadeIn 0.5s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(-10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '10px',
          bgcolor: alpha(mainColor, 0.1),
          color: mainColor
        }}>
          {loading ? <CircularProgress size={20} thickness={6} color="inherit" /> : icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: textColor, mb: 0.2 }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: 13, color: alpha(textColor, 0.7), lineHeight: 1.4 }}>
            {description}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
