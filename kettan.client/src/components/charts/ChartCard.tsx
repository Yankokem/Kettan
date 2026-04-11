import type { ReactNode } from 'react';
import { Box, Card, Typography } from '@mui/material';

interface ChartCardProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function ChartCard({ title, icon, actions, children }: ChartCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
        {actions ? <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>{actions}</Box> : null}
      </Box>

      {children}
    </Card>
  );
}
