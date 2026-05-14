import { Box, Grid, Typography, Chip, Paper, Divider, Alert, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { 
  fetchMultiBranchSupplyPushById, 
  type MultiBranchSupplyPushDetail,
  type BranchOrder
} from '../branch-operations/api';

import HubRoundedIcon from '@mui/icons-material/HubRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';

import { BackButton } from '../../components/UI/BackButton';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { StatCard } from '../../components/UI/StatCard';

const STATUS_COLORS: Record<string, { color: string, bg: string }> = {
  'PendingApproval': { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
  'Approved': { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  'Processing': { color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  'Dispatched': { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  'InTransit': { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  'Delivered': { color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  'Completed': { color: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
  'Rejected': { color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  'Cancelled': { color: '#DC2626', bg: 'rgba(220,38,38,0.12)' }
};

export function MultiBranchSupplyPushDetailPage() {
  const { batchId } = useParams({ strict: false });
  const navigate = useNavigate();
  const [data, setData] = useState<MultiBranchSupplyPushDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!batchId) return;
      try {
        setIsLoading(true);
        setError(null);
        const detail = await fetchMultiBranchSupplyPushById(Number(batchId));
        setData(detail);
      } catch (err) {
        console.error('Failed to load batch details:', err);
        setError('Failed to load multi-branch supply push details.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [batchId]);

  const columns: ColumnDef<BranchOrder>[] = [
    {
      key: 'branchName',
      label: 'Destination Branch',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BusinessRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
            {row.branchName}
          </Typography>
        </Box>
      )
    },
    {
      key: 'transactionCode',
      label: 'Order ID',
      width: 150,
      render: (row) => (
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {row.transactionCode}
        </Typography>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: 150,
      render: (row) => {
        const st = STATUS_COLORS[row.status] || { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' };
        return (
          <Chip
            label={row.status.replace(/([A-Z])/g, ' $1').trim()}
            size="small"
            sx={{
              fontSize: 11,
              fontWeight: 700,
              bgcolor: st.bg,
              color: st.color,
              border: `1px solid ${st.color}44`,
              textTransform: 'capitalize'
            }}
          />
        );
      }
    },
    {
      key: 'itemsCount',
      label: 'Items',
      width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {row.itemsCount} SKUs
        </Typography>
      )
    },
    {
      key: 'totalFulfilledValue',
      label: 'Value',
      width: 150,
      align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          ₱{row.totalFulfilledValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      key: 'actions',
      label: '',
      width: 60,
      align: 'right',
      render: (row) => (
        <Box 
          onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: String(row.orderId) } })}
          sx={{ 
            cursor: 'pointer', 
            color: 'text.disabled',
            '&:hover': { color: '#6B4C2A' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            pr: 1
          }}
        >
          <ArrowForwardIosRoundedIcon sx={{ fontSize: 14 }} />
        </Box>
      )
    }
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress size={30} sx={{ color: '#6B4C2A' }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Batch not found.'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/orders" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 900, color: '#6B4C2A', letterSpacing: '-0.02em' }}>
                Batch {data.transactionCode}
              </Typography>
              <Chip 
                label="Multi-Branch Push" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(107, 76, 42, 0.08)', 
                  color: '#6B4C2A', 
                  fontWeight: 800, 
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }} 
              />
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
              {data.subject || 'No subject provided'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', mb: 0.5 }}>
            Created On
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
            {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Typography>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Branches"
            value={data.totalBranches.toString()}
            icon={<BusinessRoundedIcon />}
            iconBg="linear-gradient(135deg, #6B4C2A 0%, #8C6B43 100%)"
            accentClass="stat-accent-brown"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Completed"
            value={data.completedBranches.toString()}
            icon={<CheckCircleRoundedIcon />}
            iconBg="linear-gradient(135deg, #059669 0%, #10B981 100%)"
            accentClass="stat-accent-green"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Cancelled"
            value={data.cancelledBranches.toString()}
            icon={<CancelRoundedIcon />}
            iconBg="linear-gradient(135deg, #DC2626 0%, #EF4444 100%)"
            accentClass="stat-accent-rust"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="In Progress"
            value={(data.totalBranches - data.completedBranches - data.cancelledBranches).toString()}
            icon={<ScheduleRoundedIcon />}
            iconBg="linear-gradient(135deg, #D97706 0%, #F59E0B 100%)"
            accentClass="stat-accent-sand"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '340px 1fr' }, gap: 3 }}>
        {/* Sidebar Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2.5 }}>
              Batch Context
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <HubRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase' }}>
                    Request Type
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', textTransform: 'capitalize' }}>
                  {data.requestType}
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CalendarMonthRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase' }}>
                    Dispatch Window
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
                  {data.dispatchWindow.replace(/_/g, ' ')}
                </Typography>
              </Box>

              {data.dispatchDate && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <ScheduleRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase' }}>
                      Scheduled Date
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
                    {new Date(data.dispatchDate).toLocaleDateString()}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 0.5, opacity: 0.6 }} />

              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', mb: 1 }}>
                  Operational Notes
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                  {data.notes || 'No additional notes provided for this batch.'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Branch Orders Table */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Inventory2RoundedIcon sx={{ color: '#6B4C2A', fontSize: 18 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#6B4C2A' }}>
                Individual Branch Orders
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.disabled', fontWeight: 600 }}>
              {data.branchOrders.length} Destinations
            </Typography>
          </Box>

          <DataTable
            data={data.branchOrders}
            columns={columns}
            keyExtractor={(row) => String(row.orderId)}
            defaultRowsPerPage={10}
            emptyTitle="No branch orders"
            emptyMessage="This batch does not contain any individual branch orders."
          />
        </Box>
      </Box>
    </Box>
  );
}
