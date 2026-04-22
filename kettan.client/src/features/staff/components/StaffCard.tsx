import { useState } from 'react';
import { Card, Box, Avatar, IconButton, Typography, Chip, Menu, MenuItem, ListItemIcon } from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import { useNavigate } from '@tanstack/react-router';
import type { StaffMember } from '../types';

interface StaffCardProps {
  staff: StaffMember;
  onEdit: (staffId: number) => void;
  onInactivate: (staffId: number) => void;
  onArchive: (staffId: number) => void;
}

const getRoleChip = (role: string) => {
  if (role === 'HQ Executive') return <Chip label={role} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#E8D3A9', color: '#6B4C2A', borderRadius: 1 }} />;
  if (role === 'Branch Manager') return <Chip label={role} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#F0F4E8', color: '#546B3F', borderRadius: 1 }} />;
  return <Chip label={role} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#F3F4F6', color: '#4B5563', borderRadius: 1 }} />;
};

const getStatusChip = (status: StaffMember['status']) => {
  if (status === 'active') return <Chip label="Active" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#FEF3C7', color: '#92400E', borderRadius: 1 }} />;
  if (status === 'inactive') return <Chip label="Inactive" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#F3F4F6', color: '#4B5563', borderRadius: 1 }} />;
  return <Chip label="Archived" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#FEE2E2', color: '#B91C1C', borderRadius: 1 }} />;
};

export function StaffCard({ staff, onEdit, onInactivate, onArchive }: StaffCardProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

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

  return (
    <Card
      onClick={() => navigate({ to: '/staff/$staffId', params: { staffId: staff.id.toString() } })}
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: 4,
        display: 'flex',
        gap: 1.75,
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        opacity: staff.status === 'archived' ? 0.55 : staff.status === 'inactive' ? 0.75 : 1,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(107, 76, 42, 0.15)',
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
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#FAF5EF',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Avatar
          src={staff.imageUrl || undefined}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: 0,
            bgcolor: '#FAF5EF',
            color: '#6B4C2A',
            fontWeight: 700,
            fontSize: 30,
          }}
        >
          {!staff.imageUrl ? staff.avatar : null}
        </Avatar>
      </Box>

      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: 'text.primary', lineHeight: 1.2, mb: 0.6 }}>
              {staff.name}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
              {getRoleChip(staff.role)}
              {getStatusChip(staff.status)}
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
            <MenuItem onClick={handleInactivate}>
              <ListItemIcon>
                <BlockRoundedIcon fontSize="small" sx={{ color: 'inherit' }} />
              </ListItemIcon>
              Inactivate
            </MenuItem>
            <MenuItem onClick={handleArchive}>
              <ListItemIcon>
                <ArchiveRoundedIcon fontSize="small" sx={{ color: '#B91C1C' }} />
              </ListItemIcon>
              <Typography sx={{ color: '#B91C1C', fontSize: 14, fontWeight: 500 }}>Archive</Typography>
            </MenuItem>
          </Menu>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.6, pt: 1.4, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
            <EmailRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {staff.email}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
            <StorefrontRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {staff.location}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
