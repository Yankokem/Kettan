import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../../utils/api';
import { Box, Typography, useTheme } from '@mui/material';
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
import { 
  humanizeRoute, 
  humanizeEntityAction, 
  parseChanges, 
  humanizeRequestDetails,
  type AuditLogEntry as UtilityAuditLogEntry
} from './utils/auditLogUtils';

// Update local interface to match utility if needed, or just use the utility one
type AuditLogEntry = UtilityAuditLogEntry;

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
  const theme = useTheme();
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

      const res = await api.get(`/api/audit-logs?${params}`);
      
      const data: AuditLogResponse = res.data;
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
      label: 'DATE AND TIME',
      width: '1.5fr',
      sortable: true,
      sortAccessor: (row) => new Date(row.occurredAt).getTime(),
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {new Date(row.occurredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </Typography>
      ),
    },
    {
      key: 'entityName',
      label: 'Event',
      width: '4fr',
      sortable: true,
      render: (row) => {
        const isRequest = row.action === 'HttpRequest' || row.entityName === 'Request';
        const title = isRequest 
          ? humanizeRoute(row.route || '', row.httpMethod || 'GET')
          : humanizeEntityAction(row.action, row.entityName, row.entityId);
        
        const style = actionStyle(row.action);

        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: 'text.primary', letterSpacing: '0.01em' }}>
                {title}
              </Typography>
              {!isRequest && (
                <Typography 
                  sx={{ 
                    fontSize: 10, 
                    fontWeight: 800, 
                    color: style.color,
                    backgroundColor: style.bg,
                    px: 0.6,
                    py: 0.1,
                    borderRadius: 0.5,
                    textTransform: 'uppercase'
                  }}
                >
                  {row.action}
                </Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.3, fontWeight: 500, opacity: 0.8 }}>
              {row.eventCategory} • {row.module || 'General'}
            </Typography>
          </Box>
        );
      },
    },
    {
      key: 'context',
      label: 'Context & Changes',
      width: '4fr',
      sortable: false,
      render: (row) => {
        const changes = parseChanges(row.oldValues || null, row.newValues || null);
        
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, py: 0.8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <Typography 
                 sx={{ 
                   fontSize: 11, 
                   fontWeight: 800, 
                   px: 0.8, 
                   py: 0.2, 
                   borderRadius: 1,
                   backgroundColor: row.outcome === 'Success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                   color: row.outcome === 'Success' ? 'success.main' : 'error.main',
                   textTransform: 'uppercase'
                 }}
               >
                 {row.outcome || 'Unknown'}
               </Typography>
               {row.outcome !== 'Success' && row.errorMessage && (
                 <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'error.main', opacity: 0.8 }}>
                   {row.errorCode ? `[${row.errorCode}] ` : ''}{row.errorMessage}
                 </Typography>
               )}
               {row.statusCode && (
                 <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.disabled' }}>
                   HTTP {row.statusCode}
                 </Typography>
               )}
            </Box>

            {changes.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mt: 0.5 }}>
                {changes.slice(0, 3).map((change, idx) => (
                  <Typography key={idx} sx={{ fontSize: 11.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{change.field}:</Box>
                    {change.oldValue !== null && (
                      <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.6 }}>{String(change.oldValue)}</Box>
                    )}
                    {change.oldValue !== null && <Box component="span">→</Box>}
                    <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>{String(change.newValue)}</Box>
                  </Typography>
                ))}
                {changes.length > 3 && (
                  <Typography sx={{ fontSize: 10, color: 'text.disabled', fontStyle: 'italic' }}>
                    + {changes.length - 3} more changes
                  </Typography>
                )}
              </Box>
            ) : row.route ? (
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 400, opacity: 0.9 }}>
                {humanizeRequestDetails(row)}
              </Typography>
            ) : null}
          </Box>
        );
      },
    },
    {
      key: 'actorName',
      label: 'User',
      width: '2fr',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary' }}>
          {row.actorName}
        </Typography>
      ),
    },
    {
      key: 'actorRole',
      label: 'Role',
      width: '1.2fr',
      sortable: true,
      render: (row) => {
        const roleStyle = theme.custom.roles[row.actorRole] || { text: theme.palette.text.secondary };
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: roleStyle.text }}>
            {row.actorRole}
          </Typography>
        );
      },
    },
  ];

  const uniqueActors = new Set(rows.map((row) => row.actorName)).size;
  const createdEvents = rows.filter((row) => row.action === 'Created').length;
  const archiveInactiveEvents = rows.filter((row) => 
    row.action.toLowerCase().includes('delete') || 
    row.action.toLowerCase().includes('archive') || 
    row.action.toLowerCase().includes('inactivate') ||
    row.action.toLowerCase().includes('deactivate')
  ).length;

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
          label="Active Users"
          value={uniqueActors}
          icon={<ManageAccountsRoundedIcon />}
          trend="up"
          trendValue="Users"
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Archive/Inactive Events"
          value={archiveInactiveEvents}
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
