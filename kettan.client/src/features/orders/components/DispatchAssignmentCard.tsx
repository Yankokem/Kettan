import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  Box, 
  MenuItem, 
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import { 
  LocalShipping as TruckIcon, 
  DirectionsCar as VanIcon, 
  TwoWheeler as BikeIcon,
  Refresh as RefreshIcon,
  LocalPostOffice as TrackingIcon,
  Event as DateIcon,
  CheckCircleOutline as DispatchIcon
} from '@mui/icons-material';
import { listVehicles } from '../../hq-inventory/vehicleApi';

interface Vehicle {
  vehicleId: number;
  plateNumber: string;
  vehicleType: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface DispatchAssignmentCardProps {
  onDispatch: (data: { vehicleId: number; trackingNumber: string; estimatedArrival: string }) => void;
  isLoading?: boolean;
}

const getVehicleIcon = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('truck')) return <TruckIcon />;
  if (t.includes('bike') || t.includes('motorcycle')) return <BikeIcon />;
  return <VanIcon />;
};

export default function DispatchAssignmentCard({ onDispatch, isLoading }: DispatchAssignmentCardProps) {
  const theme = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  
  // Form State
  const [selectedVehicle, setSelectedVehicle] = useState<number | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    loadVehicles();
    generateTracking();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const data = await listVehicles();
      // Ensure we handle both potential formats if API changed
      const normalizedData = data.map((v: any) => ({
        ...v,
        vehicleId: v.vehicleId || Number(v.id)
      }));
      setVehicles(normalizedData.filter(v => v.isActive));
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const generateTracking = () => {
    const prefix = 'KTN';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    setTrackingNumber(`${prefix}-${timestamp}-${random}`);
  };

  const handleDispatchClick = () => {
    if (selectedVehicle) {
      onDispatch({
        vehicleId: Number(selectedVehicle),
        trackingNumber,
        estimatedArrival: new Date(Date.now() + 86400000).toISOString() 
      });
    }
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        mb: 2, 
        borderRadius: 3,
        background: alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '3px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Grid container spacing={2} alignItems="center">
          {/* Label & Icon Section */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box display="flex" alignItems="center">
              <Box 
                sx={{ 
                  p: 0.75, 
                  borderRadius: 1.5, 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mr: 1,
                  display: 'flex'
                }}
              >
                <TruckIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle2" fontWeight="800" sx={{ letterSpacing: -0.3 }}>
                Assign Logistics
              </Typography>
            </Box>
          </Grid>

          {/* Vehicle Selector */}
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(Number(e.target.value))}
              disabled={isLoading || loadingVehicles}
              label={selectedVehicle === '' ? "Select Vehicle" : ""}
              InputLabelProps={{ shrink: false }}
              InputProps={{
                startAdornment: selectedVehicle !== '' ? (
                  <Box sx={{ mr: 1, color: 'primary.main', display: 'flex' }}>
                    {getVehicleIcon(vehicles.find(v => v.vehicleId === selectedVehicle)?.vehicleType || '')}
                  </Box>
                ) : null,
                sx: { borderRadius: 2, fontSize: '0.8125rem', height: 36 }
              }}
            >
              {vehicles.map((v) => (
                <MenuItem key={v.vehicleId} value={v.vehicleId} sx={{ py: 1, borderRadius: 1.5, mx: 1, my: 0.25 }}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Box sx={{ mr: 1.5, color: 'text.secondary', display: 'flex' }}>{getVehicleIcon(v.vehicleType)}</Box>
                    <Box flexGrow={1}>
                      <Typography variant="body2" fontWeight="700">{v.plateNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">{v.vehicleType}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Tracking Number (Read Only) */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box 
              sx={{ 
                px: 2, 
                py: 0.75, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.action.disabledBackground, 0.1),
                border: '1px dashed',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 36,
                boxSizing: 'border-box'
              }}
            >
              <TrackingIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mr: 0.5 }}>
                TRACKING:
              </Typography>
              <Typography variant="body2" fontWeight="700" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                {trackingNumber}
              </Typography>
            </Box>
          </Grid>

          {/* Dispatch Button */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              disabled={isLoading || selectedVehicle === ''}
              onClick={handleDispatchClick}
              startIcon={isLoading ? <CircularProgress size={16} /> : <DispatchIcon />}
              sx={{ 
                height: 36, 
                borderRadius: 2, 
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: 0
              }}
            >
              Confirm Dispatch
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
