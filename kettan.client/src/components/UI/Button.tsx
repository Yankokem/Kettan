import { Button as MuiButton, CircularProgress } from '@mui/material';
import type { ButtonProps as MuiButtonProps } from '@mui/material';

interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
}

export function Button({ variant = 'contained', color = 'primary', sx, loading, disabled, children, startIcon, ...props }: ButtonProps) {
  const getStyles = () => {
    if (variant === 'contained') {
      if (color === 'error') {
        return {
          bgcolor: 'error.main',
          color: '#fff',
          '&:hover': { bgcolor: 'error.dark' },
        };
      }
      if (color === 'success') {
        return {
          bgcolor: 'success.main',
          color: '#fff',
          '&:hover': { bgcolor: 'success.dark' },
        };
      }
      return {
        bgcolor: '#2E1F14',
        color: '#fff',
        border: '1px solid transparent',
        '&:hover': { bgcolor: '#4A3424' },
      };
    }
    if (variant === 'outlined') {
      if (color === 'error') {
        return {
          color: 'error.main',
          borderColor: 'error.main',
          '&:hover': { borderColor: 'error.dark', bgcolor: 'error.main', color: '#fff' },
        };
      }
      if (color === 'success') {
        return {
          color: 'success.main',
          borderColor: 'success.main',
          '&:hover': { borderColor: 'success.dark', bgcolor: 'success.main', color: '#fff' },
        };
      }
      return {
        color: '#6B4C2A',
        borderColor: 'rgba(107, 76, 42, 0.3)',
        '&:hover': { borderColor: '#6B4C2A', bgcolor: 'rgba(107, 76, 42, 0.04)' },
      };
    }
    return {};
  };

  return (
    <MuiButton
      variant={variant}
      color={color}
      disableElevation
      disabled={disabled || loading}
      startIcon={!loading ? startIcon : undefined}
      sx={{
        height: 40,
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 2,
        px: 2.5,
        ...getStyles(),
        ...sx,
      }}
      {...props}
    >
      {loading ? (
        <>
          <CircularProgress size={18} sx={{ color: 'inherit', mr: 1.5 }} thickness={5} />
          {children}
        </>
      ) : (
        children
      )}
    </MuiButton>
  );
}
