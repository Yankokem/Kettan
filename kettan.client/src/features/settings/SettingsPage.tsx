import { Box, Typography } from '@mui/material';

export function SettingsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 3 }}>
        Settings & User Roles
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page will contain platform configuration and user role management.
      </Typography>
    </Box>
  );
}