import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Grid, Typography } from '@mui/material';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { fetchReturns, type ReturnRecord } from '../branch-operations/api';
import { recordAuditLog } from '../audit-logs/auditLogStore';
import { resolutionStyle } from './resolutionStyle';

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

export function ReturnsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [resolutionFilter, setResolutionFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const loadRows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await fetchReturns(resolutionFilter || undefined);
      setRows(Array.isArray(results) ? results : []);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    recordAuditLog({
      action: 'ReturnsPageViewed',
      entityName: 'Return',
      entityId: 'list',
      details: 'Opened returns queue page.',
    });
    void loadRows();
  }, [resolutionFilter]);

  const safeRows = useMemo(() => {
    return Array.isArray(rows) ? rows : [];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeRows.filter((row) => {
      const matchesQuery =
        !query ||
        row.returnId.toString().includes(query) ||
        row.orderId.toString().includes(query) ||
        row.branchName.toLowerCase().includes(query) ||
        row.reason.toLowerCase().includes(query) ||
        row.resolution.toLowerCase().includes(query);

      const matchesResolution = !resolutionFilter || row.resolution === resolutionFilter;

      return matchesQuery && matchesResolution;
    });
  }, [resolutionFilter, safeRows, search]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((left, right) => {
      if (sortBy === 'oldest') {
        return new Date(left.loggedAt).getTime() - new Date(right.loggedAt).getTime();
      }

      if (sortBy === 'branch-asc') {
        return left.branchName.localeCompare(right.branchName);
      }

      if (sortBy === 'branch-desc') {
        return right.branchName.localeCompare(left.branchName);
      }

      return new Date(right.loggedAt).getTime() - new Date(left.loggedAt).getTime();
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
      key: 'orderId',
      label: 'Order',
      width: 100,
      sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600 }}>#{row.orderId}</Typography>,
    },
    {
      key: 'resolution',
      label: 'Status',
      width: 130,
      sortable: true,
      render: (row) => {
        const style = resolutionStyle(row.resolution);
        return (
          <Chip
            label={row.resolution}
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
      key: 'loggedAt',
      label: 'Date Requested',
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
      label: 'Actions',
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
      <Box sx={{ mb: 5 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Filed Returns"
              value={safeRows.length}
              icon={<AssignmentReturnRoundedIcon />}
              trend="up"
              trendValue="Queue"
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Pending Review"
              value={safeRows.filter((row) => row.resolution === 'Pending').length}
              icon={<PendingActionsRoundedIcon />}
              trend="up"
              trendValue="Needs action"
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Resolved"
              value={safeRows.filter((row) => row.resolution !== 'Pending').length}
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
              value={safeRows.filter((row) => row.resolution === 'Rejected').length}
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
          placeholder="Search return ID, order, branch, or reason..."
          sx={{ minWidth: 300, maxWidth: 420, flexShrink: 0 }}
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
          value={resolutionFilter}
          onChange={setResolutionFilter}
          minWidth={150}
          options={[
            { value: 'Pending', label: 'Pending' },
            { value: 'Credited', label: 'Credited' },
            { value: 'Replaced', label: 'Replaced' },
            { value: 'Rejected', label: 'Rejected' },
          ]}
        />

        <Button onClick={() => navigate({ to: '/returns/new' })} sx={{ flexShrink: 0 }}>
          File Return
        </Button>
      </Box>

      {error ? (
        <Typography sx={{ color: 'error.main', fontSize: 12.5, mb: 1.2 }}>{error}</Typography>
      ) : null}

      <DataTable
        data={sortedRows}
        columns={columns}
        keyExtractor={(row) => row.returnId.toString()}
        emptyMessage={isLoading ? 'Loading returns...' : 'No return records yet.'}
        defaultRowsPerPage={10}
        pageSizes={[10, 25, 50]}
      />
    </Box>
  );
}
