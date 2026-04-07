import { TextField, type TextFieldProps } from '@mui/material';

type TimePickerProps = Omit<TextFieldProps, 'type' | 'InputLabelProps'>;

export function TimePicker(props: TimePickerProps) {
  return (
    <TextField
      type="time"
      InputLabelProps={{ shrink: true }}
      {...props}
      sx={{
        '& input[type="time"]::-webkit-calendar-picker-indicator': {
          cursor: 'pointer',
          filter: 'invert(0.5)',
        },
        ...props.sx
      }}
    />
  );
}
