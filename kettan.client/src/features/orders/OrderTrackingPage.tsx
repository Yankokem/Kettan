import { Box, Typography, Chip, Card, Grid } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PersonPinCircleRoundedIcon from '@mui/icons-material/PersonPinCircleRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { BackButton } from '../../components/UI/BackButton';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for Vehicle
const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Location Mock Data
const HQ_COORD: [number, number] = [14.5547, 121.0244]; // Makati HQ
const BRANCH_COORD: [number, number] = [14.6091, 121.0223]; // Quezon City Branch
const VEHICLE_COORD: [number, number] = [14.5800, 121.0300]; // Somewhere in transit

export function OrderTrackingPage() {
  const { orderId } = useParams({ strict: false });
  const displayId = orderId || 'ORD-8891';

  return (
    <Box sx={{ pb: 3, maxWidth: 1200, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <BackButton to={`/orders/${displayId}`} />
        <Typography sx={{ ml: 1.5, fontSize: 14, fontWeight: 600, color: 'text.secondary' }}>Back to {displayId}</Typography>
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {displayId}
            </Typography>
            <Chip
              label="In Transit"
              icon={<LocalShippingRoundedIcon sx={{ fontSize: 14 }} />}
              size="small"
              sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'rgba(107,76,42,0.12)', color: '#6B4C2A', border: '1px solid rgba(107,76,42,0.28)' }}
            />
          </Box>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            Tracking logistics via <strong>EasyPost</strong>
          </Typography>
        </Box>
      </Box>

      {/* Split View */}
      <Grid container spacing={3} sx={{ flex: 1, minHeight: 600 }}>
        {/* Left Column: Logistics Log */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
              <LocalShippingRoundedIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Delivery Details</Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                Courier Profile
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>Michael Dela Cruz</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Lalamove / AB-1234-CD</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>ETA: 2:45 PM Today</Typography>
            </Box>

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
              Journey Log
            </Typography>

            <Box sx={{ position: 'relative', ml: 1, pl: 3, borderLeft: '2px solid', borderColor: 'divider' }}>
              {/* Event 1 */}
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Box sx={{ position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: '#E8D3A9', display: 'flex', alignItems: 'center', justifyItems: 'center', zIndex: 1 }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 14, margin: 'auto', color: '#B08B5A' }} />
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>Order Received</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Apr 02, 09:00 AM</Typography>
              </Box>

              {/* Event 2 */}
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Box sx={{ position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: '#E8D3A9', display: 'flex', alignItems: 'center', justifyItems: 'center', zIndex: 1 }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 14, margin: 'auto', color: '#B08B5A' }} />
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>Packed at HQ</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Apr 02, 11:30 AM</Typography>
              </Box>

              {/* Event 3 */}
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Box sx={{ position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: '#E8D3A9', display: 'flex', alignItems: 'center', justifyItems: 'center', zIndex: 1 }}>
                  <LocalShippingRoundedIcon sx={{ fontSize: 14, margin: 'auto', color: '#B08B5A' }} />
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#C9A84C' }}>Dispatched (EasyPost)</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Apr 02, 12:15 PM</Typography>
              </Box>

              {/* Event 4 */}
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Box sx={{ position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: 'background.paper', border: '2px solid', borderColor: '#C9A84C', display: 'flex', alignItems: 'center', justifyItems: 'center', zIndex: 1 }}>
                  <MapRoundedIcon sx={{ fontSize: 14, margin: 'auto', color: '#C9A84C' }} />
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>In Transit</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Current Status</Typography>
              </Box>

              {/* Event 5 */}
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', left: -34, top: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: 'background.paper', border: '2px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyItems: 'center', zIndex: 1 }}>
                  <PersonPinCircleRoundedIcon sx={{ fontSize: 14, margin: 'auto', color: 'text.disabled' }} />
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.disabled' }}>Arrived at Branch</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Pending Delivery</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Right Column: Live Map Container */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', overflow: 'hidden', position: 'relative', minHeight: 500 }}>
            {/* Floating Top Label over Map */}
            <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Live Tracking Map</Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>OpenStreetMap Routing</Typography>
            </Box>
            
            <MapContainer center={VEHICLE_COORD} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&amp;copy <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={HQ_COORD}>
                <Popup><strong>Makati HQ</strong><br />Origin Node</Popup>
              </Marker>
              <Marker position={BRANCH_COORD}>
                <Popup><strong>Quezon City Branch</strong><br />Destination Node</Popup>
              </Marker>
              <Marker position={VEHICLE_COORD} icon={truckIcon}>
                <Popup><strong>Lalamove AB-1234-CD</strong><br />Currently en route</Popup>
              </Marker>
              <Polyline positions={[HQ_COORD, VEHICLE_COORD, BRANCH_COORD]} color="#C9A84C" weight={4} dashArray="8 8" />
            </MapContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
