import { Box, Typography } from '@mui/material';
import AccessTimeFilledRoundedIcon from '@/components/icons/lucide-mui/AccessTimeFilledRoundedIcon';
import CheckCircleRoundedIcon from '@/components/icons/lucide-mui/CheckCircleRoundedIcon';
import BuildCircleRoundedIcon from '@/components/icons/lucide-mui/BuildCircleRoundedIcon';
import LocalShippingRoundedIcon from '@/components/icons/lucide-mui/LocalShippingRoundedIcon';

export interface OrderFulfillmentStepperProps {
  activeStepIndex?: number;
}

export function OrderFulfillmentStepper({ activeStepIndex = 0 }: OrderFulfillmentStepperProps) {
  const steps = [
    { label: 'Requested', icon: <AccessTimeFilledRoundedIcon sx={{ fontSize: 32 }} /> },
    { label: 'Approved', icon: <CheckCircleRoundedIcon sx={{ fontSize: 32 }} /> },
    { label: 'Packing', icon: <BuildCircleRoundedIcon sx={{ fontSize: 32 }} /> },
    { label: 'Dispatched', icon: <LocalShippingRoundedIcon sx={{ fontSize: 32 }} /> },
  ];

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 5 }}>
      {steps.map((step, idx) => {
        const isActive = idx === activeStepIndex;
        const isPast = idx < activeStepIndex;
        const isFuture = idx > activeStepIndex;

        return (
          <Box key={step.label} sx={{ display: 'flex', alignItems: 'flex-start', flex: idx < steps.length - 1 ? 1 : 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 32,
                  color: isFuture ? 'text.disabled' : '#C9A84C',
                  ...(isActive && {
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
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 600,
                  color: isFuture ? 'text.disabled' : 'text.primary',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </Typography>
            </Box>

            {idx < steps.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 3,
                  mx: 2,
                  mt: 2,
                  backgroundColor: isPast ? '#C9A84C' : 'divider',
                  ...(isActive && {
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


