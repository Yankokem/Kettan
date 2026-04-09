import { Box, Typography, Paper, Avatar, Chip, Grid } from '@mui/material';
import { CheckCircle2, PencilLine, Save, Warehouse } from 'lucide-react';
import { Button } from '../../../../components/UI/Button';
import type { Branch, BranchFormData } from '../../types';
import type { BranchProfileKpi } from '../../branchProfileData';
import { formatSchedule, getInitials } from '../../branchProfileData';
import { Clock3, MapPin, Phone } from 'lucide-react';

interface BranchProfileHeroProps {
  branch: Branch;
  formData: BranchFormData;
  branchCode: string;
  branchOpen: boolean;
  kpis: BranchProfileKpi[];
  isEditing: boolean;
  showSavedNotice: boolean;
  onViewInventory: () => void;
  onEnableEdit: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function BranchProfileHero({
  branch,
  formData,
  branchCode,
  branchOpen,
  kpis,
  isEditing,
  showSavedNotice,
  onViewInventory,
  onEnableEdit,
  onSave,
  onDiscard,
}: BranchProfileHeroProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        overflow: 'hidden',
        mb: 3,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 150,
          background: 'linear-gradient(135deg, #6A4120 0%, #8C5F2B 34%, #B78644 68%, #E1C26F 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <Chip
          label={branchOpen ? 'Open Now' : 'Closed'}
          size="small"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            height: 30,
            borderRadius: 999,
            bgcolor: branchOpen ? 'rgba(236,253,245,0.96)' : 'rgba(255,251,235,0.95)',
            color: branchOpen ? '#166534' : '#92400E',
            border: '1px solid',
            borderColor: branchOpen ? '#86EFAC' : '#FCD34D',
            fontSize: 11,
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(0,0,0,0.14)',
          }}
        />
      </Box>

      <Box sx={{ px: { xs: 3, sm: 4 }, pb: 4, pt: { xs: 2.25, sm: 2.6 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 2.3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.1, flex: 1, minWidth: 280 }}>
            <Avatar
              src={branch.imageUrl}
              sx={{
                width: 122,
                height: 122,
                mt: { xs: -8.5, sm: -9 },
                borderRadius: 3,
                bgcolor: '#2E1F14',
                border: '5px solid #FFFFFF',
                fontWeight: 800,
                fontSize: 40,
                flexShrink: 0,
                zIndex: 2,
              }}
            >
              {getInitials(formData.name)}
            </Avatar>

            <Box sx={{ pt: { xs: 1.45, sm: 1.8 }, flex: 1, minWidth: 220 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minHeight: 30 }}>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary', lineHeight: 1.15 }}>
                  {formData.name}
                </Typography>
                <Chip
                  label={formData.status === 'active' ? 'Active' : 'Setup Pending'}
                  size="small"
                  sx={{
                    height: 24,
                    borderRadius: 999,
                    bgcolor: formData.status === 'active' ? 'success.light' : 'grey.200',
                    color: formData.status === 'active' ? 'success.dark' : 'text.secondary',
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                />
                <Chip
                  label={branchCode}
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: 999,
                    bgcolor: 'rgba(201,168,76,0.2)',
                    color: '#5C4518',
                    fontSize: 10.5,
                    fontWeight: 800,
                  }}
                />
              </Box>

              <Box sx={{ mt: 1.35, pt: 1.2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.8, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                  <MapPin size={13} />
                  {formData.city}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                  <Clock3 size={13} />
                  {formatSchedule(formData.openTime)} - {formatSchedule(formData.closeTime)}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                  <Phone size={13} />
                  {formData.contactNumber}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mt: { xs: 0.5, md: 0.75 } }}>
            <Button variant="outlined" startIcon={<Warehouse size={15} />} onClick={onViewInventory}>
              View Inventory
            </Button>

            {isEditing ? (
              <>
                <Button variant="outlined" onClick={onDiscard}>
                  Discard
                </Button>
                <Button startIcon={<Save size={15} />} onClick={onSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button startIcon={<PencilLine size={15} />} onClick={onEnableEdit}>
                Edit Branch
              </Button>
            )}
          </Box>
        </Box>

        {showSavedNotice ? (
          <Box sx={{ mt: 2.2 }}>
            <Chip
              icon={<CheckCircle2 size={14} />}
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
          {kpis.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <Grid key={kpi.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.8,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#FAFAFA',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.25 }}>
                    <Box>
                      <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{kpi.value}</Typography>
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
                      <Icon size={16} />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );
}
