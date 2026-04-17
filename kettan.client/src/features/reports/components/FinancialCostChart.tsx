import { useMemo, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import SsidChartRoundedIcon from '@mui/icons-material/SsidChartRounded';
import { Dropdown } from '../../../components/UI/Dropdown';

interface ChartProps {
  fulfillmentCostHistory: number[];
  shippingCostHistory: number[];
  labels: string[];
}

type SeriesFilter = 'fulfillment' | 'shipping' | 'both';
type RangeFilter = '7days' | '30days' | '6months' | 'year';

interface DataPoint {
  label: string;
  fulfillment: number;
  shipping: number;
}

function toPeso(value: number): string {
  return value.toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  });
}

export function FinancialCostChart({ fulfillmentCostHistory, shippingCostHistory, labels }: ChartProps) {
  const [seriesFilter, setSeriesFilter] = useState<SeriesFilter>('both');
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('6months');

  const data = useMemo<DataPoint[]>(() => {
    const size = Math.min(labels.length, fulfillmentCostHistory.length, shippingCostHistory.length);
    const rows = Array.from({ length: size }, (_, idx) => ({
      label: labels[idx],
      fulfillment: fulfillmentCostHistory[idx],
      shipping: shippingCostHistory[idx],
    }));

    if (rangeFilter === '7days') return rows.slice(-Math.min(7, rows.length));
    if (rangeFilter === '30days') return rows.slice(-Math.min(30, rows.length));
    if (rangeFilter === 'year') return rows.slice(-Math.min(12, rows.length));
    return rows;
  }, [fulfillmentCostHistory, labels, rangeFilter, shippingCostHistory]);

  const chart = useMemo(() => {
    const width = 780;
    const height = 280;
    const padding = { top: 18, right: 64, bottom: 42, left: 64 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxFulfillment = Math.max(...data.map((point) => point.fulfillment), 1);
    const maxShipping = Math.max(...data.map((point) => point.shipping), 1);

    const fulfillmentAxisMax = Math.ceil(maxFulfillment * 1.1);
    const shippingAxisMax = Math.ceil(maxShipping * 1.15);

    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;
    const x = (index: number) => padding.left + stepX * index;

    const yFulfillment = (value: number) => padding.top + chartHeight - (value / fulfillmentAxisMax) * chartHeight;
    const yShipping = (value: number) => padding.top + chartHeight - (value / shippingAxisMax) * chartHeight;

    const yForSeries = (value: number, series: 'fulfillment' | 'shipping') => {
      if (seriesFilter === 'both') {
        return series === 'fulfillment' ? yFulfillment(value) : yShipping(value);
      }

      if (seriesFilter === 'shipping') {
        return yShipping(value);
      }

      return yFulfillment(value);
    };

    const buildPath = (values: number[], series: 'fulfillment' | 'shipping') => {
      if (!values.length) return '';
      return values
        .map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${yForSeries(value, series)}`)
        .join(' ');
    };

    const fulfillmentPoints = data.map((point) => ({ x: 0, y: 0, value: point.fulfillment }))
      .map((point, idx) => ({ ...point, x: x(idx), y: yForSeries(point.value, 'fulfillment') }));
    const shippingPoints = data.map((point) => ({ x: 0, y: 0, value: point.shipping }))
      .map((point, idx) => ({ ...point, x: x(idx), y: yForSeries(point.value, 'shipping') }));

    return {
      width,
      height,
      padding,
      chartHeight,
      fulfillmentAxisMax,
      shippingAxisMax,
      fulfillmentPath: buildPath(data.map((point) => point.fulfillment), 'fulfillment'),
      shippingPath: buildPath(data.map((point) => point.shipping), 'shipping'),
      fulfillmentPoints,
      shippingPoints,
      x,
    };
  }, [data, seriesFilter]);

  if (!data.length) {
    return (
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 2.5, bgcolor: 'background.paper' }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>No chart data available.</Typography>
      </Card>
    );
  }

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
            value={seriesFilter}
            onChange={(event) => setSeriesFilter(event.target.value as SeriesFilter)}
            options={[
              { value: 'fulfillment', label: 'Fulfillment Costs' },
              { value: 'shipping', label: 'Shipping Expenses' },
              { value: 'both', label: 'Combined View' },
            ]}
            sx={{ width: 150 }}
          />
          <Dropdown
            value={rangeFilter}
            onChange={(event) => setRangeFilter(event.target.value as RangeFilter)}
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

      <Box sx={{ mt: 1 }}>
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} style={{ width: '100%', height: 270, overflow: 'visible' }} preserveAspectRatio="xMidYMid meet">
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
            const leftAxisMax = seriesFilter === 'shipping' ? chart.shippingAxisMax : chart.fulfillmentAxisMax;
            const value = Math.round((leftAxisMax / 4) * (4 - tick));
            const yPosition = chart.padding.top + (chart.chartHeight / 4) * tick;
            return (
              <text key={`tick-left-${tick}`} x={12} y={yPosition + 4} fontSize="11" fill="#8D7B68" fontWeight="600">
                {toPeso(value)}
              </text>
            );
          })}

          {seriesFilter === 'both' &&
            [0, 1, 2, 3, 4].map((tick) => {
              const value = Math.round((chart.shippingAxisMax / 4) * (4 - tick));
              const yPosition = chart.padding.top + (chart.chartHeight / 4) * tick;
              return (
                <text
                  key={`tick-right-${tick}`}
                  x={chart.width - 58}
                  y={yPosition + 4}
                  fontSize="11"
                  fill="#B07A16"
                  fontWeight="600"
                  textAnchor="start"
                >
                  {toPeso(value)}
                </text>
              );
            })}

          {(seriesFilter === 'fulfillment' || seriesFilter === 'both') && (
            <path d={chart.fulfillmentPath} fill="none" stroke="#6B4C2A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {(seriesFilter === 'shipping' || seriesFilter === 'both') && (
            <path d={chart.shippingPath} fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {(seriesFilter === 'fulfillment' || seriesFilter === 'both') &&
            chart.fulfillmentPoints.map((point, idx) => (
              <g key={`fulfillment-point-${idx}`}>
                <circle cx={point.x} cy={point.y} r="4.5" fill="#fff" stroke="#6B4C2A" strokeWidth="2" />
                <title>{`${data[idx].label}: Fulfillment ${toPeso(point.value)}`}</title>
              </g>
            ))}

          {(seriesFilter === 'shipping' || seriesFilter === 'both') &&
            chart.shippingPoints.map((point, idx) => (
              <g key={`shipping-point-${idx}`}>
                <circle cx={point.x} cy={point.y} r="4.5" fill="#fff" stroke="#F59E0B" strokeWidth="2" />
                <title>{`${data[idx].label}: Shipping ${toPeso(point.value)}`}</title>
              </g>
            ))}

          {data.map((point, idx) => (
            <text
              key={`label-${point.label}-${idx}`}
              x={chart.x(idx)}
              y={chart.height - 14}
              textAnchor="middle"
              fontSize="11"
              fill="#8D7B68"
              fontWeight="600"
            >
              {point.label}
            </text>
          ))}
        </svg>
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