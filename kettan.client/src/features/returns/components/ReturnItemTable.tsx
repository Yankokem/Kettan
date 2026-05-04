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
  useTheme
} from '@mui/material';
import { TextField } from '../../../components/UI/TextField';

interface ItemLine {
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityDelivered: number;
  selected: boolean;
  quantityReturned: string;
  reasonCode: string;
}

interface ReturnItemTableProps {
  lines: ItemLine[];
  onToggleLine: (itemId: number) => void;
  onUpdateLine: (itemId: number, field: 'quantityReturned' | 'reasonCode', value: string) => void;
  reasons: { value: string; label: string }[];
}

export function ReturnItemTable({ lines, onToggleLine, onUpdateLine, reasons }: ReturnItemTableProps) {
  const theme = useTheme();

  return (
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
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((line) => (
          <TableRow
            key={line.itemId}
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
                size="small"
                sx={{ 
                  color: '#D6D3D1',
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
                disabled={!line.selected}
                inputProps={{ min: 0, max: line.quantityDelivered, step: 1 }}
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
                disabled={!line.selected}
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
