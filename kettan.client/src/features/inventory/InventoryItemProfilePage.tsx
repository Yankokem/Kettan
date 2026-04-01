import { Box, Typography, Grid, Paper, Avatar, Divider, Chip } from '@mui/material';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import { Dropdown } from '../../components/UI/Dropdown';

export function InventoryItemProfilePage() {
  return (
    <Box sx={{ pb: 5 }}>
      {/* Header Profile Title */}
      <Box sx={{ mb: 4, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Avatar 
          variant="rounded" 
          sx={{ width: 88, height: 88, bgcolor: 'error.main', borderRadius: 4, color: 'error.contrastText' }}
        >
          <LocalCafeRoundedIcon sx={{ fontSize: 44 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            Espresso Blend A
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
            <Chip 
              icon={<HandshakeRoundedIcon fontSize="small" />} 
              label="Origin Roasters" 
              size="small" 
              sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 28 }} 
            />
            <Chip 
              label="Low Stock" 
              size="small"
              icon={<WarningRoundedIcon fontSize="small" />}
              sx={{ bgcolor: 'error.main', color: 'white', '& .MuiChip-icon': { color: 'white' }, borderRadius: 2, height: 28, fontWeight: 700 }} 
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>SKU: BN-ESA-01</Typography>
          </Box>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<BuildRoundedIcon />}>
            Order Supply
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
            Product Configuration
          </Typography>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Item Name
                </Typography>
                <TextField defaultValue="Espresso Blend A" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  SKU Reference
                </Typography>
                <TextField defaultValue="BN-ESA-01" />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Category
                </Typography>
                <Dropdown
                  value="beans"
                  fullWidth
                  options={[
                    { value: 'beans', label: 'Coffee Beans' },
                    { value: 'syrup', label: 'Syrups' },
                    { value: 'milk', label: 'Milk' },
                  ]}
                  sx={{ width: '100%', minWidth: 'auto' }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Supplier Info
                </Typography>
                <Dropdown
                  value="roasters"
                  fullWidth
                  options={[
                    { value: 'roasters', label: 'Origin Roasters' },
                    { value: 'monin', label: 'Monin Dist.' },
                  ]}
                  sx={{ width: '100%', minWidth: 'auto' }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
                  Reorder Threshold
                </Typography>
                <TextField defaultValue="20" type="number" />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}