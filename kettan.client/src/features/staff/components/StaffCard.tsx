import { useState } from 'react';
import { Card, Box, Avatar, IconButton, Typography, Chip, Menu, MenuItem, ListItemIcon, useTheme } from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../../store/useAuthStore';
import type { StaffMember } from '../types';

interface StaffCardProps {
  staff: StaffMember;
  onEdit: (staffId: number) => void;
  onActivate: (staffId: number) => void;
  onInactivate: (staffId: number) => void;
  onArchive: (staffId: number) => void;
}

const getRoleChip = (role: string, theme: any) => {
  const style = theme.custom.roles[role] || { bg: theme.palette.action.hover, text: theme.palette.text.secondary };

  return (
    <Chip
      label={role}
      size="small"
      sx={{
        height: 22,
        fontSize: 11,
        fontWeight: 700,
        bgcolor: style.bg,
        color: style.text,
        borderRadius: '6px',
        border: '1px solid',
        borderColor: 'rgba(0,0,0,0.03)',
      }}
    />
  );
};

const getStatusChip = (status: StaffMember['status'], theme: any) => {
  const style = theme.custom.status[status];

  return (
    <Chip
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      size="small"
      sx={{
        height: 22,
        fontSize: 11,
        fontWeight: 700,
        bgcolor: style.bg,
        color: style.text,
        borderRadius: '6px',
        border: '1px solid',
        borderColor: 'rgba(0,0,0,0.03)',
      }}
    />
  );
};

export function StaffCard({ staff, onEdit, onActivate, onInactivate, onArchive }: StaffCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const isSelf = String(staff.id) === currentUser?.id;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit(staff.id);
  };

  const handleActivate = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    onActivate(staff.id);
  };

  const handleInactivate = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    onInactivate(staff.id);
  };

  const handleArchive = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    onArchive(staff.id);
  };

  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Card
      onClick={() => navigate({ to: '/staff/$staffId', params: { staffId: staff.id.toString() } })}
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
        background: theme.custom.gradients.card,
        borderRadius: '16px',
        display: 'flex',
        gap: 1.75,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        boxShadow: theme.palette.mode === 'light' 
          ? '0 2px 4px rgba(0,0,0,0.02), 0 1px 1px rgba(0,0,0,0.04)'
          : '0 4px 20px rgba(0,0,0,0.2)',
        opacity: staff.status === 'archived' ? 0.65 : staff.status === 'inactive' ? 0.85 : 1,
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.palette.mode === 'light'
            ? '0 12px 20px -8px rgba(107, 76, 42, 0.12), 0 4px 6px -2px rgba(0,0,0,0.05)'
            : '0 12px 30px rgba(0,0,0,0.4)',
          borderColor: '#C9A84C',
          opacity: 1,
        },
      }}
    >
      <Box
        sx={{
          width: 92,
          minWidth: 92,
          height: 92,
          borderRadius: '11px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'light' ? '#FAF5EF' : 'rgba(201,168,77,0.05)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Avatar
          src={staff.imageUrl || undefined}
          variant="rounded"
          onLoad={() => setImgLoaded(true)}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '11px',
            bgcolor: theme.palette.mode === 'light' ? '#FAF5EF' : 'rgba(201,168,77,0.1)',
            color: '#6B4C2A',
            fontWeight: 700,
            fontSize: 30,
            opacity: staff.imageUrl ? (imgLoaded ? 1 : 0) : 1,
            transition: 'opacity 0.4s ease-in-out',
          }}
        >
          {!staff.imageUrl ? staff.avatar : null}
        </Avatar>
      </Box>

      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1.2, mb: 0.8 }}>
              {staff.name}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
              {getRoleChip(staff.role, theme)}
              {getStatusChip(staff.status, theme)}
            </Box>
          </Box>

          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ color: 'text.secondary', mt: -0.5, mr: -0.5, '&:hover': { color: '#6B4C2A', bgcolor: '#FAF5EF' } }}
          >
            <MoreVertRoundedIcon fontSize="small" />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            onClick={(event) => event.stopPropagation()}
            PaperProps={{
              elevation: 0,
              sx: {
                boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: 'divider',
                minWidth: 160,
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
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditRoundedIcon fontSize="small" sx={{ color: 'inherit' }} />
              </ListItemIcon>
              Edit
            </MenuItem>
            {staff.status !== 'active' ? (
              <MenuItem onClick={handleActivate}>
                <ListItemIcon>
                  <CheckCircleRoundedIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                </ListItemIcon>
                <Typography sx={{ color: '#2E7D32', fontSize: 14, fontWeight: 500 }}>
                  {staff.status === 'archived' ? 'Restore' : 'Activate'}
                </Typography>
              </MenuItem>
            ) : (
              <MenuItem onClick={handleInactivate} disabled={isSelf}>
                <ListItemIcon>
                  <BlockRoundedIcon fontSize="small" sx={{ color: 'inherit' }} />
                </ListItemIcon>
                Inactivate
              </MenuItem>
            )}

            {staff.status !== 'archived' && (
              <MenuItem onClick={handleArchive} disabled={isSelf}>
                <ListItemIcon>
                  <ArchiveRoundedIcon fontSize="small" sx={{ color: isSelf ? 'inherit' : '#B91C1C' }} />
                </ListItemIcon>
                <Typography sx={{ color: isSelf ? 'inherit' : '#B91C1C', fontSize: 14, fontWeight: 500 }}>Archive</Typography>
              </MenuItem>
            )}
          </Menu>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mt: 2, pt: 1.6, borderTop: '1px solid', borderColor: 'rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
            <EmailRoundedIcon sx={{ fontSize: 16, color: '#4B5563' }} />
            <Typography sx={{ fontSize: 13, color: theme.custom.text.charcoal, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {staff.email}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
            <StorefrontRoundedIcon sx={{ fontSize: 16, color: '#4B5563' }} />
            <Typography sx={{ fontSize: 13, color: theme.custom.text.charcoal, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {staff.location}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
