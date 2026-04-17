import { useMemo, useState } from 'react';
import { Box, Chip, MenuItem, Paper, Typography } from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import MoveToInboxRoundedIcon from '@mui/icons-material/MoveToInboxRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { Dropdown } from '../../components/UI/Dropdown';
import { TextField } from '../../components/UI/TextField';
import { StatCard } from '../../components/UI/StatCard';

type ShippingStatus = 'Packed' | 'Dispatched' | 'InTransit' | 'Delivered';

interface ShippingQueueRow {
  id: string;
  branch: string;
  status: ShippingStatus;
  courier?: string;
  vehicle?: string;
  dispatchAt?: string;
  eta?: string;
}

const INITIAL_ROWS: ShippingQueueRow[] = [
  { id: 'ORD-9007', branch: 'North Point', status: 'Packed' },
  { id: 'ORD-9006', branch: 'Downtown Main', status: 'Packed' },
  { id: 'ORD-9005', branch: 'Airport Express', status: 'InTransit', courier: 'Juan Delivery Services', vehicle: 'ABC-1234', dispatchAt: '2026-04-17T09:10:00Z', eta: '2026-04-17T12:30' },
  { id: 'ORD-9004', branch: 'Westside Market', status: 'Dispatched', courier: 'RoadRunner Logistics', vehicle: 'XYZ-4455', dispatchAt: '2026-04-17T10:20:00Z', eta: '2026-04-17T14:00' },
  { id: 'ORD-9003', branch: 'Uptown Station', status: 'Delivered', courier: 'Juan Delivery Services', vehicle: 'ABC-1234', dispatchAt: '2026-04-16T08:00:00Z', eta: '2026-04-16T10:00' },
];

const COURIERS = [
  { value: 'Juan Delivery Services', label: 'Juan Delivery Services' },
  { value: 'RoadRunner Logistics', label: 'RoadRunner Logistics' },
];

const VEHICLES = [
  { value: 'ABC-1234', label: 'ABC-1234 (Van)' },
  { value: 'XYZ-4455', label: 'XYZ-4455 (Motorcycle)' },
  { value: 'MNL-2026', label: 'MNL-2026 (L300)' },
];

