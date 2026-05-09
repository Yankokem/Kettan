import { Box, Tooltip, Typography, Fade } from '@mui/material';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import OutboxRoundedIcon from '@mui/icons-material/OutboxRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WhereToVoteRoundedIcon from '@mui/icons-material/WhereToVoteRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';

interface TimelineEvent {
    status: string;
    date: Date | string;
    user?: string;
    role?: string;
    notes?: string;
}

const STEPS = [
  { key: 'Draft', label: 'Draft', icon: <AssignmentRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Submitted', label: 'Submitted', icon: <OutboxRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Acknowledged', label: 'Acknowledged', icon: <ThumbUpAltRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Dispatched', label: 'Dispatched', icon: <LocalShippingRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Arrived', label: 'Arrived', icon: <WhereToVoteRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Inspecting', label: 'Inspecting', icon: <SearchRoundedIcon sx={{ fontSize: 30 }} /> },
  { key: 'Completed', label: 'Completed', icon: <TaskAltRoundedIcon sx={{ fontSize: 30 }} /> },
];

function getStepIndex(status: string): number {
  const mapping: Record<string, number> = {
    Draft: 0,
    Submitted: 1,
    Acknowledged: 2,
    Dispatched: 3,
    Arrived: 4,
    Inspecting: 5,
    Completed: 6,
    Rejected: 1, // Rejected happens at submitted
  };
  return mapping[status] ?? 0;
}

export interface ReturnTrackerStepperProps {
  status: string;
  timeline: TimelineEvent[];
}

export function ReturnTrackerStepper({ status, timeline }: ReturnTrackerStepperProps) {
  const resolvedIndex = getStepIndex(status);
  const isRejected = status === 'Rejected';

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', px: 2, py: 2 }}>
      {STEPS.map((step, idx) => {
        const isActive = idx === resolvedIndex;
        const isPast = idx < resolvedIndex || (isRejected && idx <= resolvedIndex);
        const isFuture = idx > resolvedIndex && !isRejected;
        
        const matchedEvents = timeline.filter(t => t.status === step.key || (isRejected && idx === 1 && t.status === 'Rejected'));
        const event = matchedEvents[matchedEvents.length - 1];

        const activeColor = (isRejected && idx === 1) ? '#B91C1C' : '#C9A84C';
        
        const itemColor = isFuture ? 'text.disabled' : activeColor;

        const tooltipTitle = event ? (
            <Box sx={{ p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                    {isRejected && idx === 1 ? 'Rejected' : step.label}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                    {new Date(event.date).toLocaleString()}
                </Typography>
                {event.user && (
                    <Typography sx={{ fontSize: 11, color: '#F5E6B3' }}>
                        By {event.user} {event.role ? `(${event.role})` : ''}
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
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 60, cursor: event ? 'pointer' : 'default' }}>
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
                    {isRejected && idx === 1 ? <CancelRoundedIcon sx={{ fontSize: 30 }} /> : step.icon}
                </Box>
                <Typography
                    sx={{
                    fontSize: 11,
                    fontWeight: isActive ? 800 : 700,
                    color: isFuture ? 'text.disabled' : 'text.primary',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                    }}
                >
                    {isRejected && idx === 1 ? 'Rejected' : step.label}
                </Typography>
                </Box>
            </Tooltip>

            {idx < STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 3,
                  mx: 1,
                  mt: 1.75,
                  backgroundColor: isPast ? activeColor : 'divider',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
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