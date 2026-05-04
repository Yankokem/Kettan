import { useState } from 'react';
import { IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import DoDisturbOnRoundedIcon from '@mui/icons-material/DoDisturbOnRounded';

export type OrderActionStatus =
  | 'PendingApproval'
  | 'Approved'
  | 'PartiallyApproved'
  | 'Processing'
  | 'Picking'
  | 'Allocated'
  | 'Packing'
  | 'Packed'
  | 'Dispatched'
  | 'InTransit'
  | 'Delivered'
  | 'Rejected'
  | 'Returned';

interface OrderRowActionsMenuProps {
  orderId: string;
  status: OrderActionStatus;
  onViewDetails: (orderId: string) => void;
  onApprove: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onMessageBranch?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
}

export function OrderRowActionsMenu({
  orderId,
  status,
  onViewDetails,
  onApprove,
  onReject,
  onMessageBranch,
  onCancelOrder,
}: OrderRowActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isPending = status === 'PendingApproval';
  const canCancel = !['Delivered', 'Rejected', 'Returned', 'Dispatched', 'InTransit'].includes(status);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const runAction = (event: React.MouseEvent<HTMLElement>, cb: () => void) => {
    event.stopPropagation();
    handleMenuClose();
    cb();
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label="Actions"
        onClick={handleMenuOpen}
        sx={{ color: 'text.secondary', '&:hover': { color: '#6B4C2A', bgcolor: '#FAF5EF' } }}
      >
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={(event) => event.stopPropagation()}
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 190,
            mt: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: 14,
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': { bgcolor: 'rgba(201,168,77,0.08)', color: '#6B4C2A' },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={(event) => runAction(event, () => onViewDetails(orderId))}>
          <ListItemIcon>
            <VisibilityRoundedIcon fontSize="small" sx={{ color: 'inherit' }} />
          </ListItemIcon>
          View Details
        </MenuItem>

        {isPending ? (
          <MenuItem onClick={(event) => runAction(event, () => onApprove(orderId))}>
            <ListItemIcon>
              <CheckCircleRoundedIcon fontSize="small" sx={{ color: 'inherit' }} />
            </ListItemIcon>
            Approve
          </MenuItem>
        ) : null}

        <MenuItem onClick={(event) => runAction(event, () => onMessageBranch?.(orderId))}>
          <ListItemIcon>
            <ChatBubbleOutlineRoundedIcon fontSize="small" sx={{ color: 'inherit' }} />
          </ListItemIcon>
          Message Branch
        </MenuItem>

        {isPending ? (
          <MenuItem onClick={(event) => runAction(event, () => onReject(orderId))}>
            <ListItemIcon>
              <CancelRoundedIcon fontSize="small" sx={{ color: '#B91C1C' }} />
            </ListItemIcon>
            <Typography sx={{ color: '#B91C1C', fontSize: 14, fontWeight: 500 }}>Reject</Typography>
          </MenuItem>
        ) : (
          canCancel && (
            <MenuItem onClick={(event) => runAction(event, () => onCancelOrder?.(orderId))}>
              <ListItemIcon>
                <DoDisturbOnRoundedIcon fontSize="small" sx={{ color: '#B91C1C' }} />
              </ListItemIcon>
              <Typography sx={{ color: '#B91C1C', fontSize: 14, fontWeight: 500 }}>Cancel Order</Typography>
            </MenuItem>
          )
        )}
      </Menu>
    </>
  );
}
