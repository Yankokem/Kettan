import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Checkbox, 
  Typography, 
  Box, 
  MenuItem, 
  Select,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge
} from '@mui/material';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import { TextField } from '../../../components/UI/TextField';
import { Button } from '../../../components/UI/Button';
import { ReturnMediaUploader } from './ReturnMediaUploader';

interface ItemLine {
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityDelivered: number;
  branchStock: number;
  selected: boolean;
  quantityReturned: string;
  reasonCode: string;
  notes: string;
  photoUrls: string;
  imageFiles: File[];
}

interface ReturnItemTableProps {
  lines: ItemLine[];
  onToggleLine: (itemId: number) => void;
  onUpdateLine: (itemId: number, field: keyof ItemLine, value: any) => void;
  reasons: { value: string; label: string }[];
  onError?: (error: string | null) => void;
}

export function ReturnItemTable({ lines, onToggleLine, onUpdateLine, reasons, onError }: ReturnItemTableProps) {
  const theme = useTheme();
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const editingItem = lines.find((l) => l.itemId === editingItemId);

  return (
    <>
    <Table size="small" sx={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox" sx={{ borderBottom: 'none' }} />
          <TableCell sx={{ 
            fontSize: 11, 
            fontWeight: 800, 
            color: 'text.secondary', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            borderBottom: 'none',
            pb: 1.5
          }}>
            Item Description
          </TableCell>
          <TableCell align="center" sx={{ 
            fontSize: 11, 
            fontWeight: 800, 
            color: 'text.secondary', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            borderBottom: 'none',
            width: 100,
            pb: 1.5
          }}>
            Delivered
          </TableCell>
          <TableCell align="center" sx={{ 
            fontSize: 11, 
            fontWeight: 800, 
            color: 'text.secondary', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            borderBottom: 'none',
            width: 130,
            pb: 1.5
          }}>
            Qty to Return
          </TableCell>
          <TableCell sx={{ 
            fontSize: 11, 
            fontWeight: 800, 
            color: 'text.secondary', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            borderBottom: 'none',
            width: 180,
            pb: 1.5
          }}>
            Condition / Reason
          </TableCell>
          <TableCell align="right" sx={{ 
            fontSize: 11, 
            fontWeight: 800, 
            color: 'text.secondary', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            borderBottom: 'none',
            width: 80,
            pb: 1.5
          }}>
            Actions
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((line) => (
          <React.Fragment key={line.itemId}>
            <TableRow
            sx={{
              bgcolor: line.selected ? 'rgba(201,168,77,0.04)' : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(201,168,77,0.08)' },
              '& .MuiTableCell-root': {
                borderBottom: '1px solid',
                borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                py: 1.5
              }
            }}
          >
            <TableCell padding="checkbox">
              <Checkbox
                checked={line.selected}
                onChange={() => onToggleLine(line.itemId)}
                disabled={line.branchStock <= 0}
                size="small"
                sx={{ 
                  color: line.branchStock <= 0 ? 'rgba(0,0,0,0.04)' : '#D6D3D1',
                  '&.Mui-checked': { color: '#B08B5A' } 
                }}
              />
            </TableCell>
            <TableCell>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: line.selected ? 'text.primary' : 'text.secondary' }}>
                {line.itemName}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.disabled', fontFamily: 'monospace', mt: 0.25 }}>
                {line.itemSku}
              </Typography>
            </TableCell>
            <TableCell align="center">
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                {line.quantityDelivered}
              </Typography>
            </TableCell>
            <TableCell align="center">
              <TextField
                type="number"
                size="small"
                value={line.quantityReturned}
                onChange={(e) => onUpdateLine(line.itemId, 'quantityReturned', e.target.value)}
                disabled={!line.selected || line.branchStock <= 0}
                inputProps={{ min: 0, max: Math.min(line.quantityDelivered, line.branchStock), step: 1 }}
                sx={{ 
                  width: 90,
                  '& .MuiInputBase-root': {
                    height: 34,
                    fontSize: 13,
                    fontWeight: 700,
                    bgcolor: line.selected ? '#fff' : 'rgba(0,0,0,0.02)'
                  }
                }}
              />
            </TableCell>
            <TableCell>
              <Select
                value={line.reasonCode}
                onChange={(e) => onUpdateLine(line.itemId, 'reasonCode', e.target.value as string)}
                disabled={!line.selected || line.branchStock <= 0}
                size="small"
                fullWidth
                sx={{ 
                  height: 34,
                  fontSize: 12.5,
                  fontWeight: 600,
                  bgcolor: line.selected ? '#fff' : 'rgba(0,0,0,0.02)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0,0,0,0.08)'
                  }
                }}
              >
                {reasons.map((r) => (
                  <MenuItem key={r.value} value={r.value} sx={{ fontSize: 13, fontWeight: 500 }}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </TableCell>
            <TableCell align="right">
              {line.selected && line.branchStock > 0 && (
                <IconButton 
                  size="small" 
                  onClick={() => setEditingItemId(line.itemId)}
                  sx={{ 
                    bgcolor: (line.notes || line.imageFiles.length > 0 || line.photoUrls) ? 'rgba(107,76,42,0.1)' : 'rgba(0,0,0,0.04)',
                    color: (line.notes || line.imageFiles.length > 0 || line.photoUrls) ? '#6B4C2A' : 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(107,76,42,0.15)' }
                  }}
                >
                  <Badge color="error" variant="dot" invisible={!line.notes && line.imageFiles.length === 0 && !line.photoUrls}>
                    <EditNoteRoundedIcon fontSize="small" />
                  </Badge>
                </IconButton>
              )}
            </TableCell>
          </TableRow>
          {line.branchStock < line.quantityDelivered && (
            <TableRow>
              <TableCell />
              <TableCell colSpan={4} sx={{ pt: '0 !important', pb: '8px !important', borderBottom: 'none' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  bgcolor: line.branchStock <= 0 ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)', 
                  p: 1.2, 
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: line.branchStock <= 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'
                }}>
                  <Typography sx={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: line.branchStock <= 0 ? '#DC2626' : '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    {line.branchStock <= 0 ? (
                       <>⚠️ Cannot return: This item is out of stock in your branch inventory.</>
                    ) : (
                       <>⚠️ Attention: You only have {line.branchStock} in stock, but {line.quantityDelivered} were delivered.</>
                    )}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </React.Fragment>
      ))}
      </TableBody>
    </Table>

    <Dialog 
      open={Boolean(editingItemId)} 
      onClose={() => setEditingItemId(null)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, overflow: 'hidden' }
      }}
    >
      <DialogTitle sx={{ 
        p: 2.5,
        bgcolor: '#FAF7F2',
        borderBottom: '1px solid',
        borderColor: 'rgba(107,76,42,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.2
      }}>
        <EditNoteRoundedIcon sx={{ color: '#6B4C2A', fontSize: 22 }} />
        <Typography sx={{ fontWeight: 800, color: '#6B4C2A', fontSize: 18 }}>
          Item Notes & Photos
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, pt: '24px !important' }}>
        {editingItem && (
          <>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                Notes
              </Typography>
              <TextField
                placeholder="Enter specific notes about this item's condition..."
                value={editingItem.notes}
                onChange={(e) => onUpdateLine(editingItem.itemId, 'notes', e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                Photos
              </Typography>
              <ReturnMediaUploader 
                files={editingItem.imageFiles || []}
                onChange={(files) => onUpdateLine(editingItem.itemId, 'imageFiles', files)}
                existingUrls={editingItem.photoUrls ? editingItem.photoUrls.split(',').filter(Boolean) : []}
                onRemoveExisting={(url) => {
                  const newUrls = (editingItem.photoUrls || '').split(',').filter(u => u !== url).join(',');
                  onUpdateLine(editingItem.itemId, 'photoUrls', newUrls);
                }}
                onError={onError}
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0, justifyContent: 'center' }}>
        <Button onClick={() => setEditingItemId(null)} variant="contained" sx={{ bgcolor: '#6B4C2A', '&:hover': { bgcolor: '#543B21' }, color: 'white', borderRadius: 8, px: 4, py: 1, fontWeight: 700 }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
