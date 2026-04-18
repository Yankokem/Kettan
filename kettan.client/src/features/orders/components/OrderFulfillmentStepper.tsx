import { Box, Typography } from '@mui/material';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import BackpackRoundedIcon from '@mui/icons-material/BackpackRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WhereToVoteRoundedIcon from '@mui/icons-material/WhereToVoteRounded';

const STEPS = [
  { key: 'PendingApproval', label: 'Requested', icon: <AccessTimeFilledRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Approved', label: 'Approved', icon: <CheckCircleRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Picking', label: 'Picking', icon: <Inventory2RoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Packed', label: 'Packed', icon: <BackpackRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Dispatched', label: 'Dispatched', icon: <LocalShippingRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Delivered', label: 'Delivered', icon: <WhereToVoteRoundedIcon sx={{ fontSize: 30 }} /> },
];

/** Maps any order/supply-request status to the corresponding stepper index */
function getStepIndex(status: string): number {
  // Handle statuses that map between named steps
  const mapping: Record<string, number> = {
    Draft: -1,
    AutoDrafted: -1,
    PendingApproval: 0,
    Approved: 1,
    Processing: 1,
    Picking: 2,
    Packed: 3,
    Dispatched: 4,
    InTransit: 4,
    Delivered: 5,
    Rejected: 0,      // stays at first step (request was rejected)
    Returned: 5,       // delivered then returned
    PartiallyApproved: 1,
  };
  return mapping[status] ?? 0;
}

export interface OrderFulfillmentStepperProps {
  /** Current status string — drives which step is highlighted */
  status?: string;
  /** Legacy: explicit step index (overrides status if provided) */
  activeStepIndex?: number;
}

export function OrderFulfillmentStepper({ status, activeStepIndex }: OrderFulfillmentStepperProps) {
  const resolvedIndex = activeStepIndex ?? (status ? getStepIndex(status) : 0);
  const isRejected = status === 'Rejected';

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 5 }}>
      {STEPS.map((step, idx) => {
        const isActive = idx === resolvedIndex;
        const isPast = idx < resolvedIndex;
        const isFuture = idx > resolvedIndex;

        // If order was rejected, show red on the first step
        const activeColor = isRejected && idx === 0 ? '#B91C1C' : '#C9A84C';
        const itemColor = isFuture ? 'text.disabled' : activeColor;

        return (
          <Box key={step.key} sx={{ display: 'flex', alignItems: 'flex-start', flex: idx < STEPS.length - 1 ? 1 : 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
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
                      '0%': { transform: 'scale(1)', filter: 'drop-shadow(0px 0px 4px rgba(201,168,76,0.6))' },
                      '50%': { transform: 'scale(1.15)', filter: 'drop-shadow(0px 0px 12px rgba(201,168,76,1))' },
                      '100%': { transform: 'scale(1)', filter: 'drop-shadow(0px 0px 4px rgba(201,168,76,0.6))' },
                    },
                  }),
                }}
              >
                {step.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 600,
                  color: isFuture ? 'text.disabled' : 'text.primary',
                  whiteSpace: 'nowrap',
                }}
              >
                {isRejected && idx === 0 ? 'Rejected' : step.label}
              </Typography>
            </Box>

            {idx < STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 3,
                  mx: 1.5,
                  mt: 1.75,
                  backgroundColor: isPast ? activeColor : 'divider',
                  borderRadius: 2,
                  ...(isActive && !isRejected && {
                    background: 'linear-gradient(90deg, #C9A84C 0%, #F5E6B3 50%, #C9A84C 100%)',
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
