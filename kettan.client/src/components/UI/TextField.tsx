import { TextField as MuiTextField, alpha } from '@mui/material';
import type { TextFieldProps as MuiTextFieldProps } from '@mui/material';

export function TextField({ multiline = false, sx, ...props }: MuiTextFieldProps) {
  return (
    <MuiTextField
      variant="outlined"
      size="small"
      fullWidth
      {...props}
      multiline={multiline}
      sx={{
        '& .MuiOutlinedInput-root': {
          ...(multiline
            ? {
                minHeight: 40,
                alignItems: 'flex-start',
                py: 0.75,
              }
            : {
                height: 40,
              }),
          borderRadius: 2,
          bgcolor: 'background.paper',
          '& fieldset': {
            borderColor: 'divider',
            transition: 'border-color 0.2s',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(107, 76, 42, 0.5)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#C9A84C',
            borderWidth: '1px',
          },
          '&.Mui-disabled fieldset': {
            borderColor: alpha('#E5E7EB', 0.5),
          },
        },
        '& .MuiInputBase-input': {
          fontSize: 14,
          fontWeight: 500,
          color: 'text.primary',
          '&::placeholder': {
            color: 'text.disabled',
            opacity: 1,
            fontWeight: 400,
          },
        },
        '& .MuiInputBase-inputMultiline': {
          lineHeight: 1.5,
          py: 0,
        },
        ...sx,
      }}
    />
  );
}
