import { IconButton } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate } from '@tanstack/react-router';

export interface BackButtonProps {
  to: string;
}

export function BackButton({ to }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <IconButton
      
      onClick={() => navigate({ to })}
      sx={{ 
        width: 40, 
        height: 40,
        border: '1px solid',
        borderColor: 'divider',
        color: 'text.secondary',
        bgcolor: 'background.paper',
        '&:hover': { bgcolor: 'action.hover' }
      }}
    >
      <ArrowBackRoundedIcon fontSize="small" />
    </IconButton>
  );
}
