import { useState } from 'react';
import { Box, Chip, Grid, Typography, Card } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { StatCard } from '../../components/UI/StatCard';

export function TenantProfilePage() {
  const { tenantId } = useParams({ strict: false });
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'billing', label: 'Billing & Plan' },
    { id: 'branches', label: 'Branches' },
    { id: 'limits', label: 'Limits' },
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
                Downtown Cafe Network
              </Typography>
              <Chip
                label="Active"
                size="small"
                sx={{ fontSize: 12, fontWeight: 700, bgcolor: 'rgba(4,120,87,0.12)', color: '#047857', border: '1px solid rgba(4,120,87,0.28)' }}
              />
              <Chip
                label="Pro Plan"
                size="small"
                sx={{ fontSize: 12, fontWeight: 700, bgcolor: 'rgba(107,76,42,0.12)', color: '#6B4C2A', border: '1px solid rgba(107,76,42,0.28)' }}
              />
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5, fontFamily: 'monospace' }}>
              Tenant ID: {tenantId || 'T-001'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5 }}>
          <Button variant="outlined" startIcon={<BuildRoundedIcon />}>Manage Settings</Button>
        </Box>
      </Box>

      {/* ── Tabs ── */}
      <Box sx={{ mb: 3, display: 'flex', borderBottom: '1px solid', borderColor: 'divider', gap: 1 }}>
        {tabs.map((t) => (
          <Box
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            sx={{
              px: 2,
              py: 1.5,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
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

      {/* ── Content (Overview Mock) ── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2.5, mb: 3 }}>
             <StatCard
                label="Active Branches"
                value={4}
                icon={<StorefrontRoundedIcon />}
                accentClass="stat-accent-brown"
                iconBg="none"
              />
              <StatCard
                label="Total Users"
                value={25}
                icon={<BusinessRoundedIcon />}
                accentClass="stat-accent-sage"
                iconBg="none"
              />
          </Box>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>Company Information</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                 <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>Primary Contact</Typography>
                 <Typography sx={{ fontSize: 14, fontWeight: 500 }}>John Doe (john@downtowncafe.com)</Typography>
              </Box>
              <Box>
                 <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>Address</Typography>
                 <Typography sx={{ fontSize: 14, fontWeight: 500 }}>123 Main St, Metro Manila, Philippines</Typography>
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
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#6B4C2A', mb: 2 }}>Pro Tier</Typography>
            
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>Next Billing Date</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>May 20, 2026</Typography>
            
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 0.5 }}>Monthly Rate</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>$199.00 / mo</Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