function statusChipStyle(status: ShippingStatus) {
  if (status === 'Packed') {
    return { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' };
  }

  if (status === 'Dispatched') {
    return { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' };
  }

  if (status === 'InTransit') {
    return { color: '#B45309', bg: 'rgba(180,83,9,0.12)' };
  }

  return { color: '#047857', bg: 'rgba(4,120,87,0.12)' };
}

export function ShippingQueuePage() {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [searchQuery, setSearchQuery] = useState('');

  const packedOrders = rows.filter((row) => row.status === 'Packed');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedCourier, setSelectedCourier] = useState(COURIERS[0].value);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0].value);
  const [eta, setEta] = useState('');

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        row.id.toLowerCase().includes(query) ||
        row.branch.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        (row.courier ?? '').toLowerCase().includes(query) ||
        (row.vehicle ?? '').toLowerCase().includes(query)
      );
    });
  }, [rows, searchQuery]);

  const dispatchOrder = (orderId: string, courier: string, vehicle: string, etaValue?: string) => {
    const nowIso = new Date().toISOString();
    setRows((previous) =>
      previous.map((row) =>
        row.id === orderId
          ? {
              ...row,
              status: 'InTransit',
              courier,
              vehicle,
              dispatchAt: nowIso,
              eta: etaValue || undefined,
            }
          : row,
      ),
    );
  };

  const markDelivered = (orderId: string) => {
    setRows((previous) =>
      previous.map((row) => (row.id === orderId ? { ...row, status: 'Delivered' } : row)),
    );
  };

  const runDispatchConsole = () => {
    if (!selectedOrderId) {
      return;
    }

    dispatchOrder(selectedOrderId, selectedCourier, selectedVehicle, eta || undefined);
    setSelectedOrderId('');
    setEta('');
  };

  const columns: ColumnDef<ShippingQueueRow>[] = [
    {
      key: 'id',
      label: 'Order',
      width: 120,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {row.id}
        </Typography>
      ),
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (row) => <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{row.branch}</Typography>,
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      render: (row) => {
        const style = statusChipStyle(row.status);
        return (
          <Chip
            label={row.status}
            size="small"
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              bgcolor: style.bg,
              color: style.color,
              border: `1px solid ${style.color}2b`,
            }}
          />
        );
      },
    },
    {
      key: 'courier',
      label: 'Courier',
      width: 170,
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.courier || '--'}</Typography>,
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      width: 140,
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.vehicle || '--'}</Typography>,
    },
    {
      key: 'eta',
      label: 'ETA',
      width: 140,
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.eta || '--'}</Typography>,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 250,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
          <Button
            size="small"
            variant="outlined"
            sx={{ height: 32, px: 1.4 }}
            disabled={row.status !== 'Packed'}
            onClick={() => dispatchOrder(row.id, COURIERS[0].value, VEHICLES[0].value, 'Today 5:30 PM')}
          >
            Quick Dispatch
          </Button>
          <Button
            size="small"
            sx={{ height: 32, px: 1.4 }}
            disabled={row.status !== 'InTransit' && row.status !== 'Dispatched'}
            onClick={() => markDelivered(row.id)}
          >
            Mark Delivered
          </Button>
        </Box>
      ),
    },
  ];

  const readyToDispatchCount = rows.filter((row) => row.status === 'Packed').length;
  const inTransitCount = rows.filter((row) => row.status === 'InTransit' || row.status === 'Dispatched').length;
  const deliveredTodayCount = rows.filter((row) => row.status === 'Delivered').length;

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
          <StatCard
            label="Ready to Dispatch"
            value={readyToDispatchCount}
            icon={<MoveToInboxRoundedIcon />}
            trend="up"
            trendValue="+2"
            accentClass="stat-accent-brown"
            iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
          />
          <StatCard
            label="In Transit"
            value={inTransitCount}
            icon={<LocalShippingRoundedIcon />}
            trend="up"
            trendValue="+1"
            accentClass="stat-accent-gold"
            iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
          />
          <StatCard
            label="Delivered"
            value={deliveredTodayCount}
            icon={<CheckCircleRoundedIcon />}
            trend="up"
            trendValue="+4"
            accentClass="stat-accent-sage"
            iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
          />
        </Box>
      </Box>

      <Paper sx={{ p: 2.2, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }} elevation={0}>
        <Typography sx={{ fontSize: 15, fontWeight: 800, mb: 1.2 }}>Dispatch Console (Demo)</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr auto' }, gap: 1.2 }}>
          <TextField
            select
            label="Packed Order"
            value={selectedOrderId}
            onChange={(event) => setSelectedOrderId(event.target.value)}
          >
            <MenuItem value="">Select order</MenuItem>
            {packedOrders.map((order) => (
              <MenuItem key={order.id} value={order.id}>{`${order.id} - ${order.branch}`}</MenuItem>
            ))}
          </TextField>

          <Dropdown
            value={selectedCourier}
            onChange={(event) => setSelectedCourier(String(event.target.value))}
            options={COURIERS}
          />

          <Dropdown
            value={selectedVehicle}
            onChange={(event) => setSelectedVehicle(String(event.target.value))}
            options={VEHICLES}
          />

          <TextField
            label="ETA"
            placeholder="Today 6:00 PM"
            value={eta}
            onChange={(event) => setEta(event.target.value)}
          />

          <Button onClick={runDispatchConsole} disabled={!selectedOrderId}>
            Dispatch
          </Button>
        </Box>
      </Paper>

      <DataTable
        title="Shipping and Delivery Queue"
        data={filteredRows}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyMessage="No orders in this queue."
        toolbar={
          <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchInput
              placeholder="Search order, branch, courier, vehicle..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              sx={{ minWidth: 280, maxWidth: 420 }}
            />
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              Queue demo: packed orders dispatched quickly, then marked delivered.
            </Typography>
          </Box>
        }
      />
    </Box>
  );
}
