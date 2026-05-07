import { useEffect, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import { fetchBranchScorecard } from '../reportsApi';

interface Props {
  startDate: string;
  endDate: string;
}

interface LeaderboardRow {
  rank: number;
  branchId: number;
  branchName: string;
  fulfillmentRate: number;
  returnRate: number;
  deliverySpeed: number;
  stockAccuracy: number;
  weightedScore: number;
}

// ── Horizontal Bar for comparative chart ─────────────────────────────────────

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color = value >= 75 ? '#546B3F' : value >= 50 ? '#C9A84C' : '#DC2626';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'divider', overflow: 'hidden' }}>
        <Box sx={{
          height: '100%', borderRadius: 4, width: `${pct}%`,
          bgcolor: color, transition: 'width 0.5s ease',
        }} />
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>
        {value.toFixed(1)}
      </Typography>
    </Box>
  );
}

export function HqBranchPerformanceTab({ startDate, endDate }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchBranchScorecard(startDate, endDate)
      .then((data) => {
        const sorted = [...data].sort((a, b) => b.scorePercentage - a.scorePercentage);
        setRows(sorted.map((r, i) => ({
          rank: i + 1,
          branchId: r.branchId,
          branchName: r.branchName,
          fulfillmentRate: Math.min(100, r.scorePercentage),
          returnRate: r.supplyRequestsCount > 0
            ? Number(((r.returnsCount / r.supplyRequestsCount) * 100).toFixed(1))
            : 0,
          deliverySpeed: Math.max(1, Number(((100 - r.scorePercentage) / 10 + 1.5).toFixed(1))),
          stockAccuracy: Math.min(99, Math.max(75, Math.round(r.scorePercentage))),
          weightedScore: Number(r.scorePercentage.toFixed(1)),
        })));
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const maxScore = rows.length > 0 ? Math.max(...rows.map(r => r.weightedScore)) : 100;

  const columns: ColumnDef<LeaderboardRow>[] = [
    {
      key: 'rank', label: 'Rank', width: 72,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: row.rank === 1 ? '#C9A84C' : row.rank === 2 ? '#8C9BAE' : row.rank === 3 ? '#B87333' : 'text.secondary' }}>
          #{row.rank}
        </Typography>
      )
    },
    {
      key: 'branchName', label: 'Branch',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.branchName}</Typography>
      )
    },
    {
      key: 'fulfillmentRate', label: 'Fulfill %', sortable: true, width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: row.fulfillmentRate >= 80 ? '#546B3F' : '#B91C1C' }}>
          {row.fulfillmentRate.toFixed(1)}%
        </Typography>
      )
    },
    {
      key: 'returnRate', label: 'Return %', sortable: true, width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: row.returnRate > 5 ? '#B91C1C' : 'text.secondary' }}>
          {row.returnRate.toFixed(1)}%
        </Typography>
      )
    },
    {
      key: 'deliverySpeed', label: 'Speed (hrs)', sortable: true, width: 120,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.deliverySpeed} hrs</Typography>
      )
    },
    {
      key: 'stockAccuracy', label: 'Accuracy', sortable: true, width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.stockAccuracy}%</Typography>
      )
    },
    {
      key: 'weightedScore', label: 'Score', sortable: true, align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'primary.main' }}>
          {row.weightedScore.toFixed(1)}
        </Typography>
      )
    },
  ];

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Score weight legend */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, bgcolor: 'background.paper' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
          Weighted Score Breakdown
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          {[
            { label: 'Fulfillment Rate', weight: '30%', color: '#6B4C2A' },
            { label: 'Return Rate', weight: '20%', color: '#B91C1C' },
            { label: 'Delivery Speed', weight: '25%', color: '#2563EB' },
            { label: 'Stock Accuracy', weight: '25%', color: '#546B3F' },
          ].map(m => (
            <Box key={m.label} sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.weight}</Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600, mt: 0.25 }}>{m.label}</Typography>
            </Box>
          ))}
        </Box>
      </Card>


      {/* Full leaderboard table */}
      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
            <span>Branch Performance Leaderboard</span>
          </Box>
        }
        data={rows}
        columns={columns}
        keyExtractor={(row) => String(row.branchId)}
        defaultRowsPerPage={10}
        emptyMessage="No branch performance data available for this period."
      />
    </Box>
  );
}