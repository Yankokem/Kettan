import { Box, Typography } from '@mui/material';
import { TextField } from '../UI/TextField';
import type { TextFieldProps } from '@mui/material';

export interface FormTextFieldProps extends Omit<TextFieldProps, 'variant'> {
  label: string;
}

export function FormTextField({ label, ...props }: FormTextFieldProps) {
  return (
    <Box>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
        {label}
      </Typography>
      <TextField fullWidth {...props} />
    </Box>
  );
}
