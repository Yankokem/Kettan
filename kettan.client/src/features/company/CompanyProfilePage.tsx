import { Box, Typography, Grid, Paper, Avatar, Divider, Chip } from '@mui/material';
import BusinessRoundedIcon from '@/components/icons/lucide-mui/BusinessRoundedIcon';
import BuildRoundedIcon from '@/components/icons/lucide-mui/BuildRoundedIcon';
import MapRoundedIcon from '@/components/icons/lucide-mui/MapRoundedIcon';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';

export function CompanyProfilePage() {
  return (
    <Box sx={{ pb: 5 }}>
      {/* Header Profile Title */}
      <Box sx={{ mb: 4, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Avatar 
          variant="rounded" 
          sx={{ width: 88, height: 88, bgcolor: 'primary.main', borderRadius: 4, color: 'primary.contrastText' }}
        >
          <BusinessRoundedIcon sx={{ fontSize: 44 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            Philippine Roasters Corp.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
            <Chip 
              icon={<MapRoundedIcon fontSize="small" />} 
              label="Manila HQ" 
              size="small" 
              sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 28 }} 
            />
            <Chip 
              label="Enterprise Plan" 
              size="small" 
              sx={{ bgcolor: 'primary.light', color: 'primary.dark', borderRadius: 2, height: 28, fontWeight: 700 }} 
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>ID: ORG-10029</Typography>
          </Box>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<BuildRoundedIcon />}>
            Manage Subscription
          </Button>
          <Button>
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Profile Settings Content Sections */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            Organization Settings
          </Typography>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Organization Name
                </Typography>
                <TextField defaultValue="Philippine Roasters Corp." />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Billing Email
                </Typography>
                <TextField defaultValue="finance@phroasters.com" />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Phone Contact
                </Typography>
                <TextField defaultValue="+63 2 8123 4567" />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Headquarters Address
                </Typography>
                <TextField defaultValue="Level 20, Ayala Triangle Gardens Tower 2, Makati City" />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            System Limits
          </Typography>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
             <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Active Branches</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>12 / 20</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 6, bgcolor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ width: '60%', height: '100%', bgcolor: 'primary.main', borderRadius: 3 }} />
              </Box>
             </Box>
             
             <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Staff Licenses</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>45 / 50</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 6, bgcolor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ width: '90%', height: '100%', bgcolor: 'error.main', borderRadius: 3 }} />
              </Box>
             </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}


