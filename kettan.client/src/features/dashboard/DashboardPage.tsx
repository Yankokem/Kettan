import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Box, Typography, Chip, Dialog, DialogTitle, DialogContent, IconButton, List, ListItem, ListItemText, Divider } from '@mui/material';
import LocalShippingRoundedIcon    from '@mui/icons-material/LocalShippingRounded';
import SettingsBackupRestoreRoundedIcon from '@mui/icons-material/SettingsBackupRestoreRounded';
import LocalMallRoundedIcon        from '@mui/icons-material/LocalMallRounded';
import WarningAmberRoundedIcon     from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';

import { StatCard } from '../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { useAuthStore } from '../../store/useAuthStore';
import { isHqRole, isBranchRole } from '../../utils/roleHelpers';
import { BranchPerformance } from './components/BranchPerformance';
import { InventoryAlerts } from './components/InventoryAlerts';
import { FulfillmentStatus } from './components/FulfillmentStatus';
import { DashboardChart } from './components/DashboardChart';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { fetchBranchOrders, type BranchOrder } from '../branch-operations/api';
import { fetchDashboardStats, type DashboardStatsDto, type StatMetricDto } from '../reports/reportsApi';

// ── Recent Activity Row ────────────────────────────────────────────────────
interface ActivityItem {
  id: string;
  branch: string;
  type: string;
  status: 'processing' | 'picking' | 'packed' | 'dispatched' | 'in-transit' | 'delivered' | 'returned';
  time: string;
}

const STATUS_MAP: Record<string, any> = {
  processing: { label: 'Processing', color: '#B45309', bg: 'rgba(180,83,9,0.12)', icon: <RadioButtonCheckedRoundedIcon sx={{ fontSize: 12 }} /> },
  pendingapproval: { label: 'Pending Approval', color: '#B45309', bg: 'rgba(180,83,9,0.12)', icon: <RadioButtonCheckedRoundedIcon sx={{ fontSize: 12 }} /> },
  approved: { label: 'Approved', color: '#047857', bg: 'rgba(4,120,87,0.12)', icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 12 }} /> },
  rejected: { label: 'Rejected', color: '#B91C1C', bg: 'rgba(185,28,28,0.10)', icon: <WarningAmberRoundedIcon sx={{ fontSize: 12 }} /> },
  picking: { label: 'Picking', color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)', icon: <LocalMallRoundedIcon sx={{ fontSize: 12 }} /> },
  packed: { label: 'Packed', color: '#546B3F', bg: 'rgba(84,107,63,0.12)', icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 12 }} /> },
  dispatched: { label: 'Dispatched', color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)', icon: <LocalShippingRoundedIcon sx={{ fontSize: 12 }} /> },
  'in-transit': { label: 'In Transit', color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)', icon: <LocalShippingRoundedIcon sx={{ fontSize: 12 }} /> },
  delivered: { label: 'Delivered', color: '#546B3F', bg: 'rgba(84,107,63,0.12)', icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 12 }} /> },
  returned: { label: 'Returned', color: '#B91C1C', bg: 'rgba(185,28,28,0.10)', icon: <WarningAmberRoundedIcon sx={{ fontSize: 12 }} /> },
};

const activityColumns: ColumnDef<ActivityItem>[] = [
  {
    key: 'id',
    label: 'Order ID',
    width: 130,
    render: (row) => (
      <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: '#6B4C2A', fontFamily: 'monospace' }}>
        {row.id}
      </Typography>
    ),
  },
  {
    key: 'branch',
    label: 'Branch',
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
        {row.branch}
      </Typography>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    width: 170,
    render: (row) => (
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        {row.type}
      </Typography>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 130,
    render: (row) => {
      const st = STATUS_MAP[row.status] || { label: row.status, color: '#64748B', bg: 'rgba(100,116,139,0.12)', icon: null };
      return (
        <Chip
          icon={st.icon ?? undefined}
          label={st.label}
          size="small"
          sx={{
            fontSize: 11.5,
            fontWeight: 600,
            background: st.bg,
            color: st.color,
            border: `1px solid ${st.color}28`,
            '& .MuiChip-icon': { color: st.color, ml: 0.5 },
          }}
        />
      );
    },
  },
  {
    key: 'time',
    label: 'Time',
    width: 100,
    align: 'right' as const,
    render: (row) => (
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        {row.time}
      </Typography>
    ),
  },
];

