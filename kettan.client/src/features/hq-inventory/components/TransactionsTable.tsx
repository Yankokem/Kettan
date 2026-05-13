import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
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
    bgcolor: 'rgba(46, 125, 50, 0.15)',
  },
  Consumption: {
    icon: <CallMadeRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Stock-Out',
    color: 'error.dark',
    bgcolor: 'rgba(211, 47, 47, 0.15)',
  },
  Sales_Auto: {
    icon: <ShoppingCartRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Sale (Auto)',
    color: 'info.dark',
    bgcolor: 'rgba(2, 136, 209, 0.15)',
  },
  Adjustment: {
    icon: <TuneRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Adjustment',
    color: 'warning.dark',
    bgcolor: 'rgba(237, 108, 2, 0.15)',
  },
  Transfer: {
    icon: <SyncAltRoundedIcon sx={{ fontSize: 14 }} />,
    label: 'Transfer',
    color: 'secondary.dark',
    bgcolor: 'rgba(156, 39, 176, 0.15)',
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
    if (Math.abs(qty) < 0.0001) return `0 ${unitSymbol || ''}`;
    const sign = qty > 0 ? '+' : '-';
    const absQty = Math.abs(qty);
    const formatted = absQty < 1 ? absQty.toFixed(3) : absQty.toFixed(absQty % 1 === 0 ? 0 : 2);
    const finalFormatted = formatted.includes('.') ? formatted.replace(/\.?0+$/, '') : formatted;
    return `${sign}${finalFormatted} ${unitSymbol || ''}`;
  };

  const columns: ColumnDef<InventoryTransaction>[] = useMemo(() => {
    const baseColumns: ColumnDef<InventoryTransaction>[] = [
      {
        key: 'timestamp',
        label: 'Date',
        gridWidth: compact ? '1.5fr' : '1.2fr',
        render: (row) => (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {formatDate(row.timestamp)}
          </Typography>
        ),
      },
      {
        key: 'transactionType',
        label: 'Type',
        gridWidth: compact ? '1.5fr' : '1fr',
        render: (row) => {
          const config = TYPE_CONFIG[row.transactionType];
          let label = config.label;

          const remarks = row.remarks?.toLowerCase() || '';
          if (row.transactionType === 'Restock') {
            if (remarks.includes('request')) label = 'Supply Request';
            else if (remarks.includes('push')) label = 'HQ Supply Push';
            else if (remarks.includes('return')) label = 'Stock Return';
            else if (row.referenceType === 'StockIn') label = 'Stock-In';
          } else if (row.transactionType === 'Consumption') {
            if (remarks.includes('wastage')) label = 'Wastage';
            else if (remarks.includes('spill')) label = 'Spillage';
            else if (remarks.includes('expire')) label = 'Expired';
            else if (remarks.includes('damage')) label = 'Damaged';
            else if (remarks.includes('return')) label = 'Return to Supplier';
          }

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: config.color }}>
              {config.icon}
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'inherit' }}>
                {label}
              </Typography>
            </Box>
          );
        },
      },
      {
        key: 'id',
        label: 'ID',
        gridWidth: compact ? '1.2fr' : '0.8fr',
        render: (row) => (
          <Typography sx={{ fontSize: 12.5, fontFamily: 'Courier New, monospace', color: 'text.primary', fontWeight: 600 }}>
            {row.transactionCode || `TXN-${row.id}`}
          </Typography>
        ),
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
      key: 'userName',
      label: 'By',
      gridWidth: compact ? '1.5fr' : '1fr',
      render: (row) => {
        const name = row.userName?.trim();
        const displayName = name ? (name.length > 20 ? name.substring(0, 17) + '...' : name) : 'System';
        return (
          <Typography sx={{ fontSize: 12.5, color: (!name || name === 'Auto') ? 'text.secondary' : 'text.primary', fontStyle: (!name || name === 'Auto') ? 'italic' : 'normal', whiteSpace: 'nowrap' }}>
            {displayName}
          </Typography>
        );
      },
    });

    baseColumns.push({
      key: 'quantityChange',
      label: 'Qty',
      align: 'right',
      gridWidth: compact ? '1fr' : '0.9fr',
      render: (row) => {
        const isPositive = row.quantityChange > 0;
        return (
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: isPositive ? 'success.main' : 'error.main',
              whiteSpace: 'nowrap',
            }}
          >
            {formatQuantity(row.quantityChange, row.item?.unit)}
          </Typography>
        );
      },
    });

    if (!compact) {
      baseColumns.push({
        key: 'referenceId',
        label: 'Reference',
        gridWidth: '0.9fr',
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