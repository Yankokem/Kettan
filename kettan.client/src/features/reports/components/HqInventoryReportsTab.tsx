import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import {
  fetchBranchValuations,
  fetchWastageRecords,
  type BranchInventoryValuationDto,
  type WastageRecordDto,
} from '../reportsApi';

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  startDate: string;
  endDate: string;
}

export function HqInventoryReportsTab({ startDate, endDate }: Props) {
  const [branchValuations, setBranchValuations] = useState<BranchInventoryValuationDto[]>([]);
  const [wastage, setWastage] = useState<WastageRecordDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchBranchValuations(),
      fetchWastageRecords(startDate, endDate),
    ])
      .then(([bv, w]) => {
        setBranchValuations(bv);
        setWastage(w);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate]);


  // Branch valuation columns
  const branchValCols: ColumnDef<BranchInventoryValuationDto>[] = [
    {
      key: 'branchName', label: 'Branch',
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.branchName}</Typography>
    },
    {
      key: 'totalSkus', label: 'SKUs', width: 80, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.totalSkus}</Typography>
    },
    {
      key: 'totalVolume', label: 'Volume', width: 100, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.totalVolume.toLocaleString()}</Typography>
    },
    {
      key: 'totalValuation', label: 'Valuation', align: 'right', sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>{toPeso(row.totalValuation)}</Typography>
      )
    },
  ];

  // Wastage columns
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
      key: 'quantityLost', label: 'Qty Lost', width: 100, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.quantityLost} {row.unit}</Typography>
    },
    {
      key: 'unitCost', label: 'Unit Cost', width: 110, sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{toPeso(row.unitCost)}</Typography>
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


  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
        {/* Branch Inventory Valuations */}
        <DataTable
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
              <span>Branch Inventory Valuation</span>
            </Box>
          }
          data={branchValuations}
          columns={branchValCols}
          keyExtractor={(row) => String(row.branchId)}
          defaultRowsPerPage={10}
          emptyMessage="No branch inventory data available."
        />

        {/* Wastage Log */}
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
      </Box>

    </Box>
  );
}