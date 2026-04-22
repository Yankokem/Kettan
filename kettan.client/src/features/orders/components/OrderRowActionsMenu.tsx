import { useState } from 'react';
import { IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';

export type OrderActionStatus =
  | 'PendingApproval'
  | 'Approved'
  | 'Processing'
  | 'Picking'
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
  onProceed: (orderId: string) => void;
  onReject: (orderId: string) => void;
}

export function OrderRowActionsMenu({
  orderId,
  status,
  onViewDetails,
  onApprove,
  onProceed,
  onReject,
}: OrderRowActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isPending = status === 'PendingApproval';
  const canProceed = status === 'Approved' || status === 'Processing' || status === 'Picking' || status === 'Packed';

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

        {canProceed ? (
          <MenuItem onClick={(event) => runAction(event, () => onProceed(orderId))}>
            <ListItemIcon>
              <ArrowForwardRoundedIcon fontSize="small" sx={{ color: 'inherit' }} />
            </ListItemIcon>
            Proceed
          </MenuItem>
        ) : null}

        {isPending ? (
          <MenuItem onClick={(event) => runAction(event, () => onReject(orderId))}>
            <ListItemIcon>
              <CancelRoundedIcon fontSize="small" sx={{ color: '#B91C1C' }} />
            </ListItemIcon>
            <Typography sx={{ color: '#B91C1C', fontSize: 14, fontWeight: 500 }}>Reject</Typography>
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}
