import { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Chip, Grid, Paper, Typography, Skeleton } from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ContactSupportRoundedIcon from '@mui/icons-material/ContactSupportRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import { Button } from '../../components/UI/Button';
import { CompanyProfileEditModal } from './components/CompanyProfileEditModal';
import type { CompanyProfile } from './types';
import { toCompanyProfileFormData, type CompanyProfileFormData } from './types';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchCompanyProfile, updateCompanyProfile } from './companyProfileApi';


const COMPANY_PROFILE_MOCK: CompanyProfile = {
  name: 'Philippine Roasters Corp.',
  legalName: 'Philippine Roasters Corporation',
  organizationId: 'ORG-10029',
  planName: 'Enterprise Plan',
  logoUrl: null,
  headquartersCity: 'Makati City',
  headquartersAddress: 'Level 20, Ayala Triangle Gardens Tower 2, Makati City, Metro Manila',
  billingEmail: 'finance@phroasters.com',
  supportEmail: 'support@phroasters.com',
  phoneContact: '+63 2 8123 4567',
  website: 'phroasters.com',
  taxId: '000-123-456-000',
  activeBranches: 12,
  branchLimit: 20,
  activeStaff: 45,
  staffLimit: 50,
  contractRenewalDate: '2026-11-15',
};

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Box sx={{ py: 1.1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.45 }}>
        <Icon sx={{ fontSize: 13, color: 'text.secondary' }} />
        <Typography
          sx={{
            fontSize: 10.5,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'text.secondary',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 14.5, color: 'text.primary', fontWeight: 500, lineHeight: 1.35, pl: 2.2 }}>
        {value}
      </Typography>
    </Box>
  );
}

