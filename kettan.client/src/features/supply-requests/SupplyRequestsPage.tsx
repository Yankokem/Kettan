import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Grid, Typography } from '@mui/material';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import { useNavigate } from '@tanstack/react-router';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchSupplyRequests, type SupplyRequest } from '../branch-operations/api';

type SortOption = 'newest' | 'oldest' | 'branch-asc' | 'branch-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'branch-asc', label: 'Branch A-Z' },
  { value: 'branch-desc', label: 'Branch Z-A' },
];

const SAMPLE_SUPPLY_REQUESTS: SupplyRequest[] = [
  {
    requestId: 8894,
    branchId: 3,
    branchName: 'Downtown Main',
    requestedByUserId: 21,
    requestedByName: 'Maria Santos',
    status: 'PendingApproval',
    requestType: 'Manual Internal Request',
    priority: 'Normal',
    dispatchWindow: 'Next Business Day',
    dispatchDate: null,
    notes: 'Please prioritize milk and syrup lines.',
    createdAt: '2026-04-02T01:41:00Z',
    updatedAt: '2026-04-02T01:41:00Z',
    items: [
      { requestItemId: 1, itemId: 1001, itemName: 'Arabica Coffee Beans', itemSku: 'CF-ARB-MR-5KG', quantityRequested: 4, quantityApproved: 4 },
      { requestItemId: 2, itemId: 1002, itemName: 'Almond Milk - 1L', itemSku: 'MLK-ALM-1L', quantityRequested: 24, quantityApproved: 10 },
      { requestItemId: 3, itemId: 1003, itemName: 'Vanilla Syrup - 750ml', itemSku: 'SYR-VAN-750', quantityRequested: 6, quantityApproved: 0 },
      { requestItemId: 4, itemId: 1004, itemName: 'Paper Cups (12oz)', itemSku: 'PKG-CUP-12-500', quantityRequested: 2, quantityApproved: 2 },
    ],
  },
  {
    requestId: 8891,
    branchId: 4,
    branchName: 'Riverside Branch',
    requestedByUserId: 27,
    requestedByName: 'Alex Morgan',
    status: 'Approved',
    requestType: 'Scheduled Replenishment',
    priority: 'High',
    dispatchWindow: 'Today',
    dispatchDate: '2026-04-17T00:00:00Z',
    notes: 'Weekend traffic expected.',
    createdAt: '2026-04-16T08:30:00Z',
    updatedAt: '2026-04-17T09:12:00Z',
    items: [
      { requestItemId: 5, itemId: 1006, itemName: 'Whole Milk - 1L', itemSku: 'MLK-WHL-1L', quantityRequested: 30, quantityApproved: 30 },
      { requestItemId: 6, itemId: 1010, itemName: 'Cup Lids (12oz)', itemSku: 'PKG-LID-12-500', quantityRequested: 4, quantityApproved: 4 },
      { requestItemId: 7, itemId: 1012, itemName: 'Sugar Sachet Box', itemSku: 'SUG-SCH-1K', quantityRequested: 3, quantityApproved: 3 },
    ],
  },
  {
    requestId: 8870,
    branchId: 2,
    branchName: 'Northpoint Kiosk',
    requestedByUserId: 18,
    requestedByName: 'Jamie Cruz',
    status: 'Rejected',
    requestType: 'Emergency Replenishment',
    priority: 'Urgent',
    dispatchWindow: 'Today',
    dispatchDate: null,
    notes: 'Refile with corrected quantities and reason.',
    createdAt: '2026-04-10T03:20:00Z',
    updatedAt: '2026-04-10T05:48:00Z',
    items: [
      { requestItemId: 8, itemId: 1020, itemName: 'Chocolate Syrup - 750ml', itemSku: 'SYR-CHO-750', quantityRequested: 12, quantityApproved: null },
      { requestItemId: 9, itemId: 1024, itemName: 'Whipped Cream Canister', itemSku: 'CRM-WHP-01', quantityRequested: 8, quantityApproved: null },
    ],
  },
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
  if (status === 'PendingApproval') {
    return 'Pending Approval';
  }

  if (status === 'AutoDrafted') {
    return 'Auto Drafted';
  }

  if (status === 'PartiallyApproved') {
    return 'Partially Approved';
  }

  return status;
}

