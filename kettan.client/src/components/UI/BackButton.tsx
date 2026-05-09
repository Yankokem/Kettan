import { IconButton } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate } from '@tanstack/react-router';

export interface BackButtonProps {
  to: string;
  size?: 'small' | 'medium';
}

export function BackButton({ to, size = 'medium' }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <IconButton
      onClick={() => navigate({ to })}
      sx={{ 
        width: size === 'small' ? 32 : 40, 
        height: size === 'small' ? 32 : 40,
        border: '1px solid',
        borderColor: 'rgba(201, 168, 77, 0.3)',
        color: '#6B4C2A',
        bgcolor: 'rgba(201, 168, 77, 0.12)',
        '&:hover': { 
          bgcolor: 'rgba(201, 168, 77, 0.2)',
          borderColor: 'rgba(201, 168, 77, 0.45)',
        },
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <ArrowBackRoundedIcon sx={{ fontSize: size === 'small' ? 16 : 18 }} />
    </IconButton>
  );
}
