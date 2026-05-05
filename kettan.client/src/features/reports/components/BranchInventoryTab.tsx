import { useEffect, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import { StatCard } from '../../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import {
  fetchBranchInventorySummary,
  fetchBranchWastage,
  fetchEoqSuggestions,
  type WastageRecordDto,
  type EoqSuggestionDto,
} from '../reportsApi';

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props { startDate: string; endDate: string; }

export function BranchInventoryTab({ startDate, endDate }: Props) {
  const [summary, setSummary] = useState({ totalSkus: 0, totalVolume: 0, totalValuation: 0 });
  const [wastage, setWastage] = useState<WastageRecordDto[]>([]);
  const [eoq, setEoq] = useState<EoqSuggestionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchBranchInventorySummary(),
      fetchBranchWastage(startDate, endDate),
      fetchEoqSuggestions(),
    ])
      .then(([s, w, e]) => { setSummary(s); setWastage(w); setEoq(e); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totalWastageLoss = wastage.reduce((s, w) => s + w.totalLoss, 0);

  const wastageCols: ColumnDef<WastageRecordDto>[] = [
    {
      key: 'itemName', label: 'Item',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.itemName}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>{row.itemSku}</Typography>
        </Box>
      )
    },
    {
      key: 'quantityLost', label: 'Qty Lost', width: 110, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.quantityLost} {row.unit}</Typography>
    },
    {
      key: 'totalLoss', label: 'Total Loss', width: 120, align: 'right', sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>{toPeso(row.totalLoss)}</Typography>
    },
    {
      key: 'reason', label: 'Reason',
      render: (row) => <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{row.reason || '—'}</Typography>
    },
    {
      key: 'timestamp', label: 'Date', width: 120, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{fmtDate(row.timestamp)}</Typography>
    },
  ];

  const eoqCols: ColumnDef<EoqSuggestionDto>[] = [
    {
      key: 'itemName', label: 'Item',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.itemName}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>{row.itemSku}</Typography>
        </Box>
      )
    },
    {
      key: 'currentStock', label: 'Stock', width: 110, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.currentStock} {row.unit}</Typography>
    },
    {
      key: 'eoq', label: 'Suggested Order (EOQ)', align: 'right', sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ px: 1.5, py: 0.4, borderRadius: 1.5, bgcolor: 'rgba(107,76,42,0.08)', border: '1px solid rgba(107,76,42,0.2)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>{row.eoq} {row.unit}</Typography>
          </Box>
        </Box>
      )
    },
  ];

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        <StatCard
          label="Inventory Value"
          value={toPeso(summary.totalValuation)}
          trend="neutral"
          trendValue={`${summary.totalSkus} SKUs`}
          icon={<InventoryRoundedIcon />}
          accentClass="stat-accent-gold"
          iconBg="linear-gradient(135deg, #B08B5A 0%, #DEC9A8 100%)"
        />
        <StatCard
          label="Total Stock Volume"
          value={summary.totalVolume.toLocaleString()}
          trend="neutral"
          trendValue="units on hand"
          icon={<InventoryRoundedIcon />}
          accentClass="stat-accent-brown"
          iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
        />
        <StatCard
          label="Wastage Loss"
          value={toPeso(totalWastageLoss)}
          trend={totalWastageLoss > 0 ? 'down' : 'neutral'}
          trendValue={`${wastage.length} records`}
          icon={<DeleteSweepRoundedIcon />}
          accentClass="stat-accent-sage"
          iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
        />
      </Box>

      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteSweepRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
            <span>Wastage & Spoilage Log</span>
          </Box>
        }
        data={wastage}
        columns={wastageCols}
        keyExtractor={(row) => String(row.transactionId)}
        defaultRowsPerPage={10}
        emptyMessage="No wastage records in this period."
      />

      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalculateRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
            <span>EOQ Reorder Suggestions</span>
          </Box>
        }
        data={eoq}
        columns={eoqCols}
        keyExtractor={(row) => String(row.itemId)}
        defaultRowsPerPage={10}
        emptyMessage="No EOQ data available."
      />

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2, bgcolor: 'rgba(107,76,42,0.03)' }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          <strong style={{ color: '#6B4C2A' }}>EOQ Formula:</strong>{' '}
          EOQ = √(2DS/H) — Optimal order quantity to minimize total ordering and holding costs.
        </Typography>
      </Card>
    </Box>
  );
}