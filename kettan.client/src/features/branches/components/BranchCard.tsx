import { useState } from 'react';
import { Box, Card, Chip, IconButton, Divider, Typography, Menu, MenuItem, ListItemIcon } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import { useNavigate } from '@tanstack/react-router';
import type { Branch } from '../types';

interface BranchCardProps {
  branch: Branch;
  onClick?: (id: string | number) => void;
  alertCount?: number;
}

const getStatusChip = (status: string) => {
  if (status === 'active') {
    return <Chip label="Active" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#FEF3C7', color: '#92400E', borderRadius: 1 }} />;
  }
  return <Chip label="Setup Pending" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#F3F4F6', color: '#4B5563', borderRadius: 1 }} />;
};

export function BranchCard({ branch, onClick, alertCount }: BranchCardProps) {
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

  const handleViewEdit = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    navigate({ to: '/branches/$branchId', params: { branchId: branch.id.toString() } });
  };

  const handleInactive = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    // Placeholder for set inactive action
    console.log('Set inactive:', branch.id);
  };

  const handleArchive = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    // Placeholder for archive action
    console.log('Archive:', branch.id);
  };

  return (
    <Card 
      onClick={() => onClick ? onClick(branch.id) : navigate({ to: '/branch-inventory/$branchId', params: { branchId: branch.id.toString() } })}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(107, 76, 42, 0.15)',
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
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#F3F4F6',
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
            {getStatusChip(branch.status)}
            {alertCount !== undefined && alertCount > 0 && (
               <Chip label={`${alertCount} Alerts`} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#FEF2F2', color: '#B91C1C', borderRadius: 1 }} />
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
              <MenuItem onClick={handleViewEdit}>
                <ListItemIcon><EditRoundedIcon fontSize="small" sx={{ color: 'inherit' }}/></ListItemIcon>
                View / Edit
              </MenuItem>
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

      <Divider />

      {/* Card Details Section */}
      <Box sx={{ p: 2.5, pt: 2, display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <LocationOnRoundedIcon sx={{ fontSize: 18, color: '#546B3F', mt: 0.1 }} />
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.4, fontWeight: 500 }}>
            {branch.location}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PeopleRoundedIcon sx={{ fontSize: 18, color: '#546B3F' }} />
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>
            Operations team: {branch.staff} active members
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
