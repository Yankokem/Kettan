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
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
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
import { fetchSupplyRequests, type SupplyRequest } from '../branch-operations/api';

type DatasetMode = 'active' | 'history';
type SortOption = 'newest' | 'oldest' | 'branch-asc' | 'branch-desc';

const HISTORY_STATUSES = ['Completed', 'Delivered', 'Rejected', 'Cancelled', 'Returned', 'Fulfilled'];

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

function ActionsMenu({ row }: { row: SupplyRequest }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

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
        <MenuItem onClick={() => { handleClose(); navigate({ to: '/supply-requests/$requestId', params: { requestId: String(row.requestId) } }); }}>
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); navigate({ to: '/branches/$branchId', params: { branchId: String(row.branchId) } }); }}>
          <ListItemIcon><StoreRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="View Branch" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); }}>
          <ListItemIcon><ChatBubbleOutlineRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
          <ListItemText primary="Quick Message" primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} />
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { handleClose(); navigator.clipboard.writeText(`SR-${row.requestId}`); }}>
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
  const isBranch = role === 'BranchManager' || role === 'BranchOwner';

  const canAccessPage = isHq || isBranch;
  const canCreateRequests = isBranch;

  const [rows, setRows] = useState<SupplyRequest[]>([]);
  const [datasetMode, setDatasetMode] = useState<DatasetMode>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());

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

  useEffect(() => {
    void loadRows();
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

  const safeRows = useMemo(() => {
    return Array.isArray(rows) ? rows : [];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeRows.filter((row) => {
      // 1. Filter by dataset mode (Active vs History)
      const isHistorical = HISTORY_STATUSES.includes(row.status);
      if (datasetMode === 'active' && isHistorical) return false;
      if (datasetMode === 'history' && !isHistorical) return false;

      const occurredDate = new Date(row.updatedAt);
      const fromDate = new Date(`${startDate}T00:00:00`);
      const toDate = new Date(`${endDate}T23:59:59`);

      const branchName = row.branchName?.toLowerCase() ?? '';
      const requestedBy = row.requestedByName?.toLowerCase() ?? '';
      const status = row.status?.toLowerCase() ?? '';

      const matchesQuery =
        !query ||
        row.requestId.toString().includes(query) ||
        branchName.includes(query) ||
        requestedBy.includes(query) ||
        status.includes(query);

      const matchesStatus = !statusFilter || 
        row.status === statusFilter || 
        (statusFilter === 'Completed' && row.status === 'Fulfilled') ||
        (statusFilter === 'Fulfilled' && row.status === 'Completed');
      const matchesDateRange = occurredDate >= fromDate && occurredDate <= toDate;

      return matchesQuery && matchesStatus && matchesDateRange;
    });
  }, [endDate, safeRows, search, startDate, statusFilter, datasetMode]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((left, right) => {
      if (sortBy === 'oldest') {
        return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
      }

      if (sortBy === 'branch-asc') {
        return left.branchName.localeCompare(right.branchName);
      }

      if (sortBy === 'branch-desc') {
        return right.branchName.localeCompare(left.branchName);
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

    return copy;
  }, [filteredRows, sortBy]);

  const columns: ColumnDef<SupplyRequest>[] = [
    {
      key: 'requestId',
      label: 'REQUEST ID',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6B4C2A', fontFamily: 'monospace' }}>
          SR-{row.requestId}
        </Typography>
      ),
    },
    {
      key: 'branchName',
      label: 'BRANCH',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
          {row.branchName || `Branch ${row.branchId}`}
        </Typography>
      ),
    },
    {
      key: 'requestedByName',
      label: 'FILED BY',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
          {row.requestedByName || `User ${row.requestedByUserId}`}
        </Typography>
      ),
    },
    {
      key: 'items',
      label: 'ITEMS',
      align: 'center',
      sortable: true,
      sortAccessor: (row) => row.items.length,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.items.length}
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
      key: 'updatedAt',
      label: 'DATE AND TIME',
      sortable: true,
      sortAccessor: (row) => new Date(row.updatedAt).getTime(),
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {new Date(row.updatedAt).toLocaleString('en-US', { 
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
      render: (row) => <ActionsMenu row={row} />,
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
          label="Filed Requests"
          value={safeRows.length}
          icon={<AssignmentTurnedInRoundedIcon />}
          trend="up"
          trendValue="Queue"
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Pending Review"
          value={safeRows.filter((row) => ['Draft', 'AutoDrafted', 'PendingApproval'].includes(row.status)).length}
          icon={<PendingActionsRoundedIcon />}
          trend="up"
          trendValue="Needs action"
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Approved"
          value={safeRows.filter((row) => ['Approved', 'PartiallyApproved'].includes(row.status)).length}
          icon={<TaskAltRoundedIcon />}
          trend="up"
          trendValue="Processed"
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Rejected"
          value={safeRows.filter((row) => row.status === 'Rejected').length}
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
          options={datasetMode === 'active' ? [
            { value: '', label: 'All Statuses' },
            { value: 'Draft', label: 'Draft' },
            { value: 'AutoDrafted', label: 'Auto-Drafted' },
            { value: 'PendingApproval', label: 'Awaiting HQ' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Picking', label: 'Picking' },
            { value: 'Packing', label: 'Packing' },
            { value: 'Dispatched', label: 'In Transit' },
            { value: 'Arrived', label: 'Arrived' },
          ] : [
            { value: '', label: 'All Statuses' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'Cancelled', label: 'Cancelled' },
            { value: 'Returned', label: 'Returned' },
          ]}
        />

        <Tooltip title={datasetMode === 'active' ? "Active Requests" : "History"}>
          <ToggleButtonGroup
            value={datasetMode}
            exclusive
            onChange={(_event, value: DatasetMode | null) => {
              if (value) {
                setDatasetMode(value);
                setStatusFilter('');
              }
            }}
            size="small"
            sx={{
              height: 40,
              borderRadius: '14px',
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
            <ToggleButton value="active" aria-label="Active">
              <ListAltRoundedIcon sx={{ fontSize: 16 }} />
            </ToggleButton>
            <ToggleButton value="history" aria-label="History">
              <HistoryRoundedIcon sx={{ fontSize: 16 }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Tooltip>

        <Box sx={{ ml: { xs: 0, lg: 'auto' }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {canCreateRequests && (
            <Button
              startIcon={<AddShoppingCartRoundedIcon />}
              sx={{ whiteSpace: 'nowrap' }}
              onClick={() => navigate({ to: '/supply-requests/new' })}
            >
              Request Supply
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
        keyExtractor={(row) => row.requestId.toString()}
        emptyTitle={search ? 'No matches found' : 'No supply requests yet'}
        emptyMessage={isLoading ? 'Loading supply requests...' : search ? 'We couldn\'t find any supply requests matching your search.' : 'There are no supply requests logged for your branch.'}
        emptyIcon={<AddShoppingCartRoundedIcon />}
        defaultRowsPerPage={10}
        pageSizes={[10, 25, 50]}
      />
    </Box>
  );
}
