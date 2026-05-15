import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Chip, Grid, Paper, Typography, Tooltip, Stack, Divider } from '@mui/material';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
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

type SortOption = 'newest' | 'oldest';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
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
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rows = await fetchConsumptionLogs({
        from: startDate,
        to: endDate,
        method: 'Sales',
      });
      setLogs(rows);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [endDate, startDate]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const safeRows = useMemo(() => {
    return Array.isArray(logs) ? logs : [];
  }, [logs]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeRows.filter((log) => {
      const occurredDate = new Date(log.logDate);
      const fromDate = new Date(`${startDate}T00:00:00`);
      const toDate = new Date(`${endDate}T23:59:59`);

      const matchesDateRange = occurredDate >= fromDate && occurredDate <= toDate;
      const matchesQuery =
        !query ||
        (
          log.consumptionLogId.toString().includes(query) ||
          (log.remarks ?? '').toLowerCase().includes(query)
        );

      return matchesDateRange && matchesQuery;
    });
  }, [endDate, safeRows, search, startDate]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];

    copy.sort((left, right) => {
      if (sortBy === 'oldest') {
        return new Date(left.logDate).getTime() - new Date(right.logDate).getTime();
      }

      return new Date(right.logDate).getTime() - new Date(left.logDate).getTime();
    });

    return copy;
  }, [filteredRows, sortBy]);

  const columns: ColumnDef<ConsumptionLog>[] = [
    {
      key: 'consumptionLogId',
      label: 'LOG ID',
      width: 110,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          CL-{row.consumptionLogId}
        </Typography>
      ),
    },
    {
      key: 'loggedByName',
      label: 'LOGGED BY',
      width: 150,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountCircleRoundedIcon sx={{ fontSize: 18, color: '#8C6B43' }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
            {row.loggedByName || 'System'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'itemsCount',
      label: 'ITEMS',
      width: 100,
      render: (row) => (
        <Tooltip
          title={
            <Box sx={{ p: 1, minWidth: 160, maxWidth: 240 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 1, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                Included Items
              </Typography>
              <Stack
                divider={<Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}
                spacing={0.8}
                sx={{ 
                  maxHeight: 180, 
                  overflowY: 'auto',
                  pr: 0.5,
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }
                }}
              >
                {row.summaryItems?.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography sx={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{item.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
                      {item.quantity}
                    </Typography>
                  </Box>
                ))}
                {(!row.summaryItems || row.summaryItems.length === 0) && (
                  <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                    No items listed
                  </Typography>
                )}
              </Stack>
            </Box>
          }
          arrow
          placement="top"
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
              {row.itemsCount ?? 0}
            </Typography>
            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
          </Box>
        </Tooltip>
      ),
    },
    {
      key: 'totalQuantity',
      label: 'TOTAL QTY',
      width: 120,
      align: 'center',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#2E7D32' }}>
          {row.totalQuantity?.toFixed(1) ?? '0.0'}
        </Typography>
      ),
    },
    {
      key: 'remarks',
      label: 'REMARKS',
      sortable: true,
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.remarks || '--'}</Typography>,
    },
    {
      key: 'logDate',
      label: 'LOG DATE & TIME',
      width: 200,
      sortable: true,
      sortAccessor: (row) => new Date(row.logDate).getTime(),
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.logDate).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </Typography>
      ),
    },
  ];

  if (!canViewPage) {
    return (
      <Box sx={{ pb: 3 }}>
        <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
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
      <Box sx={{ mb: 4 }}>
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
              label="Sales Logs"
              value={safeRows.filter((row) => row.method.toLowerCase() === 'sales').length}
              icon={<LocalCafeRoundedIcon />}
              trend="up"
              trendValue="POS bridge"
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Items Logged"
              value={isLoading ? '...' : 'Data Set'}
              icon={<ScaleRoundedIcon />}
              trend="neutral"
              trendValue="Recorded"
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
          placeholder="Search log ID or remarks..."
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


        <Button
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate({ to: '/consumption/new' })}
          sx={{ 
            flexShrink: 0, 
            ml: 'auto',
            display: canCreateRequests ? 'inline-flex' : 'none' 
          }}
        >
          Add Consumption
        </Button>
      </Box>


      {error ? (
        <Typography sx={{ color: 'error.main', fontSize: 12.5, mb: 1.2 }}>{error}</Typography>
      ) : null}

      <DataTable
        data={sortedRows}
        columns={columns}
        keyExtractor={(row) => row.consumptionLogId.toString()}
        emptyTitle={search ? 'No matches found' : 'No consumption logs yet'}
        emptyMessage={isLoading ? 'Loading logs...' : search ? 'We couldn\'t find any consumption logs matching your search.' : 'There are no consumption logs recorded for this period.'}
        emptyIcon={<ScaleRoundedIcon />}
        defaultRowsPerPage={10}
        pageSizes={[10, 25, 50]}
      />
    </Box>
  );
}
