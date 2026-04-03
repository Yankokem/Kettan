import { Box, Typography, Chip, Card, Grid } from '@mui/material';
import { useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { ActiveOrderCard } from './components/ActiveOrderCard';
import { OrderDetailsPanel } from './components/OrderDetailsPanel';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Mock Data
export interface ActiveOrder {
  id: string;
  destination: string;
  driver: string;
  status: string;
  coords: [number, number];
  hqCoords: [number, number];
}

const ACTIVE_ORDERS: ActiveOrder[] = [
  { id: 'ORD-8891', destination: 'Quezon City Branch', driver: 'Juan Dela Cruz', status: 'In Transit', coords: [14.5800, 121.0300], hqCoords: [14.5547, 121.0244] },
  { id: 'ORD-8892', destination: 'BGC Reserve', driver: 'Maria Santos', status: 'In Transit', coords: [14.5500, 121.0500], hqCoords: [14.5547, 121.0244] }
];

export function GlobalTrackingPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
  };

  return (
    <Box sx={{ pb: 3, pt: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/orders" />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              Active Fleet Tracking
            </Typography>
            <Chip
              label="Live map"
              color="success"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Monitor all ongoing supply and return orders in real-time.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Left Sidebar */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          {selectedOrderId ? (
             <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Button 
                   onClick={handleBackToList}
                   startIcon={<ArrowBackIcon />}
                   variant="outlined"
                   sx={{ mb: 2, alignSelf: 'flex-start' }}
                >
                  Back to List
                </Button>
                <OrderDetailsPanel orderId={selectedOrderId} />
             </Box>
          ) : (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 2, flexGrow: 1 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>Ongoing Orders ({ACTIVE_ORDERS.length})</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ACTIVE_ORDERS.map(o => (
                  <ActiveOrderCard key={o.id} order={o} onSelect={() => handleSelectOrder(o.id)} isSelected={selectedOrderId === o.id} />
                ))}
              </Box>
            </Card>
          )}
        </Grid>

        {/* Right Content - Map */}
        <Grid size={{ xs: 12, md: 9 }} sx={{ height: '100%', minHeight: { xs: 400, md: 'auto' } }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', overflow: 'hidden', position: 'relative' }}>
            <MapContainer 
               center={selectedOrderId ? ACTIVE_ORDERS.find(o => o.id === selectedOrderId)?.coords || [14.5547, 121.0244] : [14.5547, 121.0244]} 
               zoom={13} 
               style={{ height: '100%', width: '100%', zIndex: 1 }}
               zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

              {ACTIVE_ORDERS.map(order => {
                  const isSelected = selectedOrderId === order.id;
                  return (
                     <Box key={order.id}>
                        <Marker position={order.coords} icon={truckIcon}>
                          <Popup>
                            <strong>{order.id}</strong><br/>
                            {order.destination}<br/>
                            {order.status}
                          </Popup>
                        </Marker>
                        
                        <Marker position={order.hqCoords}>
                          <Popup>HQ Warehouse</Popup>
                        </Marker>

                        {isSelected && (
                           <Polyline
                             positions={[order.hqCoords, order.coords]}
                             color="#f59e0b"
                             weight={4}
                             dashArray="8, 8"
                           />
                        )}
                     </Box>
                  );
              })}
            </MapContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
