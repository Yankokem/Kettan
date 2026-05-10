import { Box, Typography, Chip } from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded';
import type { OrderDetail } from '../../branch-operations/api';

export interface OrderDetailsPanelProps {
  order: OrderDetail;
}

export function OrderDetailsPanel({ order }: OrderDetailsPanelProps) {
  const toPeso = (value: number) =>
    `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatScheduleStatus = (status?: string | null) => {
    if (!status) return 'No Schedule';
    if (status === 'DueToday') return 'Due Today';
    if (status === 'NoSchedule') return 'No Schedule';
    if (status === 'OnTime') return 'On Time';
    return status;
  };

  const scheduleColor = (status?: string | null) => {
    if (status === 'Late') return '#D32F2F';
    if (status === 'DueToday') return '#ED6C02';
    if (status === 'OnTime') return '#2E7D32';
    if (status === 'Scheduled') return '#0288D1';
    return '#6B7280';
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '14px', overflow: 'hidden' }}>
      <Box sx={{ 
        p: 2.2, 
        background: 'linear-gradient(170deg, #F0E6D3 0%, #FAF5EF 100%)', 
        borderBottom: '1px solid', 
        borderColor: 'divider' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
          <DescriptionRoundedIcon sx={{ color: '#6B4C2A', fontSize: 18 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Order Details</Typography>
        </Box>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>OR-{order.orderId}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary', mt: -0.5 }}>Destination: {order.branchName}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', p: 2.5, gap: 3 }}>
        {/* Details Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EventRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Requested</Typography>
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', ml: 3.2 }}>{new Date(order.pushedToFulfillmentAt).toLocaleString()}</Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InfoRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</Typography>
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: order.subject ? 'text.primary' : 'text.secondary', ml: 3.2 }}>
              {order.subject || 'No subject'}
            </Typography>
          </Box>
          
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DirectionsCarFilledRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Vehicle</Typography>
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: order.vehicleId ? 'text.primary' : 'text.disabled', fontStyle: order.vehicleId ? 'normal' : 'italic', ml: 3.2 }}>
              {order.vehicleId ? `Vehicle #${order.vehicleId}` : 'Not yet assigned'}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EventRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispatch SLA</Typography>
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: scheduleColor(order.dispatchScheduleStatus), ml: 3.2 }}>
              {formatScheduleStatus(order.dispatchScheduleStatus)}
            </Typography>
          </Box>
        </Box>

        {/* Workflow Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{order.isHqInitiated ? 'Initiated By' : 'Pushed By'}</Typography>
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', ml: 3.2 }}>
              {order.requestedByName}
            </Typography>
          </Box>

          {order.isHqInitiated && order.dispatchReason && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
                <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispatch Reason</Typography>
              </Box>
              <Chip
                label={order.dispatchReason}
                size="small"
                sx={{ ml: 3.2, fontWeight: 600, fontSize: 11, bgcolor: 'rgba(107,76,42,0.1)', color: '#6B4C2A', border: '1px solid rgba(107,76,42,0.2)' }}
              />
            </Box>
          )}

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviewed By</Typography>
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: order.arrivedConfirmedByName ? 'text.primary' : 'text.disabled', fontStyle: order.arrivedConfirmedByName ? 'normal' : 'italic', ml: 3.2 }}>
              {order.arrivedConfirmedByName || 'Pending Review'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            Value Summary
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6B4C2A', mb: 0.4 }}>
            Requested: {toPeso(order.totalRequestedValue)}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 0.2 }}>
            Approved: {toPeso(order.totalApprovedValue)}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Fulfilled: {toPeso(order.totalFulfilledValue)}
          </Typography>
        </Box>

        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StickyNote2RoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
            <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</Typography>
          </Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, color: order.notes ? '#334155' : 'text.disabled', fontStyle: order.notes ? 'normal' : 'italic' }}>
            {order.notes || 'No notes provided'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
