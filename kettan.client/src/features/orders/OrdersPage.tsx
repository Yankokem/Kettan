import { Box, Typography, Chip, Grid } from '@mui/material';
import { useState } from 'react';

import LocalMallRoundedIcon from '@mui/icons-material/LocalMallRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import { KettanTable, type KettanColumnDef } from '../../components/UI/KettanTable';
import { StatCard } from '../../components/UI/StatCard';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { Button } from '../../components/UI/Button';

// Mock Data for Orders
interface OrderItem {
  id: string;
  branch: string;
  itemsCount: number;
  totalCost: number;
  status: 'Pending' | 'Approved' | 'Packing' | 'Dispatched' | 'Suspended';
  date: string;
}

const MOCK_ORDERS: OrderItem[] = [
  { id: 'ORD-8891', branch: 'Downtown Main',   itemsCount: 14, totalCost: 8540.00,  status: 'Pending',    date: '2026-04-02' },
  { id: 'ORD-8890', branch: 'Uptown Station',  itemsCount: 5,  totalCost: 3200.50,  status: 'Approved',   date: '2026-04-01' },
  { id: 'ORD-8889', branch: 'Westside Market', itemsCount: 22, totalCost: 11250.00, status: 'Packing',    date: '2026-03-30' },
  { id: 'ORD-8888', branch: 'Airport Express', itemsCount: 8,  totalCost: 5400.00,  status: 'Dispatched', date: '2026-03-29' },
  { id: 'ORD-8887', branch: 'Uptown Station',  itemsCount: 42, totalCost: 0,        status: 'Suspended',  date: '2026-03-28' },
];

const STATUS_MAP = {
  'Pending':    { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
  'Approved':   { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  'Packing':    { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' },
  'Dispatched': { color: '#546B3F', bg: 'rgba(84,107,63,0.12)' },
  'Suspended':  { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
};

const ORDER_QUICK_FILTERS = [
  { value: 'Pending',    label: 'Pending' },
  { value: 'Approved',  label: 'Approved' },
  { value: 'Packing',   label: 'Packing' },
  { value: 'Dispatched',label: 'Dispatched' },
  { value: 'Suspended', label: 'Suspended' },
];

const columns: KettanColumnDef<OrderItem>[] = [
  {
    key: 'id',
    label: 'Order ID',
    width: 120,
    render: (row) => (
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#6B4C2A', fontFamily: 'monospace' }}>
        {row.id}
      </Typography>
    ),
  },
  {
    key: 'branch',
    label: 'Branch Location',
    render: (row) => (
      <Typography sx={{ fontSize: 13.5, color: 'text.primary', fontWeight: 600 }}>
        {row.branch}
      </Typography>
    ),
  },
  {
    key: 'itemsCount',
    label: 'Items',
    width: 100,
    sortable: true,
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        {row.itemsCount} SKUs
      </Typography>
    ),
  },
  {
    key: 'totalCost',
    label: 'Est. Cost',
    width: 120,
    sortable: true,
    align: 'right',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 600 }}>
        {row.totalCost > 0 ? `₱${row.totalCost.toFixed(2)}` : '--'}
      </Typography>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    render: (row) => {
      const st = STATUS_MAP[row.status];
      return (
        <Chip
          label={row.status}
          size="small"
          sx={{
            fontSize: 11.5,
            fontWeight: 600,
            background: st.bg,
            color: st.color,
            border: `1px solid ${st.color}28`,
          }}
        />
      );
    },
  },
  {
    key: 'date',
    label: 'Date Requested',
    width: 130,
    sortable: true,
    render: (row) => (
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
        {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </Typography>
    ),
  },
  {
    key: 'actions',
    label: '',
    width: 100,
    render: (row) => (
      <a href={`/orders/${row.id}`} style={{ textDecoration: 'none' }}>
        <Button variant="outlined" sx={{ minWidth: 0, px: 1.5, height: 32, fontSize: 12 }}>
          Manage
        </Button>
      </a>
    ),
  },
];

export function OrdersPage() {
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-04-03');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchesBranch = !branchFilter || o.branch === branchFilter;
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesBranch && matchesStatus;
  });

  return (
    <Box sx={{ pb: 3 }}>
      {/* Stat Cards Grid */}
      <Box sx={{ mb: 5 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Pending Requests"
              value={MOCK_ORDERS.filter(o => o.status === 'Pending').length.toString()}
              trend="up"
              trendValue="1.5%"
              icon={<AccessTimeRoundedIcon />}
              accentClass="stat-accent-rust"
              iconBg="linear-gradient(135deg, #D48C6B 0%, #EAA989 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Orders Packing"
              value={MOCK_ORDERS.filter(o => o.status === 'Packing').length.toString()}
              trend="up"
              trendValue="2.4%"
              icon={<LocalMallRoundedIcon />}
              accentClass="stat-accent-sand"
              iconBg="linear-gradient(135deg, #D1BFA8 0%, #E6DFD4 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="In Transit"
              value={MOCK_ORDERS.filter(o => o.status === 'Dispatched').length.toString()}
              trend="up"
              trendValue="5.1%"
              icon={<LocalShippingRoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Revenue"
              value={`₱${MOCK_ORDERS.reduce((acc, o) => acc + o.totalCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              trend="up"
              trendValue="1.2%"
              icon={<MonetizationOnRoundedIcon />}
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Toolbar above table */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => { setStartDate(start); setEndDate(end); }}
          />
        </Box>
        <a href="/orders/new" style={{ textDecoration: 'none' }}>
          <Button startIcon={<LocalMallRoundedIcon />}>
            New Internal Request
          </Button>
        </a>
      </Box>

      {/* Orders Table with quick-filter chips + branch dropdown */}
      <KettanTable
        data={filtered}
        columns={columns}
        keyExtractor={(row) => row.id}
        defaultRowsPerPage={10}
        rowsPerPageOptions={[10, 25, 50]}
        quickFilters={ORDER_QUICK_FILTERS}
        activeQuickFilter={statusFilter}
        onQuickFilterChange={setStatusFilter}
        rightAction={
          <FilterDropdown
            label="Branch"
            icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
            value={branchFilter}
            onChange={setBranchFilter}
            compact
            minWidth={120}
            options={[
              { value: 'Downtown Main',   label: 'Downtown Main' },
              { value: 'Uptown Station',  label: 'Uptown Station' },
              { value: 'Westside Market', label: 'Westside Market' },
              { value: 'Airport Express', label: 'Airport Express' },
            ]}
          />
        }
        emptyMessage="No orders match the selected filters."
      />
    </Box>
  );
}
