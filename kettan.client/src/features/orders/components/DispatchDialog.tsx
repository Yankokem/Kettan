import { useEffect, useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography, 
  TextField, 
  Box, 
  MenuItem, 
  CircularProgress,
  alpha,
  IconButton
} from '@mui/material';
import { 
  LocalShippingRounded as TruckIcon, 
  DirectionsCarRounded as VanIcon, 
  TwoWheelerRounded as BikeIcon,
  LocalPostOfficeRounded as TrackingIcon,
  CloseRounded as CloseIcon
} from '@mui/icons-material';
import { listVehicles } from '../../hq-inventory/vehicleApi';
import { Button } from '../../../components/UI/Button';

interface Vehicle {
  vehicleId: number;
  plateNumber: string;
  vehicleType: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface DispatchDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { vehicleId: number; trackingNumber: string; estimatedArrival: string }) => void;
  isSaving?: boolean;
}

const BRAND_TAN = '#8C6B43';
const SURFACE_TAN = '#F0E6D3';
const BASE_TAN = '#FAF5EF';

const getVehicleIcon = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('truck')) return <TruckIcon sx={{ fontSize: 18 }} />;
  if (t.includes('bike') || t.includes('motorcycle')) return <BikeIcon sx={{ fontSize: 18 }} />;
  return <VanIcon sx={{ fontSize: 18 }} />;
};

export function DispatchDialog({ open, onClose, onConfirm, isSaving }: DispatchDialogProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  
  // Form State
  const [selectedVehicle, setSelectedVehicle] = useState<number | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    if (open) {
      loadVehicles();
      generateTracking();
      setSelectedVehicle('');
    }
  }, [open]);

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const data = await listVehicles();
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

  const handleConfirmClick = () => {
    if (selectedVehicle) {
      onConfirm({
        vehicleId: Number(selectedVehicle),
        trackingNumber,
        estimatedArrival: new Date(Date.now() + 86400000).toISOString() 
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isSaving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          bgcolor: '#FFFFFF',
          backgroundImage: 'none',
          boxShadow: '0 20px 40px -12px rgba(140, 107, 67, 0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2.5, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: SURFACE_TAN,
        borderBottom: '1px solid',
        borderColor: alpha(BRAND_TAN, 0.1)
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: '10px', 
            bgcolor: BRAND_TAN, 
            color: 'white',
            display: 'flex',
            boxShadow: `0 4px 8px ${alpha(BRAND_TAN, 0.25)}`
          }}>
            <TruckIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#3E2723', letterSpacing: '-0.01em' }}>
            Prepare Dispatch
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          disabled={isSaving}
          sx={{ color: BRAND_TAN }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3.5, pt: 8, bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'grid', gap: 4, mt: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: BRAND_TAN, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
              Select Delivery Vehicle
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(Number(e.target.value))}
              disabled={isSaving || loadingVehicles}
              placeholder="Choose an active vehicle"
              InputProps={{
                sx: { 
                  borderRadius: '8px', 
                  height: 44,
                  bgcolor: BASE_TAN,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(BRAND_TAN, 0.1),
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: BRAND_TAN,
                  },
                }
              }}
            >
              {loadingVehicles ? (
                <MenuItem disabled><CircularProgress size={16} sx={{ mr: 1.5, color: BRAND_TAN }} /> Loading vehicles...</MenuItem>
              ) : vehicles.length === 0 ? (
                <MenuItem disabled>No active vehicles available</MenuItem>
              ) : vehicles.map((v) => (
                <MenuItem key={v.vehicleId} value={v.vehicleId} sx={{ py: 1.2, borderRadius: '8px', mx: 1, my: 0.25 }}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Box sx={{ mr: 2, color: BRAND_TAN, display: 'flex' }}>{getVehicleIcon(v.vehicleType)}</Box>
                    <Box flexGrow={1}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#3E2723' }}>{v.plateNumber}</Typography>
                      <Typography variant="caption" sx={{ color: alpha('#3E2723', 0.6) }}>{v.vehicleType}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: BRAND_TAN, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
              Logistics Information
            </Typography>
            <Box sx={{ 
              p: 2, 
              borderRadius: '12px', 
              bgcolor: BASE_TAN, 
              border: '1px solid',
              borderColor: alpha(BRAND_TAN, 0.05),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ mr: 2, p: 1, borderRadius: '8px', bgcolor: alpha(BRAND_TAN, 0.05), color: BRAND_TAN, display: 'flex' }}>
                  <TrackingIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: alpha(BRAND_TAN, 0.6), mb: 0.2 }}>
                    TRACKING NUMBER
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: '#3E2723' }}>
                    {trackingNumber}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Typography sx={{ fontSize: 11, color: alpha('#3E2723', 0.4), mt: 1.5, fontStyle: 'italic' }}>
              * Estimated arrival is automatically set to 24 hours from dispatch.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: alpha(BRAND_TAN, 0.05), bgcolor: '#FFFFFF' }}>
        <Button 
          variant="outlined"
          onClick={onClose} 
          disabled={isSaving}
          sx={{ fontSize: 14 }}
        >
          Cancel
        </Button>
        <Button
          disabled={isSaving || selectedVehicle === ''}
          onClick={handleConfirmClick}
          loading={isSaving}
          sx={{ px: 4, height: 42 }}
        >
          Confirm Dispatch
        </Button>
      </DialogActions>
    </Dialog>
  );
}
