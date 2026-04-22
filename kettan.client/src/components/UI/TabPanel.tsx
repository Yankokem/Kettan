import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
  disablePadding?: boolean;
}

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, disablePadding = false, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: disablePadding ? 0 : 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}
