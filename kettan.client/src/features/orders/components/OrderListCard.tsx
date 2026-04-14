import { Box, Card, CardActionArea, Chip, Typography } from '@mui/material';

import { OrderRowActionsMenu, type OrderActionStatus } from './OrderRowActionsMenu';

export interface OrderCardModel {
  id: string;
  branch: string;
  itemsCount: number;
  totalCost: number;
  status: OrderActionStatus;
  date: string;
  actionedBy?: string;
}

interface OrderListCardProps {
  order: OrderCardModel;
  datasetMode: 'active' | 'history';
  onOpen: (orderId: string) => void;
  onApprove: (orderId: string) => void;
  onProceed: (orderId: string) => void;
  onDecline: (orderId: string) => void;
}

const STATUS_MAP: Record<OrderActionStatus, { color: string; bg: string }> = {
  Pending: { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
  Approved: { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  Packing: { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' },
  Dispatched: { color: '#546B3F', bg: 'rgba(84,107,63,0.12)' },
  Suspended: { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
  Delivered: { color: '#047857', bg: 'rgba(4,120,87,0.12)' },
  Declined: { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
};

export function OrderListCard({ order, datasetMode, onOpen, onApprove, onProceed, onDecline }: OrderListCardProps) {
  const statusStyle = STATUS_MAP[order.status];
  const dateLabel = datasetMode === 'history' ? 'Completed' : 'Requested';

  return (
    <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
      <CardActionArea onClick={() => onOpen(order.id)} sx={{ p: 2.25 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
              {order.id}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 13.5, color: 'text.primary', fontWeight: 600 }}>
              {order.branch}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={order.status}
              size="small"
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                background: statusStyle.bg,
                color: statusStyle.color,
                border: `1px solid ${statusStyle.color}28`,
              }}
            />
            <OrderRowActionsMenu
              orderId={order.id}
              status={order.status}
              onViewDetails={onOpen}
              onApprove={onApprove}
              onProceed={onProceed}
              onDecline={onDecline}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 1.75, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25 }}>
          <Box>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Items
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{order.itemsCount} SKUs</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Fulfillment Cost
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
              {order.totalCost > 0 ? `₱${order.totalCost.toFixed(2)}` : '--'}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {dateLabel}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {datasetMode === 'history' ? 'Actioned By' : 'Current Stage'}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
              {datasetMode === 'history' ? (order.actionedBy || '--') : order.status}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
