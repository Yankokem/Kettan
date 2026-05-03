import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Typography, Card } from '@mui/material';
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

function statusChip(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === 'draft' || normalized.includes('autodrafted')) {
    return { color: '#64748B', bg: 'rgba(100,116,139,0.12)' };
  }

  if (normalized === 'pendingapproval') {
    return { color: '#B45309', bg: 'rgba(180,83,9,0.12)' };
  }

  if (['approved', 'completed', 'delivered'].includes(normalized)) {
    return { color: '#047857', bg: 'rgba(4,120,87,0.12)' };
  }

  if (['picking', 'packing', 'processing'].includes(normalized)) {
    return { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' };
  }

  if (['dispatched', 'intransit', 'arrived'].includes(normalized)) {
    return { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' };
  }

  if (normalized.includes('rejected') || normalized.includes('cancelled')) {
    return { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' };
  }

  return { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' };
}

export function SupplyRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role ?? '';
  const isHq = role === 'TenantAdmin' || role === 'HqManager' || role === 'HqStaff';
  const isBranch = role === 'BranchManager' || role === 'BranchOwner';

  const canAccessPage = isHq || isBranch;
  const canCreateRequests = isBranch; // HQ shouldn't usually "request" from themselves via this UI

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
      label: 'Request ID',
      width: 120,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#6B4C2A', fontFamily: 'monospace' }}>
          SR-{row.requestId}
        </Typography>
      ),
    },
    {
      key: 'branchName',
      label: 'Branch',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13.5, color: 'text.primary', fontWeight: 600 }}>
          {row.branchName || `Branch ${row.branchId}`}
        </Typography>
      ),
    },
    {
      key: 'requestedByName',
      label: 'Requested By',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {row.requestedByName || `User ${row.requestedByUserId}`}
        </Typography>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      width: 90,
      align: 'center',
      sortable: true,
      sortAccessor: (row) => row.items.length,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {row.items.length}
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      sortable: true,
      render: (row) => {
        const style = statusChip(row.status);
        return (
          <Chip
            label={formatStatusLabel(row.status)}
            size="small"
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              background: style.bg,
              color: style.color,
              border: `1px solid ${style.color}28`,
            }}
          />
        );
      },
    },
    {
      key: 'updatedAt',
      label: 'Date Requested',
      width: 140,
      sortable: true,
      sortAccessor: (row) => new Date(row.updatedAt).getTime(),
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 110,
      align: 'right',
      render: (row) => (
        <Button
          size="small"
          variant="outlined"
          sx={{ height: 32, px: 1.4 }}
          onClick={() => navigate({ to: '/supply-requests/$requestId', params: { requestId: String(row.requestId) } })}
        >
          Manage
        </Button>
      ),
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

        <Box sx={{ ml: { xs: 0, lg: 'auto' }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isHq && (
            <Button
              variant="outlined"
              startIcon={<LocalShippingRoundedIcon />}
              onClick={() => navigate({ to: '/hq-inventory/vehicles' })}
            >
              Vehicles
            </Button>
          )}

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

          <Button
            startIcon={<AddShoppingCartRoundedIcon />}
            sx={{ whiteSpace: 'nowrap' }}
            onClick={() => navigate({ to: '/supply-requests/new' })}
            disabled={!canCreateRequests}
          >
            Request Supply
          </Button>
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
