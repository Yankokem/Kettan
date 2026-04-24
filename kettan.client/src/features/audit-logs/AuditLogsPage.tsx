import { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import FeedRoundedIcon from '@mui/icons-material/FeedRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { Button } from '../../components/UI/Button';

interface AuditLogEntry {
  id: number;
  action: string;
  entityName: string;
  entityId: string | null;
  eventCategory: string;
  actorName: string;
  actorRole: string;
  tenantId: number | null;
  tenantName: string | null;
  occurredAt: string;
  ipAddress: string | null;
}

interface AuditLogResponse {
  totalCount: number;
  page: number;
  pageSize: number;
  data: AuditLogEntry[];
}

function actionStyle(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes('deleted') || normalized.includes('deactivat')) {
    return { color: '#B91C1C', bg: 'rgba(185,28,28,0.12)' };
  }

  if (normalized.includes('created') || normalized.includes('activat')) {
    return { color: '#047857', bg: 'rgba(4,120,87,0.12)' };
  }

  if (normalized.includes('updated')) {
    return { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' };
  }

  return { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' };
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
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('pageSize', '200');

      const res = await fetch(`/api/audit-logs?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data: AuditLogResponse = await res.json();
      setRows(data.data);
      setTotalCount(data.totalCount);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, startDate, endDate]);

  useEffect(() => { loadRows(); }, [loadRows]);

  const actionOptions = useMemo(() => {
    const actions = Array.from(new Set(rows.map((row) => row.action)));
    return actions.map((action) => ({ value: action, label: action }));
  }, [rows]);

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

      return new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();
    });

    return copy;
  }, [filteredRows, sortBy]);

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      key: 'occurredAt',
      label: 'Time',
      width: 170,
      sortable: true,
      sortAccessor: (row) => new Date(row.occurredAt).getTime(),
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.occurredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </Typography>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      width: 140,
      sortable: true,
      render: (row) => {
        const style = actionStyle(row.action);
        return (
          <Chip
            label={row.action}
            size="small"
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              bgcolor: style.bg,
              color: style.color,
              border: `1px solid ${style.color}2b`,
            }}
          />
        );
      },
    },
    {
      key: 'entityName',
      label: 'Entity',
      width: 160,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{`${row.entityName}${row.entityId ? ` #${row.entityId}` : ''}`}</Typography>
      ),
    },
    {
      key: 'actorName',
      label: 'Actor',
      width: 160,
      sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13 }}>{row.actorName}</Typography>,
    },
    {
      key: 'actorRole',
      label: 'Role',
      width: 140,
      sortable: true,
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.actorRole}</Typography>,
    },
    {
      key: 'tenantName',
      label: 'Tenant',
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.tenantName || 'Platform'}</Typography>,
    },
  ];

  const uniqueActors = new Set(rows.map((row) => row.actorName)).size;
  const createdEvents = rows.filter((row) => row.action === 'Created').length;
  const deletedEvents = rows.filter((row) => row.action === 'Deleted').length;

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
        <StatCard
          label="Total Events"
          value={totalCount}
          icon={<FeedRoundedIcon />}
          trend="up"
          trendValue="Tracked"
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Created Events"
          value={createdEvents}
          icon={<TaskAltRoundedIcon />}
          trend="up"
          trendValue="New records"
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Active Actors"
          value={uniqueActors}
          icon={<ManageAccountsRoundedIcon />}
          trend="up"
          trendValue="Users"
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Deleted Events"
          value={deletedEvents}
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
          flexWrap: 'nowrap',
          overflowX: 'auto',
          pb: 0.5,
        }}
      >
        <SearchInput
          placeholder="Search action, entity, actor..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: 280, maxWidth: 420, flexShrink: 0 }}
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
            { value: 'actor-asc', label: 'Actor A-Z' },
            { value: 'actor-desc', label: 'Actor Z-A' },
          ]}
        />

        <FilterDropdown
          label="Action"
          icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={actionFilter}
          onChange={setActionFilter}
          minWidth={160}
          options={actionOptions}
        />

        <FilterDropdown
          label="Role"
          icon={<ManageAccountsRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
          value={roleFilter}
          onChange={setRoleFilter}
          minWidth={150}
          options={roleOptions}
        />

        <Button onClick={loadRows} sx={{ flexShrink: 0, ml: 'auto' }}>
          Refresh Logs
        </Button>
      </Box>

      <DataTable
        data={sortedRows}
        columns={columns}
        keyExtractor={(row) => String(row.id)}
        defaultRowsPerPage={10}
        pageSizes={[10, 25, 50]}
        emptyTitle={search ? 'No matches found' : 'No audit logs yet'}
        emptyMessage={loading ? 'Loading audit logs…' : search ? 'We couldn\'t find any log entries matching your search.' : 'There are no activities recorded in the audit log for this period.'}
        emptyIcon={<FeedRoundedIcon />}
      />
    </Box>
  );
}
