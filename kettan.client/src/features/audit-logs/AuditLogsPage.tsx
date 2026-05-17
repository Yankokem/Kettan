import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api } from '../../utils/api';
import { Box, Typography, useTheme, Chip } from '@mui/material';
import FeedRoundedIcon from '@mui/icons-material/FeedRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { Button } from '../../components/UI/Button';
import { 
  buildEventDescription,
  type AuditLogEntry
} from './utils/auditLogUtils';
import { fetchAuditStats, type AuditStatsDto } from '../reports/reportsApi';

interface AuditLogResponse {
  totalCount: number;
  page: number;
  pageSize: number;
  data: AuditLogEntry[];
}

function getActionIcon(action: string) {
  switch (action) {
    case 'Created': return <AddCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />;
    case 'Updated': return <EditRoundedIcon sx={{ fontSize: 16 }} />;
    case 'Deleted': return <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />;
    default: return <FeedRoundedIcon sx={{ fontSize: 16 }} />;
  }
}

function getActionChipColor(action: string): 'success' | 'primary' | 'error' | 'default' {
  switch (action) {
    case 'Created': return 'success';
    case 'Updated': return 'primary';
    case 'Deleted': return 'error';
    default: return 'default';
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

export function AuditLogsPage() {
  const theme = useTheme();
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());
  const [page] = useState(1);
  const [pageSize] = useState(25);
  const [auditStats, setAuditStats] = useState<AuditStatsDto | null>(null);
  const fetching = useRef(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const loadRows = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (actionFilter) params.set('action', actionFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await api.get(`/api/audit-logs?${params}`);
      
      const data: AuditLogResponse = res.data;
      setRows(data.data);
      setTotalCount(data.totalCount);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
      fetching.current = false;
    }
  }, [debouncedSearch, actionFilter, startDate, endDate, page, pageSize]);

  useEffect(() => { loadRows(); }, [loadRows]);

  useEffect(() => {
    fetchAuditStats()
      .then(setAuditStats)
      .catch(err => console.error('Failed to load audit stats:', err));
  }, []);

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(rows.map((row) => row.actorRole)));
    return roles.map((role) => ({ value: role, label: role }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (roleFilter) {
      result = result.filter((row) => row.actorRole === roleFilter);
    }
    return result;
  }, [rows, roleFilter]);

  const sortedRows = useMemo(() => {
    if (sortBy === 'newest') return filteredRows;

    const copy = [...filteredRows];

    copy.sort((left, right) => {
      if (sortBy === 'oldest') {
        return new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime();
      }

      if (sortBy === 'actor-asc') {
        return left.actorName.localeCompare(right.actorName);
      }

      if (sortBy === 'actor-desc') {
        return right.actorName.localeCompare(left.actorName);
      }

      return 0;
    });

    return copy;
  }, [filteredRows, sortBy]);

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      key: 'occurredAt',
      label: 'DATE & TIME',
      width: '1.2fr',
      sortable: true,
      sortAccessor: (row) => new Date(row.occurredAt).getTime(),
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {new Date(row.occurredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </Typography>
      ),
    },
    {
      key: 'actorName',
      label: 'USER',
      width: '1.3fr',
      sortable: true,
      render: (row) => {
        const roleStyle = theme.custom?.roles?.[row.actorRole] || { text: theme.palette.text.secondary };
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
              {row.actorName}
            </Typography>
            <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: roleStyle.text, opacity: 0.85 }}>
              {row.actorRole}
            </Typography>
          </Box>
        );
      },
    },
    {
      key: 'event',
      label: 'EVENT',
      width: '4.5fr',
      sortable: false,
      render: (row) => {
        const description = buildEventDescription(row);
        return (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
            <Chip
              icon={getActionIcon(row.action)}
              label={row.action}
              color={getActionChipColor(row.action)}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: 11, 
                fontWeight: 600, 
                height: 24,
                mt: 0.2,
                flexShrink: 0,
                '& .MuiChip-icon': { fontSize: 14 }
              }}
            />
            <Typography sx={{ 
              fontSize: 13, 
              fontWeight: 500, 
              color: 'text.primary', 
              lineHeight: 1.55,
              wordBreak: 'break-word'
            }}>
              {description}
            </Typography>
          </Box>
        );
      },
    },
  ];

  const uniqueActors = new Set(rows.map((row) => row.actorName)).size;
  const createdEvents = rows.filter((row) => row.action === 'Created').length;
  const archiveInactiveEvents = rows.filter((row) => row.action === 'Deleted').length;

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
        <StatCard
          label="Total Events"
          value={auditStats?.totalEvents.currentValue ?? totalCount}
          icon={<FeedRoundedIcon />}
          trend={auditStats?.totalEvents.trend ?? 'up'}
          trendValue={`${auditStats?.totalEvents.percentageChange ?? 0}% vs last week`}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Created Events"
          value={auditStats?.createdEvents.currentValue ?? createdEvents}
          icon={<TaskAltRoundedIcon />}
          trend={auditStats?.createdEvents.trend ?? 'up'}
          trendValue={`${auditStats?.createdEvents.percentageChange ?? 0}% vs last week`}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Active Users"
          value={auditStats?.activeUsers.currentValue ?? uniqueActors}
          icon={<ManageAccountsRoundedIcon />}
          trend={auditStats?.activeUsers.trend ?? 'up'}
          trendValue={`${auditStats?.activeUsers.percentageChange ?? 0}% vs last week`}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Deleted Events"
          value={auditStats?.archivalEvents.currentValue ?? archiveInactiveEvents}
          icon={<HighlightOffRoundedIcon />}
          trend={auditStats?.archivalEvents.trend ?? 'up'}
          trendValue={`${auditStats?.archivalEvents.percentageChange ?? 0}% vs last week`}
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
          placeholder="Search entity, action, user..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ 
            minWidth: { xs: '100%', sm: 280 }, 
            maxWidth: { sm: 420 }, 
            flexShrink: 1 
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
          onChange={setSortBy}
          minWidth={160}
          options={[
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
            { value: 'actor-asc', label: 'User A-Z' },
            { value: 'actor-desc', label: 'User Z-A' },
          ]}
        />

        <FilterDropdown
          label="Action"
          icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={actionFilter}
          onChange={setActionFilter}
          minWidth={160}
          options={[
            { value: 'Created', label: 'Created' },
            { value: 'Updated', label: 'Updated' },
            { value: 'Deleted', label: 'Deleted' },
          ]}
        />

        <FilterDropdown
          label="Role"
          icon={<ManageAccountsRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={roleFilter}
          onChange={setRoleFilter}
          minWidth={150}
          options={roleOptions}
        />

        <Button onClick={loadRows} sx={{ flexShrink: 0, ml: { xs: 0, lg: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
          Refresh Logs
        </Button>
      </Box>

      <DataTable
        data={sortedRows}
        columns={columns}
        keyExtractor={(row) => String(row.id)}
        defaultRowsPerPage={25}
        pageSizes={[10, 25, 50]}
        emptyTitle={search ? 'No matches found' : 'No audit logs yet'}
        emptyMessage={loading ? 'Loading audit logs…' : search ? 'We couldn\'t find any log entries matching your search.' : 'There are no activities recorded in the audit log for this period.'}
        emptyIcon={<FeedRoundedIcon />}
      />
    </Box>
  );
}
