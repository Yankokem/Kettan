import { Box, Typography, Chip, Card } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import BuildCircleRoundedIcon from '@mui/icons-material/BuildCircleRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { TextField } from '../../components/UI/TextField';

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
    <Box sx={{ pb: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <BackButton to="/orders" />
        <Typography sx={{ ml: 1.5, fontSize: 14, fontWeight: 600, color: 'text.secondary' }}>Back to Orders</Typography>
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {displayId}
            </Typography>
            <Chip
              label="Pending Approval"
              icon={<AccessTimeFilledRoundedIcon sx={{ fontSize: 14 }} />}
              size="small"
              sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'rgba(180,83,9,0.12)', color: '#B45309', border: '1px solid rgba(180,83,9,0.28)' }}
            />
          </Box>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            Requested by <strong>Downtown Main</strong> on Apr 02, 2026
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" sx={{ color: 'error.main', borderColor: 'error.light', '&:hover': { bgcolor: 'error.50' } }}>
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

      {/* Fulfillment Details Banner */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'error.main', bgcolor: '#FEF2F2', borderRadius: 3, p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <ErrorOutlineRoundedIcon sx={{ color: 'error.main', mt: 0.5 }} />
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'error.dark' }}>
            Partial Fulfillment Required
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'error.main', mt: 0.5, lineHeight: 1.5 }}>
            HQ Inventory is insufficient to fulfill this order completely. Almond Milk and Vanilla Syrup are out of stock or low. Please adjust the approved quantities before sending to the packing floor.
          </Typography>
        </Box>
      </Card>

      {/* Stepper Visual */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, mx: 2 }}>
        {[
          { label: 'Requested', icon: <AccessTimeFilledRoundedIcon />, active: true },
          { label: 'Approved', icon: <CheckCircleRoundedIcon />, active: false },
          { label: 'Packing', icon: <BuildCircleRoundedIcon />, active: false },
          { label: 'Dispatched', icon: <LocalShippingRoundedIcon />, active: false },
        ].map((step, idx, arr) => (
          <Box key={step.label} sx={{ display: 'flex', alignItems: 'center', flex: idx < arr.length - 1 ? 1 : 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: step.active ? '#C9A84C' : 'background.paper', 
                color: step.active ? '#fff' : 'text.disabled',
                border: '2px solid', borderColor: step.active ? '#C9A84C' : 'divider',
                boxShadow: step.active ? '0 2px 8px rgba(201,168,76,0.3)' : 'none'
              }}>
                {step.icon}
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: step.active ? 'text.primary' : 'text.disabled' }}>
                {step.label}
              </Typography>
            </Box>
            {idx < arr.length - 1 && (
              <Box sx={{ flex: 1, height: 2, bgcolor: step.active ? '#C9A84C' : 'divider', mx: 2, mt: -3, opacity: step.active ? 1 : 0.5 }} />
            )}
          </Box>
        ))}
      </Box>

      {/* Constraints Data Table */}
      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Item Reconciliation</Typography>
          </Box>
        }
        data={MOCK_ITEMS}
        columns={COLUMNS}
        keyExtractor={(row) => row.id}
      />
    </Box>
  );
}
