import { useEffect, useState } from 'react';
import { Box, Typography, Card, Button, List, ListItem, ListItemText, Chip, Skeleton, Divider } from '@mui/material';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import { useNavigate } from '@tanstack/react-router';
import { fetchLatestOngoingSupplyRequest, type SupplyRequest } from '../../branch-operations/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Draft: { label: 'Drafting', color: '#6B4C2A', bg: 'rgba(107,76,42,0.1)' },
  PendingApproval: { label: 'Awaiting HQ', color: '#B45309', bg: 'rgba(180,83,9,0.1)' },
  Approved: { label: 'HQ Approved', color: '#047857', bg: 'rgba(4,120,87,0.1)' },
  InFulfillment: { label: 'In Fulfillment', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  Arrived: { label: 'Package Arrived', color: '#718F58', bg: 'rgba(113,143,88,0.1)' },
};

export function FulfillmentStatus() {
  const navigate = useNavigate();
  const [request, setRequest] = useState<SupplyRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchLatestOngoingSupplyRequest();
        setRequest(data);
      } catch (err) {
        console.error('Failed to load ongoing request', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card elevation={0} sx={{ p: 2.5, height: '100%', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="text" width="40%" />
      </Card>
    );
  }

  if (!request) {
    return (
      <Card
        elevation={0}
        sx={{
          p: 2.5,
          height: '100%',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: 1.5
        }}
      >
        <ListAltRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.5 }} />
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>No Active Requests</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Your branch is all caught up with supplies.</Typography>
        </Box>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => navigate({ to: '/supply-requests' })}
          sx={{ mt: 1, borderRadius: '8px', textTransform: 'none' }}
        >
          Create New Request
        </Button>
      </Card>
    );
  }

  const status = STATUS_CONFIG[request.status] || { label: request.status, color: 'text.secondary', bg: 'rgba(0,0,0,0.05)' };

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutorenewRoundedIcon sx={{ color: '#546B3F', fontSize: 20 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
            Current Request
          </Typography>
        </Box>
        <Chip 
          label={status.label} 
          size="small"
          sx={{ 
            fontSize: 10, 
            fontWeight: 700, 
            color: status.color, 
            bgcolor: status.bg,
            border: `1px solid ${status.color}30`,
            borderRadius: '6px',
            height: 22
          }} 
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
          Reference ID
        </Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#6B4C2A', fontFamily: 'monospace' }}>
          #{request.requestId.toString().padStart(4, '0')}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

      <Box sx={{ flexGrow: 1 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
          Items Requested
        </Typography>
        <List dense sx={{ p: 0 }}>
          {request.items.slice(0, 4).map((item, idx) => (
            <ListItem key={idx} sx={{ p: 0, mb: 0.5 }}>
              <ListItemText 
                primary={`• ${item.quantityRequested}x ${item.itemName}`}
                primaryTypographyProps={{ sx: { fontSize: 12.5, fontWeight: 500, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
              />
            </ListItem>
          ))}
          {request.items.length > 4 && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5, fontStyle: 'italic', pl: 1.5 }}>
              + {request.items.length - 4} more items...
            </Typography>
          )}
        </List>
      </Box>

      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={() => navigate({ to: `/supply-requests/${request.requestId}` })}
          sx={{ 
            borderRadius: '10px', 
            textTransform: 'none', 
            fontWeight: 700,
            bgcolor: '#6B4C2A',
            '&:hover': { bgcolor: '#543D22' }
          }}
        >
          View Transaction
        </Button>
      </Box>
    </Card>
  );
}
