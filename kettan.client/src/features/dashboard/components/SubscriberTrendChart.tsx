import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Box, Typography, Card, MenuItem, Select, FormControl } from '@mui/material';
import SsidChartRoundedIcon from '@mui/icons-material/SsidChartRounded';

const PIE_COLORS = ['#6B4C2A', '#047857', '#B08B5A', '#2563EB', '#7C3AED'];

interface SubscriberTrendPoint {
  year: number;
  month: number;
  planName: string;
  count: number;
}

interface SubscriberTrendChartProps {
  data: SubscriberTrendPoint[];
  timeScope: string;
  onTimeScopeChange: (scope: string) => void;
}

export function SubscriberTrendChart({ data, timeScope, onTimeScopeChange }: SubscriberTrendChartProps) {
  
  const chartData = useMemo(() => {
    const groups: Record<string, any> = {};
    const planNames = new Set<string>();

    // Initialize last 6 months to ensure chart layout exists
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      groups[label] = { name: label };
    }

    data.forEach(p => {
      const date = new Date(p.year, p.month - 1);
      const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (groups[label]) {
        groups[label][p.planName] = (groups[label][p.planName] || 0) + p.count;
        planNames.add(p.planName);
      }
    });

    const formattedData = Object.values(groups);
    const plans = Array.from(planNames);

    // CRITICAL FIX: Recharts WILL NOT render axes or grids if there are no data keys.
    // If we have no subscription data yet, we inject a dummy zero-value plan.
    if (plans.length === 0) {
      plans.push('No Subscriptions');
      formattedData.forEach(d => d['No Subscriptions'] = 0);
    }

    return {
      formattedData,
      planNames: plans
    };
  }, [data]);

  return (
    <Card 
      elevation={0} 
      sx={{ 
        p: 3, 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: '14px', 
        flex: 1,
        bgcolor: '#fff', // Changed to white
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          {/* Raw Icon (no encapsulation) */}
          <SsidChartRoundedIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#3E2723' }}>New Subscribers</Typography>
            {/* Description removed */}
          </Box>
        </Box>

        <FormControl size="small">
          <Select
            value={timeScope}
            onChange={(e) => onTimeScopeChange(e.target.value)}
            sx={{ 
              fontSize: 12, 
              fontWeight: 600, 
              bgcolor: '#fff',
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(107,76,42,0.2)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B4C2A' },
            }}
          >
            <MenuItem value="weekly" sx={{ fontSize: 12, fontWeight: 500 }}>Weekly</MenuItem>
            <MenuItem value="monthly" sx={{ fontSize: 12, fontWeight: 500 }}>Monthly</MenuItem>
            <MenuItem value="annual" sx={{ fontSize: 12, fontWeight: 500 }}>Annual</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: 1, minHeight: 300 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107,76,42,0.08)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8C6B43', fontSize: 11, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8C6B43', fontSize: 11, fontWeight: 600 }}
            />
            <RechartsTooltip 
              cursor={{ fill: 'rgba(107,76,42,0.04)' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 8px 24px rgba(46,31,12,0.12)',
                padding: '12px'
              }}
              itemStyle={{ fontSize: 12, fontWeight: 600 }}
              labelStyle={{ fontSize: 11, color: '#8C6B43', marginBottom: '4px', fontWeight: 700 }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ paddingBottom: '20px', fontSize: 12, fontWeight: 600 }}
            />
            {chartData.planNames.length > 0 ? (
              chartData.planNames.map((name, index) => (
                <Bar 
                  key={name} 
                  dataKey={name} 
                  stackId="a" 
                  fill={PIE_COLORS[index % PIE_COLORS.length]} 
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              ))
            ) : (
              // Fallback bar if no plans exist yet
              <Bar dataKey="Placeholder" stackId="a" fill="transparent" barSize={32} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}
