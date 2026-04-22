import { useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import type { InventoryTransaction, TransactionType } from '../types';

interface TransactionsTableProps {
  transactions: InventoryTransaction[];
  onRowClick?: (transaction: InventoryTransaction) => void;
  compact?: boolean;
}

const TYPE_CONFIG: Record<TransactionType, { icon: React.ReactNode; label: string; color: string; bgcolor: string }> = {
  Restock: {
    icon: <CallReceivedRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Stock-In',
    color: 'success.dark',
    bgcolor: 'success.light',
  },
  Consumption: {
    icon: <CallMadeRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Stock-Out',
    color: 'error.dark',
    bgcolor: 'error.light',
  },
  Sales_Auto: {
    icon: <ShoppingCartRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Sale (Auto)',
    color: 'info.dark',
    bgcolor: 'info.light',
  },
  Adjustment: {
    icon: <TuneRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Adjustment',
    color: 'warning.dark',
    bgcolor: 'warning.light',
  },
  Transfer: {
    icon: <SyncAltRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Transfer',
    color: 'secondary.dark',
    bgcolor: 'rgba(84,107,63,0.15)',
  },
};

export function TransactionsTable({ transactions, onRowClick, compact = false }: TransactionsTableProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatQuantity = (qty: number, unitSymbol?: string) => {
    const sign = qty > 0 ? '+' : '';
    const absQty = Math.abs(qty);
    const formatted = absQty < 1 ? absQty.toFixed(3) : absQty.toFixed(absQty % 1 === 0 ? 0 : 2);
    return `${sign}${qty > 0 ? '' : '-'}${formatted} ${unitSymbol || ''}`;
  };

  const columns: ColumnDef<InventoryTransaction>[] = useMemo(() => {
    const baseColumns: ColumnDef<InventoryTransaction>[] = [
      {
        key: 'timestamp',
        label: 'Date',
        width: compact ? 120 : 150,
        render: (row) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            {formatDate(row.timestamp)}
          </Typography>
        ),
      },
      {
        key: 'transactionType',
        label: 'Type',
        width: compact ? 100 : 120,
        render: (row) => {
          const config = TYPE_CONFIG[row.transactionType];
          return (
            <Chip
              icon={config.icon as React.ReactElement}
              label={config.label}
              size="small"
              sx={{
                height: 24,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: config.bgcolor,
                color: config.color,
                '& .MuiChip-icon': { color: config.color },
              }}
            />
          );
        },
      },
    ];

    if (!compact) {
      baseColumns.push({
        key: 'item',
        label: 'Item',
        render: (row) => (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              {row.item?.name || 'Unknown Item'}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>
              {row.batch?.batchNumber || ''}
            </Typography>
          </Box>
        ),
      });
    }

    baseColumns.push({
      key: 'quantityChange',
      label: 'Qty',
      align: 'right',
      width: compact ? 80 : 100,
      render: (row) => {
        const isPositive = row.quantityChange > 0;
        return (
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: isPositive ? 'success.main' : 'error.main',
            }}
          >
            {formatQuantity(row.quantityChange, row.item?.unit?.symbol)}
          </Typography>
        );
      },
    });

    baseColumns.push({
      key: 'userName',
      label: 'By',
      width: compact ? 80 : 100,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: row.userName === 'Auto' ? 'info.main' : 'text.primary' }}>
          {row.userName || 'Unknown'}
        </Typography>
      ),
    });

    if (!compact) {
      baseColumns.push({
        key: 'referenceId',
        label: 'Reference',
        width: 100,
        render: (row) => (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace' }}>
            {row.referenceId || '-'}
          </Typography>
        ),
      });
    }

    return baseColumns;
  }, [compact]);

  return (
    <DataTable
      columns={columns}
      data={transactions}
      keyExtractor={(row) => row.id}
      onRowClick={onRowClick ? (row) => onRowClick(row) : undefined}
      emptyMessage="No transactions found"
      defaultRowsPerPage={compact ? 5 : 15}
      rowsPerPageOptions={compact ? [5, 10] : [15, 25, 50]}
    />
  );
}

