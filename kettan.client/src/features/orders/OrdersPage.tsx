import { Box, Grid, ToggleButton, ToggleButtonGroup, Tooltip, Typography, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/useAuthStore';

import LocalMallRoundedIcon from '@mui/icons-material/LocalMallRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';

import { EmptyState } from '../../components/UI/EmptyState';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { StatCard } from '../../components/UI/StatCard';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { OrderRowActionsMenu, type OrderActionStatus } from './components/OrderRowActionsMenu';
import { fetchOrders, fetchSupplyRequests, type BranchOrder, type SupplyRequest } from '../branch-operations/api';

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

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

const STATUS_MAP: Record<string, { color: string; bg: string }> = {
  PendingApproval: { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
  Approved: { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  Processing: { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' },
  Picking: { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  Allocated: { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  Packed: { color: '#0891B2', bg: 'rgba(8,145,178,0.12)' },
  Dispatched: { color: '#546B3F', bg: 'rgba(84,107,63,0.12)' },
  InTransit: { color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  Delivered: { color: '#047857', bg: 'rgba(4,120,87,0.12)' },
  Rejected: { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
  Returned: { color: '#9333EA', bg: 'rgba(147,51,234,0.10)' },
};

type DatasetMode = 'active' | 'history';
type SortOption = 'newest' | 'oldest' | 'cost-high' | 'cost-low' | 'items-high' | 'items-low';
type ActiveStatusTab = 'Approved' | 'Processing' | 'Picking' | 'Packed';

const ACTIVE_STATUSES: OrderActionStatus[] = ['Approved', 'PartiallyApproved', 'Processing', 'Picking', 'Allocated', 'Packing', 'Packed'];
const HISTORY_STATUSES: OrderActionStatus[] = ['Dispatched', 'InTransit', 'Delivered', 'Rejected', 'Returned'];
const ACTIVE_STATUS_TABS: ActiveStatusTab[] = ['Approved', 'Processing', 'Picking', 'Packed'];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'cost-high', label: 'Cost High to Low' },
  { value: 'cost-low', label: 'Cost Low to High' },
  { value: 'items-high', label: 'Most Items' },
  { value: 'items-low', label: 'Least Items' },
];

function getStatusDisplayLabel(status: OrderActionStatus): string {
  if (status === 'PendingApproval') {
    return 'Pending Approval';
  }

  if (status === 'InTransit') {
    return 'In Transit';
  }

  return status;
}

function getDefaultActiveStatusByRole(role?: string): ActiveStatusTab {
  if (role === 'HqManager' || role === 'TenantAdmin' || role === 'HqStaff') {
    return 'Picking';
  }

  return 'Approved';
}

function getColumns(
  onViewDetails: (orderId: string) => void,
  onApprove: (orderId: string) => void,
  onReject: (orderId: string) => void,
): ColumnDef<OrderItem>[] {
  return [
    {
      key: 'id',
      label: 'Order ID',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {row.id.startsWith('SR-') ? row.id : `ORD-${row.id}`}
        </Typography>
      ),
    },
    {
      key: 'date',
      label: 'Date Requested',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
          {new Date(row.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>
      ),
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 600 }}>
          {row.branch}
        </Typography>
      ),
    },
    {
      key: 'itemsCount',
      label: 'Items',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.itemsCount} SKUs
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const st = STATUS_MAP[row.status] || { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' };
        const displayLabel = getStatusDisplayLabel(row.status);
        return (
          <Typography sx={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: st.color,
            textTransform: 'lowercase',
            '&::first-letter': { textTransform: 'capitalize' }
          }}>
            {displayLabel}
          </Typography>
        );
      },
    },
    {
      key: 'totalCost',
      label: 'Fulfillment Cost',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 700 }}>
          {row.totalCost > 0 ? `₱${row.totalCost.toFixed(2)}` : '--'}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <OrderRowActionsMenu
          orderId={row.id}
          status={row.status}
          onViewDetails={onViewDetails}
          onApprove={onApprove}
          onReject={onReject}
        />
      ),
    },
  ];
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());
  const [datasetMode, setDatasetMode] = useState<DatasetMode>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeStatusTab, setActiveStatusTab] = useState<ActiveStatusTab>(() => getDefaultActiveStatusByRole(user?.role));
  const [historyStatusFilter, setHistoryStatusFilter] = useState<OrderActionStatus | ''>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [ordersRows, requestsRows] = await Promise.all([
          fetchOrders(),
          fetchSupplyRequests() 
        ]);

        const mappedOrders = ordersRows.map((row: BranchOrder) => ({
          id: String(row.orderId),
          branch: row.branchName || `Branch ${row.branchId}`,
          itemsCount: Number(row.itemsCount || 0),
          totalCost: Number(row.fulfillmentCost || 0),
          status: row.status as OrderActionStatus,
          date: row.pushedToFulfillmentAt,
          requestId: row.requestId,
        }));

        // SIMPLE FILTER: Show everything EXCEPT Pending, Draft, and AutoDrafted
        const excludedStatuses = ['PendingApproval', 'Draft', 'AutoDrafted'];

        // Get IDs of requests that already have a corresponding Order record
        const existingOrderRequestIds = new Set(
          ordersRows
            .map((o: any) => o.requestId)
            .filter((id: any) => !!id)
        );

        const mappedRequests = requestsRows
          .filter(row => !existingOrderRequestIds.has(row.requestId) && !excludedStatuses.includes(row.status)) 
          .map((row: SupplyRequest) => ({
            id: `SR-${row.requestId}`,
            requestId: row.requestId,
            branch: row.branchName || `Branch ${row.branchId}`,
            itemsCount: row.items?.length || 0,
            totalCost: 0,
            status: row.status as OrderActionStatus,
            date: row.createdAt,
            actionedBy: row.requestedByName
          }));

        const finalMerged = [...mappedRequests, ...mappedOrders];
        setOrders(finalMerged);
      } catch (err) {
        console.error('Failed to load orders/requests:', err);
        setError('Failed to load orders.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();

    // ── SignalR Real-Time Sync ──
    const url = import.meta.env.VITE_API_URL || '';
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${url}/hub/workflow`, {
            withCredentials: true,
            accessTokenFactory: () => useAuthStore.getState().token || ''
        })
        .withAutomaticReconnect()
        .build();

    connection.on('ReceiveStatusUpdate', () => {
        void loadOrders();
    });

    connection.start()
        .then(() => connection.invoke('JoinOrdersList'))
        .catch(err => console.error('Orders Page SignalR Error: ', err));

    // ── Real-Time Polling (30 seconds) fallback ──
    const interval = setInterval(() => {
      void loadOrders();
    }, 30000);

    return () => {
        clearInterval(interval);
        if (connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke('LeaveGroup', 'Orders_All').finally(() => void connection.stop());
        }
    };
  }, []);

  const source = orders.filter((order) => {
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
    const matchesStatus = datasetMode === 'active'
      ? (
          order.status === activeStatusTab || 
          (activeStatusTab === 'Approved' && order.status === 'PartiallyApproved') ||
          (activeStatusTab === 'Picking' && (order.status === 'Allocated' || order.status === 'Packing'))
        )
      : !historyStatusFilter || order.status === historyStatusFilter;
    
    // Check date filtering
    const orderDateOnly = order.date ? order.date.slice(0, 10) : '';
    const inRange = orderDateOnly >= startDate && orderDateOnly <= endDate;
    
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

  const historyStatusOptions = HISTORY_STATUSES.map((status) => ({
    value: status,
    label: getStatusDisplayLabel(status),
  }));

  const openDetails = (id: string) => {
    if (id.startsWith('SR-')) {
      const requestId = id.replace('SR-', '');
      navigate({ to: '/supply-requests/$requestId', params: { requestId } });
    } else {
      navigate({ to: '/orders/$orderId', params: { orderId: id } });
    }
  };

  const handleApprove = (id: string) => {
    openDetails(id);
  };


  const handleReject = (id: string) => {
    openDetails(id);
  };

  const handleDatasetModeChange = (nextMode: DatasetMode) => {
    setDatasetMode(nextMode);
    if (nextMode === 'history') {
      setHistoryStatusFilter('');
    }
  };

  const columns = getColumns(openDetails, handleApprove, handleReject);

  return (
    <Box sx={{ pb: 3 }}>
      {/* Stat Cards Grid */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Pending Fulfillment"
              value={orders.filter((o) => ['Approved', 'PartiallyApproved', 'Processing'].includes(o.status)).length.toString()}
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
              value={orders.filter((o) => o.status === 'Picking' || o.status === 'Allocated' || o.status === 'Packed').length.toString()}
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
              value={orders.filter((o) => o.status === 'Dispatched' || o.status === 'InTransit').length.toString()}
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
              value={`₱${orders.reduce((acc, o) => acc + o.totalCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
          flexWrap: 'wrap',
        }}
      >
        <SearchInput
          id="order-search"
          name="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search order ID, branch, or actor..."
          sx={{ 
            minWidth: { xs: '100%', sm: 240, md: 280 }, 
            maxWidth: { sm: 360 },
            flexShrink: 1,
          }}
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

        {datasetMode === 'active' ? (
          <FilterDropdown
            label="Status"
            icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
            value={activeStatusTab}
            onChange={(value) => setActiveStatusTab(value as ActiveStatusTab)}
            minWidth={160}
            options={ACTIVE_STATUS_TABS.map((status) => ({
              value: status,
              label: getStatusDisplayLabel(status),
            }))}
          />
        ) : (
          <FilterDropdown
            label="Status"
            icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
            value={historyStatusFilter}
            onChange={(value) => setHistoryStatusFilter(value as OrderActionStatus | '')}
            minWidth={120}
            options={historyStatusOptions}
          />
        )}

        <Box 
          sx={{ 
            ml: { xs: 0, lg: 'auto' }, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.2,
          }}
        >
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

          <Button
            startIcon={<LocalMallRoundedIcon />}
            onClick={() => navigate({ to: '/orders/new' })}
            sx={{ whiteSpace: 'nowrap' }}
          >
            New Request
          </Button>
        </Box>
      </Box>

      {error ? (
        <Typography sx={{ color: 'error.main', fontSize: 12.5, mb: 1.2 }}>{error}</Typography>
      ) : null}

      <DataTable
        data={sorted}
        columns={columns}
        keyExtractor={(row) => row.id}
        defaultRowsPerPage={10}
        rowsPerPageOptions={[10, 25, 50]}
        onRowClick={(row) => openDetails(row.id)}
        emptyTitle="No orders found"
        emptyMessage={isLoading ? 'Loading orders...' : 'No orders match the selected filters.'}
        emptyIcon={<Inventory2RoundedIcon />}
      />
    </Box>
  );
}

