import { Box, Typography, Chip, Grid } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { TextField } from '../../components/UI/TextField';
import { OrderFulfillmentStepper } from './components/OrderFulfillmentStepper';
import { StatusAlertIcon } from './components/StatusAlertIcon';
import { OrderDetailsPanel } from './components/OrderDetailsPanel';

interface RequestItem {
  id: string;
  name: string;
  requestedQty: number;
  hqStock: number;
  approvedQty: number;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
}

const MOCK_ITEMS: RequestItem[] = [
  { id: '1', name: 'Arabica Coffee Beans (Medium Roast) - 5kg', requestedQty: 4, hqStock: 120, approvedQty: 4, status: 'Available' },
  { id: '2', name: 'Almond Milk - 1L Carton', requestedQty: 24, hqStock: 10, approvedQty: 10, status: 'Low Stock' },
  { id: '3', name: 'Vanilla Syrup - 750ml Bottle', requestedQty: 6, hqStock: 0, approvedQty: 0, status: 'Out of Stock' },
  { id: '4', name: 'Paper Cups (12oz) - Box of 500', requestedQty: 2, hqStock: 45, approvedQty: 2, status: 'Available' },
];

const COLUMNS: ColumnDef<RequestItem>[] = [
  {
    key: 'name',
    label: 'Requested Item',
    gridWidth: '2fr',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 600 }}>
        {row.name}
      </Typography>
    ),
  },
  {
    key: 'hqStock',
    label: 'HQ Stock',
    gridWidth: '100px',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: row.hqStock < row.requestedQty ? 'error.main' : 'text.secondary', fontWeight: row.hqStock < row.requestedQty ? 700 : 500 }}>
        {row.hqStock} units
      </Typography>
    ),
  },
  {
    key: 'requestedQty',
    label: 'Requested',
    gridWidth: '100px',
    render: (row) => (
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
        {row.requestedQty} units
      </Typography>
    ),
  },
  {
    key: 'status',
    label: 'Availability',
    gridWidth: '140px',
    render: (row) => {
      const color = row.status === 'Available' ? '#546B3F' : (row.status === 'Low Stock' ? '#B45309' : '#B91C1C');
      const bg = row.status === 'Available' ? 'rgba(84,107,63,0.12)' : (row.status === 'Low Stock' ? 'rgba(180,83,9,0.12)' : 'rgba(185,28,28,0.10)');
      return (
        <Chip
          label={row.status}
          size="small"
          sx={{ fontSize: 11.5, fontWeight: 600, background: bg, color: color, border: `1px solid ${color}28` }}
        />
      );
    },
  },
  {
    key: 'approvedQty',
    label: 'Approved Qty',
    gridWidth: '140px',
    render: (row) => (
      <TextField
        size="small"
        type="number"
        defaultValue={row.approvedQty}
        inputProps={{ min: 0, max: row.hqStock, sx: { fontSize: 13, fontWeight: 700, py: 0.5 } }}
        sx={{ width: 80, '& .MuiOutlinedInput-notchedOutline': { borderColor: row.hqStock < row.requestedQty ? 'error.main' : 'divider' } }}
      />
    ),
  }
];

export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false });
  const displayId = orderId || 'ORD-8891';

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/orders" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
                {displayId}
              </Typography>
              <Chip
                label="Pending Approval"
                icon={<AccessTimeFilledRoundedIcon sx={{ fontSize: 14 }} />}
                size="small"
                sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'rgba(180,83,9,0.12)', color: '#B45309', border: '1px solid rgba(180,83,9,0.28)' }}
              />
            </Box>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
              Requested by <strong>Downtown Main</strong> on Apr 02, 2026
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5, alignItems: 'center' }}>
          <StatusAlertIcon
            severity="warning"
            title="Partial Fulfillment Warning"
            message="This order contains items with insufficient HQ stock. Approving this order will dispatch only the available quantities."
          />
          <Button variant="outlined" startIcon={<CancelRoundedIcon />} sx={{ color: 'error.main', borderColor: 'error.light', '&:hover': { bgcolor: 'error.50' } }}>
            Reject Order
          </Button>
          <Button startIcon={<CheckCircleRoundedIcon />}>
            Approve & Send to Packing
          </Button>
          <a href={`/orders/${displayId}/tracking`} style={{ textDecoration: 'none' }}>
            <Button variant="outlined" startIcon={<LocalShippingRoundedIcon />}>
              Tracker
            </Button>
          </a>
        </Box>
      </Box>

      {/* Stepper Visual */}
      <OrderFulfillmentStepper activeStepIndex={0} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3.5 }}>
          {/* Order Details Panel */}
          <OrderDetailsPanel orderId={displayId} />
        </Grid>
        
        <Grid size={{ xs: 12, md: 8.5 }}>
          {/* Constraints Data Table */}
          <DataTable
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Item Reconciliation</Typography>
              </Box>
            }
            data={MOCK_ITEMS}
            columns={COLUMNS}
            keyExtractor={(row) => row.id}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
