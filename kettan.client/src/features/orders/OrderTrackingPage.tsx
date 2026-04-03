import { Box, Typography, Chip, Card, Grid } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { BackButton } from '../../components/UI/BackButton';
import { DeliveryDetailsPanel } from './components/DeliveryDetailsPanel';
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
        {/* Left Column: Logistics Log */}
        <Grid size={{ xs: 12, md: 3 }}>
          <DeliveryDetailsPanel />
        </Grid>

        {/* Right Column: Live Map Container */}
        <Grid size={{ xs: 12, md: 9 }}>
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
