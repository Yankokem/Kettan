import { Select, MenuItem, FormControl, Box } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import React from 'react';

export interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  icon: React.ReactNode;
  minWidth?: number;
  compact?: boolean;
}

export function FilterDropdown({ value, onChange, options, label, icon, minWidth = 140, compact = false }: FilterDropdownProps) {
  return (
    <FormControl size="small">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        displayEmpty
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            {selected ? options.find((o) => o.value === selected)?.label || label : label}
          </Box>
        )}
        IconComponent={KeyboardArrowDownRoundedIcon}
        sx={{
          height: compact ? 28 : 40,
          borderRadius: compact ? '8px' : 2,
          fontSize: 14,
          fontWeight: 600,
          color: '#6B4C2A',
          bgcolor: 'transparent',
          minWidth,
          transition: 'all 0.2s',
          '& .MuiOutlinedInput-notchedOutline': {
            border: '1px solid',
            borderColor: 'rgba(107, 76, 42, 0.3)',
          },
          '&:hover': {
            bgcolor: 'rgba(107, 76, 42, 0.04)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6B4C2A',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6B4C2A',
            borderWidth: '1px',
          },
          '& .MuiSelect-select': {
            py: compact ? 0.5 : 1,
            pl: 2,
            pr: 4,
            fontSize: compact ? 12 : 14,
          }
        }}
      >
        <MenuItem value="" sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary', fontStyle: 'italic' }}>
          Clear {label}
        </MenuItem>
        {options.map((opt) => (
          <MenuItem value={opt.value} key={opt.value} sx={{ fontSize: 13, fontWeight: 500 }}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}