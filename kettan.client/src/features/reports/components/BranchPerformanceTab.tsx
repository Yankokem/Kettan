import { useEffect, useState } from 'react';
import { Box, Card, Typography, Grid } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import { 
  fetchBranchPerformanceDetail, 
  type BranchPerformanceDetailDto,
  fetchBranchConsumptionAnalytics,
  type ConsumptionAnalyticsDto
} from '../reportsApi';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';

interface Props { startDate: string; endDate: string; }

const EMPTY_PERF: BranchPerformanceDetailDto = {
  weightedScore: 0, fulfillmentRate: 0, returnRate: 0,
  deliverySpeedHrs: 0, stockAccuracy: 0, rankInChain: 0, totalBranches: 0,
};

const EMPTY_CONS: ConsumptionAnalyticsDto = {
  topMenuItems: [],
  ingredientUsage: [],
  shiftBreakdown: [],
};

// ── Gauge SVG ────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const needleX = 100 + 60 * Math.cos(rad);
  const needleY = 100 + 60 * Math.sin(rad);
  const color = score >= 75 ? '#546B3F' : score >= 50 ? '#C9A84C' : '#DC2626';

  return (
    <svg viewBox="0 0 200 120" style={{ width: 200, height: 120 }}>
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E5E7EB" strokeWidth="16" strokeLinecap="round" />
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
        strokeDasharray={`${(score / 100) * 251.2} 251.2`}
      />
      <line x1="100" y1="100" x2={needleX} y2={needleY} stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="100" cy="100" r="5" fill="#374151" />
      <text x="100" y="88" textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>{score.toFixed(1)}</text>
      <text x="100" y="102" textAnchor="middle" fontSize="10" fill="#6B7280">/ 100 pts</text>
    </svg>
  );
}

// ── Metric bar ────────────────────────────────────────────────────────────────

function MetricBar({
  label, value, unit = '%', weight, good = 'high', color,
}: {
  label: string; value: number; unit?: string; weight: string; good?: 'high' | 'low'; color: string;
}) {
  const display = good === 'low'
    ? Math.max(0, 100 - value * 2)
    : value;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{label}</Typography>
          <Box sx={{ px: 1, py: 0.2, borderRadius: 1, bgcolor: `${color}18`, border: `1px solid ${color}40` }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color }}>{weight}</Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>
          {value.toFixed(1)}{unit === 'hrs' ? ' hrs' : '%'}
        </Typography>
      </Box>
      <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'divider', overflow: 'hidden' }}>
        <Box sx={{
          height: '100%', borderRadius: 4,
          width: `${Math.min(display, 100)}%`,
          bgcolor: color,
          transition: 'width 0.6s ease',
        }} />
      </Box>
    </Box>
  );
}

export function BranchPerformanceTab({ startDate, endDate }: Props) {
  const [perfData, setPerfData] = useState<BranchPerformanceDetailDto>(EMPTY_PERF);
  const [consData, setConsData] = useState<ConsumptionAnalyticsDto>(EMPTY_CONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchBranchPerformanceDetail(startDate, endDate),
      fetchBranchConsumptionAnalytics(startDate, endDate)
    ])
      .then(([perf, cons]) => {
        setPerfData(perf);
        setConsData(cons);
      })
      .catch(() => {
        setPerfData(EMPTY_PERF);
        setConsData(EMPTY_CONS);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const topItemsColumns: ColumnDef<any>[] = [
    { key: 'menuItemName', label: 'Item Name', sortable: true, render: (row) => row.menuItemName },
    { key: 'totalSold', label: 'Total Sold', width: 120, align: 'right', sortable: true, render: (row) => row.totalSold },
    { key: 'logCount', label: 'Logs', width: 100, align: 'right', sortable: true, render: (row) => row.logCount },
  ];

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Gauge card */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <SpeedRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>My Performance Score</Typography>
              </Box>
              <ScoreGauge score={perfData.weightedScore} />
              {perfData.totalBranches > 0 && (
                <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                    Ranked{' '}
                    <strong style={{ color: perfData.rankInChain === 1 ? '#C9A84C' : '#374151' }}>
                      #{perfData.rankInChain}
                    </strong>
                    {' '}of {perfData.totalBranches} branches
                  </Typography>
                </Box>
              )}
            </Card>

            {/* Metric breakdown */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEventsRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>Score Breakdown</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <MetricBar label="Fulfillment Rate" value={perfData.fulfillmentRate} weight="30%" good="high" color="#6B4C2A" />
                <MetricBar label="Return Rate" value={perfData.returnRate} weight="20%" good="low" color="#DC2626" />
                <MetricBar label="Delivery Speed" value={perfData.deliverySpeedHrs} unit="hrs" weight="25%" good="low" color="#2563EB" />
                <MetricBar label="Stock Accuracy" value={perfData.stockAccuracy} weight="25%" good="high" color="#546B3F" />
              </Box>
            </Card>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, bgcolor: 'background.paper', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2 }}>
              <RestaurantMenuRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>Top Consumed Items</Typography>
            </Box>
            <DataTable
              data={consData.topMenuItems}
              columns={topItemsColumns}
              keyExtractor={(row) => row.menuItemId.toString()}
              emptyMessage="No consumption data for this period."
              defaultRowsPerPage={8}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
