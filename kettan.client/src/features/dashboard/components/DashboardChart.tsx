import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Card } from '@mui/material';
import SsidChartRoundedIcon from '@mui/icons-material/SsidChartRounded';
import { Dropdown } from '../../../components/UI/Dropdown';

type SeriesFilter = 'orders' | 'inventory' | 'returns';
type RangeFilter = '7days' | '30days';

interface MetricPoint {
  label: string;
  orders: number;
  inventory: number;
  returns: number;
}

const METRICS: MetricPoint[] = [
  { label: 'Mon', orders: 43, inventory: 8, returns: 3 },
  { label: 'Tue', orders: 48, inventory: 6, returns: 2 },
  { label: 'Wed', orders: 52, inventory: 7, returns: 4 },
  { label: 'Thu', orders: 58, inventory: 5, returns: 3 },
  { label: 'Fri', orders: 62, inventory: 4, returns: 2 },
  { label: 'Sat', orders: 55, inventory: 6, returns: 4 },
  { label: 'Sun', orders: 50, inventory: 5, returns: 3 },
  { label: 'W2-M', orders: 60, inventory: 4, returns: 2 },
  { label: 'W2-T', orders: 64, inventory: 3, returns: 2 },
  { label: 'W2-W', orders: 67, inventory: 4, returns: 1 },
  { label: 'W2-T', orders: 69, inventory: 3, returns: 2 },
  { label: 'W2-F', orders: 72, inventory: 2, returns: 1 },
  { label: 'W2-S', orders: 66, inventory: 4, returns: 2 },
  { label: 'W2-S', orders: 61, inventory: 5, returns: 3 },
];

const SERIES_META: Record<SeriesFilter, { label: string; color: string }> = {
  orders: { label: 'Orders Fulfilled', color: '#6B4C2A' },
  inventory: { label: 'Inventory Issues', color: '#B45309' },
  returns: { label: 'Return Requests', color: '#B91C1C' },
};

export function DashboardChart() {
  const [seriesFilter, setSeriesFilter] = useState<SeriesFilter>('orders');
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('7days');
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(760);

  useEffect(() => {
    const host = chartHostRef.current;

    if (!host) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.round(entries[0]?.contentRect.width ?? 0);

      if (nextWidth > 0) {
        setChartWidth(nextWidth);
      }
    });

    observer.observe(host);

    return () => {
      observer.disconnect();
    };
  }, []);

  const data = useMemo(() => {
    if (rangeFilter === '30days') {
      return METRICS;
    }

    return METRICS.slice(-7);
  }, [rangeFilter]);

  const chart = useMemo(() => {
    const width = Math.max(chartWidth, 520);
    const height = 250;
    const padding = { top: 18, right: 22, bottom: 44, left: 44 };
    const plotWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map((point) => point[seriesFilter]);
    const maxValue = Math.max(...values, 1);
    const axisMax = Math.ceil(maxValue * 1.2);
    const stepX = values.length > 1 ? plotWidth / (values.length - 1) : 0;

    const x = (index: number) => padding.left + index * stepX;
    const y = (value: number) => padding.top + chartHeight - (value / axisMax) * chartHeight;

    const points = values.map((value, index) => ({ x: x(index), y: y(value), value }));
    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = `${linePath} L ${x(values.length - 1)} ${padding.top + chartHeight} L ${x(0)} ${padding.top + chartHeight} Z`;

    return {
      width,
      height,
      padding,
      chartHeight,
      axisMax,
      points,
      linePath,
      areaPath,
    };
  }, [chartWidth, data, seriesFilter]);

  const seriesMeta = SERIES_META[seriesFilter];

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SsidChartRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
            Operations Trend
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Dropdown
            value={seriesFilter}
            onChange={(event) => setSeriesFilter(event.target.value as SeriesFilter)}
            options={[
              { value: 'orders', label: 'Orders Fulfilled' },
              { value: 'inventory', label: 'Inventory Issues' },
              { value: 'returns', label: 'Return Requests' },
            ]}
            sx={{ minWidth: 170 }}
          />

          <Dropdown
            value={rangeFilter}
            onChange={(event) => setRangeFilter(event.target.value as RangeFilter)}
            options={[
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
            ]}
            sx={{ minWidth: 150 }}
          />
        </Box>
      </Box>

      <Box ref={chartHostRef} sx={{ flex: 1, minHeight: 240, width: '100%', mt: 1 }}>
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} style={{ width: '100%', height: 250, overflow: 'visible' }} preserveAspectRatio="xMidYMid meet">
          {[0, 1, 2, 3, 4].map((line) => {
            const yPosition = chart.padding.top + (chart.chartHeight / 4) * line;
            return (
              <line
                key={`grid-${line}`}
                x1={chart.padding.left}
                y1={yPosition}
                x2={chart.width - chart.padding.right}
                y2={yPosition}
                stroke="#E7E1D8"
                strokeWidth="1"
                strokeDasharray="4 5"
              />
            );
          })}

          {[0, 1, 2, 3, 4].map((tick) => {
            const value = Math.round((chart.axisMax / 4) * (4 - tick));
            const yPosition = chart.padding.top + (chart.chartHeight / 4) * tick;
            return (
              <text key={`tick-${tick}`} x={8} y={yPosition + 4} fontSize="11" fill="#8D7B68" fontWeight="600">
                {value}
              </text>
            );
          })}

          <path d={chart.areaPath} fill={seriesMeta.color} opacity="0.12" />
          <path d={chart.linePath} fill="none" stroke={seriesMeta.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {chart.points.map((point, idx) => (
            <g key={`point-${idx}`}>
              <circle cx={point.x} cy={point.y} r="4.5" fill="#fff" stroke={seriesMeta.color} strokeWidth="2" />
              <title>{`${data[idx].label}: ${point.value}`}</title>
            </g>
          ))}

          {data.map((point, idx) => (
            <text
              key={`label-${point.label}-${idx}`}
              x={chart.points[idx]?.x ?? 0}
              y={chart.height - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#8D7B68"
              fontWeight="600"
            >
              {point.label}
            </text>
          ))}
        </svg>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
            Metric: {seriesMeta.label}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: seriesMeta.color, fontWeight: 700 }}>
            Latest: {data[data.length - 1]?.[seriesFilter] ?? 0}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
