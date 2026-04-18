import { Box, Grid, ToggleButton, ToggleButtonGroup, Tooltip, Typography, Chip } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import LocalMallRoundedIcon from '@mui/icons-material/LocalMallRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { StatCard } from '../../components/UI/StatCard';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { OrdersListViewSwitcher, type OrdersListViewMode } from './components/OrdersListViewSwitcher';
import { OrderRowActionsMenu, type OrderActionStatus } from './components/OrderRowActionsMenu';
import { OrderListCard } from './components/OrderListCard';

// Mock Data for Orders
interface OrderItem {
  id: string;
  branch: string;
  itemsCount: number;
  totalCost: number;
  status: OrderActionStatus;
  date: string;
  actionedBy?: string;
}

const MOCK_ORDERS: OrderItem[] = [
  { id: 'ORD-8894', branch: 'Downtown Main', itemsCount: 14, totalCost: 8540.0, status: 'PendingApproval', date: '2026-04-11' },
  { id: 'ORD-8893', branch: 'Uptown Station', itemsCount: 5, totalCost: 3200.5, status: 'Approved', date: '2026-04-10' },
  { id: 'ORD-8892', branch: 'Westside Market', itemsCount: 22, totalCost: 11250.0, status: 'Picking', date: '2026-04-08' },
  { id: 'ORD-8891', branch: 'Airport Express', itemsCount: 8, totalCost: 5400.0, status: 'Dispatched', date: '2026-04-07' },
  { id: 'ORD-8890', branch: 'Uptown Station', itemsCount: 10, totalCost: 7045.5, status: 'Delivered', date: '2026-04-03', actionedBy: 'Ana Reyes' },
  { id: 'ORD-8889', branch: 'Downtown Main', itemsCount: 9, totalCost: 4100.0, status: 'Rejected', date: '2026-03-31', actionedBy: 'John Cruz' },
  { id: 'ORD-8888', branch: 'Westside Market', itemsCount: 3, totalCost: 2350.0, status: 'Returned', date: '2026-03-28', actionedBy: 'Maria Santos' },
];

