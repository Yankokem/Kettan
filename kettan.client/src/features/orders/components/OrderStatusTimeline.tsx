import { Box, Typography } from '@mui/material';
import { StatusTimeline, type TimelineEvent } from '../../../components/UI/StatusTimeline';

interface OrderStatusTimelineProps {
  orderId: string;
  status: string; // Keep simple for now
}

export function OrderStatusTimeline({ orderId, status }: OrderStatusTimelineProps) {
  // In a real app this data comes from an endpoint based on the order ID.
  console.log(`Tracking order ${orderId} with status ${status}`);
  const timelineEvents: TimelineEvent[] = [
    { title: 'Request Submitted', timestamp: 'Apr 5, 9:00 AM', subtitle: 'by Maria Santos (Branch Manager)', status: 'completed' },
    { title: 'Approved by HQ', timestamp: 'Apr 5, 10:15 AM', subtitle: 'by John Cruz (HQ Manager)', status: 'completed' },
    { title: 'Picking Started', timestamp: 'Apr 5, 11:00 AM', subtitle: 'by Ana Reyes (HQ Staff)', status: 'completed' },
    { title: 'Packed & Ready', timestamp: 'Apr 5, 1:30 PM', subtitle: 'by Ana Reyes (HQ Staff)', status: 'completed' },
    { title: 'Dispatched', timestamp: 'Apr 5, 2:00 PM', subtitle: 'Courier: Juan | Vehicle: ABC-1234 (Van)', status: 'completed' },
    { title: 'In Transit', timestamp: 'Est. arrival: Apr 5, 5:00 PM', status: 'current' },
    { title: 'Delivered', subtitle: 'Awaiting branch confirmation', status: 'upcoming' }
  ];

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
        Status History
      </Typography>
      <StatusTimeline events={timelineEvents} />
    </Box>
  );
}
