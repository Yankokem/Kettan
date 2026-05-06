import { useEffect, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import { 
  fetchBranchWastage, 
  fetchEoqSuggestions,
  type WastageRecordDto,
  type EoqSuggestionDto
} from '../reportsApi';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';

interface Props { startDate: string; endDate: string; }

export function InventoryAnalyticsTab({ startDate, endDate }: Props) {
  const [wastage, setWastage] = useState<WastageRecordDto[]>([]);
  const [eoq, setEoq] = useState<EoqSuggestionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchBranchWastage(startDate, endDate),
      fetchEoqSuggestions()
    ])
      .then(([w, e]) => {
        setWastage(w);
        setEoq(e);
      })
      .catch(() => {
        setWastage([]);
        setEoq([]);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const wastageColumns: ColumnDef<WastageRecordDto>[] = [
    { key: 'itemName', label: 'Item Name', sortable: true, render: (row) => row.itemName },
    { key: 'itemSku', label: 'SKU', width: 120, render: (row) => row.itemSku },
    { key: 'quantityLost', label: 'Qty Lost', width: 100, align: 'right', render: (row) => `${row.quantityLost} ${row.unit}` },
    { key: 'totalLoss', label: 'Loss Value', width: 120, align: 'right', render: (row) => `₱${row.totalLoss.toLocaleString()}` },
    { key: 'reason', label: 'Reason', width: 180, render: (row) => row.reason },
    { key: 'timestamp', label: 'Date', width: 120, render: (row) => new Date(row.timestamp).toLocaleDateString() },
  ];

  const eoqColumns: ColumnDef<EoqSuggestionDto>[] = [
    { key: 'itemName', label: 'Item Name', sortable: true, render: (row) => row.itemName },
    { key: 'itemSku', label: 'SKU', width: 120, render: (row) => row.itemSku },
    { key: 'currentStock', label: 'In Stock', width: 100, align: 'right', render: (row) => `${row.currentStock} ${row.unit}` },
    { key: 'annualDemand', label: 'Annual Demand', width: 120, align: 'right', render: (row) => row.annualDemand },
    { key: 'eoq', label: 'Suggested Order', width: 150, align: 'right', render: (row) => (
      <Box sx={{ color: '#6B4C2A', fontWeight: 700 }}>
        {row.eoq} {row.unit}
      </Box>
    )},
  ];

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Wastage Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <DeleteSweepRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>Wastage & Spoilage Log</Typography>
        </Box>
        <DataTable
          data={wastage}
          columns={wastageColumns}
          keyExtractor={(row) => row.transactionId.toString()}
          emptyMessage="No wastage logs found for this period."
          defaultRowsPerPage={5}
        />
      </Card>

      {/* EOQ Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
          <AutoFixHighRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>EOQ Reorder Suggestions</Typography>
        </Box>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2 }}>
          Recommended order quantities calculated using the Economic Order Quantity algorithm based on annual demand and holding costs.
        </Typography>
        <DataTable
          data={eoq}
          columns={eoqColumns}
          keyExtractor={(row) => row.itemId.toString()}
          emptyMessage="No suggestions available."
          defaultRowsPerPage={5}
        />
      </Card>
    </Box>
  );
}
