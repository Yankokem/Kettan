import { useEffect, useMemo, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { Box, Typography, Card } from '@mui/material';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import { useNavigate } from '@tanstack/react-router';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchSupplyRequests, fetchIncomingShipments, type SupplyRequest, type BranchOrder } from '../branch-operations/api';

type SortOption = 'newest' | 'oldest' | 'branch-asc' | 'branch-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'branch-asc', label: 'Branch A-Z' },
  { value: 'branch-desc', label: 'Branch Z-A' },
];

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatStatusLabel(status: string) {
  switch (status) {
    case 'PendingApproval': return 'Awaiting HQ';
    case 'AutoDrafted': return 'Auto Drafted';
    case 'PartiallyApproved': return 'Partially Approved';
    case 'InTransit':
    case 'Dispatched': return 'In Transit';
    default: return status;
  }
}

function statusColor(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'draft' || normalized.includes('autodrafted')) return '#757575'; // Neutral
  if (normalized === 'pendingapproval') return '#ED6C02'; // Pending
  if (['approved', 'completed', 'delivered'].includes(normalized)) return '#2E7D32'; // Success
  if (['picking', 'packing', 'processing', 'dispatched', 'intransit', 'arrived'].includes(normalized)) return '#0288D1'; // Info
  if (normalized.includes('rejected') || normalized.includes('cancelled')) return '#D32F2F'; // Error
  return '#6B7280';
}

function formatPeso(value: number): string {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatScheduleStatus(status?: string | null): string {
  switch (status) {
    case 'DueToday':
      return 'Due Today';
    case 'NoSchedule':
      return 'No Schedule';
    case 'OnTime':
      return 'On Time';
    default:
      return status || 'No Schedule';
  }
}

function scheduleColor(status?: string | null): string {
  if (status === 'Late') return '#D32F2F';
  if (status === 'DueToday') return '#ED6C02';
  if (status === 'OnTime') return '#2E7D32';
  if (status === 'Scheduled') return '#0288D1';
  return '#6B7280';
}

function ActionsMenu({ row, type }: { row: any; type: 'Request' | 'Dispatch' }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const viewPath = type === 'Request' ? '/supply-requests/$requestId' : '/orders/$orderId';
  const viewParams = type === 'Request' 
    ? { requestId: String(row.requestId) } 
    : { orderId: String(row.orderId) };

  return (
    <>
      <IconButton size="small" onClick={handleClick} sx={{ color: 'text.secondary' }}>
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <MenuItem onClick={() => { handleClose(); navigate({ to: viewPath, params: viewParams }); }}>
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
        
        {type === 'Request' && (
          <MenuItem onClick={() => { handleClose(); navigate({ to: '/branches/$branchId', params: { branchId: String(row.branchId) } }); }}>
            <ListItemIcon><StoreRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
            <ListItemText primary="View Branch" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
          </MenuItem>
        )}

        <MenuItem onClick={() => { handleClose(); }}>
          <ListItemIcon><ChatBubbleOutlineRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="Quick Message" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { handleClose(); navigator.clipboard.writeText(row.transactionCode || (type === 'Request' ? `SR-${row.requestId}` : `SD-${row.orderId}`)); }}>
          <ListItemIcon><ContentCopyRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="Copy ID" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
      </Menu>
    </>
  );
}

