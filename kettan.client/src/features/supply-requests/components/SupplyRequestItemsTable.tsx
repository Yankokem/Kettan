import { Box, Chip, Typography } from '@mui/material';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';

import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import type { SupplyRequestDetailItem } from './SupplyRequestDetail.types';

interface SupplyRequestItemsTableProps {
  items: SupplyRequestDetailItem[];
}

const AVAILABILITY_STYLE: Record<SupplyRequestDetailItem['availability'], { color: string; bg: string }> = {
  Available: { color: '#546B3F', bg: 'rgba(84,107,63,0.12)' },
  'Low Stock': { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
  'Out of Stock': { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
};

const ITEM_COLUMNS: ColumnDef<SupplyRequestDetailItem>[] = [
  {
    key: 'name',
    label: 'Requested Item',
    render: (row) => (
      <Box>
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 600 }}>{row.name}</Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>{row.sku}</Typography>
      </Box>
    ),
  },
  {
    key: 'hqStock',
    label: 'HQ Stock',
    width: 110,
    sortable: true,
    render: (row) => (
      <Typography
        sx={{
          fontSize: 13,
          color: row.hqStock < row.requestedQty ? 'error.main' : 'text.secondary',
          fontWeight: row.hqStock < row.requestedQty ? 700 : 500,
        }}
      >
        {row.hqStock} units
      </Typography>
    ),
  },
  {
    key: 'requestedQty',
    label: 'Requested',
    width: 110,
    sortable: true,
    render: (row) => (
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.requestedQty} units</Typography>
    ),
  },
  {
    key: 'availability',
    label: 'Availability',
    width: 140,
    render: (row) => {
      const style = AVAILABILITY_STYLE[row.availability];

      return (
        <Chip
          label={row.availability}
          size="small"
          sx={{
            fontSize: 11.5,
            fontWeight: 600,
            bgcolor: style.bg,
            color: style.color,
            border: `1px solid ${style.color}28`,
          }}
        />
      );
    },
  },
  {
    key: 'approvedQty',
    label: 'Approved Qty',
    width: 130,
    render: (row) => (
      <Box
        sx={{
          width: 72,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          border: '1px solid',
          borderColor: row.hqStock < row.requestedQty ? 'error.light' : 'divider',
          color: 'text.primary',
          fontSize: 13,
          fontWeight: 700,
          bgcolor: 'background.paper',
        }}
      >
        {row.approvedQty ?? '-'}
      </Box>
    ),
  },
];

export function SupplyRequestItemsTable({ items }: SupplyRequestItemsTableProps) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
        <InventoryRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>
          Item Reconciliation
        </Typography>
      </Box>

      <DataTable
        data={items}
        columns={ITEM_COLUMNS}
        keyExtractor={(row) => row.id}
        defaultRowsPerPage={10}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </>
  );
}
