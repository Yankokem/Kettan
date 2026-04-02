import { Box, Typography } from '@mui/material';
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';

interface LedgerItem {
  id: string;
  orderId: string;
  branchName: string;
  date: string;
  fulfillmentCost: number;
  deliveryCost: number;
  status: string;
}

export function InvoiceLedger({ invoices }: { invoices: LedgerItem[] }) {
  const columns: ColumnDef<LedgerItem>[] = [
    {
      key: 'orderId',
      label: 'Invoice',
      gridWidth: '100px',
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {row.id}
        </Typography>
      )
    },
    {
      key: 'branchName',
      label: 'Branch',
      gridWidth: '1.5fr',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
          {row.branchName}
        </Typography>
      )
    },
    {
      key: 'fulfillmentCost',
      label: 'Amount',
      gridWidth: '100px',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 700 }}>
          ${(row.fulfillmentCost + row.deliveryCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      )
    }
  ];

  return (
    <DataTable
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Recent Invoices</Typography>
        </Box>
      }
      data={invoices}
      columns={columns}
      keyExtractor={(row) => row.id}
    />
  );
}