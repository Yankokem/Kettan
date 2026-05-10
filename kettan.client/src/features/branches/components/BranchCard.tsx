import { useState } from 'react';
import { Box, Card, Chip, IconButton, Divider, Typography, Menu, MenuItem, ListItemIcon, useTheme } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import LocalPhoneRoundedIcon from '@mui/icons-material/LocalPhoneRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import { useNavigate } from '@tanstack/react-router';
import type { Branch } from '../types';

interface BranchCardProps {
  branch: Branch;
  onClick?: (id: string | number) => void;
  alertCount?: number;
}

export function BranchCard({ branch, onClick, alertCount }: BranchCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleInactive = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    console.log('Set inactive:', branch.id);
  };

  const handleArchive = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    console.log('Archive:', branch.id);
  };

  const statusStyle = branch.status === 'active' 
    ? theme.custom.status.active 
    : theme.custom.status.inactive;

  return (
    <Card 
      onClick={() => onClick ? onClick(branch.id) : navigate({ to: '/branches/$branchId', params: { branchId: branch.id.toString() } })}
      elevation={0}
      sx={{
        p: 0,
        border: '1px solid',
        borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
        background: theme.custom.gradients.card,
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        boxShadow: theme.palette.mode === 'light' 
          ? '0 2px 4px rgba(0,0,0,0.02), 0 1px 1px rgba(0,0,0,0.04)'
          : '0 4px 20px rgba(0,0,0,0.2)',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.palette.mode === 'light'
            ? '0 12px 20px -8px rgba(107, 76, 42, 0.12), 0 4px 6px -2px rgba(0,0,0,0.05)'
            : '0 12px 30px rgba(0,0,0,0.4)',
          borderColor: '#C9A84C',
        }
      }}
    >
      {/* Card Header Section */}
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.75, minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: theme.palette.mode === 'light' ? '#FAF5EF' : 'rgba(201,168,77,0.05)',
                flexShrink: 0,
              }}
            >
              {branch.imageUrl ? (
                <Box
                  component="img"
                  src={branch.imageUrl}
                  alt={`${branch.name} branch`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9CA3AF',
                  }}
                >
                  <StorefrontRoundedIcon sx={{ fontSize: 30 }} />
                </Box>
              )}
            </Box>

            <Box sx={{ minWidth: 0, pt: 0.25 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 800, color: 'text.primary', lineHeight: 1.2, mb: 0.65 }}>
                {branch.name}
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: 'text.primary', fontWeight: 600 }}>
                {branch.manager}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>
                {branch.staff} Staff Members
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={branch.status === 'active' ? 'Active' : 'Setup Pending'} 
              size="small" 
              sx={{ 
                height: 24, 
                px: 1.5,
                fontSize: 11, 
                fontWeight: 700, 
                bgcolor: statusStyle.bg, 
                color: statusStyle.text, 
                borderRadius: '6px' 
              }} 
            />
            
            {alertCount !== undefined && alertCount > 0 && (
               <Chip 
                 label={`${alertCount} Alerts`} 
                 size="small" 
                 sx={{ 
                   height: 22, 
                   fontSize: 10.5, 
                   fontWeight: 700, 
                   bgcolor: '#FEF2F2', 
                   color: '#B91C1C', 
                   borderRadius: '6px' 
                 }} 
               />
            )}
            <IconButton 
              size="small" 
              onClick={handleMenuOpen}
              sx={{ ml: -0.5, mr: -1, color: 'text.secondary', '&:hover': { color: '#6B4C2A', bgcolor: '#FAF5EF' } }}
            >
              <MoreVertRoundedIcon fontSize="small" />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
              PaperProps={{
                elevation: 0,
                sx: {
                  boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  minWidth: 160,
                  mt: 1,
                  borderRadius: '12px',
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1,
                    fontSize: 14,
                    color: 'text.secondary',
                    fontWeight: 500,
                    '&:hover': { bgcolor: 'rgba(201,168,77,0.08)', color: '#6B4C2A' }
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleInactive}>
                <ListItemIcon><BlockRoundedIcon fontSize="small" sx={{ color: 'inherit' }}/></ListItemIcon>
                Set Inactive
              </MenuItem>
              <MenuItem onClick={handleArchive}>
                <ListItemIcon><ArchiveRoundedIcon fontSize="small" sx={{ color: '#B91C1C' }}/></ListItemIcon>
                <Typography sx={{ color: '#B91C1C', fontSize: 14, fontWeight: 500 }}>Archive</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ opacity: 0.6 }} />

      {/* Card Details Section */}
      <Box sx={{ p: 2.5, pt: 2, display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <LocationOnRoundedIcon sx={{ fontSize: 18, color: '#8C6B43', mt: 0.1 }} />
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.4, fontWeight: 500 }}>
            {branch.address}, {branch.city}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalPhoneRoundedIcon sx={{ fontSize: 18, color: '#8C6B43' }} />
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>
            Contact: {branch.contactNumber || 'N/A'}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
