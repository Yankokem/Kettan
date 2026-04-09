import { useMemo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { DataTable, type ColumnDef } from '../../../../components/UI/DataTable';
import type { BranchTransactionRow } from '../../types';
import { formatDate } from '../../branchProfileData';

interface BranchTransactionsTabProps {
  transactions: BranchTransactionRow[];
}

export function BranchTransactionsTab({ transactions }: BranchTransactionsTabProps) {
  const columns = useMemo<ColumnDef<BranchTransactionRow>[]>(
    () => [
      {
        key: 'reference',
        label: 'Reference',
        width: '22%',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.primary', fontWeight: 700, fontFamily: 'monospace' }}>
            {transaction.reference}
          </Typography>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '18%',
        render: (transaction) => (
          <Chip
            label={transaction.type}
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor:
                transaction.type === 'Stock-In'
                  ? 'success.light'
                  : transaction.type === 'Stock-Out'
                    ? 'error.light'
                    : transaction.type === 'Transfer'
                      ? 'info.light'
                      : 'warning.light',
              color:
                transaction.type === 'Stock-In'
                  ? 'success.dark'
                  : transaction.type === 'Stock-Out'
                    ? 'error.dark'
                    : transaction.type === 'Transfer'
                      ? 'info.dark'
                      : 'warning.dark',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        ),
      },
      {
        key: 'lineItems',
        label: 'Line Items',
        width: '14%',
        align: 'right',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.primary', fontWeight: 600 }}>
            {transaction.lineItems}
          </Typography>
        ),
      },
      {
        key: 'netChange',
        label: 'Net Qty',
        width: '14%',
        align: 'right',
        render: (transaction) => (
          <Typography
            sx={{
              fontSize: 12.5,
              color: transaction.netChange >= 0 ? 'success.main' : 'error.main',
              fontWeight: 700,
            }}
          >
            {transaction.netChange >= 0 ? '+' : ''}
            {transaction.netChange}
          </Typography>
        ),
      },
      {
        key: 'postedBy',
        label: 'Posted By',
        width: '18%',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{transaction.postedBy}</Typography>
        ),
      },
      {
        key: 'timestamp',
        label: 'Date',
        width: '14%',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{formatDate(transaction.timestamp)}</Typography>
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      <DataTable
        data={transactions}
        columns={columns}
        keyExtractor={(transaction) => transaction.id}
        defaultPageSize={5}
        pageSizes={[5, 10, 25]}
        emptyMessage="No transactions available for this branch."
      />
    </Box>
  );
}
