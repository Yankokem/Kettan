import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';

export function CustomButton({ variant = 'contained', sx, ...props }: ButtonProps) {
  const getStyles = () => {
    if (variant === 'contained') {
      return {
        bgcolor: '#2E1F14',
        color: '#fff',
        border: '1px solid transparent', // Matches the 1px border of outlined buttons so heights align perfectly
        '&:hover': { bgcolor: '#4A3424' },
      };
    }
    if (variant === 'outlined') {
      return {
        color: '#6B4C2A', 
        borderColor: 'rgba(107, 76, 42, 0.3)',
        '&:hover': { borderColor: '#6B4C2A', bgcolor: 'rgba(107, 76, 42, 0.04)' },
      };
    }
    return {};
  };

  return (
    <Button
      variant={variant}
      disableElevation
      sx={{
        height: 40, // Strict height for uniformity
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 2,
        px: 2.5,
        ...getStyles(),
        ...sx,
      }}
      {...props}
    />
  );
}
