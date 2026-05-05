import { useEffect, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';

import { StatCard } from '../../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import {
  fetchHqOverview,
  fetchCostTrend,
  fetchBranchSpend,
  type HqOverviewDto,
  type CostTrendPointDto,
  type BranchSpendDto,
} from '../reportsApi';

interface Props {
  startDate: string;
  endDate: string;
}

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function HqOverviewTab({ startDate, endDate }: Props) {
  const [overview, setOverview] = useState<HqOverviewDto | null>(null);
  const [costTrend, setCostTrend] = useState<CostTrendPointDto[]>([]);
  const [branchSpend, setBranchSpend] = useState<BranchSpendDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchHqOverview(startDate, endDate),
      fetchCostTrend(startDate, endDate),
      fetchBranchSpend(startDate, endDate),
    ])
      .then(([ov, ct, bs]) => {
        setOverview(ov);
        setCostTrend(ct);
        setBranchSpend(bs);
      })
      .catch(() => {})
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

  if (!overview && !loading) return null;

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        <StatCard
          label="Total Fulfillment Cost"
          value={toPeso(overview?.totalFulfillmentCost ?? 0)}
          trend="neutral"
          trendValue="Chain-wide supply spend"
          icon={<MonetizationOnRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Chain Inventory Value"
          value={toPeso(overview?.totalChainInventoryValue ?? 0)}
          trend="neutral"
          trendValue="HQ + All Branches"
          icon={<InventoryRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Total Wastage Loss"
          value={toPeso(overview?.totalWastageLoss ?? 0)}
          trend="down"
          trendValue="Spoilage & adjustments"
          icon={<DeleteSweepRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Returns Credit Loss"
          value={toPeso(overview?.totalReturnLoss ?? 0)}
          trend="down"
          trendValue="Customer/Branch credits"
          icon={<AssignmentReturnRoundedIcon />}
          accentClass="stat-accent-rust"
          iconBg="linear-gradient(135deg, #D48C6B 0%, #EAA989 100%)"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 2.5 }}>
        {/* Performance & Fulfillment */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
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

          <Card elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
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

        {/* Branch Spend Table */}
        <DataTable
          title="Supply Spend by Branch"
          data={branchSpend}
          columns={spendCols}
          keyExtractor={(row) => String(row.branchId)}
          defaultRowsPerPage={5}
        />
      </Box>

      {/* Simple Cost Trend Visualization */}
      <Card elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Monthly Fulfillment Cost Trend</Typography>
        <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 2, px: 2 }}>
          {costTrend.map((pt, i) => {
            const max = Math.max(...costTrend.map(c => c.fulfillmentCost), 1);
            const height = (pt.fulfillmentCost / max) * 100;
            return (
              <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: '100%', 
                  height: `${height}%`, 
                  minHeight: 4,
                  bgcolor: '#6B4C2A', 
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease',
                  '&:hover': { bgcolor: '#C9A84C' }
                }} />
                <Typography sx={{ fontSize: 10, color: 'text.secondary', transform: 'rotate(-45deg)', mt: 1 }}>{pt.label}</Typography>
              </Box>
            );
          })}
        </Box>
      </Card>
    </Box>
  );
}