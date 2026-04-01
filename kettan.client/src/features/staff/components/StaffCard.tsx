import { Card, Box, Avatar, IconButton, Typography, Chip } from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import type { StaffMember } from '../types';

interface StaffCardProps {
  staff: StaffMember;
}

const getRoleChip = (role: string) => {
  if (role === 'HQ Executive') return <Chip label={role} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#E8D3A9', color: '#6B4C2A', borderRadius: 1 }} />;
  if (role === 'Branch Manager') return <Chip label={role} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#F0F4E8', color: '#546B3F', borderRadius: 1 }} />;
  return <Chip label={role} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#F3F4F6', color: '#4B5563', borderRadius: 1 }} />;
};

export function StaffCard({ staff }: StaffCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        opacity: staff.status === 'inactive' ? 0.6 : 1,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(107, 76, 42, 0.15)',
          borderColor: '#C9A84C',
          opacity: 1
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Avatar sx={{ width: 52, height: 52, bgcolor: '#FAF5EF', color: '#6B4C2A', fontWeight: 700, border: '1px solid #EADDCD', borderRadius: 3 }}>
          {staff.avatar}
        </Avatar>
        <IconButton size="small" sx={{ color: 'text.secondary', mt: -0.5, mr: -0.5, '&:hover': { color: '#6B4C2A', bgcolor: '#FAF5EF' } }}>
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
          {staff.name}
        </Typography>
        {getRoleChip(staff.role)}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EmailRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
            {staff.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StorefrontRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
            {staff.location}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
