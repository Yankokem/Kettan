import { Box } from '@mui/material';
import { Button } from '../UI/Button';
import { useNavigate } from '@tanstack/react-router';

export interface FormActionsProps {
  cancelTo: string;
  saveText: string;
  saveIcon?: React.ReactNode;
  onSave?: () => void;
}

export function FormActions({ cancelTo, saveText, saveIcon, onSave }: FormActionsProps) {
  const navigate = useNavigate();
  
  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      navigate({ to: cancelTo });
    }
  };
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
      
      <Button variant="outlined" onClick={() => navigate({ to: cancelTo })}>
        Cancel
      </Button>
      
      <Button startIcon={saveIcon} onClick={handleSave}>
        {saveText}
      </Button>
    </Box>
  );
}
