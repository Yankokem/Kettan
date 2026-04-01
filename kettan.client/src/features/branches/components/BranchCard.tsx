import { Box, Card, Chip, IconButton, Divider, Typography } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { useNavigate } from '@tanstack/react-router';
import type { Branch } from '../types';

interface BranchCardProps {
  branch: Branch;
}

const getStatusChip = (status: string) => {
  if (status === 'active') {
    return <Chip label="Active" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#FEF3C7', color: '#92400E', borderRadius: 1 }} />;
  }
  return <Chip label="Setup Pending" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#F3F4F6', color: '#4B5563', borderRadius: 1 }} />;
};

export function BranchCard({ branch }: BranchCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      onClick={() => navigate({ to: '/branches/$branchId', params: { branchId: branch.id.toString() } })}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#FAF5EF', color: '#6B4C2A', border: '1px solid #EADDCD' }}>
              <StorefrontRoundedIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusChip(branch.status)}
            <IconButton size="small" sx={{ ml: -0.5, mr: -1, color: 'text.secondary', '&:hover': { color: '#6B4C2A', bgcolor: '#FAF5EF' } }}>
              <MoreVertRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Typography sx={{ fontSize: 17, fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
          {branch.name}
        </Typography>
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
          <Box>
            <Typography sx={{ fontSize: 13.5, color: 'text.primary', fontWeight: 600 }}>
              {branch.manager}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>
              {branch.staff} Staff Members
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
