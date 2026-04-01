import { Box, Typography, Grid, Paper, Avatar, Divider, Chip } from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import { Dropdown } from '../../components/UI/Dropdown';

export function StaffProfilePage() {
  return (
    <Box sx={{ pb: 5 }}>
      {/* Header Profile Title */}
      <Box sx={{ mb: 4, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Avatar 
          variant="rounded" 
          sx={{ width: 88, height: 88, bgcolor: 'primary.main', borderRadius: 4, color: 'primary.contrastText' }}
        >
          <PersonRoundedIcon sx={{ fontSize: 44 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            Sarah Jenkins
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
            <Chip 
              icon={<EmailRoundedIcon fontSize="small" />} 
              label="sarah.j@acme.com" 
              size="small" 
              sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 28 }} 
            />
            <Chip 
              label="Manager" 
              size="small" 
              sx={{ bgcolor: 'info.light', color: 'info.dark', borderRadius: 2, height: 28, fontWeight: 700 }} 
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>ID: ST-0428</Typography>
          </Box>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<BuildRoundedIcon />}>
            Reset Password
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
            Staff Settings
          </Typography>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  First Name
                </Typography>
                <TextField defaultValue="Sarah" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Last Name
                </Typography>
                <TextField defaultValue="Jenkins" />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Email Address
                </Typography>
                <TextField defaultValue="sarah.j@acme.com" />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Role
                </Typography>
                <Dropdown
                  value="manager"
                  fullWidth
                  options={[
                    { value: 'staff', label: 'Staff' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                  sx={{ width: '100%', minWidth: 'auto' }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Assigned Branch
                </Typography>
                <Dropdown
                  value="1"
                  fullWidth
                  options={[
                    { value: '1', label: 'Downtown HQ' },
                    { value: '2', label: 'Westside Branch' },
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
