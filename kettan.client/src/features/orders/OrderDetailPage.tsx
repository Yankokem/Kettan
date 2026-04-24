import { Box, Typography, Chip, Grid } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import BackpackRoundedIcon from '@mui/icons-material/BackpackRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';

import { useAuthStore } from '../../store/useAuthStore';
import { Dropdown } from '../../components/UI/Dropdown';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { TextField } from '../../components/UI/TextField';
import { OrderFulfillmentStepper } from './components/OrderFulfillmentStepper';
import { StatusAlertIcon } from './components/StatusAlertIcon';
import { OrderDetailsPanel } from './components/OrderDetailsPanel';
import {
  fetchOrderById,
  pickOrder,
  packOrder,
  dispatchOrder,
  type OrderDetail,
  type OrderRequestItem,
} from '../branch-operations/api';

interface RequestItem {
  id: string;
  name: string;
  requestedQty: number;
  hqStock: number;
  approvedQty: number;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
}

const COLUMNS: ColumnDef<RequestItem>[] = [
  {
    key: 'name',
    label: 'Requested Item',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 600 }}>
        {row.name}
      </Typography>
    ),
  },
  {
    key: 'hqStock',
    label: 'HQ Stock',
    width: 110,
    sortable: true,
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: row.hqStock < row.requestedQty ? 'error.main' : 'text.secondary', fontWeight: row.hqStock < row.requestedQty ? 700 : 500 }}>
        {row.hqStock} units
      </Typography>
    ),
  },
  {
    key: 'requestedQty',
    label: 'Requested',
    width: 110,
    sortable: true,
    render: (row) => (
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
        {row.requestedQty} units
      </Typography>
    ),
  },
  {
    key: 'status',
    label: 'Availability',
    width: 140,
    render: (row) => {
      const color = row.status === 'Available' ? '#546B3F' : (row.status === 'Low Stock' ? '#B45309' : '#B91C1C');
      const bg    = row.status === 'Available' ? 'rgba(84,107,63,0.12)' : (row.status === 'Low Stock' ? 'rgba(180,83,9,0.12)' : 'rgba(185,28,28,0.10)');
      return (
        <Chip
          label={row.status}
          size="small"
          sx={{ fontSize: 11.5, fontWeight: 600, background: bg, color, border: `1px solid ${color}28` }}
        />
      );
    },
  },
  {
    key: 'approvedQty',
    label: 'Approved Qty',
    width: 140,
    render: (row) => (
      <TextField
        size="small"
        type="number"
        defaultValue={row.approvedQty}
        inputProps={{ min: 0, max: row.hqStock, sx: { fontSize: 13, fontWeight: 600, py: 0.5 } }}
        sx={{ width: 80, '& .MuiOutlinedInput-notchedOutline': { borderColor: row.hqStock < row.requestedQty ? 'error.main' : 'divider' } }}
      />
    ),
  }
];

