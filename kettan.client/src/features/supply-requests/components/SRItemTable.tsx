import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  alpha,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import LightbulbCircleRoundedIcon from '@mui/icons-material/LightbulbCircleRounded';
import CommentRoundedIcon from '@mui/icons-material/CommentRounded';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import type { SupplyRequestDetailItem } from './SupplyRequestDetail.types';
import { type PickingSuggestion } from '../../branch-operations/api';

export type SRTableMode = 'readonly' | 'picking' | 'packing' | 'branch-check';

interface SRItemTableProps {
  items: SupplyRequestDetailItem[];
  mode: SRTableMode;
  suggestions?: PickingSuggestion[];
  onItemsChange?: (items: SupplyRequestDetailItem[]) => void;
}

export default function SRItemTable({ items, mode, suggestions = [], onItemsChange }: SRItemTableProps) {
  const [localItems, setLocalItems] = useState<SupplyRequestDetailItem[]>(items);

  // Reject modal state
  const [rejectItem, setRejectItem] = useState<SupplyRequestDetailItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Sync with props when readonly or when items fundamentally change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Push changes up
  useEffect(() => {
    if (onItemsChange && mode !== 'readonly') {
      onItemsChange(localItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localItems, mode]);

  const toggleCheck = (id: string, field: 'isPicked' | 'isPacked' | 'isBranchChecked') => {
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: !item[field] } : item
      )
    );
  };

  const updateSendQty = (id: string, qty: number | null) => {
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, sendQuantity: qty } : item
      )
    );
  };

  const handleOpenReject = (e: React.MouseEvent, item: SupplyRequestDetailItem) => {
    e.stopPropagation();
    setRejectItem(item);
    setRejectReason(item.pickingRejectionReason || '');
  };

  const handleConfirmReject = () => {
    if (!rejectItem) return;
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === rejectItem.id
          ? {
              ...item,
              isPicked: false,
              isRejectedDuringPicking: true,
              pickingRejectionReason: rejectReason,
            }
          : item
      )
    );
    setRejectItem(null);
    setRejectReason('');
  };

  const handleUndoReject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isRejectedDuringPicking: false,
              pickingRejectionReason: null,
            }
          : item
      )
    );
  };

  // Filter and sort items based on mode
  let displayItems = [...localItems];

  if (mode === 'packing') {
    // Put rejected items at the bottom
    displayItems.sort((a, b) => {
      if (a.isRejectedDuringPicking && !b.isRejectedDuringPicking) return 1;
      if (!a.isRejectedDuringPicking && b.isRejectedDuringPicking) return -1;
      return 0;
    });
  } else if (mode === 'branch-check') {
    // Hide rejected items completely
    displayItems = displayItems.filter((i) => !i.isRejectedDuringPicking);
  }

  // Define columns
  const columns: ColumnDef<SupplyRequestDetailItem>[] = [];

  // Checkbox column
  if (mode !== 'readonly') {
    columns.push({
      key: 'checkbox',
      label: '',
      render: (row: SupplyRequestDetailItem) => {
        let checked = false;
        let disabled = false;
        
        if (mode === 'picking') {
          checked = row.isPicked || false;
          disabled = row.isRejectedDuringPicking || false;
        } else if (mode === 'packing') {
          checked = row.isPacked || false;
          disabled = row.isRejectedDuringPicking || false;
        } else if (mode === 'branch-check') {
          checked = row.isBranchChecked || false;
        }

        return (
          <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
            <Checkbox
              checked={checked}
              disabled={disabled}
              onClick={(e) => e.stopPropagation()} 
              onChange={() => {
                if (mode === 'picking') toggleCheck(row.id, 'isPicked');
                if (mode === 'packing') toggleCheck(row.id, 'isPacked');
                if (mode === 'branch-check') toggleCheck(row.id, 'isBranchChecked');
              }}
              sx={{ p: 0.5 }}
            />
          </Box>
        );
      },
      width: 50,
    });
  }

  columns.push(
    {
      key: 'item',
      label: 'Item',
      render: (row: SupplyRequestDetailItem) => (
        <Box>
          <Typography variant="body2" fontWeight={500} color={row.isRejectedDuringPicking ? 'text.secondary' : 'text.primary'}>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            SKU: {row.sku}
          </Typography>
        </Box>
      ),
      width: '35%',
    },
    {
      key: 'requested',
      label: 'Requested',
      render: (row: SupplyRequestDetailItem) => (
        <Typography variant="body2" color={row.isRejectedDuringPicking ? 'text.secondary' : 'text.primary'}>
          {row.requestedQty}
        </Typography>
      ),
      width: '10%',
    }
  );

  if (mode === 'readonly' || mode === 'picking') {
    columns.push({
      key: 'approved',
      label: 'Approved',
      render: (row: SupplyRequestDetailItem) => (
        <Typography variant="body2" color={row.isRejectedDuringPicking ? 'text.secondary' : 'text.primary'}>
          {row.approvedQty !== null ? row.approvedQty : '-'}
        </Typography>
      ),
      width: '10%',
    });
    
    columns.push({
      key: 'hqStock',
      label: 'HQ Stock',
      render: (row: SupplyRequestDetailItem) => (
        <Typography variant="body2" color={row.isRejectedDuringPicking ? 'text.secondary' : 'text.primary'}>
          {row.hqStock}
        </Typography>
      ),
      width: '10%',
    });
  }

  // Picking mode specials
  if (mode === 'picking') {
    columns.push({
      key: 'suggested',
      label: 'Suggested',
      render: (row: SupplyRequestDetailItem) => {
        const suggestion = suggestions.find((s) => s.itemId.toString() === row.id);
        if (!suggestion) return <Typography variant="body2" color="text.secondary">-</Typography>;
        return (
          <Tooltip title={`Branch Stock: ${suggestion.branchCurrentStock} | Threshold: ${suggestion.branchThreshold}`}>
            <Chip 
              icon={<LightbulbCircleRoundedIcon />} 
              label={suggestion.suggestedSendQty} 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ borderRadius: 1 }}
            />
          </Tooltip>
        );
      },
      width: '12%',
    });

    columns.push({
      key: 'sendQty',
      label: 'Send Qty',
      render: (row: SupplyRequestDetailItem) => {
        const suggestion = suggestions.find((s) => s.itemId.toString() === row.id);
        const defaultVal = row.sendQuantity !== null ? row.sendQuantity : (suggestion?.suggestedSendQty ?? row.approvedQty ?? row.requestedQty);

        return (
          <TextField
            size="small"
            type="number"
            value={row.sendQuantity !== null ? row.sendQuantity : defaultVal}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              updateSendQty(row.id, val);
            }}
            disabled={row.isRejectedDuringPicking}
            onClick={(e) => e.stopPropagation()}
            sx={{ width: 80, '& .MuiInputBase-root': { height: 32 } }}
          />
        );
      },
      width: '12%',
    });

    columns.push({
      key: 'actions',
      label: 'Actions',
      render: (row: SupplyRequestDetailItem) => {
        if (row.isRejectedDuringPicking) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <Tooltip title={`Rejected: ${row.pickingRejectionReason}`}>
                  <CommentRoundedIcon color="error" fontSize="small" />
               </Tooltip>
               <Tooltip title="Undo Reject">
                  <IconButton size="small" onClick={(e) => handleUndoReject(e, row.id)}>
                    <UndoRoundedIcon fontSize="small" />
                  </IconButton>
               </Tooltip>
            </Box>
          );
        }
        return (
          <Tooltip title="Reject Item">
            <IconButton size="small" color="error" onClick={(e) => handleOpenReject(e, row)}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
      width: '10%',
      align: 'right',
    });
  } else if (mode === 'packing' || mode === 'branch-check') {
     columns.push({
      key: 'sendQtyStatic',
      label: 'Send Qty',
      render: (row: SupplyRequestDetailItem) => (
        <Typography variant="body2" fontWeight={600} color={row.isRejectedDuringPicking ? 'text.secondary' : 'text.primary'}>
          {row.sendQuantity !== null ? row.sendQuantity : (row.approvedQty ?? row.requestedQty)}
        </Typography>
      ),
      width: '15%',
    });
  }

  // Readonly availability
  if (mode === 'readonly') {
     columns.push({
      key: 'availability',
      label: 'Availability',
      render: (row: SupplyRequestDetailItem) => {
        let color: 'success' | 'warning' | 'error' = 'success';
        if (row.availability === 'Low Stock') color = 'warning';
        if (row.availability === 'Out of Stock') color = 'error';

        return (
          <Chip
            label={row.availability}
            size="small"
            color={color}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          />
        );
      },
      width: '15%',
    });
  }

  // Row click handler
  const handleRowClick = (row: SupplyRequestDetailItem) => {
    if (mode === 'readonly') return;
    if (mode === 'picking' && !row.isRejectedDuringPicking) toggleCheck(row.id, 'isPicked');
    if (mode === 'packing' && !row.isRejectedDuringPicking) toggleCheck(row.id, 'isPacked');
    if (mode === 'branch-check' && !row.isRejectedDuringPicking) toggleCheck(row.id, 'isBranchChecked');
  };

  // Row styling
  const getRowSx = (row: SupplyRequestDetailItem) => {
    const sx: any = {};
    
    if (row.isRejectedDuringPicking) {
      sx.opacity = mode === 'packing' ? 0.6 : 1;
      sx.bgcolor = alpha('#f44336', 0.05);
      sx.borderLeft = `3px solid #f44336`;
      return sx;
    }
    
    let isChecked = false;
    if (mode === 'picking') isChecked = row.isPicked || false;
    if (mode === 'packing') isChecked = row.isPacked || false;
    if (mode === 'branch-check') isChecked = row.isBranchChecked || false;

    if (isChecked) {
      sx.bgcolor = alpha('#4caf50', 0.05);
    }

    if (mode !== 'readonly') {
      sx.cursor = 'pointer';
      sx['&:hover'] = { bgcolor: 'action.hover' };
    }

    return sx;
  };

  return (
    <>
      <DataTable
        data={displayItems}
        columns={columns}
        keyExtractor={(row: SupplyRequestDetailItem) => row.id}
        onRowClick={handleRowClick}
        rowSx={getRowSx}
      />

      {/* Reject Modal */}
      <Dialog open={!!rejectItem} onClose={() => setRejectItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Item</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a reason for rejecting <strong>{rejectItem?.name}</strong>. This item will not be fulfilled.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Rejection Reason"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Out of stock, not available until next week"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRejectItem(null)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmReject} 
            color="error" 
            variant="contained"
            disabled={!rejectReason.trim()}
          >
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
