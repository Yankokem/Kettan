import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
  if (items.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
        <Typography color="text.secondary">No items selected yet. Click "Add Items" to choose inventory.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: 'background.default' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Unit</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(({ item, quantity, notes }) => (
            <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                  <Chip label={item.category} size="small" sx={{ height: 16, fontSize: '0.65rem', mt: 0.5 }} />
                </Box>
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                {item.sku}
              </TableCell>
              <TableCell align="right">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '60px', textAlign: 'right', padding: '4px', fontSize: '0.875rem' }}
                />
              </TableCell>
              <TableCell align="right" sx={{ color: 'text.secondary' }}>{item.unit}</TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-block', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {notes || '-'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" color="error" onClick={() => onRemoveItem(item.id)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
