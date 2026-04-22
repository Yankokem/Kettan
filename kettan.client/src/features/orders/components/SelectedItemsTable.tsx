import { Box, Chip, IconButton, TextField, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import type { InventoryItem } from './InventoryItemCard';

interface SelectedItem {
  item: InventoryItem;
  quantity: number;
  notes: string;
}

interface SelectedItemsTableProps {
  items: SelectedItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
}

export function SelectedItemsTable({ items, onRemoveItem, onUpdateQuantity }: SelectedItemsTableProps) {
  const columns: ColumnDef<SelectedItem>[] = [
    {
      key: 'item',
      label: 'Item',
      width: '26%',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.item.name}</Typography>
          <Chip label={row.item.category} size="small" sx={{ height: 16, fontSize: '0.65rem', mt: 0.5 }} />
        </Box>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      width: '16%',
      render: (row) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
          {row.item.sku}
        </Typography>
      ),
    },
    {
      key: 'hqStock',
      label: 'HQ Stock',
      align: 'right',
      width: '12%',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: row.item.hqStock === 0 ? 'error.main' : 'text.secondary', fontWeight: row.item.hqStock === 0 ? 700 : 500 }}>
          {row.item.hqStock}
        </Typography>
      ),
    },
    {
      key: 'quantity',
      label: 'Request Qty',
      align: 'right',
      width: '10%',
      render: (row) => (
        <TextField
          type="number"
          size="small"
          value={row.quantity}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) =>
            onUpdateQuantity(row.item.id, Math.max(1, parseInt(event.target.value, 10) || 1))
          }
          inputProps={{ min: 1, style: { textAlign: 'right', fontSize: 13, width: 66 } }}
          sx={{ '& .MuiOutlinedInput-input': { py: 0.65 } }}
        />
      ),
    },
    {
      key: 'status',
      label: 'Stock Check',
      width: '14%',
      render: (row) => {
        const shortage = Math.max(0, row.quantity - row.item.hqStock);
        if (row.item.hqStock === 0) {
          return <Chip label="Backorder" size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(185,28,28,0.10)', color: '#B91C1C' }} />;
        }
        if (shortage > 0) {
          return <Chip label={`Short ${shortage}`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(180,83,9,0.12)', color: '#B45309' }} />;
        }
        return <Chip label="Ready" size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(84,107,63,0.12)', color: '#546B3F' }} />;
      },
    },
    {
      key: 'unit',
      label: 'Unit',
      align: 'right',
      width: '10%',
      render: (row) => <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{row.item.unit}</Typography>,
    },
    {
      key: 'notes',
      label: 'Notes',
      width: '20%',
      render: (row) => (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'inline-block', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {row.notes || '-'}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      width: '6%',
      render: (row) => (
        <IconButton
          size="small"
          color="error"
          onClick={(event) => {
            event.stopPropagation();
            onRemoveItem(row.item.id);
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      keyExtractor={(row) => row.item.id}
      emptyMessage={'No items selected yet. Click "Add Items" to choose inventory.'}
      defaultRowsPerPage={10}
      rowsPerPageOptions={[10, 25, 50]}
    />
  );
}
