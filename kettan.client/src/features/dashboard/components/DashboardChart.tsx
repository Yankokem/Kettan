import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { LineChart as LineChartIcon } from 'lucide-react';
import { Dropdown } from '../../../components/UI/Dropdown';
import { ChartCard } from '../../../components/charts/ChartCard';
import {
  LineAreaChart,
  type ChartDatum,
  type LineAreaSeries,
} from '../../../components/charts/LineAreaChart';

type MetricKey = 'orders' | 'inventory' | 'returns';
type RangeKey = '7days' | '30days' | 'year';

const metricOptions: { value: MetricKey; label: string }[] = [
  { value: 'orders', label: 'Orders Fulfilled' },
  { value: 'inventory', label: 'Inventory Issues' },
  { value: 'returns', label: 'Return Requests' },
];

const rangeOptions: { value: RangeKey; label: string }[] = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'year', label: 'This Year' },
];

const chartSeriesByMetric: Record<MetricKey, LineAreaSeries[]> = {
  orders: [{ dataKey: 'value', label: 'Fulfilled Orders', color: '#6B4C2A' }],
  inventory: [{ dataKey: 'value', label: 'Inventory Issues', color: '#B45309' }],
  returns: [{ dataKey: 'value', label: 'Return Requests', color: '#B91C1C' }],
};

const chartDataByMetric: Record<MetricKey, Record<RangeKey, ChartDatum[]>> = {
  orders: {
    '7days': [
      { label: 'Mon', value: 14 },
      { label: 'Tue', value: 19 },
      { label: 'Wed', value: 17 },
      { label: 'Thu', value: 26 },
      { label: 'Fri', value: 31 },
      { label: 'Sat', value: 28 },
      { label: 'Sun', value: 24 },
    ],
    '30days': [
      { label: 'Wk 1', value: 106 },
      { label: 'Wk 2', value: 118 },
      { label: 'Wk 3', value: 142 },
      { label: 'Wk 4', value: 135 },
    ],
    year: [
      { label: 'Jan', value: 352 },
      { label: 'Feb', value: 388 },
      { label: 'Mar', value: 412 },
      { label: 'Apr', value: 435 },
      { label: 'May', value: 448 },
      { label: 'Jun', value: 472 },
      { label: 'Jul', value: 490 },
      { label: 'Aug', value: 514 },
      { label: 'Sep', value: 501 },
      { label: 'Oct', value: 526 },
      { label: 'Nov', value: 541 },
      { label: 'Dec', value: 558 },
    ],
  },
  inventory: {
    '7days': [
      { label: 'Mon', value: 7 },
      { label: 'Tue', value: 9 },
      { label: 'Wed', value: 6 },
      { label: 'Thu', value: 5 },
      { label: 'Fri', value: 8 },
      { label: 'Sat', value: 4 },
      { label: 'Sun', value: 6 },
    ],
    '30days': [
      { label: 'Wk 1', value: 33 },
      { label: 'Wk 2', value: 27 },
      { label: 'Wk 3', value: 31 },
      { label: 'Wk 4', value: 24 },
    ],
    year: [
      { label: 'Jan', value: 122 },
      { label: 'Feb', value: 118 },
      { label: 'Mar', value: 127 },
      { label: 'Apr', value: 111 },
      { label: 'May', value: 104 },
      { label: 'Jun', value: 96 },
      { label: 'Jul', value: 109 },
      { label: 'Aug', value: 102 },
      { label: 'Sep', value: 93 },
      { label: 'Oct', value: 88 },
      { label: 'Nov', value: 84 },
      { label: 'Dec', value: 81 },
    ],
  },
  returns: {
    '7days': [
      { label: 'Mon', value: 1 },
      { label: 'Tue', value: 2 },
      { label: 'Wed', value: 2 },
      { label: 'Thu', value: 1 },
      { label: 'Fri', value: 3 },
      { label: 'Sat', value: 2 },
      { label: 'Sun', value: 1 },
    ],
    '30days': [
      { label: 'Wk 1', value: 7 },
      { label: 'Wk 2', value: 6 },
      { label: 'Wk 3', value: 8 },
      { label: 'Wk 4', value: 5 },
    ],
    year: [
      { label: 'Jan', value: 23 },
      { label: 'Feb', value: 20 },
      { label: 'Mar', value: 24 },
      { label: 'Apr', value: 22 },
      { label: 'May', value: 21 },
      { label: 'Jun', value: 18 },
      { label: 'Jul', value: 17 },
      { label: 'Aug', value: 19 },
      { label: 'Sep', value: 16 },
      { label: 'Oct', value: 15 },
      { label: 'Nov', value: 14 },
      { label: 'Dec', value: 13 },
    ],
  },
};

export function DashboardChart() {
  const [metric, setMetric] = useState<MetricKey>('orders');
  const [range, setRange] = useState<RangeKey>('7days');

  const data = useMemo(() => chartDataByMetric[metric][range], [metric, range]);
  const latestPoint = data[data.length - 1];

  return (
    <ChartCard
      title="System Analytics"
      icon={<LineChartIcon size={18} color="#6B4C2A" />}
      actions={
        <>
          <Dropdown
            value={metric}
            onChange={(event) => setMetric(event.target.value as MetricKey)}
            options={metricOptions}
            sx={{ minWidth: 178 }}
          />
          <Dropdown
            value={range}
            onChange={(event) => setRange(event.target.value as RangeKey)}
            options={rangeOptions}
            sx={{ minWidth: 145 }}
          />
        </>
      }
    >
      <LineAreaChart
        data={data}
        series={chartSeriesByMetric[metric]}
        yTickFormatter={(value) => value.toLocaleString()}
        tooltipValueFormatter={(value) => `${value.toLocaleString()} items`}
      />

      <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>
          Latest point: <strong>{latestPoint?.label}</strong>
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 700 }}>
          {metricOptions.find((entry) => entry.value === metric)?.label}: {Number(latestPoint?.value ?? 0).toLocaleString()}
        </Typography>
      </Box>
    </ChartCard>
  );
}
