import { useEffect, useMemo, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { Box, Grid, Typography } from '@mui/material';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';

import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, List, ListItem, Divider } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { SearchInput } from '../../components/UI/SearchInput';
import { StatCard } from '../../components/UI/StatCard';
import { fetchReturns, type ReturnRecord } from '../branch-operations/api';
import { fetchReturnStats, type ReturnStatsDto, type StatMetricDto } from '../reports/reportsApi';
import { useAuthStore } from '../../store/useAuthStore';

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

function statusColor(status: string): string {
  switch (status) {
    case 'Draft':        return '#757575';
    case 'Submitted':    return '#D97706'; // Smooth Amber
    case 'Acknowledged': return '#0288D1'; // Light Blue
    case 'Dispatched':   return '#43A047'; // Green
    case 'Arrived':      return '#8C6B43'; // Muted Brown
    case 'Inspecting':   return '#AF52DE'; // Purple
    case 'Completed':    return '#2E7D32'; // Deep Green
    case 'Rejected':     return '#D32F2F'; // Red
    default:             return '#6B7280';
  }
}

function formatPeso(value: number): string {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatScheduleStatus(status?: string | null): string {
  switch (status) {
    case 'DueToday':    return 'Due Today';
    case 'NoSchedule':  return 'No Schedule';
    case 'OnTime':      return 'On Time';
    default:            return status || 'No Schedule';
  }
}

function scheduleColor(status?: string | null): string {
  if (status === 'Late') return '#D32F2F';
  if (status === 'DueToday') return '#ED6C02';
  if (status === 'OnTime') return '#2E7D32';
  if (status === 'Scheduled') return '#0288D1';
  return '#6B7280';
}

function ActionsMenu({ row }: { row: ReturnRecord }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton size="small" onClick={handleClick} sx={{ color: 'text.secondary' }}>
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <MenuItem onClick={() => { handleClose(); navigate({ to: '/returns/$returnId', params: { returnId: String(row.returnId) } }); }}>
          <ListItemIcon><VisibilityRoundedIcon fontSize="small" sx={{ color: '#3B82F6' }} /></ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: '#3B82F6' }} />
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); }}>
          <ListItemIcon><OpenInNewRoundedIcon fontSize="small" sx={{ color: '#16A34A' }} /></ListItemIcon>
          <ListItemText primary="View Linked Order" primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: '#16A34A' }} />
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { handleClose(); navigator.clipboard.writeText((row.transactionCode || `RT-${row.returnId}`).replace(/^[A-Z]+-/, '')); }}>
          <ListItemIcon><ContentCopyRoundedIcon fontSize="small" sx={{ color: '#64748B' }} /></ListItemIcon>
          <ListItemText primary="Copy ID" primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: '#64748B' }} />
        </MenuItem>
      </Menu>
    </>
  );
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
  const { user } = useAuthStore();
  const canFileReturn = user?.role !== 'TenantAdmin' && user?.role !== 'HqManager' && user?.role !== 'HqStaff' && user?.role !== 'HQ Staff';

  const [rows, setRows] = useState<ReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());
  const [returnStats, setReturnStats] = useState<ReturnStatsDto | null>(null);

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title: string;
    icon: React.ReactNode;
    data: StatMetricDto | null;
  }>({ open: false, title: '', icon: null, data: null });

  const openDetail = (title: string, data: StatMetricDto | null | undefined, icon: React.ReactNode) => {
    if (!data) return;
    setDetailModal({ open: true, title, icon, data });
  };

  const closeDetail = () => setDetailModal(prev => ({ ...prev, open: false }));

  const loadRows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [results, stats] = await Promise.all([
        fetchReturns(statusFilter ? { status: statusFilter } : undefined),
        fetchReturnStats()
      ]);
      setRows(Array.isArray(results) ? results : []);
      setReturnStats(stats);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadRows(); }, [statusFilter]);

  // Real-time Status Sync via SignalR
  useEffect(() => {
    const url = import.meta.env.VITE_API_URL || '';
    
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${url}/hub/workflow`, {
            withCredentials: true,
            accessTokenFactory: () => useAuthStore.getState().token || ''
        })
        .withAutomaticReconnect()
        .build();

    connection.on('ReceiveStatusUpdate', () => {
        void loadRows();
    });

    connection.start()
        .then(() => connection.invoke('JoinReturnsList'))
        .catch(err => console.error('Returns Page SignalR Error: ', err));

    return () => {
        if (connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke('LeaveReturnsList').finally(() => void connection.stop());
        }
    };
  }, []);

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
        (row.subject ?? '').toLowerCase().includes(query) ||
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
      label: 'ID',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {(row.transactionCode || `RT-${row.returnId}`).replace(/^[A-Z]+-/, '')}
        </Typography>
      ),
    },
    {
      key: 'orderId',
      label: 'ORDER ID',
      sortable: true,
      render: (row) => {
        const prefix = row.isOrderHqInitiated ? 'SP-' : 'SR-';
        const cleanCode = (row.orderTransactionCode || `ORD-${row.orderId}`).replace(/^[A-Z]+-/, '');
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6B4C2A', fontFamily: 'monospace' }}>
            {prefix}{cleanCode}
          </Typography>
        );
      },
    },
    {
      key: 'subject',
      label: 'SUBJECT',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {row.subject || '—'}
        </Typography>
      ),
    },
    {
      key: 'branchName',
      label: 'BRANCH',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
          {row.branchName || `Branch ${row.branchId}`}
        </Typography>
      ),
    },
    {
      key: 'totalReturnedValue',
      label: 'VALUES',
      sortable: true,
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#6B4C2A' }}>
            Ret {formatPeso(row.totalReturnedValue ?? 0)}
          </Typography>
          {(row.totalLossValue ?? 0) > 0 && (
            <Typography sx={{ fontSize: 11.5, color: '#D32F2F' }}>
              Loss {formatPeso(row.totalLossValue ?? 0)}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      render: (row) => (
        <Typography 
          sx={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: statusColor(row.status),
            letterSpacing: '0.01em'
          }}
        >
          {row.status}
        </Typography>
      ),
    },
    {
      key: 'pickupScheduleStatus',
      label: 'PICKUP SLA',
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: scheduleColor(row.pickupScheduleStatus) }}>
          {formatScheduleStatus(row.pickupScheduleStatus)}
        </Typography>
      ),
    },
    {
      key: 'loggedAt',
      label: 'DATE AND TIME',
      sortable: true,
      sortAccessor: (row) => new Date(row.loggedAt).getTime(),
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
          {new Date(row.loggedAt).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (row) => <ActionsMenu row={row} />,
    },
  ];

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Total Returns"
              value={returnStats?.totalReturns.currentValue ?? safeRows.length}
              icon={<AssignmentReturnRoundedIcon />}
              trend={returnStats?.totalReturns.trend ?? 'up'}
              trendValue={`${returnStats?.totalReturns.percentageChange ?? 0}% vs last week`}
              accentClass="stat-accent-brown"
              iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
              onClick={() => openDetail('Total Returns', returnStats?.totalReturns, <AssignmentReturnRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Awaiting Action"
              value={returnStats?.awaitingAction.currentValue ?? safeRows.filter((r) => ACTIVE_STATUSES.has(r.status)).length}
              icon={<PendingActionsRoundedIcon />}
              trend={returnStats?.awaitingAction.trend ?? 'up'}
              trendValue={`${returnStats?.awaitingAction.percentageChange ?? 0}% vs last week`}
              accentClass="stat-accent-gold"
              iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
              onClick={() => openDetail('Awaiting Action', returnStats?.awaitingAction, <PendingActionsRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="In Transit / Arrived"
              value={returnStats?.inTransitOrArrived.currentValue ?? safeRows.filter((r) => r.status === 'Dispatched' || r.status === 'Arrived').length}
              icon={<LocalShippingRoundedIcon />}
              trend={returnStats?.inTransitOrArrived.trend ?? 'up'}
              trendValue={`${returnStats?.inTransitOrArrived.percentageChange ?? 0}% vs last week`}
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
              onClick={() => openDetail('In Transit / Arrived', returnStats?.inTransitOrArrived, <LocalShippingRoundedIcon />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              label="Completed"
              value={returnStats?.completed.currentValue ?? safeRows.filter((r) => r.status === 'Completed').length}
              icon={<TaskAltRoundedIcon />}
              trend={returnStats?.completed.trend ?? 'up'}
              trendValue={`${returnStats?.completed.percentageChange ?? 0}% vs last week`}
              accentClass="stat-accent-sage"
              iconBg="linear-gradient(135deg, #4A7C59 0%, #8FBB9F 100%)"
              onClick={() => openDetail('Completed', returnStats?.completed, <TaskAltRoundedIcon />)}
            />
          </Grid>
        </Grid>
      </Box>

      {/* ── Detail Modal ── */}
      <Dialog 
        open={detailModal.open} 
        onClose={closeDetail}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: '#FCF9F6',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ 
          m: 0, p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(107, 76, 42, 0.08)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              color: '#6B4C2A', 
              opacity: 0.8,
              '& svg': { fontSize: 20 }
            }}>
              {detailModal.icon}
            </Box>
            <Typography sx={{ fontWeight: 800, color: '#6B4C2A', fontSize: '0.95rem' }}>
              {detailModal.title} Breakdown
            </Typography>
          </Box>
          <IconButton onClick={closeDetail} sx={{ color: '#6B4C2A' }}>
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List sx={{ py: 0 }}>
            {!detailModal.data || detailModal.data.items.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No records to display for this metric.
                </Typography>
              </Box>
            ) : (
              detailModal.data.items.map((item, idx) => (
                <Box key={item.id}>
                  <ListItem 
                    sx={{ 
                      py: 1.2, px: 3, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(107, 76, 42, 0.04)' }
                    }}
                    onClick={() => {
                      closeDetail();
                      navigate({ 
                        to: '/returns/$returnId', 
                        params: { returnId: item.id.replace('RT-', '') } 
                      });
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 700, color: '#6B4C2A', fontSize: '0.82rem' }}>
                          {item.id} — {item.title}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {item.subtitle} {item.date && `• ${new Date(item.date).toLocaleDateString()}`}
                        </Typography>
                      }
                    />
                    <ArrowForwardIosRoundedIcon sx={{ fontSize: 12, color: 'rgba(107, 76, 42, 0.3)' }} />
                  </ListItem>
                  {idx < (detailModal.data?.items.length ?? 0) - 1 && <Divider sx={{ opacity: 0.5 }} />}
                </Box>
              ))
            )}
          </List>
        </DialogContent>
      </Dialog>

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

        {canFileReturn && (
          <Button
            startIcon={<AssignmentReturnRoundedIcon />}
            onClick={() => navigate({ to: '/returns/new' })}
            sx={{ ml: { xs: 0, lg: 'auto' }, whiteSpace: 'nowrap' }}
          >
            File Return
          </Button>
        )}
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