import { TextField as MuiTextField, type TextFieldProps } from '@mui/material';

type TimePickerProps = Omit<TextFieldProps, 'type' | 'InputLabelProps'>;

export function TimePicker(props: TimePickerProps) {
  return (
    <MuiTextField
      type="time"
      InputLabelProps={{ shrink: true }}
      {...props}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          '& fieldset': {
            borderColor: 'divider',
          },
          '&:hover fieldset': {
            borderColor: 'text.secondary',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#6B4C2A',
            borderWidth: 1.5,
          },
        },
        '& input[type="time"]': {
          fontSize: 14,
          padding: '12px 14px',
        },
        '& input[type="time"]::-webkit-calendar-picker-indicator': {
          cursor: 'pointer',
          filter: 'invert(0.5)',
          opacity: 0.6,
          '&:hover': {
            opacity: 1,
          },
        },
        ...props.sx
      }}
    />
  );
}
