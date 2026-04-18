import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Grid, Paper, Typography } from '@mui/material';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { useAuthStore } from '../../store/useAuthStore';
import {
  fetchConsumptionLogs,
  type ConsumptionLog,
} from '../branch-operations/api';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

type SortOption = 'newest' | 'oldest' | 'method-asc' | 'method-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'method-asc', label: 'Method A-Z' },
  { value: 'method-desc', label: 'Method Z-A' },
];

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

function methodChipStyle(method: string) {
  if (method.toLowerCase() === 'sales') {
    return { color: '#2563EB', bg: 'rgba(37,99,235,0.10)', border: 'rgba(37,99,235,0.25)' };
  }

  return { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)', border: 'rgba(107,76,42,0.25)' };
}

export function ConsumptionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role ?? '';
  const isBranchManager = role === 'BranchManager';
  const isBranchOwner = role === 'BranchOwner';
  const canViewPage = isBranchManager || isBranchOwner;
  const canCreateRequests = isBranchManager;

  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rows = await fetchConsumptionLogs({
        from: startDate,
        to: endDate,
        method: methodFilter || undefined,
      });
      setLogs(rows);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, [endDate, methodFilter, startDate]);

  const safeRows = useMemo(() => {
    return Array.isArray(logs) ? logs : [];
  }, [logs]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeRows.filter((log) => {
      const occurredDate = new Date(log.logDate);
      const fromDate = new Date(`${startDate}T00:00:00`);
      const toDate = new Date(`${endDate}T23:59:59`);
      const method = (log.method ?? '').toLowerCase();

      const matchesMethod = !methodFilter || method === methodFilter.toLowerCase();
      const matchesDateRange = occurredDate >= fromDate && occurredDate <= toDate;
      const matchesQuery =
        !query ||
        (
          log.consumptionLogId.toString().includes(query) ||
          method.includes(query) ||
          (log.shift ?? '').toLowerCase().includes(query) ||
          (log.remarks ?? '').toLowerCase().includes(query)
        );

      return matchesMethod && matchesDateRange && matchesQuery;
    });
  }, [endDate, methodFilter, safeRows, search, startDate]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];

    copy.sort((left, right) => {
      if (sortBy === 'oldest') {
        return new Date(left.logDate).getTime() - new Date(right.logDate).getTime();
      }

      if (sortBy === 'method-asc') {
        return left.method.localeCompare(right.method);
      }

      if (sortBy === 'method-desc') {
        return right.method.localeCompare(left.method);
      }

      return new Date(right.logDate).getTime() - new Date(left.logDate).getTime();
    });

    return copy;
  }, [filteredRows, sortBy]);

  const columns: ColumnDef<ConsumptionLog>[] = [
    {
      key: 'consumptionLogId',
      label: 'Log ID',
      width: 110,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          CL-{row.consumptionLogId}
        </Typography>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      width: 130,
      sortable: true,
      render: (row) => {
        const style = methodChipStyle(row.method);
        const isSales = row.method.toLowerCase() === 'sales';
        return (
          <Chip
            icon={isSales ? <LocalCafeRoundedIcon sx={{ fontSize: 15 }} /> : <PrecisionManufacturingRoundedIcon sx={{ fontSize: 15 }} />}
            label={row.method}
            size="small"
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: style.color,
              bgcolor: style.bg,
              border: `1px solid ${style.border}`,
            }}
          />
        );
      },
    },
    {
      key: 'shift',
      label: 'Shift',
      width: 100,
      render: (row) => <Typography sx={{ fontSize: 13 }}>{row.shift ?? '--'}</Typography>,
    },
    {
      key: 'remarks',
      label: 'Remarks',
      sortable: true,
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.remarks || '--'}</Typography>,
    },
    {
      key: 'logDate',
      label: 'Log Date',
      width: 140,
      sortable: true,
      sortAccessor: (row) => new Date(row.logDate).getTime(),
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.logDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      ),
    },
  ];

  if (!canViewPage) {
    return (
      <Box sx={{ pb: 3, pt: 1 }}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 0.5 }}>Consumption Logging</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            This module is available for Branch Manager and Branch Owner only.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const todayToken = new Date().toISOString().slice(0, 10);

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 5 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Logged Transactions"
              value={safeRows.length}
              icon={<ScaleRoundedIcon />}
              trend="up"
              trendValue="Queue"
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Direct Consumption"
              value={safeRows.filter((row) => row.method.toLowerCase() === 'direct').length}
              icon={<PrecisionManufacturingRoundedIcon />}
              trend="up"
              trendValue="Manual"
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Sales Consumption"
              value={safeRows.filter((row) => row.method.toLowerCase() === 'sales').length}
              icon={<LocalCafeRoundedIcon />}
              trend="up"
              trendValue="Auto"
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Today"
              value={safeRows.filter((row) => row.logDate.slice(0, 10) === todayToken).length}
              icon={<TodayRoundedIcon />}
              trend="up"
              trendValue="Current day"
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
          placeholder="Search log ID, method, shift, or remarks..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
          label="Method"
          icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={methodFilter}
          onChange={setMethodFilter}
          minWidth={165}
          options={[
            { value: 'Direct', label: 'Direct' },
            { value: 'Sales', label: 'Sales' },
          ]}
        />

        <Button
          startIcon={<AddRoundedIcon />}
          sx={{ flexShrink: 0, ml: 'auto' }}
          onClick={() => navigate({ to: '/consumption/new' })}
          disabled={!canCreateRequests}
        >
          Add Consumption
        </Button>
      </Box>

      {!canCreateRequests ? (
        <Paper sx={{ p: 1.35, mb: 1.2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Branch Owner can view consumption history, but only Branch Manager can submit consumption logs.
          </Typography>
        </Paper>
      ) : null}

      {error ? (
        <Typography sx={{ color: 'error.main', fontSize: 12.5, mb: 1.2 }}>{error}</Typography>
      ) : null}

      <DataTable
        data={sortedRows}
        columns={columns}
        keyExtractor={(row) => row.consumptionLogId.toString()}
        emptyMessage={isLoading ? 'Loading logs...' : 'No consumption logs yet.'}
        defaultRowsPerPage={10}
        pageSizes={[10, 25, 50]}
      />
    </Box>
  );
}
