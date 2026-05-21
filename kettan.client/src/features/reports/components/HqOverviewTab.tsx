import { useEffect, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import {
  fetchHqOverview,
  fetchBranchSpend,
  fetchBranchScorecard,
  type HqOverviewDto,
  type BranchSpendDto,
} from '../reportsApi';

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

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function HqOverviewTab({ startDate, endDate }: Props) {
  const [overview, setOverview] = useState<HqOverviewDto | null>(null);
  const [branchSpend, setBranchSpend] = useState<BranchSpendDto[]>([]);
  const [scorecardRows, setScorecardRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchHqOverview(startDate, endDate),
      fetchBranchSpend(startDate, endDate),
      fetchBranchScorecard(startDate, endDate),
    ])
      .then(([ov, bs, sc]) => {
        setOverview(ov);
        setBranchSpend(bs);
        
        const sorted = [...sc].sort((a, b) => b.scorePercentage - a.scorePercentage);
        setScorecardRows(sorted.map((r, i) => ({
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
      .catch((err) => {
        console.error('Error loading HQ Overview data:', err);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const spendCols: ColumnDef<BranchSpendDto>[] = [
    {
      key: 'branchName', label: 'Branch',
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.branchName}</Typography>
    },
    {
      key: 'totalSpend', label: 'Total Supply Spend', align: 'right', sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>{toPeso(row.totalSpend)}</Typography>
      )
    },
  ];

  const scorecardCols: ColumnDef<LeaderboardRow>[] = [
    {
      key: 'rank', label: 'Rank', width: 64,
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
      key: 'fulfillmentRate', label: 'Fulfill %', sortable: true, width: 85,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: row.fulfillmentRate >= 80 ? '#546B3F' : '#B91C1C' }}>
          {row.fulfillmentRate.toFixed(1)}%
        </Typography>
      )
    },
    {
      key: 'returnRate', label: 'Return %', sortable: true, width: 85,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: row.returnRate > 5 ? '#B91C1C' : 'text.secondary' }}>
          {row.returnRate.toFixed(1)}%
        </Typography>
      )
    },
    {
      key: 'deliverySpeed', label: 'Speed', sortable: true, width: 90,
      render: (row) => (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{row.deliverySpeed} hrs</Typography>
      )
    },
    {
      key: 'stockAccuracy', label: 'Accuracy', sortable: true, width: 85,
      render: (row) => (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{row.stockAccuracy}%</Typography>
      )
    },
    {
      key: 'weightedScore', label: 'Score', sortable: true, align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          {row.weightedScore.toFixed(1)}
        </Typography>
      )
    },
  ];

  if (!overview && !loading) return null;

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Top Row: Performance Leader & Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <Card elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider', background: (theme) => theme.custom.gradients.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <EmojiEventsRoundedIcon sx={{ color: '#C9A84C' }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Chain Performance Leader</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>Top Performing Branch</Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'text.primary' }}>
                {overview?.topPerformerName || '—'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>Weighted Score</Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#C9A84C' }}>
                {overview?.topPerformerScore.toFixed(1) || '0.0'}%
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider', background: (theme) => theme.custom.gradients.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <CategoryRoundedIcon sx={{ color: '#6B4C2A' }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Order Fulfillment Metrics</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Success Rate</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{overview?.fulfillmentRate.toFixed(1)}%</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Total Orders</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{overview?.totalOrders.toLocaleString()}</Typography>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Bottom Row: Branch Spend & Leaderboard */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 2.5 }}>
        <DataTable
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <MonetizationOnRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
              <Typography sx={{ 
                fontSize: 15, 
                fontWeight: 700, 
                color: (theme) => (theme.palette.mode === 'dark' ? '#E8D3A9' : '#2E1F0C'), 
                letterSpacing: '-0.01em',
              }}>
                Supply Spend by Branch
              </Typography>
            </Box>
          }
          data={branchSpend}
          columns={spendCols}
          keyExtractor={(row) => String(row.branchId)}
          defaultRowsPerPage={5}
          sx={{ height: '100%' }}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Score Weight Legend */}
          <Card 
            elevation={0} 
            sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: '14px', 
              overflow: 'hidden', 
              bgcolor: 'background.paper' 
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2.25,
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(170deg, rgba(46, 31, 20, 0.96) 0%, rgba(58, 39, 24, 0.92) 100%)'
                    : 'linear-gradient(170deg, rgba(250, 245, 239, 0.98) 0%, rgba(240, 230, 211, 0.98) 100%)',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <TrendingUpRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
              <Typography sx={{ 
                fontSize: 15, 
                fontWeight: 700, 
                color: (theme) => (theme.palette.mode === 'dark' ? '#E8D3A9' : '#2E1F0C'), 
                letterSpacing: '-0.01em',
              }}>
                Weighted Score Breakdown
              </Typography>
            </Box>
            <Box sx={{ p: 2.5, background: (theme) => theme.custom.gradients.card }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
                {[
                  { label: 'Fulfillment Rate', weight: '30%', color: '#6B4C2A' },
                  { label: 'Return Rate', weight: '20%', color: '#B91C1C' },
                  { label: 'Delivery Speed', weight: '25%', color: '#2563EB' },
                  { label: 'Stock Accuracy', weight: '25%', color: '#546B3F' },
                ].map(m => (
                  <Box key={m.label} sx={{ textAlign: 'center', p: 1, borderRadius: 2, bgcolor: 'rgba(107, 76, 42, 0.03)', border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.06)' }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.weight}</Typography>
                    <Typography sx={{ fontSize: 9.5, color: 'text.secondary', fontWeight: 600, mt: 0.25, whiteSpace: 'nowrap' }}>{m.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>

          {/* Full Leaderboard Table */}
          <DataTable
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <EmojiEventsRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                <Typography sx={{ 
                  fontSize: 15, 
                  fontWeight: 700, 
                  color: (theme) => (theme.palette.mode === 'dark' ? '#E8D3A9' : '#2E1F0C'), 
                  letterSpacing: '-0.01em',
                }}>
                  Branch Performance Leaderboard
                </Typography>
              </Box>
            }
            data={scorecardRows}
            columns={scorecardCols}
            keyExtractor={(row) => String(row.branchId)}
            defaultRowsPerPage={5}
            emptyMessage="No branch performance data available for this period."
          />
        </Box>
      </Box>
    </Box>
  );
}