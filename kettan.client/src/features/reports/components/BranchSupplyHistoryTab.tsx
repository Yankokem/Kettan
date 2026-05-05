import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { StatCard } from '../../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import {
  fetchBranchSupplyHistory,
  type BranchSupplyHistoryDto,
} from '../reportsApi';

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Delivered:   { bg: 'rgba(84,107,63,0.12)',  text: '#546B3F' },
  InTransit:   { bg: 'rgba(37,99,235,0.10)',  text: '#2563EB' },
  Processing:  { bg: 'rgba(201,168,76,0.15)', text: '#9A6F00' },
  Approved:    { bg: 'rgba(37,99,235,0.08)',  text: '#1D4ED8' },
  Cancelled:   { bg: 'rgba(220,38,38,0.10)',  text: '#DC2626' },
  Rejected:    { bg: 'rgba(107,114,128,0.12)', text: '#6B7280' },
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  High:   { bg: 'rgba(220,38,38,0.10)',  text: '#DC2626' },
  Normal: { bg: 'rgba(107,114,128,0.10)', text: '#6B7280' },
  Low:    { bg: 'rgba(84,107,63,0.10)',   text: '#546B3F' },
};

interface Props { startDate: string; endDate: string; }

export function BranchSupplyHistoryTab({ startDate, endDate }: Props) {
  const [records, setRecords] = useState<BranchSupplyHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchBranchSupplyHistory(startDate, endDate)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totalSpend = records.reduce((s, r) => s + r.fulfillmentCost, 0);
  const fullyFulfilled = records.filter(r => r.isFullyFulfilled).length;
  const fulfillmentRate = records.length > 0
    ? Math.round((fullyFulfilled / records.length) * 100) : 0;

  const columns: ColumnDef<BranchSupplyHistoryDto>[] = [
    {
      key: 'referenceNumber', label: 'Reference', width: 130,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {row.referenceNumber}
        </Typography>
      )
    },
    {
      key: 'status', label: 'Status', width: 120,
      render: (row) => {
        const style = STATUS_STYLES[row.status] ?? { bg: 'rgba(0,0,0,0.06)', text: '#374151' };
        return (
          <Box sx={{ px: 1.25, py: 0.35, borderRadius: 1.5, bgcolor: style.bg, display: 'inline-block' }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: style.text }}>{row.status}</Typography>
          </Box>
        );
      }
    },
    {
      key: 'priority', label: 'Priority', width: 90,
      render: (row) => {
        const style = PRIORITY_STYLES[row.priority] ?? { bg: 'rgba(0,0,0,0.06)', text: '#374151' };
        return (
          <Box sx={{ px: 1.25, py: 0.35, borderRadius: 1.5, bgcolor: style.bg, display: 'inline-block' }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: style.text }}>{row.priority}</Typography>
          </Box>
        );
      }
    },
    {
      key: 'isFullyFulfilled', label: 'Fulfilled', width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: row.isFullyFulfilled ? '#546B3F' : '#C9A84C' }}>
          {row.isFullyFulfilled ? 'Full' : 'Partial'}
        </Typography>
      )
    },
    {
      key: 'fulfillmentCost', label: 'Cost', width: 120, sortable: true, align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: row.fulfillmentCost > 0 ? '#6B4C2A' : 'text.secondary' }}>
          {row.fulfillmentCost > 0 ? toPeso(row.fulfillmentCost) : '—'}
        </Typography>
      )
    },
    {
      key: 'createdAt', label: 'Filed', width: 120, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{fmtDate(row.createdAt)}</Typography>
    },
    {
      key: 'deliveredAt', label: 'Delivered', width: 120, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{fmtDate(row.deliveredAt)}</Typography>
    },
  ];

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        <StatCard
          label="Total Supply Cost Received"
          value={toPeso(totalSpend)}
          trend="neutral"
          trendValue={`${records.length} requests`}
          icon={<LocalShippingRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Full Fulfillment Rate"
          value={`${fulfillmentRate}%`}
          trend={fulfillmentRate >= 80 ? 'up' : 'down'}
          trendValue={`${fullyFulfilled} of ${records.length} fully filled`}
          icon={<LocalShippingRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
        <StatCard
          label="Partial / Pending"
          value={records.length - fullyFulfilled}
          trend="neutral"
          trendValue="Not fully fulfilled"
          icon={<ReplayRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
      </Box>

      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
            <span>Supply Request History</span>
          </Box>
        }
        data={records}
        columns={columns}
        keyExtractor={(row) => String(row.requestId)}
        defaultRowsPerPage={10}
        emptyMessage="No supply requests in this period."
        quickFilters={[
          { value: 'Delivered', label: 'Delivered' },
          { value: 'Processing', label: 'Processing' },
          { value: 'Cancelled', label: 'Cancelled' },
        ]}
      />
    </Box>
  );
}