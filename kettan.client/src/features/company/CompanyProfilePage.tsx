import { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Chip, Grid, Paper, Typography } from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import { Button } from '../../components/UI/Button';
import { CompanyProfileEditModal } from './components/CompanyProfileEditModal';
import type { CompanyProfile } from './types';
import { toCompanyProfileFormData, type CompanyProfileFormData } from './types';
import { fetchCompanyProfile, fetchCompanyProfileCore, fetchCompanyUtilizationCounts, updateCompanyProfile } from './companyProfileApi';
import { useAuthStore } from '../../store/useAuthStore';

const EMPTY_COMPANY_PROFILE: CompanyProfile = {
  name: 'Company Profile',
  legalName: 'Company Profile',
  organizationId: 'N/A',
  planName: 'Starter Plan',
  headquartersCity: 'Not Set',
  headquartersAddress: 'Not Set',
  billingEmail: '',
  supportEmail: '',
  phoneContact: '',
  website: '',
  taxId: 'N/A',
  activeBranches: 0,
  branchLimit: 1,
  activeStaff: 0,
  staffLimit: 1,
  contractRenewalDate: new Date().toISOString(),
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ py: 1.1 }}>
      <Typography
        sx={{
          fontSize: 10.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          color: 'text.secondary',
          mb: 0.45,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14.5, color: 'text.primary', fontWeight: 600, lineHeight: 1.35 }}>{value}</Typography>
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
    <Box sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
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
  const sessionTenant = useAuthStore((state) => state.user?.tenant);

  const initialProfile = useMemo<CompanyProfile>(() => {
    if (!sessionTenant) {
      return EMPTY_COMPANY_PROFILE;
    }

    const normalizedTier = typeof sessionTenant.subscriptionTier === 'string' 
      ? sessionTenant.subscriptionTier.trim().toLowerCase()
      : String(sessionTenant.subscriptionTier || '').toLowerCase();
    const planName = normalizedTier === 'enterprise' || normalizedTier === '3'
      ? 'Enterprise Plan'
      : normalizedTier === 'growth' || normalizedTier === '2'
        ? 'Growth Plan'
        : 'Starter Plan';

    return {
      ...EMPTY_COMPANY_PROFILE,
      name: sessionTenant.name || EMPTY_COMPANY_PROFILE.name,
      legalName: sessionTenant.name || EMPTY_COMPANY_PROFILE.legalName,
      planName,
    };
  }, [sessionTenant]);

  const [profile, setProfile] = useState<CompanyProfile>(initialProfile);
  const [subscriptionTier, setSubscriptionTier] = useState(sessionTenant?.subscriptionTier ?? 'Starter');
  const [editDraft, setEditDraft] = useState<CompanyProfileFormData>(toCompanyProfileFormData(initialProfile));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSavedNotice, setShowSavedNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(!sessionTenant);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoadError(null);

        const core = await fetchCompanyProfileCore();
        if (!isMounted) {
          return;
        }

        setProfile(core.profile);
        setSubscriptionTier(core.subscriptionTier);
        setEditDraft(toCompanyProfileFormData(core.profile));
        setIsLoading(false);

        const counts = await fetchCompanyUtilizationCounts();
        if (!isMounted) {
          return;
        }

        setProfile((previous) => ({
          ...previous,
          activeBranches: counts.activeBranches,
          activeStaff: counts.activeStaff,
        }));
      } catch {
        if (!isMounted) {
          return;
        }

        setLoadError('Unable to load company profile from API.');
        setIsLoading(false);
      } finally {
        // no-op: loading is settled once core profile call resolves
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
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
      branches: Math.round((profile.activeBranches / Math.max(1, profile.branchLimit)) * 100),
      staff: Math.round((profile.activeStaff / Math.max(1, profile.staffLimit)) * 100),
    }),
    [profile.activeBranches, profile.activeStaff, profile.branchLimit, profile.staffLimit]
  );

  const handleOpenEditModal = () => {
    setSaveError(null);
    setEditDraft(toCompanyProfileFormData(profile));
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSaveError(null);
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
          const uploadRes = await fetch('/api/uploads/image', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            // Backend returns { Url, PublicId } (PascalCase)
            finalLogoUrl = uploadData.Url ?? uploadData.url ?? null;
            console.log('[Upload] Logo URL:', finalLogoUrl);
          } else {
            const errData = await uploadRes.json().catch(() => ({}));
            console.error('[Upload] Logo upload failed:', uploadRes.status, errData);
          }
        } catch (err) {
          console.error('Failed to upload company logo:', err);
        }
      }

      await updateCompanyProfile({ ...nextData, logoUrl: finalLogoUrl }, subscriptionTier);
      const refreshed = await fetchCompanyProfile();

      setProfile(refreshed.profile);
      setSubscriptionTier(refreshed.subscriptionTier);
      setEditDraft(toCompanyProfileFormData(refreshed.profile));
      
      // Update global auth store to reflect new logo
      if (sessionTenant) {
        useAuthStore.getState().updateTenant({
          ...sessionTenant,
          logoUrl: refreshed.profile.logoUrl,
          name: refreshed.profile.name
        });
      }

      setIsEditModalOpen(false);
      setShowSavedNotice(true);
    } catch {
      setSaveError('Unable to save company profile right now.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && profile.name === EMPTY_COMPANY_PROFILE.name) {
    return (
      <Box sx={{ pb: 5, pt: 4 }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Loading company profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      {(loadError || saveError) && (
        <Typography sx={{ fontSize: 13, color: 'error.main', mb: 2 }}>
          {saveError || loadError}
        </Typography>
      )}

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
        {/* ── Banner ── */}
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

          {/* Action buttons — top-right of banner */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              pr: { xs: 3, sm: 4 },
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<BuildRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#FAF5EF',
                '&:hover': { borderColor: '#FAF5EF', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Manage Subscription
            </Button>

            <Button
              startIcon={<EditRoundedIcon sx={{ fontSize: 18 }} />}
              onClick={handleOpenEditModal}
              disabled={isSaving}
              sx={{
                bgcolor: '#2E1F14',
                color: '#FAF5EF',
                '&:hover': { bgcolor: '#1A1209' },
              }}
            >
              Edit Company Profile
            </Button>
          </Box>

          {/* Company name — pinned to bottom-left of banner, after avatar width */}
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
              {profile.name}
            </Typography>
          </Box>
        </Box>

        {/* ── Below-banner row: avatar + chips + meta ── */}
        <Box sx={{ px: { xs: 3, sm: 4 }, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, mt: -5, flexWrap: 'wrap' }}>
            {/* Avatar centered on the seam — half above, half below */}
            <Avatar
              variant="rounded"
              src={profile.logoUrl || undefined}
              sx={{
                width: 132,
                height: 132,
                borderRadius: 4,
                bgcolor: '#FAF5EF',
                border: '5px solid',
                borderColor: 'background.paper',
                color: '#6B4C2A',
                flexShrink: 0,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
            >
              {!profile.logoUrl && <BusinessRoundedIcon sx={{ fontSize: 64 }} />}
            </Avatar>

            {/* Chips + meta below the avatar */}
            <Box sx={{ minWidth: 0, flex: 1, pb: 0.5, pt: 3.5 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
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
        </Box>
      </Paper>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#6B4C2A' }}>
              <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Organization Details</Typography>
            </Box>

            <Grid container spacing={2.4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Legal Name" value={profile.legalName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Tax ID" value={profile.taxId} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Billing Email" value={profile.billingEmail} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Support Email" value={profile.supportEmail} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Phone Contact" value={profile.phoneContact} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Website" value={profile.website} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailRow label="Headquarters Address" value={profile.headquartersAddress} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#6B4C2A' }}>
              <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Plan Utilization</Typography>
            </Box>

            <Box sx={{ display: 'grid', gap: 1.4 }}>
              <UtilizationMeter label="Active Branches" current={profile.activeBranches} limit={profile.branchLimit} tone="gold" />
              <UtilizationMeter label="Staff Licenses" current={profile.activeStaff} limit={profile.staffLimit} tone="sage" />
            </Box>

            <Box sx={{ mt: 2.2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'grid', gap: 1 }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
                <CallRoundedIcon sx={{ fontSize: 15 }} />
                {profile.phoneContact}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
                <AlternateEmailRoundedIcon sx={{ fontSize: 15 }} />
                {profile.supportEmail}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
                <PublicRoundedIcon sx={{ fontSize: 15 }} />
                {profile.website}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <CompanyProfileEditModal
        open={isEditModalOpen}
        formData={editDraft}
        onClose={handleCloseEditModal}
        onSave={handleSaveProfile}
        isSaving={isSaving}
      />
    </Box>
  );
}