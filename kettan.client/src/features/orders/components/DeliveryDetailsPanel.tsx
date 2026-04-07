import { Box, Typography, Card, Divider, Grid } from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';

export function DeliveryDetailsPanel() {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, flexShrink: 0 }}>
        <LocalShippingRoundedIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Delivery Details</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocalShippingRoundedIcon color="action" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Courier / Provider</Typography>
              <Typography variant="body1" fontWeight={600}>In-House Logistics</Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12 }}>
          <Divider />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonRoundedIcon color="action" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Driver Assigned</Typography>
              <Typography variant="body1" fontWeight={600}>Juan Dela Cruz</Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PhoneRoundedIcon color="action" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Contact Info</Typography>
              <Typography variant="body1" fontWeight={600}>+63 917 123 4567</Typography>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocalShippingRoundedIcon color="info" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Vehicle Information</Typography>
              <Typography variant="body1" fontWeight={600}>ABC-1234 (Van)</Typography>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Estimated Arrival</Typography>
            <Typography variant="h6" color="primary.main" fontWeight={700}>Today, 5:00 PM</Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}
