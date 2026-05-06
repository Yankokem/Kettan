import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Card, CircularProgress } from '@mui/material';
import SsidChartRoundedIcon from '@mui/icons-material/SsidChartRounded';
import { Dropdown } from '../../../components/UI/Dropdown';
import { fetchBranchSalesTrend, fetchHqSupplyTrend } from '../../reports/reportsApi';
import type { TrendPointDto, BranchTrendDto } from '../../reports/reportsApi';
import { useAuthStore } from '../../../store/useAuthStore';

type RangeFilter = '7days' | '30days';

const COLORS = ['#6B4C2A', '#B45309', '#B91C1C', '#059669', '#2563EB', '#7C3AED', '#DB2777'];

export function DashboardChart() {
  const { user } = useAuthStore();
  const isHq = user?.role === 'TenantAdmin' || user?.role === 'HqManager' || user?.role === 'HqStaff';
  
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('7days');
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(760);
  const [hqData, setHqData] = useState<BranchTrendDto[]>([]);
  const [branchData, setBranchData] = useState<TrendPointDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = chartHostRef.current;
    if (!host) return;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.round(entries[0]?.contentRect.width ?? 0);
      if (nextWidth > 0) setChartWidth(nextWidth);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadMetrics = async () => {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (rangeFilter === '30days' ? 30 : 7));

      try {
        setIsLoading(true);
        setError(null);

        if (isHq) {
          const data = await fetchHqSupplyTrend(startDate.toISOString(), endDate.toISOString());
          setHqData(data);
        } else {
          const data = await fetchBranchSalesTrend(startDate.toISOString(), endDate.toISOString());
          setBranchData(data);
        }
      } catch (err) {
        console.error('Chart load error:', err);
        setError('Live report data is not available yet.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadMetrics();
  }, [rangeFilter, isHq]);

  const chart = useMemo(() => {
    const width = Math.max(chartWidth, 520);
    const height = 280;
    const padding = { top: 20, right: 30, bottom: 50, left: 60 };
    const plotWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const allPoints = isHq ? hqData.flatMap(d => d.points) : branchData;
    if (allPoints.length === 0) {
      return { width, height, padding, chartHeight, axisMax: 1, series: [], labels: [] };
    }

    const maxValue = Math.max(...allPoints.map(p => p.value), 1);
    const axisMax = Math.ceil(maxValue * 1.1 / 10) * 10;
    
    const labels = isHq ? (hqData[0]?.points.map(p => p.label) ?? []) : branchData.map(p => p.label);
    const stepX = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;

    const x = (index: number) => padding.left + index * stepX;
    const y = (value: number) => padding.top + chartHeight - (value / axisMax) * chartHeight;

    const series = isHq ? hqData.map((branch, bIdx) => {
      const points = branch.points.map((p, pIdx) => ({ x: x(pIdx), y: y(p.value), value: p.value }));
      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return { name: branch.branchName, color: COLORS[bIdx % COLORS.length], points, linePath };
    }) : [{
      name: 'Sales Revenue',
      color: '#6B4C2A',
      points: branchData.map((p, i) => ({ x: x(i), y: y(p.value), value: p.value })),
      linePath: branchData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ')
    }];

    return { width, height, padding, chartHeight, axisMax, series, labels };
  }, [chartWidth, hqData, branchData, isHq]);

  if (error && !isLoading) {
    return (
      <Card elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>{error}</Typography>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ p: 2.5, height: '100%', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SsidChartRoundedIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary' }}>
            {isHq ? 'Supply Demand Trend' : 'Sales Revenue Trend'}
          </Typography>
        </Box>
        <Dropdown
          value={rangeFilter}
          onChange={(e) => setRangeFilter(e.target.value as RangeFilter)}
          options={[
            { value: '7days', label: 'Last 7 Days' },
            { value: '30days', label: 'Last 30 Days' },
          ]}
          sx={{ minWidth: 140 }}
        />
      </Box>

      <Box ref={chartHostRef} sx={{ flex: 1, minHeight: 260, position: 'relative' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress size={24} sx={{ color: '#6B4C2A' }} />
          </Box>
        ) : (
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((line) => {
              const yPos = chart.padding.top + (chart.chartHeight / 4) * line;
              return (
                <line key={`grid-${line}`} x1={chart.padding.left} y1={yPos} x2={chart.width - chart.padding.right} y2={yPos} stroke="#F0EBE3" strokeDasharray="4 4" />
              );
            })}

            {/* Y Axis labels */}
            {[0, 1, 2, 3, 4].map((tick) => {
              const val = Math.round((chart.axisMax / 4) * (4 - tick));
              const yPos = chart.padding.top + (chart.chartHeight / 4) * tick;
              return (
                <text key={`tick-${tick}`} x={chart.padding.left - 10} y={yPos + 4} textAnchor="end" fontSize="11" fill="#8D7B68" fontWeight="600">
                  {isHq ? val : `₱${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                </text>
              );
            })}

            {/* X Axis labels */}
            {chart.labels.map((label, idx) => {
              const stepX = (chart.width - chart.padding.left - chart.padding.right) / (chart.labels.length - 1);
              const xPos = chart.padding.left + idx * stepX;
              return (
                <text key={`label-${idx}`} x={xPos} y={chart.height - 20} textAnchor="middle" fontSize="11" fill="#8D7B68" fontWeight="600">
                  {label}
                </text>
              );
            })}

            {/* Line series */}
            {chart.series.map((s, sIdx) => (
              <g key={`series-${sIdx}`}>
                <path d={s.linePath} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {s.points.map((p, pIdx) => (
                  <g key={`point-${sIdx}-${pIdx}`}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={s.color} strokeWidth="2" />
                    <title>{`${s.name} (${chart.labels[pIdx]}): ${p.value}`}</title>
                  </g>
                ))}
              </g>
            ))}
          </svg>
        )}
      </Box>

      {isHq && hqData.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {chart.series.map((s, idx) => (
            <Box key={`legend-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>{s.name}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {!isHq && branchData.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>
            Metric: Sales Revenue (PhP)
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6B4C2A', fontWeight: 700 }}>
            Latest: ₱{branchData[branchData.length - 1]?.value.toLocaleString()}
          </Typography>
        </Box>
      )}
    </Card>
  );
}
