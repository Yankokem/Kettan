import { Box, Typography, Card, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';

const STEPS = [
  { label: 'Order Processing', description: '3 orders waiting for approval', active: false },
  { label: 'Picking & Packing', description: 'Batch #B-042 in progress', active: true },
  { label: 'Shipping & Delivery', description: '2 riders dispatched currently', active: false },
  { label: 'Order Tracking', description: '1 order arriving shortly at BGC', active: false },
];

export function FulfillmentStepper() {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <AutorenewRoundedIcon sx={{ color: '#546B3F', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
          Daily Fulfillment Status
        </Typography>
      </Box>

      <Stepper activeStep={1} orientation="vertical" sx={{ mt: 1 }}>
        {STEPS.map((step, index) => (
          <Step key={step.label} active={true}>
            <StepLabel
              sx={{
                p: 0,
                '& .MuiStepLabel-label': {
                  fontSize: 13.5,
                  fontWeight: step.active ? 600 : 500,
                  color: step.active ? '#546B3F' : 'text.primary',
                },
                '& .MuiStepIcon-root': {
                  color: step.active ? '#546B3F' : index < 1 ? '#8C6B43' : 'divider',
                  width: 20,
                  height: 20,
                },
              }}
            >
              {step.label}
            </StepLabel>
            <StepContent
              sx={{
                ml: 1.25,
                borderLeft: index === STEPS.length - 1 ? 'none' : '1px solid',
                borderColor: 'divider',
                pt: 0.5,
                pb: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {step.description}
              </Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Card>
  );
}