function UtilizationMeter({
  label,
  current,
  limit,
  tone,
}: {
  label: string;
  current: number;
  limit: number;
  tone: 'gold' | 'sage';
}) {
  const pct = Math.max(0, Math.min(100, Math.round((current / limit) * 100)));

  const toneStyles =
    tone === 'gold'
      ? {
          track: 'rgba(201,168,76,0.15)',
          fill: 'linear-gradient(90deg, #9F7B3A 0%, #C9A84C 100%)',
          chipBg: 'rgba(201,168,76,0.16)',
          chipColor: '#6B4C2A',
        }
      : {
          track: 'rgba(113,143,88,0.18)',
          fill: 'linear-gradient(90deg, #5F7C49 0%, #7FA45E 100%)',
          chipBg: 'rgba(113,143,88,0.15)',
          chipColor: '#3F5831',
        };

  return (
    <Box sx={{ p: 1.75, borderRadius: '14px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{label}</Typography>
        <Chip
          label={`${pct}%`}
          size="small"
          sx={{
            height: 22,
            borderRadius: 999,
            bgcolor: toneStyles.chipBg,
            color: toneStyles.chipColor,
            fontWeight: 800,
            fontSize: 11,
          }}
        />
      </Box>

      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600, mb: 1.2 }}>
        {current} / {limit} in active use
      </Typography>

      <Box sx={{ width: '100%', height: 8, bgcolor: toneStyles.track, borderRadius: 999, overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', background: toneStyles.fill, borderRadius: 999 }} />
      </Box>
    </Box>
  );
}

export function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile>(COMPANY_PROFILE_MOCK);
  const [loading, setLoading] = useState(true);
  const [editDraft, setEditDraft] = useState<CompanyProfileFormData>(toCompanyProfileFormData(COMPANY_PROFILE_MOCK));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSavedNotice, setShowSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('Standard');
  const { user } = useAuthStore();
  const sessionTenant = user?.tenant;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await fetchCompanyProfile();
        setProfile(result.profile);
        setSubscriptionTier(result.subscriptionTier);
        setEditDraft(toCompanyProfileFormData(result.profile));
      } catch (err) {
        console.error('Failed to load company profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!showSavedNotice) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setShowSavedNotice(false);
    }, 2200);

    return () => clearTimeout(timeoutHandle);
  }, [showSavedNotice]);

  const utilization = useMemo(
    () => ({
      branches: profile.branchLimit > 0 ? Math.round((profile.activeBranches / profile.branchLimit) * 100) : 0,
      staff: profile.staffLimit > 0 ? Math.round((profile.activeStaff / profile.staffLimit) * 100) : 0,
    }),
    [profile.activeBranches, profile.activeStaff, profile.branchLimit, profile.staffLimit]
  );

  const handleOpenEditModal = () => {
    setEditDraft(toCompanyProfileFormData(profile));
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditDraft(toCompanyProfileFormData(profile));
    setIsEditModalOpen(false);
  };

  const handleSaveProfile = async (nextData: CompanyProfileFormData) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      let finalLogoUrl = nextData.logoUrl;
      if (nextData.logoFile) {
        const formData = new FormData();
        formData.append('file', nextData.logoFile);
        try {
          const uploadRes = await api.post('/api/uploads/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (uploadRes.status >= 200 && uploadRes.status < 300) {
            const uploadData = uploadRes.data;
            finalLogoUrl = uploadData.Url ?? uploadData.url ?? null;
          }
        } catch (err) {
          console.error('Failed to upload company logo:', err);
        }
      }

      await updateCompanyProfile({ ...nextData, logoUrl: finalLogoUrl ?? null }, subscriptionTier);
      const refreshed = await fetchCompanyProfile();

      setProfile(refreshed.profile);
      setSubscriptionTier(refreshed.subscriptionTier);
      setEditDraft(toCompanyProfileFormData(refreshed.profile));

      if (sessionTenant) {
        useAuthStore.getState().updateTenant({
          ...sessionTenant,
          logoUrl: refreshed.profile.logoUrl ?? null,
          name: refreshed.profile.name,
        });
      }

      setIsEditModalOpen(false);
      setShowSavedNotice(true);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSaveError('Unable to save company profile right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
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
            height: 140,
            background: 'linear-gradient(135deg, #6A4120 0%, #8C5F2B 34%, #B78644 68%, #E1C26F 100%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.08,
              backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: { xs: 3, sm: '184px' },
              right: { xs: 3, sm: '420px' },
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 20, sm: 30 },
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
              {loading ? <Skeleton width={200} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : profile.name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 3, sm: 4 }, pb: 3.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, mt: -5, flexWrap: 'wrap' }}>
            {loading ? (
              <Skeleton variant="rounded" sx={{ width: 132, height: 132, borderRadius: '14px', border: '5px solid', borderColor: 'background.paper' }} />
            ) : (
              <Avatar
                variant="rounded"
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
                  fontWeight: 800
                }}
              >
                <BusinessRoundedIcon sx={{ fontSize: 54 }} />
              </Avatar>
            )}

            <Box sx={{ minWidth: 0, flex: 1, pt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                    {loading ? (
                      <>
                        <Skeleton width={100} height={28} sx={{ borderRadius: 2 }} />
                        <Skeleton width={120} height={28} sx={{ borderRadius: 999 }} />
                        <Skeleton width={80} height={24} sx={{ borderRadius: 999 }} />
                      </>
                    ) : (
                      <>
                        <Chip
                          icon={<MapRoundedIcon fontSize="small" />}
                          label={`${profile.headquartersCity} HQ`}
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
                          label={profile.planName}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(201,168,76,0.18)',
                            color: '#6B4C2A',
                            borderRadius: 999,
                            height: 28,
                            fontWeight: 800,
                          }}
                        />
                        <Chip
                          label={profile.organizationId}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(107,76,42,0.10)',
                            color: '#5C4518',
                            borderRadius: 999,
                            height: 24,
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        />
                      </>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                  <Button variant="outlined" startIcon={<BuildRoundedIcon sx={{ fontSize: 18 }} />}>
                    Manage Subscription
                  </Button>

                  <Button startIcon={<EditRoundedIcon sx={{ fontSize: 18 }} />} onClick={handleOpenEditModal}>
                    Edit Company Profile
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.8,
                  mt: 1.25,
                  pt: 1.15,
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
                      <CalendarMonthRoundedIcon sx={{ fontSize: 14 }} />
                      Renewal: {new Date(profile.contractRenewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                      <HubRoundedIcon sx={{ fontSize: 14 }} />
                      {utilization.branches}% branch capacity utilized
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                      <BadgeRoundedIcon sx={{ fontSize: 14 }} />
                      {utilization.staff}% seat utilization
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
                label="Saved changes to company profile"
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

          {saveError ? (
            <Box sx={{ mt: 2.2 }}>
              <Chip
                label={saveError}
                sx={{
                  borderRadius: 999,
                  bgcolor: 'error.light',
                  color: 'error.dark',
                  fontWeight: 700,
                }}
              />
            </Box>
          ) : null}
        </Box>
      </Paper>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#6B4C2A' }}>
              <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Organization Details</Typography>
            </Box>

            <Grid container spacing={2.4}>
              <Grid size={{ xs: 12, md: 6 }}>
                {loading ? <Skeleton height={54} /> : <DetailRow label="Legal Name" value={profile.legalName} icon={BadgeRoundedIcon} />}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {loading ? <Skeleton height={54} /> : <DetailRow label="Tax ID" value={profile.taxId} icon={DescriptionRoundedIcon} />}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {loading ? <Skeleton height={54} /> : <DetailRow label="Billing Email" value={profile.billingEmail} icon={EmailRoundedIcon} />}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {loading ? <Skeleton height={54} /> : <DetailRow label="Support Email" value={profile.supportEmail} icon={ContactSupportRoundedIcon} />}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {loading ? <Skeleton height={54} /> : <DetailRow label="Phone Contact" value={profile.phoneContact} icon={CallRoundedIcon} />}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {loading ? <Skeleton height={54} /> : <DetailRow label="Website" value={profile.website} icon={PublicRoundedIcon} />}
              </Grid>
              <Grid size={{ xs: 12 }}>
                {loading ? <Skeleton height={54} /> : <DetailRow label="Headquarters Address" value={profile.headquartersAddress} icon={LocationOnRoundedIcon} />}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#6B4C2A' }}>
              <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Plan Utilization</Typography>
            </Box>

            <Box sx={{ display: 'grid', gap: 1.4 }}>
              {loading ? (
                <>
                  <Skeleton variant="rectangular" height={90} sx={{ borderRadius: '14px' }} />
                  <Skeleton variant="rectangular" height={90} sx={{ borderRadius: '14px' }} />
                </>
              ) : (
                <>
                  <UtilizationMeter label="Active Branches" current={profile.activeBranches} limit={profile.branchLimit} tone="gold" />
                  <UtilizationMeter label="Staff Licenses" current={profile.activeStaff} limit={profile.staffLimit} tone="sage" />
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <CompanyProfileEditModal
        open={isEditModalOpen}
        formData={editDraft}
        onClose={handleCloseEditModal}
        onSave={handleSaveProfile}
      />

      {isSaving && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(255,255,255,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6">Saving...</Typography>
        </Box>
      )}
    </Box>
  );
}