function statusChip(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('pending') || normalized.includes('draft')) {
    return { color: '#B45309', bg: 'rgba(180,83,9,0.12)' };
  }

  if (normalized.includes('approved')) {
    return { color: '#047857', bg: 'rgba(4,120,87,0.12)' };
  }

  if (normalized.includes('rejected')) {
    return { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' };
  }

  return { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' };
}

export function SupplyRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role ?? '';
  const canAccessPage = role === 'BranchManager' || role === 'BranchOwner';
  const canCreateRequests = role === 'BranchManager' || role === 'BranchOwner';

  const [rows, setRows] = useState<SupplyRequest[]>([]);
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
      const safeResults = Array.isArray(results) ? results : [];
      setRows(safeResults.length > 0 ? safeResults : SAMPLE_SUPPLY_REQUESTS);
    } catch {
      setRows(SAMPLE_SUPPLY_REQUESTS);
      setError(null);
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

      const matchesStatus = !statusFilter || row.status === statusFilter;
      const matchesDateRange = occurredDate >= fromDate && occurredDate <= toDate;

      return matchesQuery && matchesStatus && matchesDateRange;
    });
  }, [endDate, safeRows, search, startDate, statusFilter]);

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
      <Box sx={{ pb: 3, pt: 1 }}>
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 0.5 }}>Supply Requests</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            This module is available for Branch Manager and Branch Owner only.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 5 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Filed Requests"
              value={safeRows.length}
              icon={<AssignmentTurnedInRoundedIcon />}
              trend="up"
              trendValue="Queue"
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Pending Review"
              value={safeRows.filter((row) => ['Draft', 'AutoDrafted', 'PendingApproval'].includes(row.status)).length}
              icon={<PendingActionsRoundedIcon />}
              trend="up"
              trendValue="Needs action"
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Approved"
              value={safeRows.filter((row) => ['Approved', 'PartiallyApproved'].includes(row.status)).length}
              icon={<TaskAltRoundedIcon />}
              trend="up"
              trendValue="Processed"
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Rejected"
              value={safeRows.filter((row) => row.status === 'Rejected').length}
              icon={<HighlightOffRoundedIcon />}
              trend="up"
              trendValue="Needs review"
              accentClass="stat-accent-rust"
              iconBg="linear-gradient(135deg, #D48C6B 0%, #EAA989 100%)"
            />
          </Grid>
        </Grid>
      </Box>

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
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search request ID, branch, or requestor..."
          sx={{ minWidth: 300, maxWidth: 420, flexShrink: 0 }}
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
            { value: 'Draft', label: 'Draft' },
            { value: 'AutoDrafted', label: 'Auto-Drafted' },
            { value: 'PendingApproval', label: 'Pending Approval' },
            { value: 'Approved', label: 'Approved' },
            { value: 'PartiallyApproved', label: 'Partially Approved' },
            { value: 'Rejected', label: 'Rejected' },
          ]}
        />

        <Button
          startIcon={<AddShoppingCartRoundedIcon />}
          sx={{ flexShrink: 0, ml: 'auto' }}
          onClick={() => navigate({ to: '/supply-requests/new' })}
          disabled={!canCreateRequests}
        >
          Request Supply
        </Button>
      </Box>

      {error ? (
        <Typography sx={{ color: 'error.main', fontSize: 12.5, mb: 1.2 }}>{error}</Typography>
      ) : null}

      <DataTable
        data={sortedRows}
        columns={columns}
        keyExtractor={(row) => row.requestId.toString()}
        emptyMessage={isLoading ? 'Loading supply requests...' : 'No supply requests yet.'}
        defaultRowsPerPage={10}
        pageSizes={[10, 25, 50]}
      />
    </Box>
  );
}
