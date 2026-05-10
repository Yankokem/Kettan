import { useEffect, useState, useMemo } from 'react';
import { Box, Chip, Typography, Card, Grid, Avatar, Paper } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ContactSupportRoundedIcon from '@mui/icons-material/ContactSupportRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { ConfirmDialog } from '../../components/UI/ConfirmDialog';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import { fetchTenantDetail, toggleTenantStatus, type TenantDetail } from './tenantsApi';

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
  const pct = limit > 0 ? Math.max(0, Math.min(100, Math.round((current / limit) * 100))) : 0;

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
    <Box sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.08)', bgcolor: '#fff' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#3E2723' }}>{label}</Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>({current}/{limit})</Typography>
        </Box>
        <Chip
          label={`${pct}%`}
          size="small"
          sx={{
            height: 20,
            borderRadius: 999,
            bgcolor: toneStyles.chipBg,
            color: toneStyles.chipColor,
            fontWeight: 800,
            fontSize: 10,
          }}
        />
      </Box>

      <Box sx={{ width: '100%', height: 6, bgcolor: toneStyles.track, borderRadius: 999, overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', background: toneStyles.fill, borderRadius: 999 }} />
      </Box>
    </Box>
  );
}

export function TenantProfilePage() {
  const { tenantId } = useParams({ strict: false });
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadData = () => {
    if (!tenantId) return;
    setLoading(true);
    fetchTenantDetail(tenantId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [tenantId]);

  if (loading || !data) {
    return <LoadingOverlay open={true} />;
  }

  const { tenant, branches, userCount, subscription, payments } = data;
  const isActive = tenant.isActive && tenant.subscriptionStatus === 'Active';

  const utilization = {
    branches: subscription?.branchLimit ? Math.round((branches.length / subscription.branchLimit) * 100) : 0,
    staff: subscription?.userLimit ? Math.round((userCount / subscription.userLimit) * 100) : 0,
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscription', label: 'Subscription & Billing' },
  ];

  const handleToggle = async () => {
    if (!tenantId) return;
    try {
      await toggleTenantStatus(tenantId, !isActive);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmOpen(false);
    }
  };

  const paymentColumns: ColumnDef<(typeof payments)[0]>[] = [
    { key: 'paidAt', label: 'Date', width: 160, sortable: true, render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.paidAt ? new Date(row.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</Typography> },
    { key: 'amount', label: 'Amount', width: 140, align: 'right', render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600 }}>₱{row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography> },
    { key: 'paymentMethod', label: 'Method', width: 130, render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.paymentMethod || '—'}</Typography> },
    {
      key: 'status', label: 'Status', width: 120, align: 'center',
      render: (row) => (
        <Box sx={{ fontSize: 11.5, fontWeight: 700, color: row.status === 'Paid' ? '#047857' : '#B45309', bgcolor: row.status === 'Paid' ? 'rgba(4,120,87,0.12)' : 'rgba(180,83,9,0.12)', px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
          {row.status}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 5 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <BackButton to="/tenants" size="small" />
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Tenant Profile
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
            Business information, resource utilization, and subscription health.
          </Typography>
        </Box>
      </Box>

      {/* ── Premium Profile Header ── */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.1)', borderRadius: '14px', overflow: 'hidden', mb: 3 }}>
        <Box sx={{ position: 'relative', height: 140, background: 'linear-gradient(135deg, #6A4120 0%, #8C5F2B 34%, #B78644 68%, #E1C26F 100%)' }}>
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <Box sx={{ position: 'absolute', bottom: 12, left: { xs: 3, sm: '184px' } }}>
            <Typography sx={{ fontSize: { xs: 20, sm: 30 }, fontWeight: 800, letterSpacing: '-0.02em', color: '#FAF5EF', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
              {tenant.name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 3, sm: 4 }, pb: 3.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, mt: -5, flexWrap: 'wrap' }}>
            <Avatar variant="rounded" sx={{ width: 132, height: 132, borderRadius: '14px', bgcolor: '#FAF5EF', border: '5px solid', borderColor: 'background.paper', color: '#6B4C2A', flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
              <BusinessRoundedIcon sx={{ fontSize: 54 }} />
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1, pt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                  <Chip
                    icon={<MapRoundedIcon fontSize="small" />}
                    label={tenant.address?.split(',').pop()?.trim() || 'No City'}
                    size="small"
                    sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 28, fontWeight: 600 }}
                  />
                  <Chip
                    label={`${tenant.subscriptionTier} Plan`}
                    size="small"
                    sx={{ bgcolor: 'rgba(201,168,76,0.18)', color: '#6B4C2A', borderRadius: 999, height: 28, fontWeight: 800 }}
                  />
                  <Chip
                    label={`TENANT-${tenant.tenantId}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(107,76,42,0.10)', color: '#5C4518', borderRadius: 999, height: 24, fontWeight: 700, fontSize: 11 }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, mt: 1.25, pt: 1.15, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                  <CalendarMonthRoundedIcon sx={{ fontSize: 14 }} />
                  Joined: {new Date(tenant.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                  <HubRoundedIcon sx={{ fontSize: 14 }} />
                  {utilization.branches}% branch utilization
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                  <BadgeRoundedIcon sx={{ fontSize: 14 }} />
                  {utilization.staff}% staff utilization
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* ── Tabs ── */}
      <Box sx={{ mb: 3, display: 'flex', borderBottom: '1px solid', borderColor: 'divider', gap: 1 }}>
        {tabs.map((t) => (
          <Box
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            sx={{
              px: 2, py: 1.5, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              color: activeTab === t.id ? '#6B4C2A' : 'text.secondary',
              borderBottom: '2px solid',
              borderColor: activeTab === t.id ? '#6B4C2A' : 'transparent',
              '&:hover': { color: '#6B4C2A' }
            }}
          >
            {t.label}
          </Box>
        ))}
      </Box>

        {activeTab === 'overview' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.1)', borderRadius: '14px', p: 3, bgcolor: '#fff', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#3E2723' }}>
                <BadgeRoundedIcon sx={{ fontSize: 20 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Organization Details</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Legal Name" value={tenant.legalName || tenant.name} icon={BadgeRoundedIcon} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Tax ID" value={tenant.taxId || 'Not provided'} icon={DescriptionRoundedIcon} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Billing Email" value={tenant.email || '—'} icon={EmailRoundedIcon} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Support Email" value={tenant.supportEmail || '—'} icon={ContactSupportRoundedIcon} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Phone Contact" value={tenant.phone || '—'} icon={CallRoundedIcon} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Telephone" value={tenant.telephone || '—'} icon={CallRoundedIcon} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Website" value={tenant.website || '—'} icon={PublicRoundedIcon} /></Grid>
                <Grid size={{ xs: 12 }}><DetailRow label="Address" value={tenant.address || '—'} icon={LocationOnRoundedIcon} /></Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.1)', borderRadius: '14px', p: 3, bgcolor: '#fff', flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#3E2723' }}>
                  <MapRoundedIcon sx={{ fontSize: 20 }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Branch Network ({branches.length})</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {branches.length > 0 ? (
                    branches.slice(0, 5).map((b) => (
                      <Box key={b.branchId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar variant="rounded" sx={{ width: 42, height: 42, bgcolor: 'rgba(107, 76, 42, 0.05)', color: '#6B4C2A', borderRadius: 1.5 }}>
                          <BusinessRoundedIcon sx={{ fontSize: 22 }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500 }}>
                              {b.city || 'No City'}
                            </Typography>
                            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: b.isActive ? '#047857' : '#B91C1C' }}>
                              {b.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic', py: 2, textAlign: 'center' }}>
                      No branches registered.
                    </Typography>
                  )}
                  {branches.length > 5 && (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center', mt: 1, cursor: 'pointer', '&:hover': { color: '#6B4C2A' } }}>
                      + {branches.length - 5} more branches
                    </Typography>
                  )}
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.1)', borderRadius: '14px', p: 3, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#3E2723' }}>
                  <HubRoundedIcon sx={{ fontSize: 20 }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Plan Utilization</Typography>
                </Box>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <UtilizationMeter label="Active Branches" current={branches.length} limit={subscription?.branchLimit || 0} tone="gold" />
                  <UtilizationMeter label="Staff Licenses" current={userCount} limit={subscription?.userLimit || 0} tone="sage" />
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      )}

      {activeTab === 'subscription' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.1)', borderRadius: '14px', p: 3, bgcolor: '#fff', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#3E2723' }}>
                <BuildRoundedIcon sx={{ fontSize: 20 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Subscription & Billing Details</Typography>
              </Box>
              {subscription ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Current Plan" value={subscription.planName || '—'} icon={BuildRoundedIcon} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Billing Cycle" value={subscription.billingCycle} icon={CalendarMonthRoundedIcon} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Monthly Rate" value={`₱${subscription.planPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={PaymentRoundedIcon} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Auto-Renew" value={subscription.autoRenew ? 'Enabled' : 'Disabled'} icon={CheckCircleRoundedIcon} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Plan Status" value={subscription.status} icon={CheckCircleRoundedIcon} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Member Since" value={new Date(subscription.startDate).toLocaleDateString()} icon={CalendarMonthRoundedIcon} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Branch Capacity" value={`${subscription.branchLimit} Branches`} icon={HubRoundedIcon} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Next Billing" value={subscription.periodEnd ? new Date(subscription.periodEnd).toLocaleDateString() : '—'} icon={CalendarMonthRoundedIcon} /></Grid>
                </Grid>
              ) : (
                <Typography sx={{ py: 2, color: 'text.secondary', textAlign: 'center', fontSize: 13 }}>
                  No active subscription data available.
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.1)', borderRadius: '14px', p: 3, bgcolor: '#fff', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#3E2723' }}>
                <PaymentRoundedIcon sx={{ fontSize: 20 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Recent Payments</Typography>
              </Box>
              <DataTable 
                title={null}
                data={payments} 
                columns={[
                  { key: 'paidAt', label: 'Date', width: 100, render: (row) => <Typography sx={{ fontSize: 11.5 }}>{row.paidAt ? new Date(row.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</Typography> },
                  { key: 'amount', label: 'Amount', width: 90, align: 'right', render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 700 }}>₱{row.amount.toLocaleString('en-US')}</Typography> },
                  { key: 'status', label: 'Status', width: 80, align: 'right', render: (row) => (
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: row.status === 'Paid' ? '#047857' : '#B45309' }}>
                      {row.status}
                    </Typography>
                  )},
                ]} 
                keyExtractor={(row) => String(row.paymentId)} 
                emptyMessage="No history." 
                className="none"
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={isActive ? 'Archive Business?' : 'Reactivate Business?'}
        message={isActive
          ? `Are you sure you want to archive "${tenant.name}"? This action will immediately block all users from logging in.`
          : `Are you sure you want to reactivate "${tenant.name}"?`}
        confirmText={isActive ? 'Archive' : 'Reactivate'}
        onConfirm={handleToggle}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
