import { Avatar, Box, Chip, Grid, Paper, Typography, Skeleton } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { Button } from '../../../../components/UI/Button';
import type { Branch, BranchFormData } from '../../types';
import type { BranchProfileKpi } from '../../branchProfileData';
import { formatSchedule, getInitials } from '../../branchProfileData';

interface BranchProfileHeroProps {
  branch: Branch | null;
  formData: BranchFormData | null;
  branchCode: string;
  branchOpen: boolean;
  kpis: BranchProfileKpi[];
  showSavedNotice: boolean;
  onViewInventory: () => void;
  onEnableEdit: () => void;
  loading?: boolean;
}

export function BranchProfileHero({
  branch,
  formData,
  branchCode,
  branchOpen,
  kpis,
  showSavedNotice,
  onViewInventory,
  onEnableEdit,
  loading = false,
}: BranchProfileHeroProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 180,
          background: 'linear-gradient(135deg, #6B4C2A 0%, #8C6B43 40%, #F0E6D3 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          px: { xs: 3, sm: 4 },
          pb: 2,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: '136px' }}>
             {loading ? (
                <Skeleton variant="text" width={240} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
             ) : (
                <Box>
                  <Typography 
                    sx={{ 
                      fontSize: { xs: 22, sm: 32 }, 
                      fontWeight: 900, 
                      color: '#FFFFFF', 
                      letterSpacing: '-0.03em',
                      textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}
                  >
                    {formData?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                     <Chip
                        label={formData?.status === 'active' ? 'Active' : 'Setup'}
                        size="small"
                        sx={{
                          height: 20,
                          borderRadius: '4px',
                          bgcolor: formData?.status === 'active' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.2)',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: 10,
                          backdropFilter: 'blur(4px)',
                        }}
                      />
                      <Chip
                        label={branchCode}
                        size="small"
                        sx={{
                          height: 20,
                          borderRadius: '4px',
                          bgcolor: 'rgba(255,255,255,0.15)',
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: 10,
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          backdropFilter: 'blur(4px)',
                        }}
                      />
                  </Box>
                </Box>
             )}
          </Box>

          {loading ? (
            <Skeleton 
              variant="rectangular" 
              sx={{ width: 90, height: 28, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.1)', mb: 1 }} 
            />
          ) : (
            <Chip
              label={branchOpen ? 'Open Now' : 'Closed'}
              size="small"
              sx={{
                mb: 1,
                height: 28,
                borderRadius: 999,
                bgcolor: branchOpen ? '#34D399' : '#F59E0B',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 11,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: 'none',
              }}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 3, sm: 4 }, pb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: -10 }}>
          {loading ? (
            <Skeleton variant="rectangular" sx={{ width: 120, height: 120, borderRadius: '18px', border: '6px solid #FFFFFF' }} />
          ) : (
            <Avatar
              src={branch?.imageUrl}
              sx={{
                width: 120,
                height: 120,
                borderRadius: '18px',
                bgcolor: '#2E1F14',
                border: '6px solid #FFFFFF',
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                fontWeight: 900,
                fontSize: 42,
              }}
            >
              {formData ? getInitials(formData.name) : '??'}
            </Avatar>
          )}

          <Box sx={{ pt: 11.5, minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, mt: -6.5 }}>
              <Button 
                variant="outlined" 
                startIcon={<Inventory2RoundedIcon sx={{ fontSize: 18 }} />} 
                onClick={onViewInventory}
                sx={{ bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
              >
                View Inventory
              </Button>

              <Button 
                startIcon={<EditRoundedIcon sx={{ fontSize: 18 }} />} 
                onClick={onEnableEdit}
              >
                Edit Branch
              </Button>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.8,
                mt: 1.1,
                pt: 1.1,
                borderTop: '1px solid',
                borderColor: 'divider',
                flexWrap: 'wrap',
              }}
            >
              {loading ? (
                <Skeleton variant="text" width="60%" height={24} />
              ) : (
                <>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                    <LocationOnRoundedIcon sx={{ fontSize: 14 }} />
                    {formData?.city}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
                    {formData ? `${formatSchedule(formData.openTime)} - ${formatSchedule(formData.closeTime)}` : ''}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                    <CallRoundedIcon sx={{ fontSize: 14 }} />
                    {formData?.contactNumber}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {showSavedNotice ? (
          <Box sx={{ mt: 2.2 }}>
            <Chip
              icon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
              label="Saved changes to branch profile"
              sx={{
                borderRadius: 999,
                bgcolor: 'success.light',
                color: 'success.dark',
                fontWeight: 700,
                '& .MuiChip-icon': { color: 'success.dark' },
              }}
            />
          </Box>
        ) : null}

        <Grid container spacing={2} sx={{ mt: 2.2, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2.5 }} />
              </Grid>
            ))
          ) : (
            kpis.map((kpi) => {
              const Icon = kpi.icon;

              return (
                <Grid key={kpi.id} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: '14px',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#FAFAFA',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.25 }}>
                      <Box>
                        <Typography sx={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{kpi.value}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>{kpi.label}</Typography>
                        {kpi.helperText ? (
                          <Typography sx={{ fontSize: 10.5, color: 'text.disabled', mt: 0.3 }}>{kpi.helperText}</Typography>
                        ) : null}
                      </Box>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          bgcolor: kpi.iconBg,
                          color: kpi.iconColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon sx={{ fontSize: 17 }} />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })
          )}
        </Grid>
      </Box>
    </Paper>
  );
}
