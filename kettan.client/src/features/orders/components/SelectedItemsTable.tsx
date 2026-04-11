import { Box, Chip, IconButton, Typography } from '@mui/material';
import DeleteOutlineIcon from '@/components/icons/lucide-mui/DeleteOutlineIcon';
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
      width: '28%',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.item.name}</Typography>
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
      key: 'quantity',
      label: 'Qty',
      align: 'right',
      width: '12%',
      render: (row) => (
        <input
          type="number"
          min="1"
          value={row.quantity}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) =>
            onUpdateQuantity(row.item.id, Math.max(1, parseInt(event.target.value, 10) || 1))
          }
          style={{ width: '60px', textAlign: 'right', padding: '4px', fontSize: '0.875rem' }}
        />
      ),
    },
    {
      key: 'unit',
      label: 'Unit',
      align: 'right',
      width: '10%',
      render: (row) => (
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{row.item.unit}</Typography>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      width: '26%',
      render: (row) => (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'inline-block', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {row.notes || '-'}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      width: '8%',
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