export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false });
  const { user } = useAuthStore();
  
  const [orderStatus, setOrderStatus] = useState<string>('PendingApproval');
  const [selectedCourier, setSelectedCourier] = useState('van_1');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const VEHICLES = [
    { value: 'van_1', label: 'Juan Delivery Services - Van 1' },
    { value: 'van_2', label: 'Juan Delivery Services - Van 2' },
    { value: 'truck_1', label: 'Metro Fleet - Truck 1' },
  ];

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Missing order id.');
        return;
      }

      try {
        setError(null);
        const row = await fetchOrderById(Number(orderId));
        setOrder(row);
        setOrderStatus(row.status);
      } catch {
        setError('Failed to load order details.');
      }
    };

    void loadOrder();
  }, [orderId]);

  const itemRows: RequestItem[] = useMemo(() => {
    return (order?.requestedItems ?? []).map((item: OrderRequestItem) => ({
      id: String(item.itemId),
      name: item.itemName,
      requestedQty: Number(item.quantityRequested),
      hqStock: Number(item.quantityApproved ?? item.quantityRequested),
      approvedQty: Number(item.quantityApproved ?? 0),
      status: (item.quantityApproved ?? item.quantityRequested) >= item.quantityRequested ? 'Available' : 'Low Stock',
    }));
  }, [order]);

  const handleAction = (nextStatus: string) => {
    setOrderStatus(nextStatus);
  };

  const handleWorkflowAction = async (action: 'pick' | 'pack' | 'dispatch') => {
    if (!orderId) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (action === 'pick') {
        await pickOrder(Number(orderId), 'Picking started from frontend.');
      } else if (action === 'pack') {
        await packOrder(Number(orderId), 'Packing confirmed from frontend.');
      } else if (action === 'dispatch') {
        await dispatchOrder(Number(orderId), {
          courierId: undefined,
          vehicleId: undefined,
          trackingNumber: undefined,
          estimatedArrival: undefined,
          remarks: 'Dispatched from frontend.',
        });
      }

      const refreshed = await fetchOrderById(Number(orderId));
      setOrder(refreshed);
      setOrderStatus(refreshed.status);
    } catch {
      setError('Failed to update order workflow.');
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <Box sx={{ pb: 3 }}>
        <Typography sx={{ color: 'error.main', fontSize: 14 }}>{error}</Typography>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ pb: 3 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Loading order…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/orders" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
                ORD-{order.orderId}
              </Typography>
              <Chip
                label={orderStatus.replace(/([A-Z])/g, ' $1').trim()}
                icon={orderStatus === 'Processing' ? <AccessTimeFilledRoundedIcon sx={{ fontSize: 14 }} /> : undefined}
                size="small"
                sx={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  bgcolor: orderStatus === 'Returned' ? 'rgba(185,28,28,0.1)' : 'rgba(37,99,235,0.12)', 
                  color: orderStatus === 'Returned' ? '#B91C1C' : '#2563EB', 
                  border: `1px solid ${orderStatus === 'Returned' ? 'rgba(185,28,28,0.28)' : 'rgba(37,99,235,0.28)'}` 
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
              Requested by <strong>{order.branchName}</strong> on {new Date(order.pushedToFulfillmentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          </Box>
        </Box>
        {/* Header Actions (Dynamic based on status and role) */}
        <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5, alignItems: 'center' }}>
          
          {orderStatus === 'Processing' && (
            <Button startIcon={<InventoryRoundedIcon />} onClick={() => void handleWorkflowAction('pick')} disabled={isSaving}>
              Start Picking
            </Button>
          )}

          {orderStatus === 'Picking' && (
            <Button startIcon={<BackpackRoundedIcon />} onClick={() => void handleWorkflowAction('pack')} disabled={isSaving}>
              Confirm Items Packed
            </Button>
          )}

          {orderStatus === 'Packed' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 200 }}>
                <Dropdown
                  options={VEHICLES}
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value as string)}
                  size="small"
                  fullWidth
                />
              </Box>
              <Button startIcon={<LocalShippingRoundedIcon />} onClick={() => void handleWorkflowAction('dispatch')} disabled={isSaving}>
                Dispatch Order
              </Button>
            </Box>
          )}

          {/* If dispatched, branch confirms delivery, HQ cannot override */}
          {orderStatus === 'Dispatched' && user?.role !== 'BranchManager' && user?.role !== 'BranchOwner' && (
            <Chip label="Awaiting Branch Delivery Confirmation" variant="outlined" sx={{ fontWeight: 600, color: 'text.secondary' }} />
          )}

          {orderStatus === 'Delivered' && (
            <Button variant="outlined" startIcon={<AssignmentReturnRoundedIcon />} sx={{ color: '#B45309', borderColor: '#B45309' }}>
              File Return
            </Button>
          )}

        </Box>
      </Box>

      {/* Stepper Visual */}
      <OrderFulfillmentStepper status={orderStatus} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3.5 }}>
          <OrderDetailsPanel orderId={`ORD-${order.orderId}`} />
        </Grid>

        <Grid size={{ xs: 12, md: 8.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
            <InventoryRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>Item Reconciliation</Typography>
          </Box>
          <DataTable
            data={itemRows}
            columns={COLUMNS}
            keyExtractor={(row) => row.id}
            defaultRowsPerPage={10}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

