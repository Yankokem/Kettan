import { Box, Card, Typography } from '@mui/material';
import SsidChartRoundedIcon from '@mui/icons-material/SsidChartRounded';
import { Dropdown } from '../../../components/UI/Dropdown';

interface ChartProps {
  fulfillmentCostHistory: number[];
  shippingCostHistory: number[];
  labels: string[];
}

export function FinancialCostChart({ fulfillmentCostHistory, shippingCostHistory, labels }: ChartProps) {
  // A simple placeholder for a dynamic chart using basic HTML/CSS flex layout
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', p: 2.5, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SsidChartRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
            Financial Cost Chart
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Dropdown
            defaultValue="fulfillment"
            options={[
              { value: 'fulfillment', label: 'Fulfillment Costs' },
              { value: 'shipping', label: 'Shipping Expenses' },
              { value: 'both', label: 'Combined View' },
            ]}
            sx={{ width: 150 }}
          />
          <Dropdown
            defaultValue="6months"
            options={[
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: '6months', label: 'Last 6 Months' },
              { value: 'year', label: 'This Year' },
            ]}
            sx={{ width: 140 }}
          />
        </Box>
      </Box>
      
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 260, width: '100%', pb: 2, borderBottom: '1px solid', borderColor: 'divider', mt: 1 }}>
        {labels.map((label, idx) => {
          // Normalize visually so it maxes around 90% (leaving standard top padding)
          const maxFulfillTarget = 28000;
          const maxShipTarget = 3200;
          const fulfillHeight = Math.min((fulfillmentCostHistory[idx] / maxFulfillTarget) * 100, 100);
          const shipHeight = Math.min((shippingCostHistory[idx] / maxShipTarget) * 100, 100); // Scaled differently for visibility
          return (
            <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 160, position: 'relative' }}>
                {/* Fulfillment Bar */}
                <Box 
                  sx={{ width: 14, height: `${fulfillHeight}%`, bgcolor: 'primary.main', borderRadius: '4px 4px 0 0', position: 'relative', mb: 0 }} 
                  title={`Fulfillment: $${fulfillmentCostHistory[idx]}`}
                />
                {/* Shipping Bar */}
                <Box 
                  sx={{ width: 14, height: `${shipHeight}%`, bgcolor: '#F59E0B', borderRadius: '4px 4px 0 0', position: 'relative', mb: 0 }} 
                  title={`Shipping: $${shippingCostHistory[idx]}`}
                />
              </Box>
              <Typography variant="caption" sx={{ mt: 1.5, color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 3, mt: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', borderRadius: '50%' }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>Fulfillment Spend</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#F59E0B', borderRadius: '50%' }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>Shipping Expenses</Typography>
        </Box>
      </Box>
    </Card>
  );
}