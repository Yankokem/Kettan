import { useEffect, useState } from 'react';
import { Box, Typography, Card, CircularProgress, List, ListItem, Chip } from '@mui/material';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../../store/useAuthStore';
import { api } from '../../../utils/api';

interface LowStockAlert {
  itemId: number;
  itemName: string;
  sku: string;
  branchName: string;
  currentStock: number;
  threshold: number;
  unit: string;
}

export function InventoryAlerts() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isHq = user?.role === 'TenantAdmin' || user?.role === 'HqManager' || user?.role === 'HqStaff';
  
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setIsLoading(true);
        const endpoint = isHq ? '/api/reports/hq/low-stock' : '/api/reports/branch/low-stock';
        const res = await api.get<LowStockAlert[]>(endpoint);
        setAlerts(res.data);
      } catch (err) {
        console.error('Failed to load low stock alerts', err);
      } finally {
        setIsLoading(false);
      }
    };
    void loadAlerts();
  }, [isHq]);

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <NotificationsActiveRoundedIcon sx={{ color: '#DC2626', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
          Low Stock Alerts
        </Typography>
        {alerts.length > 0 && (
          <Chip 
            label={alerts.length} 
            size="small" 
            sx={{ 
              height: 18, 
              fontSize: 10, 
              fontWeight: 700, 
              bgcolor: '#FEE2E2', 
              color: '#B91C1C',
              ml: 'auto'
            }} 
          />
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, mx: -1, maxHeight: 280 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={20} sx={{ color: '#6B4C2A' }} />
          </Box>
        ) : alerts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
            <Inventory2RoundedIcon sx={{ color: 'text.disabled', fontSize: 32, mb: 1, opacity: 0.5 }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
              All items in stock
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
            {alerts.map((alert, idx) => (
              <ListItem 
                key={`${alert.itemId}-${idx}`}
                disablePadding
                onClick={() => navigate({ to: '/hq-inventory', search: { search: alert.sku } })}
                sx={{ 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  p: 1.5,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.06)',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(107, 76, 42, 0.04)',
                    borderColor: 'rgba(107, 76, 42, 0.2)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                    {alert.itemName}
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                    {alert.currentStock} / {alert.threshold} {alert.unit}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600, fontFamily: 'monospace' }}>
                    {alert.sku}
                  </Typography>
                  {isHq && (
                    <Typography sx={{ fontSize: 11, color: '#6B4C2A', fontWeight: 700 }}>
                      • {alert.branchName}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Card>
  );
}
