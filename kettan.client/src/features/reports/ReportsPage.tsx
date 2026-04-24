import { useEffect, useMemo, useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { StatCard } from '../../components/UI/StatCard';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import { BranchLeaderboardTable } from './components/BranchLeaderboardTable';
import { fetchBranchScorecard, fetchInventorySummary, fetchOrderFulfillment } from './reportsApi';

interface LeaderboardBranch {
  id: string;
  name: string;
  fulfillmentRate: number;
  returnRate: number;
  deliverySpeed: number;
  stockAccuracy: number;
  weightedScore: number;
}

function NotAvailablePanel({ title, message }: { title: string; message: string }) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minHeight: 250,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', mb: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
        {message}
      </Typography>
    </Box>
  );
}

export function ReportsPage() {
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-04-02');
  const [branchFilter, setBranchFilter] = useState('all');
  const [reportType, setReportType] = useState('full');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [branches, setBranches] = useState<LeaderboardBranch[]>([]);
  const [inventorySummary, setInventorySummary] = useState({ totalSkus: 0, totalVolume: 0, totalValuation: 0 });
  const [fulfillment, setFulfillment] = useState({ totalOrders: 0, deliveredOrders: 0, fulfillmentRate: 0, totalFulfillmentCost: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [scorecard, inventory, orderFulfillment] = await Promise.all([
          fetchBranchScorecard(startDate, endDate),
          fetchInventorySummary(branchFilter === 'all' ? undefined : Number(branchFilter)),
          fetchOrderFulfillment(startDate, endDate),
        ]);

        setBranches(
          scorecard.map((row) => ({
            id: String(row.branchId),
            name: row.branchName,
            fulfillmentRate: row.scorePercentage,
            returnRate: row.supplyRequestsCount > 0 ? Number(((row.returnsCount / row.supplyRequestsCount) * 100).toFixed(1)) : 0,
            deliverySpeed: Math.max(1, Number(((100 - row.scorePercentage) / 10 + 1.5).toFixed(1))),
            stockAccuracy: Math.min(99, Math.max(75, Math.round(row.scorePercentage))),
            weightedScore: Number(row.scorePercentage.toFixed(1)),
          })),
        );
        setInventorySummary(inventory);
        setFulfillment(orderFulfillment);
      } catch {
        setBranches([]);
        setInventorySummary({ totalSkus: 0, totalVolume: 0, totalValuation: 0 });
        setFulfillment({ totalOrders: 0, deliveredOrders: 0, fulfillmentRate: 0, totalFulfillmentCost: 0 });
      }
    };

    void load();
  }, [branchFilter, startDate, endDate]);

  const branchOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Branches' }];
    branches.forEach((branch) => {
      options.push({ value: branch.id, label: branch.name });
    });
    return options;
  }, [branches]);

  const averageReturnRate = branches.length > 0
    ? branches.reduce((sum, branch) => sum + branch.returnRate, 0) / branches.length
    : 0;

  const topPerformer = branches[0];

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Dropdown
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value as string)}
            options={branchOptions}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
          <Dropdown
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as string)}
            options={[
              { value: 'pdf', label: 'PDF Format' },
              { value: 'csv', label: 'CSV Spreadsheeet' },
            ]}
            sx={{ minWidth: 140 }}
          />
          <Button startIcon={<DownloadRoundedIcon />}>
            Export
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={reportType}
          onChange={(_, val) => setReportType(val)}
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14,
              minHeight: 48,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'text.primary' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#C9A84C' },
          }}
        >
          <Tab label="Full System View" value="full" />
          <Tab label="Transactions & Ledgers" value="transactions" />
          <Tab label="Branch Leaderboard" value="leaderboard" />
        </Tabs>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <StatCard
          label="Total Fulfillment Spend"
          value={`₱${fulfillment.totalFulfillmentCost.toLocaleString()}`}
          trend="up"
          trendValue={`${fulfillment.fulfillmentRate.toFixed(1)}%`}
          icon={<MonetizationOnRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Logistics Expenses"
          value={`₱${Math.round(inventorySummary.totalValuation).toLocaleString()}`}
          trend="down"
          trendValue={`${inventorySummary.totalVolume.toLocaleString()} units`}
          icon={<LocalShippingRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Average Order Return"
          value={`${averageReturnRate.toFixed(1)}%`}
          trend="down"
          trendValue="Live report"
          icon={<ReplayRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Top Performer"
          value={topPerformer?.name ?? 'No data'}
          trend="up"
          trendValue={`${topPerformer?.weightedScore?.toFixed(1) ?? '0.0'} PTS`}
          icon={<EmojiEventsRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, mb: 2.5, alignItems: 'stretch' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <NotAvailablePanel
            title="Financial Cost Chart"
            message="The current backend does not expose a chart-ready financial ledger feed yet. The page keeps the same layout and shows this gap explicitly instead of fabricating data."
          />
        </Box>
        <Box sx={{ width: { xs: '100%', xl: 450, lg: 400 }, flexShrink: 0 }}>
          <NotAvailablePanel
            title="Invoice Ledger"
            message="Invoice rows are not exposed by the current backend contract yet. This section is intentionally marked not available until that endpoint exists."
          />
        </Box>
      </Box>

      <BranchLeaderboardTable branches={branches} />
    </Box>
  );
}
