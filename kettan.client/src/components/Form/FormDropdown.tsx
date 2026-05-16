import { Typography, Box } from '@mui/material';
import { Dropdown, type DropdownProps } from '../UI/Dropdown';

export interface FormDropdownProps extends Omit<DropdownProps, 'label'> {
  label: string;
}

export function FormDropdown({ label, error, helperText, ...props }: FormDropdownProps) {
  return (
    <Box>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', mb: 1, ml: 0.5 }}>
        {label}
      </Typography>
      <Dropdown fullWidth sx={{ width: '100%', minWidth: 'auto' }} error={error} helperText={helperText} {...props} />
    </Box>
  );
}
