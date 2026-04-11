import { useId } from 'react';
import { Box, Typography } from '@mui/material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ChartDatum {
  label: string;
  [key: string]: string | number;
}

export interface LineAreaSeries {
  dataKey: string;
  label: string;
  color: string;
  strokeWidth?: number;
  fillOpacity?: number;
}

interface LineAreaChartProps {
  data: ChartDatum[];
  series: LineAreaSeries[];
  xKey?: string;
  height?: number;
  yTickFormatter?: (value: number) => string;
  tooltipValueFormatter?: (value: number, seriesKey: string) => string;
  showLegend?: boolean;
}

export function LineAreaChart({
  data,
  series,
  xKey = 'label',
  height = 280,
  yTickFormatter,
  tooltipValueFormatter,
  showLegend = true,
}: LineAreaChartProps) {
  const gradientSeed = useId().replace(/:/g, '');

  return (
    <Box sx={{ width: '100%', minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            {series.map((entry) => (
              <linearGradient
                key={entry.dataKey}
                id={`${gradientSeed}-${entry.dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={entry.color} stopOpacity={entry.fillOpacity ?? 0.32} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid stroke="#E7E5E4" strokeDasharray="4 4" vertical={false} />

          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#78716C', fontSize: 11, fontWeight: 600 }}
            dy={6}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#78716C', fontSize: 11, fontWeight: 600 }}
            tickFormatter={yTickFormatter}
            width={48}
          />

          <Tooltip
            cursor={{ stroke: '#D6D3D1', strokeDasharray: '4 4' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E7E5E4',
              boxShadow: '0 8px 24px rgba(28,25,23,0.08)',
              padding: '10px 12px',
            }}
            labelStyle={{ color: '#292524', fontWeight: 700, marginBottom: 6 }}
            formatter={(rawValue, name) => {
              const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
              const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
              const output = tooltipValueFormatter ? tooltipValueFormatter(safeValue, String(name)) : safeValue.toLocaleString();

              return [
                <Typography component="span" key={`${name}-value`} sx={{ color: '#44403C', fontSize: 12, fontWeight: 600 }}>
                  {output}
                </Typography>,
                String(name),
              ];
            }}
          />

          {showLegend ? (
            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: '#57534E', fontSize: 12, fontWeight: 600 }}>{value}</span>
              )}
            />
          ) : null}

          {series.map((entry) => (
            <Area
              key={entry.dataKey}
              type="monotone"
              dataKey={entry.dataKey}
              name={entry.label}
              stroke={entry.color}
              strokeWidth={entry.strokeWidth ?? 2.5}
              fill={`url(#${gradientSeed}-${entry.dataKey})`}
              dot={{ r: 3, strokeWidth: 2, fill: '#FFFFFF' }}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
