import { ToggleButton, ToggleButtonGroup, type ToggleButtonGroupProps } from '@mui/material';
import React from 'react';

export interface ViewToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface ViewToggleProps<T extends string> extends Omit<ToggleButtonGroupProps, 'onChange' | 'value'> {
  value: T;
  options: ViewToggleOption<T>[];
  onChange: (value: T) => void;
}

export function ViewToggle<T extends string>({ value, options, onChange, sx, ...props }: ViewToggleProps<T>) {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: T | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      size="small"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        '& .MuiToggleButton-root': {
          px: 1.5,
          height: 40,
          fontSize: 13,
          fontWeight: 600,
          color: '#6B4C2A',
          borderColor: 'rgba(107, 76, 42, 0.25)',
          textTransform: 'none',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            bgcolor: 'rgba(107, 76, 42, 0.12)',
            color: '#4A3424',
            '&:hover': {
              bgcolor: 'rgba(107, 76, 42, 0.18)',
            },
          },
          '&:hover': {
            bgcolor: 'rgba(107, 76, 42, 0.04)',
          },
        },
        ...sx,
      }}
      {...props}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.icon && (
            <span style={{ display: 'flex', alignItems: 'center', marginRight: option.label ? 8 : 0 }}>
              {option.icon}
            </span>
          )}
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
