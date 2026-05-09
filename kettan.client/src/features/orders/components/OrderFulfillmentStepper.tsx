import { Box, Typography, Tooltip, Fade } from '@mui/material';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import BackpackRoundedIcon from '@mui/icons-material/BackpackRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WhereToVoteRoundedIcon from '@mui/icons-material/WhereToVoteRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import type { SupplyRequestTimelineEntry } from '../../supply-requests/components/SupplyRequestDetail.types';

const STEPS = [
  { key: 'PendingApproval', label: 'Requested', icon: <AccessTimeFilledRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Approved', label: 'Approved', icon: <CheckCircleRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Picking', label: 'Picking', icon: <Inventory2RoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Packed', label: 'Packed', icon: <BackpackRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Dispatched', label: 'Dispatched', icon: <LocalShippingRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Arrived', label: 'Arrived', icon: <WhereToVoteRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Completed', label: 'Completed', icon: <TaskAltRoundedIcon sx={{ fontSize: 30 }} /> },
];

/** Maps any order/supply-request status to the corresponding stepper index */
function getStepIndex(status: string): number {
  const mapping: Record<string, number> = {
    Draft: -1,
    AutoDrafted: -1,
    PendingApproval: 0,
    Approved: 1,
    Processing: 1,
    Picking: 2,
    Allocated: 2,
    Packing: 3,
    Packed: 3,
    Dispatched: 4,
    InTransit: 4,
    Arrived: 5,
    Delivered: 5,
    Completed: 6,
    Rejected: 0,
    Returned: 6,
    PartiallyApproved: 1,
    Fulfilled: 6,
  };
  return mapping[status] ?? 0;
}

export interface OrderFulfillmentStepperProps {
  status?: string;
  activeStepIndex?: number;
  timeline?: SupplyRequestTimelineEntry[];
}

export function OrderFulfillmentStepper({ status, activeStepIndex, timeline = [] }: OrderFulfillmentStepperProps) {
  const resolvedIndex = activeStepIndex ?? (status ? getStepIndex(status) : 0);
  const isRejected = status === 'Rejected';
  const isCancelled = status === 'Cancelled';
  const isCompleted = status === 'Completed' || status === 'Fulfilled';

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 5 }}>
      {STEPS.map((step, idx) => {
        const isActive = idx === resolvedIndex;
        const isPast = idx < resolvedIndex;
        const isFuture = idx > resolvedIndex;

        let activeColor = '#8C6B43'; // Default tan
        if (isRejected || isCancelled) {
          activeColor = '#B91C1C'; // Error red
        } else if (isCompleted) {
          activeColor = '#16a34a'; // Success green
        }

        const itemColor = isFuture ? 'rgba(140, 107, 67, 0.25)' : activeColor;

        const event = timeline.find(t => {
           if (isRejected && idx === 0 && t.status === 'Rejected') return true;
           return getStepIndex(t.status) === idx;
        });

        const tooltipTitle = event ? (
          <Box sx={{ p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {isRejected && idx === 0 ? 'Rejected' : isCancelled && idx === resolvedIndex ? 'Cancelled' : step.label}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              {new Date(event.timestamp).toLocaleString()}
            </Typography>
            {event.actor && (
              <Typography sx={{ fontSize: 11, color: '#F5E6B3' }}>
                By {event.actor}
              </Typography>
            )}
          </Box>
        ) : '';

        return (
          <Box key={step.key} sx={{ display: 'flex', alignItems: 'flex-start', flex: idx < STEPS.length - 1 ? 1 : 0 }}>
            <Tooltip
              title={tooltipTitle}
              arrow
              placement="top"
              TransitionComponent={Fade}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: '#2C1810',
                    borderRadius: 2,
                    boxShadow: 4,
                  },
                },
                arrow: {
                  sx: {
                    color: '#2C1810',
                  },
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, cursor: event ? 'pointer' : 'default' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 30,
                    color: itemColor,
                    ...(isActive && !isRejected && {
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', filter: 'drop-shadow(0px 0px 4px rgba(140, 107, 67, 0.6))' },
                        '50%': { transform: 'scale(1.15)', filter: 'drop-shadow(0px 0px 12px rgba(140, 107, 67, 1))' },
                        '100%': { transform: 'scale(1)', filter: 'drop-shadow(0px 0px 4px rgba(140, 107, 67, 0.6))' },
                      },
                    }),
                  }}
                >
                  {isRejected && idx === 0 ? <CancelRoundedIcon sx={{ fontSize: 30 }} /> : step.icon}
                </Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 600,
                    color: isFuture ? 'text.disabled' : 'text.primary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isRejected && idx === 0 ? 'Rejected' : isCancelled && idx === resolvedIndex ? 'Cancelled' : step.label}
                </Typography>
              </Box>
            </Tooltip>

            {idx < STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 3,
                  mx: 1.5,
                  mt: 1.75,
                  backgroundColor: isPast ? activeColor : 'rgba(140, 107, 67, 0.15)',
                  borderRadius: 2,
                  ...(isActive && !isRejected && {
                    background: 'linear-gradient(90deg, #8C6B43 0%, #F5E6B3 50%, #8C6B43 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'movingLine 1s linear infinite',
                    '@keyframes movingLine': {
                      '0%': { backgroundPosition: '100% 0' },
                      '100%': { backgroundPosition: '-100% 0' },
                    },
                  }),
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
