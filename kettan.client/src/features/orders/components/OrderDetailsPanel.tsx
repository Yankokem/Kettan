import { Box, Typography, Chip } from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';

export interface OrderDetailsPanelProps {
  orderId: string;
}

export function OrderDetailsPanel({ orderId }: OrderDetailsPanelProps) {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
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
          <Chip label={orderId} size="small" sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: '#e2e8f0', color: '#1e293b', borderRadius: 1 }} />
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <EventRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Requested</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', ml: 3.5 }}>Apr 02, 2026, 09:41 AM</Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StorefrontRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination Branch</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', ml: 3.5 }}>Downtown Main</Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</Typography>
          </Box>
          <Box sx={{ ml: 3.5 }}>
            <Chip
              label="Pending Approval"
              size="small"
              sx={{ fontSize: 12, fontWeight: 600, bgcolor: 'rgba(180,83,9,0.12)', color: '#B45309', border: '1px solid rgba(180,83,9,0.28)' }}
            />
          </Box>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DirectionsCarFilledRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Vehicle</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.disabled', fontStyle: 'italic', ml: 3.5 }}>Not yet assigned</Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviewed By</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.disabled', fontStyle: 'italic', ml: 3.5 }}>Pending Review</Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filled By</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', ml: 3.5 }}>Alex Morgan<Typography component="span" sx={{ fontSize: 13, color: 'text.disabled', ml: 0.5 }}>(Branch Manager)</Typography></Typography>
        </Box>
        
        <Box sx={{ bgcolor: 'rgba(241, 245, 249, 0.6)', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StickyNote2RoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</Typography>
          </Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, color: '#334155' }}>Please deliver before the weekend rush. We are running extremely low on Vanilla Syrup.</Typography>
        </Box>
      </Box>
    </Box>
  );
}
