import { Select, MenuItem, FormControl } from '@mui/material';
import type { SelectProps } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@/components/icons/lucide-mui/KeyboardArrowDownRoundedIcon';

export interface DropdownProps extends Omit<SelectProps, 'variant'> {
  options: { value: string | number; label: string }[];
}

export function Dropdown({ options, sx, ...props }: DropdownProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <Select
        {...props}
        displayEmpty
        IconComponent={KeyboardArrowDownRoundedIcon}
        sx={{
          height: 40, // Height matching Button and Searchbar strictly
          borderRadius: 3,
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
    </FormControl>
  );
}


