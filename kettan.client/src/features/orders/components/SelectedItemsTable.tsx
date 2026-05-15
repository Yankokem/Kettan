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
  branchCount?: number;
}

export function SelectedItemsTable({ items, onRemoveItem, onUpdateQuantity, branchCount = 1 }: SelectedItemsTableProps) {
  const columns: ColumnDef<SelectedItem>[] = [
    {
      key: 'item',
      label: 'Item',
      width: 'minmax(140px, 1.8fr)',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13.5 }}>{row.item.name}</Typography>
          <Chip label={row.item.category} size="small" sx={{ height: 16, fontSize: '0.65rem', mt: 0.5 }} />
        </Box>
      ),
    },
    {
      key: 'unit',
      label: 'Unit',
      align: 'right',
      width: 'minmax(45px, 0.5fr)',
      render: (row) => <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{row.item.unit}</Typography>,
    },
    {
      key: 'sku',
      label: 'SKU',
      width: 'minmax(100px, 1.2fr)',
      render: (row) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
          {row.item.sku}
        </Typography>
      ),
    },
    {
      key: 'hqStock',
      label: 'HQ Stock',
      align: 'right',
      width: 'minmax(65px, 0.7fr)',
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: row.item.hqStock === 0 ? 'error.main' : 'text.secondary', fontWeight: row.item.hqStock === 0 ? 700 : 500 }}>
          {row.item.hqStock}
        </Typography>
      ),
    },
    {
      key: 'quantity',
      label: 'Push Qty',
      align: 'right',
      width: 'minmax(80px, 0.8fr)',
      render: (row) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <TextField
            type="number"
            size="small"
            value={row.quantity}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) =>
              onUpdateQuantity(row.item.id, Math.max(1, parseInt(event.target.value, 10) || 1))
            }
            inputProps={{ min: 1, style: { textAlign: 'right', fontSize: 13, width: '100%' } }}
            sx={{ '& .MuiOutlinedInput-input': { py: 0.65 }, maxWidth: 74 }}
          />
          {branchCount > 1 && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
              x{branchCount} = {row.quantity * branchCount}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'status',
      label: 'Stock Check',
      width: 'minmax(90px, 1fr)',
      render: (row) => {
        const totalNeeded = row.quantity * branchCount;
        const shortage = Math.max(0, totalNeeded - row.item.hqStock);
        if (row.item.hqStock === 0) {
          return <Chip label="Backorder" size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(185,28,28,0.10)', color: '#B91C1C' }} />;
        }
        if (shortage > 0) {
          return <Chip label={`Short ${shortage}`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(211,47,47,0.12)', color: '#D32F2F' }} />;
        }
        return <Chip label="Ready" size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(84,107,63,0.12)', color: '#546B3F' }} />;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      width: 'minmax(45px, 0.4fr)',
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
      columnGap={1.2}
    />
  );
}
