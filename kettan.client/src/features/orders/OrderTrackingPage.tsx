import { Box, Typography, Chip, Grid } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';

import { BackButton } from '../../components/UI/BackButton';
import { DeliveryDetailsPanel } from './components/DeliveryDetailsPanel';
import { OrderStatusTimeline } from './components/OrderStatusTimeline';

export function OrderTrackingPage() {
  const { orderId } = useParams({ strict: false });
  const displayId = orderId || 'ORD-8891';

  return (
    <Box sx={{ pb: 3, pt: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to={`/orders/${displayId}`} />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {displayId}
            </Typography>
            <Chip
              label="In Transit"
              icon={<LocalShippingRoundedIcon sx={{ fontSize: 14 }} />}
              size="small"
              sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'rgba(107,76,42,0.12)', color: '#6B4C2A', border: '1px solid rgba(107,76,42,0.28)' }}
            />
          </Box>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Real-time logistics tracking for order shipment
          </Typography>
        </Box>
      </Box>

      {/* Split View */}
      <Grid container spacing={3} sx={{ flex: 1, minHeight: 600 }}>
        {/* Left Column: Logistics Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <DeliveryDetailsPanel />
        </Grid>

        {/* Right Column: Status Timeline */}
        <Grid size={{ xs: 12, md: 8 }}>
          <OrderStatusTimeline orderId={displayId!} status="In Transit" />
        </Grid>
      </Grid>
    </Box>
  );
}
