import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import FeedRoundedIcon from '@mui/icons-material/FeedRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { Dropdown } from '../../components/UI/Dropdown';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { Button } from '../../components/UI/Button';
import { listAuditLogs, recordAuditLog, type AuditLogEntry } from './auditLogStore';

function actionStyle(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes('rejected')) {
    return { color: '#B91C1C', bg: 'rgba(185,28,28,0.12)' };
  }

  if (normalized.includes('resolved')) {
    return { color: '#047857', bg: 'rgba(4,120,87,0.12)' };
  }

  if (normalized.includes('viewed')) {
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
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());

  const loadRows = () => {
    setRows(listAuditLogs());
  };

  useEffect(() => {
    recordAuditLog({
      action: 'AuditLogsViewed',
      entityName: 'AuditLog',
      entityId: 'page',
      details: 'Opened audit logs page.',
    });
    loadRows();
  }, []);

  const actionOptions = useMemo(() => {
    const actions = Array.from(new Set(rows.map((row) => row.action)));
    return [
      { value: '', label: 'All Actions' },
      ...actions.map((action) => ({ value: action, label: action })),
    ];
  }, [rows]);

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(rows.map((row) => row.actorRole)));
    return [
      { value: '', label: 'All Roles' },
      ...roles.map((role) => ({ value: role, label: role })),
    ];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const occurredDate = new Date(row.occurredAt);
      const fromDate = new Date(`${startDate}T00:00:00`);
      const toDate = new Date(`${endDate}T23:59:59`);

      const matchesQuery =
        !query ||
        row.id.toLowerCase().includes(query) ||
        row.action.toLowerCase().includes(query) ||
        row.entityName.toLowerCase().includes(query) ||
        row.entityId.toLowerCase().includes(query) ||
        row.actorName.toLowerCase().includes(query) ||
        row.actorRole.toLowerCase().includes(query) ||
        row.details.toLowerCase().includes(query);

      const matchesAction = !actionFilter || row.action === actionFilter;
      const matchesRole = !roleFilter || row.actorRole === roleFilter;
      const matchesDateRange = occurredDate >= fromDate && occurredDate <= toDate;

      return matchesQuery && matchesAction && matchesRole && matchesDateRange;
    });
  }, [actionFilter, endDate, roleFilter, rows, search, startDate]);

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
      width: 160,
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
      width: 130,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{`${row.entityName} #${row.entityId}`}</Typography>
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
      key: 'details',
      label: 'Details',
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.details}</Typography>,
    },
  ];

  const totalEvents = rows.length;
  const uniqueActors = new Set(rows.map((row) => row.actorName)).size;
  const returnEvents = rows.filter((row) => row.entityName === 'Return').length;
  const rejectedEvents = rows.filter((row) => row.action === 'ReturnRejected').length;

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <StatCard
          label="Total Events"
          value={totalEvents}
          icon={<FeedRoundedIcon />}
          trend="up"
          trendValue="Tracked"
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Return Events"
          value={returnEvents}
          icon={<TaskAltRoundedIcon />}
          trend="up"
          trendValue="Lifecycle"
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
          label="Rejected Events"
          value={rejectedEvents}
          icon={<HighlightOffRoundedIcon />}
          trend="up"
          trendValue="Needs review"
          accentClass="stat-accent-rust"
          iconBg="linear-gradient(135deg, #D48C6B 0%, #EAA989 100%)"
        />
      </Box>

      <DataTable
        title="Audit Logs"
        data={filteredRows}
        columns={columns}
        keyExtractor={(row) => row.id}
        defaultRowsPerPage={10}
        pageSizes={[10, 25, 50]}
        emptyMessage="No audit logs for the selected filters."
        toolbar={
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '2fr 1fr 1fr auto auto' }, gap: 1.2, alignItems: 'center' }}>
            <SearchInput
              placeholder="Search action, entity, actor, details..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 240 }}
            />
            <Dropdown
              value={actionFilter}
              onChange={(event) => setActionFilter(String(event.target.value))}
              options={actionOptions}
            />
            <Dropdown
              value={roleFilter}
              onChange={(event) => setRoleFilter(String(event.target.value))}
              options={roleOptions}
            />
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
            <Button onClick={loadRows}>
              Refresh Logs
            </Button>
          </Box>
        }
      />
    </Box>
  );
}
