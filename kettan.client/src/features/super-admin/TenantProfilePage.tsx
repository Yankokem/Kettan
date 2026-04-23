import { useEffect, useState } from 'react';
import { Box, Chip, Grid, Typography, Card } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { StatCard } from '../../components/UI/StatCard';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { ConfirmDialog } from '../../components/UI/ConfirmDialog';
import { fetchTenantDetail, toggleTenantStatus, type TenantDetail } from './tenantsApi';

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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>{loading ? 'Loading…' : 'Tenant not found.'}</Typography>
      </Box>
    );
  }

  const { tenant, branches, userCount, subscription, payments } = data;
  const isActive = tenant.isActive && tenant.subscriptionStatus === 'Active';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'branches', label: `Branches (${branches.length})` },
    { id: 'actions', label: 'Actions' },
  ];

  const statusColor = isActive ? '#047857' : tenant.subscriptionStatus === 'PendingPayment' ? '#B45309' : '#B91C1C';
  const statusBg = isActive ? 'rgba(4,120,87,0.12)' : tenant.subscriptionStatus === 'PendingPayment' ? 'rgba(180,83,9,0.12)' : 'rgba(185,28,28,0.1)';

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

  const branchColumns: ColumnDef<(typeof branches)[0]>[] = [
    { key: 'name', label: 'Branch Name', sortable: true, render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.name}</Typography> },
    { key: 'city', label: 'City', sortable: true, width: 180, render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.city || '—'}</Typography> },
    {
      key: 'isActive', label: 'Status', width: 120, align: 'center',
      render: (row) => (
        <Box sx={{ fontSize: 11.5, fontWeight: 700, color: row.isActive ? '#047857' : '#B91C1C', bgcolor: row.isActive ? 'rgba(4,120,87,0.12)' : 'rgba(185,28,28,0.1)', px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Box>
      ),
    },
  ];

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
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/tenants" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                {tenant.name}
              </Typography>
              <Chip
                label={tenant.subscriptionStatus}
                size="small"
                sx={{ fontSize: 12, fontWeight: 700, bgcolor: statusBg, color: statusColor, border: `1px solid ${statusColor}40` }}
              />
              <Chip
                label={`${tenant.subscriptionTier} Plan`}
                size="small"
                sx={{ fontSize: 12, fontWeight: 700, bgcolor: 'rgba(107,76,42,0.12)', color: '#6B4C2A', border: '1px solid rgba(107,76,42,0.28)' }}
              />
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5, fontFamily: 'monospace' }}>
              Tenant ID: {tenant.tenantId}
            </Typography>
          </Box>
        </Box>
      </Box>

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

      {/* ── Tab Content ── */}
      {activeTab === 'overview' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2.5, mb: 3 }}>
              <StatCard label="Active Branches" value={branches.filter(b => b.isActive).length} icon={<StorefrontRoundedIcon />} accentClass="stat-accent-brown" iconBg="none" />
              <StatCard label="Total Users" value={userCount} icon={<GroupRoundedIcon />} accentClass="stat-accent-sage" iconBg="none" />
            </Box>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>Company Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>Email</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{tenant.email || '—'}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>Phone</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{tenant.phone || '—'}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>Address</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{tenant.address || '—'}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>Joined</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {new Date(tenant.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PaymentRoundedIcon sx={{ color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Subscription</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>Current Plan</Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#6B4C2A', mb: 2 }}>
                {subscription?.planName || tenant.subscriptionTier}
              </Typography>
              {subscription?.periodEnd && (
                <>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>Next Billing Date</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>
                    {new Date(subscription.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </>
              )}
              {subscription && (
                <>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>Monthly Rate</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 600 }}>₱{subscription.planPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} / mo</Typography>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 'subscription' && (
        <Box>
          {subscription && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, mb: 3 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>Subscription Details</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>Plan</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{subscription.planName}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>Billing Cycle</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{subscription.billingCycle}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>Auto-Renew</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{subscription.autoRenew ? 'Yes' : 'No'}</Typography>
                </Box>
              </Box>
            </Card>
          )}
          <DataTable
            title="Payment History"
            data={payments}
            columns={paymentColumns}
            keyExtractor={(row) => String(row.paymentId)}
            emptyMessage="No payments recorded yet."
          />
        </Box>
      )}

      {activeTab === 'branches' && (
        <DataTable
          title="Branches"
          data={branches}
          columns={branchColumns}
          keyExtractor={(row) => String(row.branchId)}
          emptyMessage="No branches registered."
        />
      )}

      {activeTab === 'actions' && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, maxWidth: 500 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1 }}>Tenant Status Control</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
            {isActive
              ? 'Deactivating a tenant will immediately suspend their account. All users under this tenant will be locked out.'
              : 'Reactivating this tenant will restore full access to all users under this account.'}
          </Typography>
          <Button
            onClick={() => setConfirmOpen(true)}
            sx={{
              bgcolor: isActive ? '#B91C1C' : '#047857',
              '&:hover': { bgcolor: isActive ? '#991B1B' : '#065F46' },
            }}
          >
            {isActive ? 'Deactivate Tenant' : 'Activate Tenant'}
          </Button>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={isActive ? 'Deactivate Tenant?' : 'Activate Tenant?'}
        message={isActive
          ? `Are you sure you want to deactivate "${tenant.name}"? All users will be immediately locked out.`
          : `Are you sure you want to reactivate "${tenant.name}"?`}
        confirmText={isActive ? 'Deactivate' : 'Activate'}
        onConfirm={handleToggle}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
