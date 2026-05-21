import { Avatar, Box, Chip, Grid, Paper, Typography, Skeleton } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import { Button } from '../../../../components/UI/Button';
import type { Branch, BranchFormData } from '../../types';
import type { BranchProfileKpi } from '../../branchProfileData';
import { formatSchedule, getInitials } from '../../branchProfileData';

interface BranchProfileHeroProps {
  branch: Branch | null;
  formData: BranchFormData | null;
  kpis: BranchProfileKpi[];
  showSavedNotice: boolean;
  onEnableEdit: () => void;
  loading?: boolean;
}

export function BranchProfileHero({
  branch,
  formData,
  kpis,
  showSavedNotice,
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
      {/* ── Banner — matches manager-side BranchInfoPage ── */}
      <Box
        sx={{
          position: 'relative',
          height: 140,
          background: 'linear-gradient(135deg, #6A4120 0%, #8C5F2B 34%, #B78644 68%, #E1C26F 100%)',
        }}
      >
        {/* Dot texture overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Branch name — pinned to bottom-left of banner */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: { xs: 3, sm: '184px' },
            right: { xs: 3, sm: '420px' },
          }}
        >
          {loading ? (
            <Skeleton width={200} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <Typography
              sx={{
                fontSize: { xs: 20, sm: 26 },
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: '#FAF5EF',
                textShadow: '0 1px 6px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {formData?.name || 'Loading Branch...'}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 3, sm: 4 }, pb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, mt: -5, flexWrap: 'wrap' }}>
          {loading ? (
            <Skeleton variant="rounded" sx={{ width: 132, height: 132, borderRadius: '14px', border: '5px solid', borderColor: 'background.paper' }} />
          ) : (
            <Avatar
              variant="rounded"
              src={branch?.imageUrl || undefined}
              sx={{
                width: 132,
                height: 132,
                borderRadius: '14px',
                bgcolor: '#FAF5EF',
                border: '5px solid',
                borderColor: 'background.paper',
                color: '#6B4C2A',
                flexShrink: 0,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                fontSize: 48,
                fontWeight: 800,
              }}
            >
              {formData ? getInitials(formData.name) : '??'}
            </Avatar>
          )}

          <Box sx={{ minWidth: 0, flex: 1, pb: 0.5, pt: 3.5 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
              {loading ? (
                <>
                  <Skeleton width={100} height={28} sx={{ borderRadius: 2 }} />
                  <Skeleton width={120} height={28} sx={{ borderRadius: 999 }} />
                </>
              ) : (
                <>
                  <Chip
                    icon={<MapRoundedIcon fontSize="small" />}
                    label={formData?.city && formData.city !== 'N/A' ? formData.city : 'Location Unspecified'}
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      height: 28,
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={formData?.status === 'active' ? 'Active Branch' : 'Setup Pending'}
                    size="small"
                    sx={{
                      bgcolor: formData?.status === 'active' ? 'rgba(113,143,88,0.15)' : 'rgba(201,168,76,0.18)',
                      color: formData?.status === 'active' ? '#3F5831' : '#6B4C2A',
                      borderRadius: 999,
                      height: 28,
                      fontWeight: 800,
                    }}
                  />

                  <Box sx={{ flex: 1 }} />

                  <Button
                    startIcon={<EditRoundedIcon sx={{ fontSize: 18 }} />}
                    onClick={onEnableEdit}
                  >
                    Edit Branch
                  </Button>
                </>
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.8,
                pt: 0.75,
                borderTop: '1px solid',
                borderColor: 'divider',
                flexWrap: 'wrap',
              }}
            >
              {loading ? (
                <Skeleton width="60%" height={24} />
              ) : (
                <>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 14, color: '#6B4C2A' }} />
                    {formData ? `${formatSchedule(formData.openTime)} - ${formatSchedule(formData.closeTime)}` : 'Schedule Not Set'}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                    <CallRoundedIcon sx={{ fontSize: 14, color: '#6B4C2A' }} />
                    {formData?.contactNumber || 'No Contact Number'}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                    <PeopleRoundedIcon sx={{ fontSize: 14, color: '#6B4C2A' }} />
                    {branch?.staff ?? 0} Staff Members
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
