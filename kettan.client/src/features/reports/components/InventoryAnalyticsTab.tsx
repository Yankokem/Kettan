import { useEffect, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import { 
  fetchBranchWastage, 
  fetchBranchEoqSuggestions,
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
      fetchBranchEoqSuggestions()
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
    { 
      key: 'itemName', label: 'Item Name', sortable: true, 
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.itemName}</Typography> 
    },
    { 
      key: 'itemSku', label: 'SKU', 
      render: (row) => <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace' }}>{row.itemSku}</Typography> 
    },
    { 
      key: 'quantityLost', label: 'Qty Lost', align: 'right', 
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.quantityLost} {row.unit}</Typography> 
    },
    { 
      key: 'totalLoss', label: 'Loss Value', align: 'right', 
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>₱{row.totalLoss.toLocaleString()}</Typography> 
    },
    { 
      key: 'reason', label: 'Reason', 
      render: (row) => <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.4 }}>{row.reason}</Typography> 
    },
    { 
      key: 'timestamp', label: 'Logged At', 
      render: (row) => (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {new Date(row.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}<br/>
          {new Date(row.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      )
    },
  ];

  const eoqColumns: ColumnDef<EoqSuggestionDto>[] = [
    { 
      key: 'itemName', label: 'Item Name', sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.itemName}</Typography> 
    },
    { 
      key: 'itemSku', label: 'SKU', 
      render: (row) => <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>{row.itemSku}</Typography> 
    },
    { 
      key: 'currentStock', label: 'In Stock', align: 'right', 
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.currentStock} {row.unit}</Typography> 
    },
    { 
      key: 'annualDemand', label: 'Annual Demand', align: 'right', 
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.annualDemand.toLocaleString()}</Typography> 
    },
    { 
      key: 'setupCost', label: 'Setup Cost (S)', align: 'right', 
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>₱{row.setupCost.toLocaleString()}</Typography> 
    },
    { 
      key: 'holdingCost', label: 'Holding Cost (H)', align: 'right', 
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>₱{row.holdingCost.toLocaleString()}</Typography> 
    },
    { 
      key: 'eoq', label: 'Suggested Order (EOQ)', align: 'right', 
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
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Wastage Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, background: (theme) => theme.custom.gradients.card }}>
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
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, background: (theme) => theme.custom.gradients.card }}>
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
          emptyMessage="No suggestions available. Items need Annual Demand, Holding Cost, and Setup Cost configured in Inventory settings."
          defaultRowsPerPage={5}
        />
      </Card>
    </Box>
  );
}
