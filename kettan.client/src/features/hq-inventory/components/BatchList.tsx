import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import WarningAmberRoundedIcon from '@/components/icons/lucide-mui/WarningAmberRoundedIcon';
import TuneRoundedIcon from '@/components/icons/lucide-mui/TuneRoundedIcon';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import type { Batch, Unit } from '../types';

interface BatchListProps {
  batches: Batch[];
  unit: Unit;
  onAdjust?: (batchId: string) => void;
  compact?: boolean;
}

export function BatchList({ batches, unit, onAdjust, compact = false }: BatchListProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getExpiryStatus = (expiryDate: string): { label: string; color: string; bgcolor: string } | null => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Expired', color: 'error.dark', bgcolor: 'error.light' };
    }
    if (diffDays <= 7) {
      return { label: 'Expiring Soon', color: 'warning.dark', bgcolor: 'warning.light' };
    }
    if (diffDays <= 30) {
      return { label: `${diffDays}d left`, color: 'text.secondary', bgcolor: 'action.hover' };
    }
    return null;
  };

  const columns: ColumnDef<Batch & { index: number }>[] = [
    {
      key: 'index',
      label: '#',
      width: 50,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
            {row.index}
          </Typography>
          {row.index === 1 && (
            <Chip
              label="FIFO"
              size="small"
              sx={{
                height: 18,
                fontSize: 9,
                fontWeight: 700,
                bgcolor: 'primary.main',
                color: 'white',
              }}
            />
          )}
        </Box>
      ),
    },
    {
      key: 'batchNumber',
      label: 'Batch Number',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
          {row.batchNumber}
        </Typography>
      ),
    },
    {
      key: 'currentQuantity',
      label: 'Quantity',
      align: 'right',
      width: compact ? 80 : 100,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {row.currentQuantity} {unit.symbol}
        </Typography>
      ),
    },
    {
      key: 'expiryDate',
      label: 'Expiry',
      width: compact ? 120 : 150,
      render: (row) => {
        const status = getExpiryStatus(row.expiryDate);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {status && (status.label === 'Expired' || status.label === 'Expiring Soon') && (
              <WarningAmberRoundedIcon sx={{ fontSize: 16, color: status.color }} />
            )}
            <Box>
              <Typography sx={{ fontSize: 13, color: status?.label === 'Expired' ? 'error.main' : 'text.primary' }}>
                {formatDate(row.expiryDate)}
              </Typography>
              {status && (
                <Typography sx={{ fontSize: 11, color: status.color, fontWeight: 500 }}>
                  {status.label}
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
    },
  ];

  if (onAdjust && !compact) {
    columns.push({
      key: 'actions',
      label: '',
      width: 60,
      align: 'right',
      render: (row) => (
        <Tooltip title="Adjust quantity">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onAdjust(row.id);
            }}
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <TuneRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    });
  }

  // Add index to batches for FIFO display
  const batchesWithIndex = batches.map((batch, i) => ({ ...batch, index: i + 1 }));

  return (
    <DataTable
      columns={columns}
      data={batchesWithIndex}
      keyExtractor={(row) => row.id}
      emptyMessage="No batches available"
      defaultRowsPerPage={compact ? 5 : 10}
      rowsPerPageOptions={compact ? [5] : [5, 10, 25]}
    />
  );
}



