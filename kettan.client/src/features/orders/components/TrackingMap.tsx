import React from 'react';
import { Box, Typography } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
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

export const TrackingMap: React.FC = () => {
  return (
    <>
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
    </>
  );
};
