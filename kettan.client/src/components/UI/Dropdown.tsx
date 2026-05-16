import { Select, MenuItem, FormControl, FormHelperText } from '@mui/material';
import type { SelectProps } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

export interface DropdownProps extends Omit<SelectProps, 'variant' | 'error'> {
  options: { value: string | number; label: string }[];
  error?: boolean;
  helperText?: React.ReactNode;
}

export function Dropdown({ options, sx, error, helperText, ...props }: DropdownProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 160 }} error={error}>
      <Select
        {...props}
        error={error}
        displayEmpty
        IconComponent={KeyboardArrowDownRoundedIcon}
        sx={{
          height: 40, // Height matching Button and Searchbar strictly
          borderRadius: '14px',
          fontSize: 14,
          fontWeight: 500,
          bgcolor: 'background.paper',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'divider',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(107, 76, 42, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#C9A84C',
            borderWidth: '1px',
          },
          ...sx,
        }}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13, fontWeight: 500 }}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
