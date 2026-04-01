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
        '& .MuiToggleButton-root': {
          px: 2,
          height: 40,
          fontSize: 13,
          fontWeight: 600,
          color: 'text.secondary',
          borderColor: 'divider',
          textTransform: 'none',
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
        },
        ...sx,
      }}
      {...props}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.icon && (
            <span style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}>
              {option.icon}
            </span>
          )}
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
