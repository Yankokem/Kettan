import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import {
  fetchReturnsLossOverview,
  fetchReturnLossRecords,
  type ReturnsLossOverviewDto,
  type ReturnLossRecordDto,
} from '../reportsApi';

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

const RESOLUTION_COLORS: Record<string, { bg: string; text: string }> = {
  Replaced: { bg: 'rgba(59,130,246,0.10)', text: '#2563EB' },
  Credited: { bg: 'rgba(220,38,38,0.10)', text: '#DC2626' },
  Rejected: { bg: 'rgba(107,114,128,0.12)', text: '#6B7280' },
};

interface Props {
  startDate: string;
  endDate: string;
}

const EMPTY_OVERVIEW: ReturnsLossOverviewDto = {
  totalReturns: 0,
  replacedCount: 0,
  creditedCount: 0,
  rejectedCount: 0,
  totalMoneyLost: 0,
  averageReturnRate: 0,
};

export function HqReturnsLossTab({ startDate, endDate }: Props) {
  const [overview, setOverview] = useState<ReturnsLossOverviewDto>(EMPTY_OVERVIEW);
  const [records, setRecords] = useState<ReturnLossRecordDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchReturnsLossOverview(startDate, endDate),
      fetchReturnLossRecords(startDate, endDate),
    ])
      .then(([ov, rc]) => {
        setOverview(ov);
        setRecords(rc);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const columns: ColumnDef<ReturnLossRecordDto>[] = [
    {
      key: 'returnId', label: 'Return ID', width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#6B4C2A', fontFamily: 'monospace' }}>
          RET-{row.returnId}
        </Typography>
      )
    },
    {
      key: 'orderId', label: 'Order', width: 90,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontFamily: 'monospace' }}>
          ORD-{row.orderId}
        </Typography>
      )
    },
    {
      key: 'branchName', label: 'Branch',
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.branchName}</Typography>
    },
    {
      key: 'resolution', label: 'Resolution', width: 110,
      render: (row) => {
        const style = RESOLUTION_COLORS[row.resolution] ?? { bg: 'rgba(0,0,0,0.06)', text: '#374151' };
        return (
          <Box sx={{ px: 1.25, py: 0.35, borderRadius: 1.5, bgcolor: style.bg, display: 'inline-block' }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: style.text }}>{row.resolution}</Typography>
          </Box>
        );
      }
    },
    {
      key: 'itemCount', label: 'Items', width: 72, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.itemCount}</Typography>
    },
    {
      key: 'reason', label: 'Reason',
      render: (row) => <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{row.reason || '—'}</Typography>
    },
    {
      key: 'creditAmount', label: 'Credit / Loss', width: 120, sortable: true, align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: row.creditAmount > 0 ? '#DC2626' : 'text.secondary' }}>
          {row.creditAmount > 0 ? toPeso(row.creditAmount) : '—'}
        </Typography>
      )
    },
    {
      key: 'loggedAt', label: 'Filed', width: 120, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{fmtDate(row.loggedAt)}</Typography>
    },
  ];

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Resolution breakdown visual */}
      {overview.totalReturns > 0 && (
        <Box sx={{ display: 'flex', gap: 2, p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          {[
            { label: 'Replaced', count: overview.replacedCount, color: '#2563EB' },
            { label: 'Credited (Loss)', count: overview.creditedCount, color: '#DC2626' },
            { label: 'Rejected', count: overview.rejectedCount, color: '#6B7280' },
          ].map(item => {
            const pct = overview.totalReturns > 0 ? Math.round((item.count / overview.totalReturns) * 100) : 0;
            return (
              <Box key={item.label} sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary' }}>{item.count} ({pct}%)</Typography>
                </Box>
                <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'divider', overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', borderRadius: 4, width: `${pct}%`, bgcolor: item.color, transition: 'width 0.5s ease' }} />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Records table */}
      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReplayRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
            <span>Return Records</span>
          </Box>
        }
        data={records}
        columns={columns}
        keyExtractor={(row) => String(row.returnId)}
        defaultRowsPerPage={10}
        emptyMessage="No return records in this period."
        quickFilters={[
          { value: 'Replaced', label: 'Replaced' },
          { value: 'Credited', label: 'Credited' },
          { value: 'Rejected', label: 'Rejected' },
        ]}
      />
    </Box>
  );
}