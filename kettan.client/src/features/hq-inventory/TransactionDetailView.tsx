import { useEffect, useMemo, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Box, Paper, Typography, Divider, Skeleton } from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import { PageHeader } from '../../components/UI/PageHeader';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { fetchTransactionGroup } from './hqInventoryApi';
import type { InventoryTransaction } from './types';

export default function TransactionDetailView() {
  const { transactionId } = useParams({ from: '/layout/hq-inventory/transactions/$transactionId' });
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTransactionGroup(transactionId);
        setTransactions(data);
      } catch (err) {
        console.error('Failed to load transaction details', err);
        setError('Unable to load transaction details. It might have been deleted or the ID is invalid.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [transactionId]);

  const summary = useMemo(() => {
    if (transactions.length === 0) return null;
    const first = transactions[0];
    return {
      reference: first.referenceId ? `REF-${first.referenceId}` : transactionId.substring(0, 12),
      type: first.transactionType,
      date: new Date(first.timestamp).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      userName: first.userName || 'System',
      remarks: first.remarks,
      totalItems: transactions.length,
      totalQty: transactions.reduce((sum, t) => sum + Math.abs(t.quantityChange), 0)
    };
  }, [transactions, transactionId]);

  const columns: ColumnDef<InventoryTransaction>[] = [
    {
      key: 'itemName',
      label: 'ITEM',
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
            {row.itemName || row.item?.name || 'Unknown Item'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>
            {row.itemSku || row.item?.sku || ''}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'batchNumber',
      label: 'BATCH',
      render: (row) => (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace', fontWeight: 500 }}>
          {row.batch?.batchNumber || 'N/A'}
        </Typography>
      ),
    },
    {
      key: 'quantityChange',
      label: 'QUANTITY',
      align: 'right',
      render: (row) => (
        <Typography sx={{ 
          fontSize: 13, 
          fontWeight: 700, 
          color: row.quantityChange > 0 ? '#166534' : '#B91C1C' 
        }}>
          {row.quantityChange > 0 ? '+' : ''}{row.quantityChange}
        </Typography>
      ),
    }
  ];

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      <PageHeader
        title="Transaction Details"
        description="View complete breakdown of this inventory movement record."
        backTo="/hq-inventory"
      />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
        {/* Left Side: Summary Details */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '350px' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 3, bgcolor: 'rgba(107, 76, 42, 0.04)', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <ReceiptLongRoundedIcon sx={{ color: '#6B4C2A' }} />
              <Typography sx={{ fontWeight: 700, color: '#2E1F14' }}>Summary</Typography>
            </Box>
            {isLoading ? (
              <Skeleton width="60%" height={32} />
            ) : (
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#6B4C2A' }}>
                {summary?.reference}
              </Typography>
            )}
          </Box>

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <DetailItem 
              icon={<CalendarTodayRoundedIcon fontSize="small" />} 
              label="Date and Time" 
              value={summary?.date} 
              isLoading={isLoading} 
            />
            <DetailItem 
              icon={<PersonRoundedIcon fontSize="small" />} 
              label="Performed By" 
              value={summary?.userName} 
              isLoading={isLoading} 
            />
            <DetailItem 
              icon={<AssessmentRoundedIcon fontSize="small" />} 
              label="Transaction Type" 
              value={summary?.type} 
              isLoading={isLoading} 
              isType
            />
            <Divider />
            <DetailItem 
              icon={<InfoRoundedIcon fontSize="small" />} 
              label="Remarks" 
              value={summary?.remarks || 'No remarks provided'} 
              isLoading={isLoading} 
              multiline
            />
          </Box>

          <Box sx={{ p: 3, bgcolor: '#fcfcfc', borderTop: '1px solid', borderColor: 'divider' }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Unique Items</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{summary?.totalItems}</Typography>
             </Box>
             <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Total Movement</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{summary?.totalQty} units</Typography>
             </Box>
          </Box>
        </Paper>

        {/* Right Side: Items Table */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            width: '100%',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            p: 3
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 3, color: '#2E1F14' }}>
            Transaction Items
          </Typography>
          <DataTable
            columns={columns}
            data={transactions}
            isLoading={isLoading}
            keyExtractor={(row) => row.id}
            emptyTitle="No items found"
            emptyMessage="This transaction has no associated item movements."
          />
        </Paper>
      </Box>
    </Box>
  );
}

function DetailItem({ icon, label, value, isLoading, isType, multiline }: { 
  icon: React.ReactNode, 
  label: string, 
  value?: string, 
  isLoading: boolean,
  isType?: boolean,
  multiline?: boolean
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ color: '#B08B5A', display: 'flex' }}>{icon}</Box>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </Box>
      {isLoading ? (
        <Skeleton width="80%" />
      ) : (
        <Typography sx={{ 
          fontSize: 14, 
          fontWeight: 600, 
          color: isType ? '#166534' : 'text.primary',
          whiteSpace: multiline ? 'pre-wrap' : 'normal',
          lineHeight: 1.5
        }}>
          {value || '-'}
        </Typography>
      )}
    </Box>
  );
}
