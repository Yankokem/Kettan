import { Button } from './Button';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate } from '@tanstack/react-router';

export interface BackButtonProps {
  to: string;
}

export function BackButton({ to }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <Button 
      variant="outlined" 
      onClick={() => navigate({ to: to as any })} 
      sx={{ minWidth: 40, px: 0, color: 'text.secondary' }}
    >
      <ArrowBackRoundedIcon fontSize="small" />
    </Button>
  );
}
