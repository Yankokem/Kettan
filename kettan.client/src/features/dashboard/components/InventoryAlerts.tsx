import { Box, Typography, Card, Chip } from '@mui/material';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

interface Alert {
  id: string;
  item: string;
  branch: string;
  currentStock: number;
  eoq: number;
  status: 'critical' | 'low';
}

const ALERTS: Alert[] = [
  { id: 'al1', item: 'Espresso Beans (Dark Roast)', branch: 'Ortigas Branch', currentStock: 2, eoq: 15, status: 'critical' },
  { id: 'al2', item: 'Oat Milk 1L', branch: 'QC Branch', currentStock: 5, eoq: 24, status: 'low' },
  { id: 'al3', item: 'Paper Cups 12oz', branch: 'BGC Branch', currentStock: 100, eoq: 500, status: 'low' },
];

export function InventoryAlerts() {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1 }}>
        <NotificationsActiveRoundedIcon sx={{ color: '#DC2626', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
          Low Stock Alerts
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ALERTS.map((alert) => (
          <Box
            key={alert.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alert.status === 'critical' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(217, 119, 6, 0.2)',
              bgcolor: alert.status === 'critical' ? 'rgba(220, 38, 38, 0.02)' : 'rgba(217, 119, 6, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary' }}>
                  {alert.item}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  {alert.branch}
                </Typography>
              </Box>
              <Chip
                label={alert.status === 'critical' ? 'Critical Stock' : 'Low Stock'}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  bgcolor: alert.status === 'critical' ? '#FEE2E2' : '#FEF3C7',
                  color: alert.status === 'critical' ? '#991B1B' : '#92400E',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                 Current: <Typography component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{alert.currentStock}</Typography>
               </Typography>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                 <CheckCircleOutlineRoundedIcon sx={{ fontSize: 14, color: '#16A34A' }} />
                 <Typography sx={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
                   Suggested Restock: {alert.eoq}
                 </Typography>
               </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
