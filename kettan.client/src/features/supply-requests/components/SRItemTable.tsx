import { useState } from 'react';
import {
  Box,
  Typography,
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
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import LightbulbCircleRoundedIcon from '@mui/icons-material/LightbulbCircleRounded';
import CommentRoundedIcon from '@mui/icons-material/CommentRounded';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import type { SupplyRequestDetailItem } from './SupplyRequestDetail.types';
import { type PickingSuggestion } from '../../branch-operations/api';

export type SRTableMode = 'readonly' | 'picking' | 'packing' | 'branch-check' | 'readonly-packed';

interface SRItemTableProps {
  items: SupplyRequestDetailItem[];
  mode: SRTableMode;
  suggestions?: PickingSuggestion[];
  onItemsChange?: (items: SupplyRequestDetailItem[]) => void;
}

export default function SRItemTable({ items, mode, suggestions = [], onItemsChange }: SRItemTableProps) {
  // Reject modal state
  const [rejectItem, setRejectItem] = useState<SupplyRequestDetailItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // View rejection reason modal state
  const [viewRejectItem, setViewRejectItem] = useState<SupplyRequestDetailItem | null>(null);

  const toggleCheck = (id: string, field: 'isPicked' | 'isPacked' | 'isBranchChecked') => {
    if (!onItemsChange) return;
    onItemsChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: !item[field] } : item
      )
    );
  };

  const updateSendQty = (id: string, qty: number | null) => {
    if (!onItemsChange) return;
    onItemsChange(
      items.map((item) =>
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
    if (!rejectItem || !onItemsChange) return;
    onItemsChange(
      items.map((item) =>
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
    if (!onItemsChange) return;
    onItemsChange(
      items.map((item) =>
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
  let displayItems = [...items];

  if (mode === 'packing') {
    // Put rejected items at the bottom
    displayItems.sort((a, b) => {
      if (a.isRejectedDuringPicking && !b.isRejectedDuringPicking) return 1;
      if (!a.isRejectedDuringPicking && b.isRejectedDuringPicking) return -1;
      return 0;
    });
  } else if (mode === 'branch-check' || mode === 'readonly-packed') {
    // Hide rejected items completely
    displayItems = displayItems.filter((i) => !i.isRejectedDuringPicking);
  }

  // Define columns
  const columns: ColumnDef<SupplyRequestDetailItem>[] = [];

  // Item name column (always present)
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
      width: '1fr',
    },
    {
      key: 'requested',
      label: 'Req',
      render: (row: SupplyRequestDetailItem) => (
        <Typography variant="body2" color={row.isRejectedDuringPicking ? 'text.secondary' : 'text.primary'}>
          {row.requestedQty}
        </Typography>
      ),
      width: 60,
      align: 'center',
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
      width: 60,
      align: 'center',
    });
    
    columns.push({
      key: 'hqStock',
      label: 'HQ',
      render: (row: SupplyRequestDetailItem) => (
        <Typography variant="body2" color={row.isRejectedDuringPicking ? 'text.secondary' : 'text.primary'}>
          {row.hqStock}
        </Typography>
      ),
      width: 60,
      align: 'center',
    });
  }

  // Picking mode specials
  if (mode === 'picking') {
    columns.push({
      key: 'suggested',
      label: 'Suggested',
      render: (row: SupplyRequestDetailItem) => {
        const suggestion = suggestions.find((s) => s.requestItemId.toString() === row.id);
        if (!suggestion) return <Typography variant="body2" color="text.secondary">-</Typography>;
        return (
          <Tooltip title={`Branch Stock: ${suggestion.branchCurrentStock} | Threshold: ${suggestion.branchThreshold}`}>
            <Chip 
              icon={<LightbulbCircleRoundedIcon />} 
              label={suggestion.suggestedSendQty} 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ borderRadius: 1, height: 24, '& .MuiChip-label': { px: 0.8 } }}
            />
          </Tooltip>
        );
      },
      width: 90,
      align: 'center',
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
            sx={{ width: 70, '& .MuiInputBase-root': { height: 32, fontSize: 13 } }}
          />
        );
      },
      width: 85,
      align: 'center',
    });

    // Picking action column — approve (check) + reject (X) on the right
    columns.push({
      key: 'actions',
      label: 'Actions',
      render: (row: SupplyRequestDetailItem) => {
        if (row.isRejectedDuringPicking) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
               <Tooltip title={`Rejected: ${row.pickingRejectionReason || 'No reason provided'}`}>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setViewRejectItem(row); }} sx={{ color: 'error.main' }}>
                    <CommentRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
               </Tooltip>
               <Tooltip title="Undo Reject">
                  <IconButton size="small" onClick={(e) => handleUndoReject(e, row.id)} sx={{ color: 'text.secondary' }}>
                    <UndoRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
               </Tooltip>
            </Box>
          );
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title={row.isPicked ? "Undo Approve" : "Approve Item"}>
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); toggleCheck(row.id, 'isPicked'); }}
                sx={{ 
                  color: row.isPicked ? '#fff' : '#16a34a',
                  bgcolor: row.isPicked ? '#16a34a' : alpha('#16a34a', 0.06),
                  border: `1px solid ${row.isPicked ? '#16a34a' : alpha('#16a34a', 0.3)}`,
                  '&:hover': { bgcolor: row.isPicked ? '#15803d' : alpha('#16a34a', 0.14) },
                  transition: 'all 0.2s ease',
                }}
              >
                <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reject Item">
              <IconButton 
                size="small" 
                onClick={(e) => handleOpenReject(e, row)}
                sx={{ 
                  color: '#dc2626',
                  bgcolor: alpha('#dc2626', 0.06),
                  border: `1px solid ${alpha('#dc2626', 0.3)}`,
                  '&:hover': { bgcolor: alpha('#dc2626', 0.14) },
                  transition: 'all 0.2s ease',
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
      width: 110,
      align: 'right',
    });
  } else if (mode === 'packing' || mode === 'branch-check' || mode === 'readonly-packed') {
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

  // Packing/branch-check action column with checkbox + rejection info
  if (mode === 'packing' || mode === 'branch-check') {
    columns.push({
      key: 'actions',
      label: 'Actions',
      render: (row: SupplyRequestDetailItem) => {
        if (row.isRejectedDuringPicking) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
              <Tooltip title={`Rejected: ${row.pickingRejectionReason || 'No reason provided'}`}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setViewRejectItem(row); }} sx={{ color: 'error.main' }}>
                  <CommentRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        }
        
        const checked = mode === 'packing' ? (row.isPacked || false) : (row.isBranchChecked || false);
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title={checked ? "Undo" : (mode === 'packing' ? "Mark Packed" : "Mark Checked")}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === 'packing') toggleCheck(row.id, 'isPacked');
                  if (mode === 'branch-check') toggleCheck(row.id, 'isBranchChecked');
                }}
                sx={{
                  color: checked ? '#fff' : '#16a34a',
                  bgcolor: checked ? '#16a34a' : alpha('#16a34a', 0.06),
                  border: `1px solid ${checked ? '#16a34a' : alpha('#16a34a', 0.3)}`,
                  '&:hover': { bgcolor: checked ? '#15803d' : alpha('#16a34a', 0.14) },
                  transition: 'all 0.2s ease',
                }}
              >
                <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
      width: 80,
      align: 'right',
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

  // Readonly-packed and readonly: show rejection reason icon for branch users
  if (mode === 'readonly-packed' || mode === 'readonly') {
    // Only add rejection info column if any items are rejected
    const hasRejectedItems = items.some(i => i.isRejectedDuringPicking);
    if (hasRejectedItems) {
      columns.push({
        key: 'rejectionInfo',
        label: '',
        render: (row: SupplyRequestDetailItem) => {
          if (!row.isRejectedDuringPicking || !row.pickingRejectionReason) return null;
          return (
            <Tooltip title={`Rejection Reason: ${row.pickingRejectionReason}`}>
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); setViewRejectItem(row); }} 
                sx={{ color: 'error.main' }}
              >
                <CommentRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          );
        },
        width: 50,
        align: 'center',
      });
    }
  }

  // Row click handler
  const handleRowClick = (row: SupplyRequestDetailItem) => {
    if (mode === 'readonly' || mode === 'readonly-packed') return;
    if (mode === 'picking' && !row.isRejectedDuringPicking) toggleCheck(row.id, 'isPicked');
    if (mode === 'packing' && !row.isRejectedDuringPicking) toggleCheck(row.id, 'isPacked');
    if (mode === 'branch-check' && !row.isRejectedDuringPicking) toggleCheck(row.id, 'isBranchChecked');
  };

  // Row styling
  const getRowSx = (row: SupplyRequestDetailItem) => {
    const sx: any = {};
    
    if (row.isRejectedDuringPicking) {
      sx.opacity = mode === 'packing' ? 0.7 : 1;
      sx.bgcolor = alpha('#f44336', 0.04);
      sx.outline = `1px solid ${alpha('#f44336', 0.5)}`;
      sx.outlineOffset = '-1px';
      return sx;
    }
    
    let isChecked = false;
    if (mode === 'picking') isChecked = row.isPicked || false;
    if (mode === 'packing') isChecked = row.isPacked || false;
    if (mode === 'branch-check') isChecked = row.isBranchChecked || false;

    if (isChecked) {
      sx.bgcolor = alpha('#4caf50', 0.05);
    }

    if (mode !== 'readonly' && mode !== 'readonly-packed') {
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
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Item</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a reason for rejecting <strong>{rejectItem?.name}</strong>. This note will be visible to the branch as well.
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

      {/* View Rejection Reason Modal */}
      <Dialog open={!!viewRejectItem} onClose={() => setViewRejectItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Rejection Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Item</Typography>
            <Typography variant="body1" fontWeight={600}>{viewRejectItem?.name}</Typography>
            <Typography variant="caption" color="text.secondary">SKU: {viewRejectItem?.sku}</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: alpha('#f44336', 0.04), borderRadius: 2, border: `1px solid ${alpha('#f44336', 0.2)}` }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>Reason for Rejection</Typography>
            <Typography variant="body2">{viewRejectItem?.pickingRejectionReason || 'No reason provided'}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setViewRejectItem(null)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
