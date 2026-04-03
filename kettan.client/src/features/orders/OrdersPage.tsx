import { Box, Typography, Chip, Tabs, Tab } from '@mui/material';
import { useState } from 'react';

import LocalMallRoundedIcon from '@mui/icons-material/LocalMallRounded';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Dropdown } from '../../components/UI/Dropdown';
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
  { id: 'ORD-8891', branch: 'Downtown Main', itemsCount: 14, totalCost: 8540.00, status: 'Pending', date: '2026-04-02' },
  { id: 'ORD-8890', branch: 'Uptown Station', itemsCount: 5, totalCost: 3200.50, status: 'Approved', date: '2026-04-01' },
  { id: 'ORD-8889', branch: 'Westside Market', itemsCount: 22, totalCost: 11250.00, status: 'Packing', date: '2026-03-30' },
  { id: 'ORD-8888', branch: 'Airport Express', itemsCount: 8, totalCost: 5400.00, status: 'Dispatched', date: '2026-03-29' },
  { id: 'ORD-8887', branch: 'Uptown Station', itemsCount: 42, totalCost: 0, status: 'Suspended', date: '2026-03-28' },
];

const STATUS_MAP = {
  'Pending':    { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
  'Approved':   { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  'Packing':    { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' },
  'Dispatched': { color: '#546B3F', bg: 'rgba(84,107,63,0.12)' },
  'Suspended':  { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
};

const columns: ColumnDef<OrderItem>[] = [
  {
    key: 'id',
    label: 'Order ID',
    gridWidth: '120px',
    render: (row) => (
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
        {row.id}
      </Typography>
    ),
  },
  {
    key: 'branch',
    label: 'Branch Location',
    gridWidth: '1.5fr',
    render: (row) => (
      <Typography sx={{ fontSize: 13.5, color: 'text.primary', fontWeight: 600 }}>
        {row.branch}
      </Typography>
    ),
  },
  {
    key: 'itemsCount',
    label: 'Items',
    gridWidth: '100px',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        {row.itemsCount} SKUs
      </Typography>
    ),
  },
  {
    key: 'totalCost',
    label: 'Est. Cost',
    gridWidth: '120px',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 600 }}>
        {row.totalCost > 0 ? `$${row.totalCost.toFixed(2)}` : '--'}
      </Typography>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    gridWidth: '120px',
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
    gridWidth: '120px',
    render: (row) => (
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
        {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </Typography>
    ),
  },
  {
    key: 'actions',
    label: '',
    gridWidth: '100px',
    render: (row) => (
       
<a href={`/orders/${row.id}`} style={{ textDecoration: 'none' }}>
        <Button 
          variant="outlined" 
          sx={{ minWidth: 0, px: 1.5, height: 32, fontSize: 12 }}
        >
          Manage
        </Button>
      </a>
    ),
  },
];

export function OrdersPage() {
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-04-03');
  const [branchFilter, setBranchFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('all');

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
          Supply Orders
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.25 }}>
          Manage incoming branch fulfillment requests and process dispatches.
        </Typography>
      </Box>

      {/* Top Filter Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Dropdown
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value as string)}
            options={[
              { value: 'all', label: 'All Branches' },
              { value: '1', label: 'Downtown Main' },
              { value: '2', label: 'Uptown Station' },
              { value: '3', label: 'Westside Market' },
              { value: '4', label: 'Airport Express' }
            ]}
          />
          <DateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }} 
          />
        </Box>
         
<a href="/orders/new" style={{ textDecoration: 'none' }}>
          <Button startIcon={<LocalMallRoundedIcon />}>
            New Internal Request
          </Button>
        </a>
      </Box>

      {/* Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_e, val) => setCurrentTab(val)}
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14,
              minHeight: 48,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'text.primary' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#C9A84C' }
          }}
        >
          <Tab label="All Orders" value="all" />
          <Tab label="Pending" value="Pending" />
          <Tab label="Approved" value="Approved" />
          <Tab label="Packing" value="Packing" />
          <Tab label="Ready to Dispatch" value="Ready" />
        </Tabs>
      </Box>

      {/* Main DataTable */}
      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalMallRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Active Fulfillment Ledger</Typography>
          </Box>
        }
        data={currentTab === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === currentTab)}
        columns={columns}
        keyExtractor={(row) => row.id}
      />
    </Box>
  );
}
