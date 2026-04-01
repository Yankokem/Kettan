import { Card, Box, Avatar, Typography } from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import SettingsApplicationsRoundedIcon from '@mui/icons-material/SettingsApplicationsRounded';
import { CustomButton } from '../../../components/UI/CustomButton';

export function TenantRibbon() {
  return (
    <Card
      elevation={0}
      sx={{
        p: 3,
        mb: 5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: '#FAF5EF', color: '#6B4C2A', border: '1px solid #EADDCD', borderRadius: 3 }}>
          <BusinessRoundedIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
            Kettan Coffee Co.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: '#6B4C2A', fontWeight: 600, bgcolor: '#FAF5EF', px: 1, py: 0.25, borderRadius: 1 }}>
              Enterprise Tier
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
              Tenant ID: TEN-8448
            </Typography>
          </Box>
        </Box>
      </Box>
      <CustomButton variant="outlined" startIcon={<SettingsApplicationsRoundedIcon />}>
        Tenant Settings
      </CustomButton>
    </Card>
  );
}