export function SupplyRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role ?? '';
  const isHq = role === 'TenantAdmin' || role === 'HqManager' || role === 'HqStaff';
  const isBranch = role === 'BranchManager' || role === 'BranchOwner' || role === 'StoreStaff';

  const canAccessPage = isHq || isBranch;
  const canCreateRequests = isBranch;

  const [rows, setRows] = useState<SupplyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());
  const [incomingShipments, setIncomingShipments] = useState<BranchOrder[]>([]);

  const loadRows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await fetchSupplyRequests();
      setRows(Array.isArray(results) ? results : []);
    } catch {
      setRows([]);
      setError('Failed to load supply requests.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadIncoming = async () => {
    try {
      const results = await fetchIncomingShipments();
      setIncomingShipments(Array.isArray(results) ? results : []);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    void loadRows();
    if (isBranch) void loadIncoming();
  }, []);

  // Real-time Status Sync via SignalR
  useEffect(() => {
    const url = import.meta.env.VITE_API_URL || '';
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${url}/hub/workflow`, {
            withCredentials: true,
            accessTokenFactory: () => useAuthStore.getState().token || ''
        })
        .withAutomaticReconnect()
        .build();

    connection.on('ReceiveStatusUpdate', () => {
        void loadRows();
    });

    connection.start()
        .then(() => connection.invoke('JoinSupplyRequestsList'))
        .catch(err => console.error('Supply Requests Page SignalR Error: ', err));

    return () => {
        if (connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke('LeaveGroup', 'SupplyRequests_All').finally(() => void connection.stop());
        }
    };
  }, []);

  const combinedRows = useMemo(() => {
    const requests = Array.isArray(rows) ? rows.map(r => ({
      ...r,
      id: r.transactionCode || `SR-${r.requestId}`,
      type: 'Request' as const,
      displayId: r.transactionCode || `SR-${r.requestId}`,
      date: r.updatedAt,
      itemsCount: r.items.length,
      filedBy: r.requestedByName || `User ${r.requestedByUserId}`,
      value: r.totalFulfilledValue ?? r.totalRequestedValue ?? 0,
      sla: r.dispatchScheduleStatus,
      raw: r
    })) : [];

    // Filter out dispatches that are already linked to a supply request we're already displaying
    const existingRequestIds = new Set(requests.map(r => r.raw.requestId));

    const dispatches = Array.isArray(incomingShipments) 
      ? incomingShipments
          .filter(o => !o.requestId || !existingRequestIds.has(o.requestId))
          .map(o => ({
            ...o,
            id: o.transactionCode || `SD-${o.orderId}`,
            type: 'Dispatch' as const,
            displayId: o.transactionCode || `SD-${o.orderId}`,
            date: o.pushedToFulfillmentAt,
            itemsCount: o.itemsCount,
            filedBy: 'HQ Dispatch',
            value: o.totalFulfilledValue || o.fulfillmentCost || 0,
            sla: o.dispatchScheduleStatus,
            raw: o
          })) 
      : [];

    return [...requests, ...dispatches];
  }, [rows, incomingShipments]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return combinedRows.filter((row) => {
      const occurredDate = new Date(row.date);
      const fromDate = new Date(`${startDate}T00:00:00`);
      const toDate = new Date(`${endDate}T23:59:59`);

      const branchName = (row.raw as any).branchName?.toLowerCase() ?? '';
      const subject = row.subject?.toLowerCase() ?? '';
      const filedBy = row.filedBy?.toLowerCase() ?? '';
      const status = row.status?.toLowerCase() ?? '';

      const matchesQuery =
        !query ||
        row.displayId.toLowerCase().includes(query) ||
        branchName.includes(query) ||
        subject.includes(query) ||
        filedBy.includes(query) ||
        status.includes(query);

      const matchesStatus = !statusFilter || row.status === statusFilter;
      const matchesDateRange = occurredDate >= fromDate && occurredDate <= toDate;

      return matchesQuery && matchesStatus && matchesDateRange;
    });
  }, [combinedRows, search, startDate, endDate, statusFilter]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((left, right) => {
      if (sortBy === 'oldest') {
        return new Date(left.date).getTime() - new Date(right.date).getTime();
      }
      return new Date(right.date).getTime() - new Date(left.date).getTime();
    });

    return copy;
  }, [filteredRows, sortBy]);

  const columns: ColumnDef<any>[] = [
    {
      key: 'displayId',
      label: 'ID',
      width: 100,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {row.displayId}
        </Typography>
      ),
    },
    {
      key: 'type',
      label: 'TYPE',
      width: 100,
      sortable: true,
      render: (row) => (
        <Typography 
          sx={{ 
            fontSize: 13, 
            fontWeight: 700, 
            color: row.type === 'Request' ? '#6B4C2A' : '#546B3F',
            letterSpacing: '0.02em'
          }} 
        >
          {row.type}
        </Typography>
      ),
    },
    {
      key: 'branchName',
      label: 'BRANCH',
      width: 160,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
          {row.raw.branchName || `Branch ${row.raw.branchId || ''}`}
        </Typography>
      ),
    },
    {
      key: 'subject',
      label: 'SUBJECT',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.subject || (row.type === 'Dispatch' ? 'HQ Dispatch' : '—')}
        </Typography>
      ),
    },
    {
      key: 'filedBy',
      label: 'FILED BY',
      width: 160,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
          {row.filedBy}
        </Typography>
      ),
    },
    {
      key: 'itemsCount',
      label: 'ITEMS',
      width: 80,
      align: 'center',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.itemsCount}
        </Typography>
      ),
    },
    {
      key: 'value',
      label: 'VALUE',
      width: 120,
      align: 'right',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          {formatPeso(row.value)}
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: statusColor(row.status) }}>
          {formatStatusLabel(row.status)}
        </Typography>
      ),
    },
    {
      key: 'sla',
      label: 'SLA',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: scheduleColor(row.sla) }}>
          {formatScheduleStatus(row.sla)}
        </Typography>
      ),
    },
    {
      key: 'date',
      label: 'DATE',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {new Date(row.date).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (row) => <ActionsMenu row={row.raw} type={row.type} />,
    },
  ];

  if (!canAccessPage) {
    return (
      <Box sx={{ pb: 3 }}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 0.5 }}>Supply Requests</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            This module is available for Branch Manager and Branch Owner only.
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        <StatCard
          label="Total Records"
          value={combinedRows.length}
          icon={<AssignmentTurnedInRoundedIcon />}
          trend="up"
          trendValue="Active Pool"
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Pending Review"
          value={combinedRows.filter((row) => ['Draft', 'AutoDrafted', 'PendingApproval'].includes(row.status)).length}
          icon={<PendingActionsRoundedIcon />}
          trend="up"
          trendValue="Needs action"
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Approved"
          value={combinedRows.filter((row) => ['Approved', 'PartiallyApproved'].includes(row.status)).length}
          icon={<TaskAltRoundedIcon />}
          trend="up"
          trendValue="Processed"
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Rejected"
          value={combinedRows.filter((row) => row.status === 'Rejected').length}
          icon={<HighlightOffRoundedIcon />}
          trend="up"
          trendValue="Needs review"
          accentClass="stat-accent-rust"
          iconBg="linear-gradient(135deg, #D48C6B 0%, #EAA989 100%)"
        />
      </Box>

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
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search request ID, branch, or requestor..."
          sx={{ 
            minWidth: { xs: '100%', sm: 240, md: 300 }, 
            maxWidth: { sm: 420 },
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
          minWidth={165}
          options={SORT_OPTIONS}
        />

        <FilterDropdown
          label="Status"
          icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={statusFilter}
          onChange={setStatusFilter}
          minWidth={170}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'Draft', label: 'Draft' },
            { value: 'AutoDrafted', label: 'Auto-Drafted' },
            { value: 'PendingApproval', label: 'Awaiting HQ' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Picking', label: 'Picking' },
            { value: 'Packing', label: 'Packing' },
            { value: 'Dispatched', label: 'In Transit' },
            { value: 'Arrived', label: 'Arrived' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'Cancelled', label: 'Cancelled' },
            { value: 'Returned', label: 'Returned' },
          ]}
        />

        <Box sx={{ ml: { xs: 0, lg: 'auto' }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {canCreateRequests && (
            <Button
              startIcon={<AddShoppingCartRoundedIcon />}
              sx={{ whiteSpace: 'nowrap' }}
              onClick={() => navigate({ to: '/supply-requests/new' })}
            >
              File Request
            </Button>
          )}

          {isHq && (
            <Button
              startIcon={<LocalShippingRoundedIcon />}
              onClick={() => navigate({ to: '/hq-inventory/vehicles' })}
            >
              Vehicles
            </Button>
          )}
        </Box>
      </Box>

      {error ? (
        <Typography sx={{ color: 'error.main', fontSize: 12.5, mb: 1.2 }}>{error}</Typography>
      ) : null}

      <DataTable
        data={sortedRows}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyTitle={search ? 'No matches found' : 'No supply requests yet'}
        emptyMessage={isLoading ? 'Loading records...' : search ? 'We couldn\'t find any matching records.' : 'There are no records logged yet.'}
        emptyIcon={<AddShoppingCartRoundedIcon />}
        defaultRowsPerPage={10}
        pageSizes={[10, 25, 50]}
      />
    </Box>
  );
}
