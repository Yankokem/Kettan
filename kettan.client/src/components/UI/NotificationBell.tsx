import { IconButton, Badge, Popover, Typography, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button } from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import { useState } from 'react';

export function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton 
        onClick={handleClick}
        sx={{
          color: '#8C6B43',
          '&:hover': { background: 'rgba(201,168,77,0.1)', color: '#6B4C2A' },
          transition: 'background 160ms, color 160ms',
        }}
      >
        <Badge badgeContent={3} color="error" overlap="circular">
          <NotificationsRoundedIcon sx={{ fontSize: 20 }} />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, borderRadius: 3, mt: 1.5, border: '1px solid', borderColor: 'divider' } } }}
        elevation={4}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notifications</Typography>
          <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }}>Mark all read</Typography>
        </Box>
        <List sx={{ p: 0 }}>
          <ListItem 
            sx={{ cursor: 'pointer', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}><InventoryRoundedIcon sx={{ fontSize: 16 }} /></Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary="Low Stock Alert" 
              secondary="Sumatra Beans below threshold at Downtown Branch." 
              primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', mt: 0.5 }}>2m</Typography>
          </ListItem>
          <ListItem 
            sx={{ cursor: 'pointer', borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><LocalShippingRoundedIcon sx={{ fontSize: 16 }} /></Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary="Order #ORD-8891 Dispatched" 
              secondary="In-house logistics en route to Makati Branch." 
              primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', mt: 0.5 }}>1h</Typography>
          </ListItem>
        </List>
        <Box sx={{ p: 1, textAlign: 'center', bgcolor: 'background.default' }}>
          <Button fullWidth size="small" variant="text" sx={{ fontWeight: 600, textTransform: 'none' }}>
            View All Notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
}
