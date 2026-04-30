import { Box, Typography, Card } from '@mui/material';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';

export function InventoryAlerts() {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        background: '#FFFFFF',
        border: '1px solid rgba(107,76,42,0.08)',
        boxShadow: '0 2px 12px rgba(107,76,42,0.08), 0 1px 3px rgba(107,76,42,0.04)',
        borderRadius: '14px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1 }}>
        <NotificationsActiveRoundedIcon sx={{ color: '#DC2626', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
          Low Stock Alerts
        </Typography>
      </Box>

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
          Live low-stock alerts are not exposed by the current backend yet.
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          The dashboard is now honest about that gap instead of showing placeholder alerts.
        </Typography>
      </Box>
    </Card>
  );
}