const STATUS_MAP: Record<string, { color: string; bg: string }> = {
  PendingApproval: { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
  Approved: { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  Processing: { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' },
  Picking: { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  Packed: { color: '#0891B2', bg: 'rgba(8,145,178,0.12)' },
  Dispatched: { color: '#546B3F', bg: 'rgba(84,107,63,0.12)' },
  InTransit: { color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  Delivered: { color: '#047857', bg: 'rgba(4,120,87,0.12)' },
  Rejected: { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
  Returned: { color: '#9333EA', bg: 'rgba(147,51,234,0.10)' },
};

type DatasetMode = 'active' | 'history';
type SortOption = 'newest' | 'oldest' | 'cost-high' | 'cost-low' | 'items-high' | 'items-low';

const ACTIVE_STATUSES: OrderActionStatus[] = ['PendingApproval', 'Approved', 'Processing', 'Picking', 'Packed'];
const HISTORY_STATUSES: OrderActionStatus[] = ['Dispatched', 'InTransit', 'Delivered', 'Rejected', 'Returned'];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'cost-high', label: 'Cost High to Low' },
  { value: 'cost-low', label: 'Cost Low to High' },
  { value: 'items-high', label: 'Most Items' },
  { value: 'items-low', label: 'Least Items' },
];

function getColumns(
  mode: DatasetMode,
  onViewDetails: (orderId: string) => void,
  onApprove: (orderId: string) => void,
  onProceed: (orderId: string) => void,
  onReject: (orderId: string) => void,
): ColumnDef<OrderItem>[] {
  const baseColumns: ColumnDef<OrderItem>[] = [
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
      label: 'Branch',
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
      label: 'Fulfillment Cost',
      width: 150,
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
      width: 130,
      render: (row) => {
        const st = STATUS_MAP[row.status] || { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' };
        const displayLabel = row.status === 'PendingApproval' ? 'Pending Approval' : row.status === 'InTransit' ? 'In Transit' : row.status;
        return (
          <Chip
            label={displayLabel}
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
  ];

  const modeColumn: ColumnDef<OrderItem> =
    mode === 'history'
      ? {
          key: 'actionedBy',
          label: 'Actioned By',
          width: 150,
          render: (row) => (
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
              {row.actionedBy || '--'}
            </Typography>
          ),
        }
      : {
          key: 'date',
          label: 'Date Requested',
          width: 140,
          sortable: true,
          render: (row) => (
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          ),
        };

  const actionsColumn: ColumnDef<OrderItem> = {
    key: 'actions',
    label: 'Actions',
    width: 90,
    align: 'right',
    render: (row) => (
      <OrderRowActionsMenu
        orderId={row.id}
        status={row.status}
        onViewDetails={onViewDetails}
        onApprove={onApprove}
        onProceed={onProceed}
        onReject={onReject}
      />
    ),
  };

  return [...baseColumns, modeColumn, actionsColumn];
}

export function OrdersPage() {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState('2026-03-25');
  const [endDate, setEndDate] = useState('2026-04-14');
  const [datasetMode, setDatasetMode] = useState<DatasetMode>('active');
  const [viewMode, setViewMode] = useState<OrdersListViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const source = MOCK_ORDERS.filter((order) => {
    const statuses = datasetMode === 'active' ? ACTIVE_STATUSES : HISTORY_STATUSES;
    return statuses.includes(order.status);
  });

  const filtered = source.filter((order) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      order.id.toLowerCase().includes(query) ||
      order.branch.toLowerCase().includes(query) ||
      (order.actionedBy || '').toLowerCase().includes(query);
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const inRange = order.date >= startDate && order.date <= endDate;
    return matchesQuery && matchesStatus && inRange;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.date.localeCompare(b.date);
      case 'cost-high':
        return b.totalCost - a.totalCost;
      case 'cost-low':
        return a.totalCost - b.totalCost;
      case 'items-high':
        return b.itemsCount - a.itemsCount;
      case 'items-low':
        return a.itemsCount - b.itemsCount;
      case 'newest':
      default:
        return b.date.localeCompare(a.date);
    }
  });

  const statusOptions = (datasetMode === 'active' ? ACTIVE_STATUSES : HISTORY_STATUSES).map((status) => ({
    value: status,
    label: status,
  }));

  const openDetails = (orderId: string) => {
    navigate({ to: '/orders/$orderId', params: { orderId } });
  };

  const handleApprove = (orderId: string) => {
    navigate({ to: '/orders/$orderId', params: { orderId } });
  };

  const handleProceed = (orderId: string) => {
    navigate({ to: '/orders/$orderId', params: { orderId } });
  };

  const handleReject = (orderId: string) => {
    navigate({ to: '/orders/$orderId', params: { orderId } });
  };

  const handleDatasetModeChange = (nextMode: DatasetMode) => {
    setDatasetMode(nextMode);
    setStatusFilter('');
    if (nextMode === 'history') {
      setViewMode('table');
    }
  };

  const columns = getColumns(datasetMode, openDetails, handleApprove, handleProceed, handleReject);

  return (
    <Box sx={{ pb: 3 }}>
      {/* Stat Cards Grid */}
      <Box sx={{ mb: 5 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Pending Requests"
              value={MOCK_ORDERS.filter((o) => o.status === 'PendingApproval').length.toString()}
              trend="up"
              trendValue="1.5%"
              icon={<AccessTimeRoundedIcon />}
              accentClass="stat-accent-rust"
              iconBg="linear-gradient(135deg, #D48C6B 0%, #EAA989 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Orders Picking"
              value={MOCK_ORDERS.filter((o) => o.status === 'Picking' || o.status === 'Packed').length.toString()}
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
              value={MOCK_ORDERS.filter((o) => o.status === 'Dispatched').length.toString()}
              trend="up"
              trendValue="5.1%"
              icon={<LocalShippingRoundedIcon />}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Fulfillment Cost"
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

      {/* Top controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2.5,
          gap: 1.2,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          pb: 0.5,
        }}
      >
        <SearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search order ID, branch, or actor..."
          sx={{ minWidth: 280, maxWidth: 360, flexShrink: 0 }}
        />

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />

        <FilterDropdown
          label="Sort"
          icon={<SortRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={sortBy}
          onChange={(value) => setSortBy(value as SortOption)}
          minWidth={155}
          options={SORT_OPTIONS}
        />

        <FilterDropdown
          label="Status"
          icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={statusFilter}
          onChange={setStatusFilter}
          minWidth={120}
          options={statusOptions}
        />

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
          <Tooltip title="Active Orders">
            <ToggleButtonGroup
              value={datasetMode}
              exclusive
              onChange={(_event, value: DatasetMode | null) => {
                if (value) {
                  handleDatasetModeChange(value);
                }
              }}
              size="small"
              sx={{
                height: 40,
                borderRadius: 2,
                flexShrink: 0,
                '& .MuiToggleButton-root': {
                  px: 1.4,
                  color: '#6B4C2A',
                  borderColor: 'rgba(107, 76, 42, 0.3)',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(107, 76, 42, 0.12)',
                    color: '#4A3424',
                  },
                },
              }}
            >
              <ToggleButton value="active" aria-label="Active Orders">
                <PendingActionsRoundedIcon sx={{ fontSize: 16 }} />
              </ToggleButton>
              <ToggleButton value="history" aria-label="History">
                <HistoryRoundedIcon sx={{ fontSize: 16 }} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Tooltip>

          <OrdersListViewSwitcher
            value={viewMode}
            onChange={setViewMode}
            allowCard={datasetMode === 'active'}
          />

          <Button
            startIcon={<LocalMallRoundedIcon />}
            onClick={() => navigate({ to: '/orders/new' })}
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            New Request
          </Button>
        </Box>
      </Box>

      {viewMode === 'table' ? (
        <DataTable
          data={sorted}
          columns={columns}
          keyExtractor={(row) => row.id}
          defaultRowsPerPage={10}
          rowsPerPageOptions={[10, 25, 50]}
          onRowClick={(row) => openDetails(row.id)}
          emptyMessage="No orders match the selected filters."
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {sorted.length > 0 ? (
            sorted.map((order) => (
              <OrderListCard
                key={order.id}
                order={order}
                datasetMode={datasetMode}
                onOpen={openDetails}
                onApprove={handleApprove}
                onProceed={handleProceed}
                onReject={handleReject}
              />
            ))
          ) : (
            <Box
              sx={{
                gridColumn: '1 / -1',
                py: 8,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>
                No orders match the selected filters.
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

