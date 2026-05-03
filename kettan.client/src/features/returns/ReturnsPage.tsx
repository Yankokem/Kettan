import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Grid, Typography } from '@mui/material';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { fetchReturns, type ReturnRecord } from '../branch-operations/api';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

type SortOption = 'newest' | 'oldest' | 'branch-asc' | 'branch-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'branch-asc', label: 'Branch A-Z' },
  { value: 'branch-desc', label: 'Branch Z-A' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Acknowledged', label: 'Acknowledged' },
  { value: 'Dispatched', label: 'Dispatched' },
  { value: 'Arrived', label: 'Arrived' },
  { value: 'Inspecting', label: 'Inspecting' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Rejected', label: 'Rejected' },
];

type StatusStyle = { bg: string; color: string };
function statusStyle(status: string): StatusStyle {
  switch (status) {
    case 'Draft':        return { bg: '#F5F5F5', color: '#757575' };
    case 'Submitted':    return { bg: '#FFF8E1', color: '#F57F17' };
    case 'Acknowledged': return { bg: '#E3F2FD', color: '#1565C0' };
    case 'Dispatched':   return { bg: '#E8F5E9', color: '#2E7D32' };
    case 'Arrived':      return { bg: '#E0F7FA', color: '#00695C' };
    case 'Inspecting':   return { bg: '#F3E5F5', color: '#6A1B9A' };
    case 'Completed':    return { bg: '#E8F5E9', color: '#1B5E20' };
    case 'Rejected':     return { bg: '#FFEBEE', color: '#B71C1C' };
    case 'Credited':     return { bg: '#E8F5E9', color: '#2E7D32' };
    case 'Replaced':     return { bg: '#E3F2FD', color: '#1565C0' };
    case 'Pending':      return { bg: '#FFF8E1', color: '#F57F17' };
    default:             return { bg: '#F5F5F5', color: '#616161' };
  }
}

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

// Active = in-flight (not terminal)
const ACTIVE_STATUSES = new Set(['Submitted', 'Acknowledged', 'Dispatched', 'Arrived', 'Inspecting']);


export function ReturnsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ReturnRecord[]>([]);
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
      const results = await fetchReturns(statusFilter ? { status: statusFilter } : undefined);
      setRows(Array.isArray(results) ? results : []);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadRows(); }, [statusFilter]);

  const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return safeRows.filter((row) => {
      const occurredDate = new Date(row.loggedAt);
      const fromDate = new Date(`${startDate}T00:00:00`);
      const toDate = new Date(`${endDate}T23:59:59`);

      const matchesQuery =
        !query ||
        row.returnId.toString().includes(query) ||
        row.orderId.toString().includes(query) ||
        row.branchName.toLowerCase().includes(query) ||
        (row.reason ?? '').toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        row.resolution.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || row.status === statusFilter;
      const matchesDateRange = occurredDate >= fromDate && occurredDate <= toDate;

      return matchesQuery && matchesStatus && matchesDateRange;
    });
  }, [endDate, statusFilter, safeRows, search, startDate]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime();
      if (sortBy === 'branch-asc') return a.branchName.localeCompare(b.branchName);
      if (sortBy === 'branch-desc') return b.branchName.localeCompare(a.branchName);
      return new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime();
    });
    return copy;
  }, [filteredRows, sortBy]);

  const columns: ColumnDef<ReturnRecord>[] = [
    {
      key: 'returnId',
      label: 'Return ID',
      width: 120,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#6B4C2A', fontFamily: 'monospace' }}>
          RT-{row.returnId}
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
      key: 'items',
      label: 'Items',
      width: 80,
      align: 'center',
      sortable: true,
      sortAccessor: (row) => row.items.length,
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.items.length}</Typography>,
    },
    {
      key: 'orderId',
      label: 'Order',
      width: 100,
      sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600 }}>#{row.orderId}</Typography>,
    },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      sortable: true,
      render: (row) => {
        const s = statusStyle(row.status);
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            <Chip
              label={row.status}
              size="small"
              sx={{ fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.color}28`, width: 'fit-content' }}
            />
            {/* Show resolution context if not pending */}
            {row.resolution !== 'Pending' && (
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{row.resolution}</Typography>
            )}
          </Box>
        );
      },
    },
    {
      key: 'loggedAt',
      label: 'Date Filed',
      width: 140,
      sortable: true,
      sortAccessor: (row) => new Date(row.loggedAt).getTime(),
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 110,
      align: 'right',
      render: (row) => (
        <Button
          size="small"
          variant="outlined"
          sx={{ height: 32, px: 1.4 }}
          onClick={() => navigate({ to: '/returns/$returnId', params: { returnId: String(row.returnId) } })}
        >
          Manage
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Returns"
              value={safeRows.length}
              icon={<AssignmentReturnRoundedIcon />}
              trend="up"
              trendValue="All time"
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Awaiting Action"
              value={safeRows.filter((r) => ACTIVE_STATUSES.has(r.status)).length}
              icon={<PendingActionsRoundedIcon />}
              trend="up"
              trendValue="In progress"
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="In Transit / Arrived"
              value={safeRows.filter((r) => r.status === 'Dispatched' || r.status === 'Arrived').length}
              icon={<LocalShippingRoundedIcon />}
              trend="up"
              trendValue="On the way"
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Completed"
              value={safeRows.filter((r) => r.status === 'Completed').length}
              icon={<TaskAltRoundedIcon />}
              trend="up"
              trendValue="Resolved"
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #4A7C59 0%, #8FBB9F 100%)"
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1.2, flexWrap: 'wrap' }}>
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search return ID, order, branch, status..."
          sx={{ minWidth: { xs: '100%', sm: 240, md: 300 }, maxWidth: { sm: 420 }, flexShrink: 1 }}
        />

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => { setStartDate(start); setEndDate(end); }}
        />

        <FilterDropdown
          label="Sort"
          icon={<SortRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={sortBy}
          onChange={(v) => setSortBy(v as SortOption)}
          minWidth={165}
          options={SORT_OPTIONS}
        />

        <FilterDropdown
          label="Status"
          icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={statusFilter}
          onChange={setStatusFilter}
          minWidth={160}
          options={STATUS_FILTER_OPTIONS}
        />

        <Button
          startIcon={<AssignmentReturnRoundedIcon />}
          onClick={() => navigate({ to: '/returns/new' })}
          sx={{ ml: { xs: 0, lg: 'auto' }, whiteSpace: 'nowrap' }}
        >
          File Return
        </Button>
      </Box>

      {error && (
        <Typography sx={{ color: 'error.main', fontSize: 12.5, mb: 1.2 }}>{error}</Typography>
      )}

      <DataTable
        data={sortedRows}
        columns={columns}
        keyExtractor={(row) => row.returnId.toString()}
        emptyTitle={search ? 'No matches found' : 'No return records yet'}
        emptyMessage={
          isLoading
            ? 'Loading returns...'
            : search
              ? "We couldn't find any returns matching your search."
              : 'There are no return requests logged in the system.'
        }
        emptyIcon={<AssignmentReturnRoundedIcon />}
        defaultRowsPerPage={10}
        pageSizes={[10, 25, 50]}
      />
    </Box>
  );
}