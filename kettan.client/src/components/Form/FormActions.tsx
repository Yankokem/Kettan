import { Box } from '@mui/material';
import { Button } from '../UI/Button';
import { useNavigate } from '@tanstack/react-router';

export interface FormActionsProps {
  cancelTo: string;
  saveText: string;
  saveIcon?: React.ReactNode;
}

export function FormActions({ cancelTo, saveText, saveIcon }: FormActionsProps) {
  const navigate = useNavigate();
  return (
    <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
      {/* @ts-expect-error dynamic nav */}
      <Button variant="outlined" onClick={() => navigate({ to: cancelTo })}>
        Cancel
      </Button>
      {/* @ts-expect-error dynamic nav */}
      <Button startIcon={saveIcon} onClick={() => navigate({ to: cancelTo })}>
        {saveText}
      </Button>
    </Box>
  );
}
