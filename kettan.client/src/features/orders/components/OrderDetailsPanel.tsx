import { Box, Typography, Chip } from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import type { OrderDetail } from '../../branch-operations/api';

export interface OrderDetailsPanelProps {
  order: OrderDetail;
}

export function OrderDetailsPanel({ order }: OrderDetailsPanelProps) {
  // Helper function to get status chip styling
  const getStatusChipStyle = (status: string) => {
    const statusStyles: Record<string, { bgcolor: string; color: string; border: string }> = {
      'Processing': { bgcolor: 'rgba(59,130,246,0.12)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.28)' },
      'Picking': { bgcolor: 'rgba(59,130,246,0.12)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.28)' },
      'Packing': { bgcolor: 'rgba(59,130,246,0.12)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.28)' },
      'Packed': { bgcolor: 'rgba(180,83,9,0.12)', color: '#B45309', border: '1px solid rgba(180,83,9,0.28)' },
      'Dispatched': { bgcolor: 'rgba(147,51,234,0.12)', color: '#9333EA', border: '1px solid rgba(147,51,234,0.28)' },
      'Arrived': { bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.28)' },
      'Completed': { bgcolor: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.28)' },
      'Delivered': { bgcolor: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.28)' },
    };
    return statusStyles[status] || { bgcolor: 'rgba(180,83,9,0.12)', color: '#B45309', border: '1px solid rgba(180,83,9,0.28)' };
  };

  const statusStyle = getStatusChipStyle(order.status);

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '14px', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
        <DescriptionRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Order Details</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', p: 2.5, gap: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TagRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</Typography>
          </Box>
          <Chip label={order.orderId} size="small" sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: '#e2e8f0', color: '#1e293b', borderRadius: 1 }} />
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <EventRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Requested</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', ml: 3.5 }}>{new Date(order.pushedToFulfillmentAt).toLocaleString()}</Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StorefrontRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination Branch</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', ml: 3.5 }}>{order.branchName}</Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</Typography>
          </Box>
          <Box sx={{ ml: 3.5 }}>
            <Chip
              label={order.status}
              size="small"
              sx={{ fontSize: 12, fontWeight: 600, bgcolor: statusStyle.bgcolor, color: statusStyle.color, border: statusStyle.border }}
            />
          </Box>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DirectionsCarFilledRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Vehicle</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: order.vehicleId ? 'text.primary' : 'text.disabled', fontStyle: order.vehicleId ? 'normal' : 'italic', ml: 3.5 }}>
            {order.vehicleId ? `Vehicle #${order.vehicleId}` : 'Not yet assigned'}
          </Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviewed By</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: order.arrivedConfirmedByName ? 'text.primary' : 'text.disabled', fontStyle: order.arrivedConfirmedByName ? 'normal' : 'italic', ml: 3.5 }}>
            {order.arrivedConfirmedByName || 'Pending Review'}
          </Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filled By</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', ml: 3.5 }}>
            {order.requestedByName}
          </Typography>
        </Box>
        
        <Box sx={{ bgcolor: 'rgba(241, 245, 249, 0.6)', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StickyNote2RoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</Typography>
          </Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, color: order.notes ? '#334155' : 'text.disabled', fontStyle: order.notes ? 'normal' : 'italic' }}>
            {order.notes || 'No notes provided'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
