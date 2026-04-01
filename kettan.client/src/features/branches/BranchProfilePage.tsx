import { Box, Typography, Grid, Paper, Avatar, Divider, Chip } from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import { Dropdown } from '../../components/UI/Dropdown';

export function BranchProfilePage() {
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
            BGC Reserve
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
            <Chip 
              icon={<MapRoundedIcon fontSize="small" />} 
              label="Taguig City" 
              size="small" 
              sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 28 }} 
            />
            <Chip 
              label="Active" 
              size="small" 
              sx={{ bgcolor: 'success.light', color: 'success.dark', borderRadius: 2, height: 28, fontWeight: 700 }} 
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>ID: BR-10492</Typography>
          </Box>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<BuildRoundedIcon />}>
            Manage Access
          </Button>
          <Button>
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Profile Settings Content Sections */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            Branch Settings
          </Typography>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Branch Name
                </Typography>
                <TextField defaultValue="BGC Reserve" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Status
                </Typography>
                <Dropdown
                  value="active"
                  fullWidth
                  options={[
                    { value: 'active', label: 'Active (Operational)' },
                    { value: 'setup', label: 'Setup Pending' },
                  ]}
                  sx={{ width: '100%', minWidth: 'auto' }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Location Address
                </Typography>
                <TextField defaultValue="5th Avenue, Bonifacio Global City, Taguig" />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Assigned Manager
                </Typography>
                <Dropdown
                  value="1"
                  fullWidth
                  options={[
                    { value: '1', label: 'Miguel Santos' },
                    { value: '2', label: 'Sarah Jenkins' },
                  ]}
                  sx={{ width: '100%', minWidth: 'auto' }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
