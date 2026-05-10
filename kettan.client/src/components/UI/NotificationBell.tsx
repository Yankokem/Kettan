import { IconButton, Badge, Popover, Typography, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button, CircularProgress } from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '../../features/branch-operations/api';

const POLL_INTERVAL = 30_000; // 30 seconds

function getNotificationIcon(refType: string | null) {
  switch (refType) {
    case 'Order':
    case 'SupplyDispatch':
      return <LocalShippingRoundedIcon sx={{ fontSize: 16 }} />;
    case 'SupplyRequest':
      return <AssignmentRoundedIcon sx={{ fontSize: 16 }} />;
    case 'Return':
      return <InventoryRoundedIcon sx={{ fontSize: 16 }} />;
    default:
      return <InfoRoundedIcon sx={{ fontSize: 16 }} />;
  }
}

function getNotificationRoute(refType: string | null, refId: number | null): string | null {
  if (!refId) return null;
  switch (refType) {
    case 'Order':
    case 'SupplyDispatch':
      return `/orders/${refId}`;
    case 'SupplyRequest':
      return `/supply-requests/${refId}`;
    case 'Return':
      return `/returns/${refId}`;
    default:
      return null;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const rows = await fetchNotifications();
      setNotifications(rows);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    setIsLoading(true);
    loadNotifications().finally(() => setIsLoading(false));

    const interval = setInterval(() => {
      void loadNotifications();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silently fail
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    // Mark as read
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif.notificationId);
        setNotifications((prev) =>
          prev.map((n) => (n.notificationId === notif.notificationId ? { ...n, isRead: true } : n))
        );
      } catch {
        // Silently fail
      }
    }

    // Navigate to the reference
    const route = getNotificationRoute(notif.referenceType, notif.referenceId);
    if (route) {
      handleClose();
      navigate({ to: route });
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton 
        onClick={handleClick}
        sx={{
          color: '#6B4C2A',
          bgcolor: '#FAF5EF',
          border: '1px solid',
          borderColor: 'rgba(201, 168, 77, 0.2)',
          borderRadius: '12px',
          width: 38,
          height: 38,
          '&:hover': { 
            bgcolor: '#F5E6B3', 
            borderColor: 'rgba(201, 168, 77, 0.4)',
            color: '#4A3418' 
          },
          transition: 'all 0.2s ease',
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error" 
          overlap="circular"
          sx={{ 
            '& .MuiBadge-badge': { 
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            } 
          }}
        >
          <NotificationsRoundedIcon sx={{ fontSize: 18, color: '#8C6B43' }} />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, borderRadius: '14px', mt: 1.5, border: '1px solid', borderColor: 'divider' } } }}
        elevation={4}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={() => void handleMarkAllRead()}
            >
              Mark all read
            </Typography>
          )}
        </Box>

        {isLoading && notifications.length === 0 ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#8C6B43' }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsRoundedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No notifications yet</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notif) => (
              <ListItem 
                key={notif.notificationId}
                onClick={() => void handleNotificationClick(notif)}
                sx={{ 
                  cursor: 'pointer', 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: notif.isRead ? 'transparent' : 'rgba(107,76,42,0.04)',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background 0.15s ease',
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: notif.isRead ? 'rgba(107,76,42,0.1)' : '#8C6B43', 
                    color: notif.isRead ? '#8C6B43' : '#fff',
                    width: 32, 
                    height: 32 
                  }}>
                    {getNotificationIcon(notif.referenceType)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={notif.title} 
                  secondary={notif.message} 
                  primaryTypographyProps={{ 
                    variant: 'subtitle2', 
                    fontWeight: notif.isRead ? 500 : 700,
                    sx: { fontSize: 13 }
                  }}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    sx: { 
                      fontSize: 12, 
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      overflow: 'hidden',
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', mt: 0.5, flexShrink: 0 }}>
                  {timeAgo(notif.createdAt)}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ p: 1, textAlign: 'center', bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button fullWidth size="small" variant="text" sx={{ fontWeight: 600, textTransform: 'none', color: '#6B4C2A' }}>
            View All Notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
}