const ACTIVITY_QUICK_FILTERS = [
  { value: 'processing', label: 'Processing' },
  { value: 'picking', label: 'Picking' },
  { value: 'packed', label: 'Packed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in-transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role ?? '';
  const isHq = isHqRole(userRole);
  const isBranch = isBranchRole(userRole);
  const isTenantAdmin = userRole === 'TenantAdmin';
  const [activityStatusFilter, setActivityStatusFilter] = useState('');
  const [activityBranchFilter, setActivityBranchFilter] = useState('');
  const [activityRows, setActivityRows] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [orders, dashboardStats] = await Promise.all([
          fetchBranchOrders(),
          fetchDashboardStats()
        ]);
        
        setActivityRows(
          orders
            .slice(0, 11)
            .map((order: BranchOrder) => ({
              id: `ORD-${order.orderId}`,
              branch: order.branchName,
              type: `Order ${order.status}`,
              status: order.status.toLowerCase() as ActivityItem['status'],
              time: new Date(order.pushedToFulfillmentAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            })),
        );
        setStats(dashboardStats);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setActivityRows([]);
      }
    };

    void loadDashboardData();
  }, []);

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title: string;
    icon: React.ReactNode;
    data: StatMetricDto | null;
  }>({ open: false, title: '', icon: null, data: null });

  const openDetail = (title: string, data: StatMetricDto | null | undefined, icon: React.ReactNode) => {
    console.log('Click on card:', title);
    if (!data) {
      console.warn('Metric data is missing for:', title);
      setDetailModal({ open: true, title, icon, data: null });
      return;
    }
    setDetailModal({ open: true, title, icon, data });
  };

  const closeDetail = () => setDetailModal(prev => ({ ...prev, open: false }));

  const baseActivity = useMemo(() => (isBranch ? activityRows.slice(0, 4) : activityRows), [activityRows, isBranch]);
  const filteredActivity = baseActivity.filter((row) => {
    const matchesStatus = !activityStatusFilter || row.status === activityStatusFilter;
    const matchesBranch = !activityBranchFilter || row.branch === activityBranchFilter;
    return matchesStatus && matchesBranch;
  });

  if (user?.role === 'SuperAdmin') {
    return <SuperAdminDashboard />;
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* ── Stat Cards - Common for all roles ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' },
          gap: 2.5,
          mb: 3.5,
        }}
      >
        <StatCard
          label="Pending Supply Orders"
          value={stats?.pendingSupplyOrders.currentValue ?? 0}
          trend={stats?.pendingSupplyOrders.trend ?? 'up'}
          trendValue={`${stats?.pendingSupplyOrders.percentageChange ?? 0}% vs last week`}
          icon={<LocalMallRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
          onClick={() => {
            console.log('Clicked card 1');
            openDetail('Pending Supply Orders', stats?.pendingSupplyOrders, <LocalMallRoundedIcon />);
          }}
        />
        <StatCard
          label="Low Stock Items"
          value={stats?.lowStockItems.currentValue ?? 0}
          trend={stats?.lowStockItems.trend ?? 'up'}
          trendValue={`${stats?.lowStockItems.percentageChange ?? 0}% vs last week`}
          icon={<WarningAmberRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
          onClick={() => {
            console.log('Clicked card 2');
            openDetail('Low Stock Items', stats?.lowStockItems, <WarningAmberRoundedIcon />);
          }}
        />
        <StatCard
          label="Active Shipments"
          value={stats?.activeShipments.currentValue ?? 0}
          trend={stats?.activeShipments.trend ?? 'up'}
          trendValue={`${stats?.activeShipments.percentageChange ?? 0}% vs last week`}
          icon={<LocalShippingRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
          onClick={() => {
            console.log('Clicked card 3');
            openDetail('Active Shipments', stats?.activeShipments, <LocalShippingRoundedIcon />);
          }}
        />
        <StatCard
          label="Pending Returns"
          value={stats?.pendingReturns.currentValue ?? 0}
          trend={stats?.pendingReturns.trend ?? 'up'}
          trendValue={`${stats?.pendingReturns.percentageChange ?? 0}% vs last week`}
          icon={<SettingsBackupRestoreRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
          onClick={() => {
            console.log('Clicked card 4');
            openDetail('Pending Returns', stats?.pendingReturns, <SettingsBackupRestoreRoundedIcon />);
          }}
        />
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
                      if (detailModal.title === 'Low Stock Items') {
                        navigate({ to: '/hq-inventory' });
                      } else if (item.id.startsWith('RET-')) {
                         navigate({ to: '/returns' });
                      } else if (item.id.startsWith('ORD-')) {
                         navigate({ to: `/orders/${item.id.replace('ORD-', '')}` });
                      } else {
                         navigate({ to: '/supply-requests' });
                      }
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

      {/* ── Main Dashboard Grid - Role-Based Content ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        
        {/* HQ Roles: Operations trend chart + Branch Performance/Low Stock */}
        {isHq && (
          <>
            {/* Top Row: Chart & Performance */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'stretch' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <DashboardChart />
              </Box>
              <Box sx={{ width: { xs: '100%', xl: 340, lg: 300 }, flexShrink: 0 }}>
                <BranchPerformance />
              </Box>
            </Box>

            {/* Bottom Row: Recent Operations & Low Stock Alerts */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'stretch' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <DataTable
                  title="Recent Operations"
                  data={filteredActivity}
                  columns={activityColumns}
                  keyExtractor={(row) => row.id}
                  defaultRowsPerPage={5}
                  rowsPerPageOptions={[5, 10, 25]}
                  quickFilters={ACTIVITY_QUICK_FILTERS}
                  activeQuickFilter={activityStatusFilter}
                  onQuickFilterChange={setActivityStatusFilter}
                  rightAction={
                    <FilterDropdown
                      label="Branch"
                      icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
                      value={activityBranchFilter}
                      onChange={setActivityBranchFilter}
                      minWidth={110}
                      compact
                      options={[
                        { value: 'BGC Branch',     label: 'BGC Branch' },
                        { value: 'Makati HQ',      label: 'Makati HQ' },
                        { value: 'Ortigas Branch', label: 'Ortigas Branch' },
                        { value: 'Alabang Branch', label: 'Alabang Branch' },
                        { value: 'QC Branch',      label: 'QC Branch' },
                        { value: 'Manila Branch',  label: 'Manila Branch' },
                        { value: 'Cebu Branch',    label: 'Cebu Branch' },
                        { value: 'Davao Branch',   label: 'Davao Branch' },
                        { value: 'Iloilo Branch',  label: 'Iloilo Branch' },
                        { value: 'Bacolod Branch', label: 'Bacolod Branch' },
                        { value: 'Clark HQ',       label: 'Clark HQ' },
                      ]}
                    />
                  }
                />
              </Box>
              <Box sx={{ width: { xs: '100%', xl: 340, lg: 300 }, flexShrink: 0 }}>
                <InventoryAlerts />
              </Box>
            </Box>
          </>
        )}

        {/* Branch Roles: Supply requests, consumption logs, branch performance */}
        {isBranch && (
          <>
            {/* Top Row: Chart & Fulfillment Stepper */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'stretch' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <DashboardChart />
              </Box>
              <Box sx={{ width: { xs: '100%', xl: 340, lg: 300 }, flexShrink: 0 }}>
                <FulfillmentStatus />
              </Box>
            </Box>

            {/* Bottom Row: Recent Operations (limited) & Inventory Alerts */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'stretch' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <DataTable
                  title="My Recent Operations"
                  data={filteredActivity}
                  columns={activityColumns}
                  keyExtractor={(row) => row.id}
                  defaultRowsPerPage={5}
                  rowsPerPageOptions={[5, 10, 25]}
                  quickFilters={ACTIVITY_QUICK_FILTERS}
                  activeQuickFilter={activityStatusFilter}
                  onQuickFilterChange={setActivityStatusFilter}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', xl: 340, lg: 300 }, flexShrink: 0 }}>
                <InventoryAlerts />
              </Box>
            </Box>
          </>
        )}

        {/* TenantAdmin-specific: Additional subscription status widget */}
        {isTenantAdmin && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                TenantAdmin-specific widgets (subscription status, advanced analytics) can be added here.
              </Typography>
            </Box>
          </Box>
        )}
        
      </Box>
    </Box>
  );
}

