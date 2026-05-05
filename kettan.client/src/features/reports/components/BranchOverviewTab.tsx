import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { StatCard } from '../../../components/UI/StatCard';
import { fetchBranchOverview, type BranchOverviewDto } from '../reportsApi';

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface Props { startDate: string; endDate: string; }

const EMPTY: BranchOverviewDto = {
  inventoryValue: 0, totalSkus: 0, totalSupplySpendReceived: 0,
  wastageLoss: 0, performanceScore: 0, rankInChain: 0, totalBranchesInChain: 0,
};

export function BranchOverviewTab({ startDate, endDate }: Props) {
  const [data, setData] = useState<BranchOverviewDto>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchBranchOverview(startDate, endDate)
      .then(setData)
      .catch(() => setData(EMPTY))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        <StatCard
          label="My Inventory Value"
          value={toPeso(data.inventoryValue)}
          trend="neutral"
          trendValue={`${data.totalSkus} SKUs on hand`}
          icon={<InventoryRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Supply Spend Received"
          value={toPeso(data.totalSupplySpendReceived)}
          trend="neutral"
          trendValue="Total HQ fulfillment cost"
          icon={<MonetizationOnRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Wastage Loss"
          value={toPeso(data.wastageLoss)}
          trend={data.wastageLoss > 0 ? 'down' : 'neutral'}
          trendValue="Adjustment write-offs"
          icon={<DeleteSweepRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="My Performance Score"
          value={`${data.performanceScore.toFixed(1)} pts`}
          trend={data.rankInChain === 1 ? 'up' : 'neutral'}
          trendValue={
            data.totalBranchesInChain > 0
              ? `Rank #${data.rankInChain} of ${data.totalBranchesInChain} branches`
              : 'No ranking data'
          }
          icon={<EmojiEventsRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>
    </Box>
  );
}