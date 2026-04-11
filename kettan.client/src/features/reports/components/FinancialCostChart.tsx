import { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { LineChart as LineChartIcon } from 'lucide-react';
import { Dropdown } from '../../../components/UI/Dropdown';
import { ChartCard } from '../../../components/charts/ChartCard';
import { LineAreaChart, type ChartDatum, type LineAreaSeries } from '../../../components/charts/LineAreaChart';

interface ChartProps {
  fulfillmentCostHistory: number[];
  shippingCostHistory: number[];
  labels: string[];
}

export function FinancialCostChart({ fulfillmentCostHistory, shippingCostHistory, labels }: ChartProps) {
  const [viewMode, setViewMode] = useState<'fulfillment' | 'shipping' | 'both'>('both');
  const [range, setRange] = useState<'7days' | '30days' | '6months' | 'year'>('6months');

  const sixMonthData = useMemo<ChartDatum[]>(
    () =>
      labels.map((label, index) => ({
        label,
        fulfillment: fulfillmentCostHistory[index] ?? 0,
        shipping: shippingCostHistory[index] ?? 0,
      })),
    [fulfillmentCostHistory, labels, shippingCostHistory]
  );

  const rangeData = useMemo<Record<'7days' | '30days' | '6months' | 'year', ChartDatum[]>>(
    () => ({
      '7days': [
        { label: 'Mon', fulfillment: 4300, shipping: 380 },
        { label: 'Tue', fulfillment: 4800, shipping: 410 },
        { label: 'Wed', fulfillment: 3900, shipping: 350 },
        { label: 'Thu', fulfillment: 5100, shipping: 430 },
        { label: 'Fri', fulfillment: 5600, shipping: 470 },
        { label: 'Sat', fulfillment: 6100, shipping: 530 },
        { label: 'Sun', fulfillment: 4550, shipping: 390 },
      ],
      '30days': [
        { label: 'Wk 1', fulfillment: 17200, shipping: 1390 },
        { label: 'Wk 2', fulfillment: 18800, shipping: 1520 },
        { label: 'Wk 3', fulfillment: 19600, shipping: 1650 },
        { label: 'Wk 4', fulfillment: 20400, shipping: 1710 },
      ],
      '6months': sixMonthData,
      year: [
        { label: 'Jan', fulfillment: 19200, shipping: 1680 },
        { label: 'Feb', fulfillment: 20400, shipping: 1710 },
        { label: 'Mar', fulfillment: 21800, shipping: 1790 },
        { label: 'Apr', fulfillment: 23100, shipping: 1860 },
        { label: 'May', fulfillment: 24600, shipping: 1990 },
        { label: 'Jun', fulfillment: 23900, shipping: 1940 },
        { label: 'Jul', fulfillment: 25400, shipping: 2060 },
        { label: 'Aug', fulfillment: 26750, shipping: 2140 },
        { label: 'Sep', fulfillment: 26100, shipping: 2110 },
        { label: 'Oct', fulfillment: 27500, shipping: 2230 },
        { label: 'Nov', fulfillment: 28400, shipping: 2310 },
        { label: 'Dec', fulfillment: 29200, shipping: 2360 },
      ],
    }),
    [sixMonthData]
  );

  const activeSeries = useMemo<LineAreaSeries[]>(() => {
    if (viewMode === 'fulfillment') {
      return [{ dataKey: 'fulfillment', label: 'Fulfillment Spend', color: '#6B4C2A' }];
    }

    if (viewMode === 'shipping') {
      return [{ dataKey: 'shipping', label: 'Shipping Expense', color: '#F59E0B' }];
    }

    return [
      { dataKey: 'fulfillment', label: 'Fulfillment Spend', color: '#6B4C2A' },
      { dataKey: 'shipping', label: 'Shipping Expense', color: '#F59E0B' },
    ];
  }, [viewMode]);

  const chartData = rangeData[range];

  return (
    <ChartCard
      title="Financial Cost Trends"
      icon={<LineChartIcon size={18} color="#6B4C2A" />}
      actions={
        <>
          <Dropdown
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value as 'fulfillment' | 'shipping' | 'both')}
            options={[
              { value: 'fulfillment', label: 'Fulfillment Costs' },
              { value: 'shipping', label: 'Shipping Expenses' },
              { value: 'both', label: 'Combined View' },
            ]}
            sx={{ minWidth: 165 }}
          />
          <Dropdown
            value={range}
            onChange={(event) => setRange(event.target.value as '7days' | '30days' | '6months' | 'year')}
            options={[
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: '6months', label: 'Last 6 Months' },
              { value: 'year', label: 'This Year' },
            ]}
            sx={{ minWidth: 150 }}
          />
        </>
      }
    >
      <LineAreaChart
        data={chartData}
        series={activeSeries}
        yTickFormatter={(value) => `$${Math.round(value / 1000)}k`}
        tooltipValueFormatter={(value) => `$${value.toLocaleString()}`}
      />

      <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>
          Data span: {range === '6months' ? 'Last 6 Months' : range === '30days' ? 'Last 30 Days' : range === '7days' ? 'Last 7 Days' : 'This Year'}
        </Box>
        <Box sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 700 }}>
          Total: ${chartData.reduce((sum, row) => sum + Number(row.fulfillment ?? 0) + Number(row.shipping ?? 0), 0).toLocaleString()}
        </Box>
      </Box>
    </ChartCard>
  );
}