import { Box, Typography } from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { KettanTable, type KettanColumnDef } from '../../../components/UI/KettanTable';

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
  const columns: KettanColumnDef<LedgerItem>[] = [
    {
      key: 'orderId',
      label: 'Invoice',
      width: 100,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {row.id}
        </Typography>
      )
    },
    {
      key: 'branchName',
      label: 'Branch',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
          {row.branchName}
        </Typography>
      )
    },
    {
      key: 'fulfillmentCost',
      label: 'Amount',
      width: 110,
      align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 700 }}>
          ${(row.fulfillmentCost + row.deliveryCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
        <ReceiptLongRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>Recent Invoices</Typography>
      </Box>
      <KettanTable
        data={invoices}
        columns={columns}
        keyExtractor={(row) => row.id}
        defaultRowsPerPage={10}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Box>
  );
}