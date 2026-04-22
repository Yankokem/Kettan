import { Box, Tabs, Tab } from '@mui/material';
import { StatCard } from '../../components/UI/StatCard';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { DateRangePicker } from '../../components/UI/DateRangePicker';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { BranchLeaderboardTable } from './components/BranchLeaderboardTable';
import { FinancialCostChart } from './components/FinancialCostChart';
import { InvoiceLedger } from './components/InvoiceLedger';
import { useState } from 'react';

const MOCK_BRANCHES = [
  { id: '1', name: 'Downtown Main', fulfillmentRate: 98, returnRate: 1.2, deliverySpeed: 24, stockAccuracy: 99, weightedScore: 95.4 },
  { id: '2', name: 'Uptown Station', fulfillmentRate: 85, returnRate: 4.5, deliverySpeed: 48, stockAccuracy: 88, weightedScore: 72.1 },
  { id: '3', name: 'Westside Market', fulfillmentRate: 92, returnRate: 2.1, deliverySpeed: 36, stockAccuracy: 95, weightedScore: 88.5 },
  { id: '4', name: 'Airport Express', fulfillmentRate: 89, returnRate: 3.5, deliverySpeed: 52, stockAccuracy: 92, weightedScore: 80.2 },
];

const MOCK_INVOICES = [
  { id: 'INV-101', orderId: 'ORD-8891', branchName: 'Downtown Main', date: '2026-04-02', fulfillmentCost: 8540.00, deliveryCost: 120.00, status: 'Paid' },
  { id: 'INV-100', orderId: 'ORD-8890', branchName: 'Uptown Station', date: '2026-04-01', fulfillmentCost: 3200.50, deliveryCost: 85.00, status: 'Processing' },
  { id: 'INV-099', orderId: 'ORD-8889', branchName: 'Westside Market', date: '2026-03-30', fulfillmentCost: 11250.00, deliveryCost: 200.00, status: 'Paid' },
  { id: 'INV-098', orderId: 'ORD-8888', branchName: 'Airport Express', date: '2026-03-29', fulfillmentCost: 5400.00, deliveryCost: 115.00, status: 'Paid' },
];

export function ReportsPage() {
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-04-02');
  const [branchFilter, setBranchFilter] = useState('all');
  const [reportType, setReportType] = useState('full');
  const [exportFormat, setExportFormat] = useState('pdf');

  return (
    <Box sx={{ pb: 3 }}>
      {/* Universal Top Filter Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Dropdown
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value as string)}
            options={[
              { value: 'all', label: 'All Branches' },
              { value: '1', label: 'Downtown Main' },
              { value: '2', label: 'Uptown Station' },
              { value: '3', label: 'Westside Market' },
              { value: '4', label: 'Airport Express' }
            ]}
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
              { value: 'csv', label: 'CSV Spreadsheeet' }
            ]}
            sx={{ minWidth: 140 }}
          />
          <Button startIcon={<DownloadRoundedIcon />}>
            Export
          </Button>
        </Box>
      </Box>

      {/* Tabs for Report View Selection (Visual Only as requested) */}
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
              '&.Mui-selected': { color: 'text.primary' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#C9A84C' }
          }}
        >
          <Tab label="Full System View" value="full" />
          <Tab label="Transactions & Ledgers" value="transactions" />
          <Tab label="Branch Leaderboard" value="leaderboard" />
        </Tabs>
      </Box>

      {/* KPI Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <StatCard
          label="Total Fulfillment Spend"
          value="$145,230"
          trend="up"
          trendValue="+12%"
          icon={<AttachMoneyRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Logistics Expenses"
          value="$8,450"
          trend="down"
          trendValue="-4%"
          icon={<LocalShippingRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Average Order Return"
          value="2.8%"
          trend="down"
          trendValue="-0.5%"
          icon={<ReplayRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Top Performer"
          value="Downtown Main"
          trend="up"
          trendValue="95.4 PTS"
          icon={<EmojiEventsRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #C9A84C 0%, #E8D3A9 100%)"
        />
      </Box>

      {/* Visualizations Floor */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, mb: 2.5, alignItems: 'stretch' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Financial Chart */}
          <FinancialCostChart 
            labels={['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']}
            fulfillmentCostHistory={[12000, 18000, 22000, 19500, 24000, 14500]}
            shippingCostHistory={[800, 1200, 2400, 1100, 2800, 950]}
          />
        </Box>
        <Box sx={{ width: { xs: '100%', xl: 450, lg: 400 }, flexShrink: 0 }}>
          {/* Invoices */}
          <InvoiceLedger invoices={MOCK_INVOICES} />
        </Box>
      </Box>

      {/* Ranked Leaderboard */}
      <BranchLeaderboardTable branches={MOCK_BRANCHES} />
    </Box>
  );
}
