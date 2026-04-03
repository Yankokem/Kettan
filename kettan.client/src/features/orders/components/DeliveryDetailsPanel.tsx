import { Box, Typography, Card } from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PersonPinCircleRoundedIcon from '@mui/icons-material/PersonPinCircleRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';

export function DeliveryDetailsPanel() {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, flexShrink: 0 }}>
        <LocalShippingRoundedIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Delivery Details</Typography>
      </Box>

      <Box sx={{ mb: 4, flexShrink: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
          Courier Profile
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>Michael Dela Cruz</Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Lalamove / AB-1234-CD</Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>ETA: 2:45 PM Today</Typography>
      </Box>

      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 2, flexShrink: 0 }}>
        Journey Log
      </Typography>

      <Box sx={{ position: 'relative', ml: 1, pl: 3, borderLeft: '2px solid', borderColor: 'divider', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Event 1 */}
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: '#E8D3A9', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#B08B5A' }} />
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>Order Received</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Apr 02, 09:00 AM</Typography>
        </Box>

        {/* Event 2 */}
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: '#E8D3A9', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#B08B5A' }} />
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>Packed at HQ</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Apr 02, 11:30 AM</Typography>
        </Box>

        {/* Event 3 */}
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: '#E8D3A9', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <LocalShippingRoundedIcon sx={{ fontSize: 14, color: '#B08B5A' }} />
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#C9A84C' }}>Dispatched</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Apr 02, 12:15 PM</Typography>
        </Box>

        {/* Event 4 (Active/Pulsing) */}
        <Box sx={{ position: 'relative' }}>
          <Box sx={{
            position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: 'background.paper', border: '2px solid', borderColor: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)', filter: 'drop-shadow(0px 0px 4px rgba(201,168,76,0.6))' },
              '50%': { transform: 'scale(1.15)', filter: 'drop-shadow(0px 0px 12px rgba(201,168,76,1))' },
              '100%': { transform: 'scale(1)', filter: 'drop-shadow(0px 0px 4px rgba(201,168,76,0.6))' },
            }
          }}>
            <MapRoundedIcon sx={{ fontSize: 14, color: '#C9A84C' }} />
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>In Transit</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Current Status</Typography>
        </Box>

        {/* Event 5 */}
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: 'background.paper', border: '2px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <PersonPinCircleRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.disabled' }}>Arrived at Branch</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Pending Delivery</Typography>
        </Box>
      </Box>
    </Card>
  );
}
