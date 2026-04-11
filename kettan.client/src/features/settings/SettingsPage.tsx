import { useMemo, useState } from 'react';
import { Box, Paper, TextField, Typography } from '@mui/material';
import { motion } from 'motion/react';
import {
  BellRing,
  ShieldCheck,
  SlidersHorizontal,
  Store,
} from 'lucide-react';
import { AccessMatrix } from '../../components/UI/AccessMatrix';
import { Button } from '../../components/UI/Button';
import { PageTransition, SectionReveal } from '../../components/UI/PageTransition';
import { Switch } from '../../components/UI/Switch';

type SettingsTabKey = 'access' | 'thresholds' | 'approvals' | 'notifications';

interface ThresholdConfig {
  id: string;
  label: string;
  unit: string;
  value: number;
}

const SETTINGS_TABS: {
  key: SettingsTabKey;
  label: string;
  icon: typeof SlidersHorizontal;
  hint: string;
  detail: string;
}[] = [
  {
    key: 'access',
    label: 'Role Access',
    icon: ShieldCheck,
    hint: 'Permissions by role and module',
    detail: 'Define who can view, create, update, and delete records across each major system module.',
  },
  {
    key: 'thresholds',
    label: 'Thresholds',
    icon: SlidersHorizontal,
    hint: 'Low-stock defaults for catalog items',
    detail: 'Set chain-wide minimum stock levels used by alerts, replenishment planning, and branch monitoring.',
  },
  {
    key: 'approvals',
    label: 'Approval Rules',
    icon: Store,
    hint: 'Automation limits for supply requests',
    detail: 'Configure order value rules that trigger automatic approval or require manager sign-off.',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: BellRing,
    hint: 'Persistent alert preferences',
    detail: 'Choose which operational events send persistent bell notifications to users and managers.',
  },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('access');

  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([
    { id: 'beans', label: 'Arabica Beans', unit: 'kg', value: 5 },
    { id: 'milk', label: 'Fresh Milk', unit: 'L', value: 20 },
    { id: 'cups', label: 'Medium Cups', unit: 'pcs', value: 120 },
    { id: 'lids', label: 'Cup Lids', unit: 'pcs', value: 120 },
  ]);

  const [autoApproveEnabled, setAutoApproveEnabled] = useState(true);
  const [autoApproveLimit, setAutoApproveLimit] = useState('5000');

  const [notificationPrefs, setNotificationPrefs] = useState({
    lowStock: true,
    orderUpdates: true,
    deliveryConfirmations: true,
    returnFiled: true,
  });

  const activeTabMeta = useMemo(
    () => SETTINGS_TABS.find((entry) => entry.key === activeTab) ?? SETTINGS_TABS[0],
    [activeTab]
  );

  const updateThreshold = (id: string, value: string) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    setThresholds((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, value: parsed } : entry))
    );
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '320px minmax(0, 1fr)', lg: '340px minmax(0, 1fr)' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <SectionReveal delay={0.04}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              overflow: 'hidden',
              position: { md: 'sticky' },
              top: { md: 12 },
            }}
          >
            <Box
              sx={{
                px: 2.2,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(180deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0) 100%)',
              }}
            >
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8C6B43' }}>
                Control Center
              </Typography>
              <Typography sx={{ mt: 0.4, fontSize: 16, fontWeight: 800, color: 'text.primary' }}>
                Settings Cabinet
              </Typography>
              <Typography sx={{ mt: 0.6, fontSize: 12, lineHeight: 1.5, color: 'text.secondary' }}>
                Configure access, inventory defaults, and operational rules from one place.
              </Typography>
            </Box>

            <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.55 }}>
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      position: 'relative',
                      border: 'none',
                      borderRadius: 10,
                      background: active ? 'rgba(201,168,76,0.16)' : 'transparent',
                      cursor: 'pointer',
                      color: active ? '#5C4518' : '#57534E',
                      fontWeight: active ? 700 : 600,
                      fontSize: 13,
                      padding: '12px 12px 12px 18px',
                      textAlign: 'left',
                      transition: 'background 180ms ease, color 180ms ease',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={14} />
                      {tab.label}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 5,
                        marginLeft: 22,
                        fontSize: 11,
                        fontWeight: 500,
                        color: active ? '#6B4C2A' : '#78716C',
                        opacity: 0.95,
                      }}
                    >
                      {tab.hint}
                    </span>

                    {active ? (
                      <motion.div
                        layoutId="settings-tab-indicator"
                        transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                        style={{
                          position: 'absolute',
                          top: 10,
                          bottom: 10,
                          left: 0,
                          width: 4,
                          borderTopRightRadius: 999,
                          borderBottomRightRadius: 999,
                          backgroundColor: '#C9A84C',
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </Box>
          </Paper>
        </SectionReveal>

        <PageTransition yOffset={8} duration={0.3}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            <Box sx={{ mb: 2.4, pb: 2, borderBottom: '1px dashed', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
                {activeTabMeta.label}
              </Typography>
              <Typography sx={{ mt: 0.6, fontSize: 12.5, color: 'text.secondary', maxWidth: 760, lineHeight: 1.55 }}>
                {activeTabMeta.detail}
              </Typography>
            </Box>

            {activeTab === 'access' ? <AccessMatrix hideHeader /> : null}

            {activeTab === 'thresholds' ? (
              <Box>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {thresholds.map((entry) => (
                    <Box
                      key={entry.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        px: 2,
                        py: 1.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>{entry.label}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Unit: {entry.unit}</Typography>
                      </Box>

                      <TextField
                        size="small"
                        type="number"
                        value={entry.value}
                        onChange={(event) => updateThreshold(entry.id, event.target.value)}
                        sx={{ width: 120 }}
                      />
                    </Box>
                  ))}
                </Box>

                <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button>Save Threshold Defaults</Button>
                </Box>
              </Box>
            ) : null}

            {activeTab === 'approvals' ? (
              <Box>
                <Paper
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2.5,
                    p: 2.2,
                    display: 'grid',
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Enable Auto-Approval</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        Approve supply requests automatically when below the configured cost limit.
                      </Typography>
                    </Box>
                    <Switch checked={autoApproveEnabled} onChange={(event) => setAutoApproveEnabled(event.target.checked)} />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Auto-approve if order value is below:</Typography>
                    <TextField
                      size="small"
                      value={autoApproveLimit}
                      onChange={(event) => setAutoApproveLimit(event.target.value)}
                      sx={{ width: 160 }}
                      InputProps={{ startAdornment: <span style={{ marginRight: 8, color: '#57534E' }}>PHP</span> }}
                    />
                  </Box>
                </Paper>

                <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button>Save Approval Rules</Button>
                </Box>
              </Box>
            ) : null}

            {activeTab === 'notifications' ? (
              <Box>
                <Box sx={{ display: 'grid', gap: 1.2 }}>
                  {[
                    {
                      key: 'lowStock' as const,
                      title: 'Low-Stock Alerts',
                      description: 'Notify users when branch or HQ stock drops below configured thresholds.',
                    },
                    {
                      key: 'orderUpdates' as const,
                      title: 'Order Status Changes',
                      description: 'Notify assignees when request/order statuses move through the pipeline.',
                    },
                    {
                      key: 'deliveryConfirmations' as const,
                      title: 'Delivery Confirmations',
                      description: 'Notify HQ and branch leads when deliveries are confirmed or delayed.',
                    },
                    {
                      key: 'returnFiled' as const,
                      title: 'Return Filings',
                      description: 'Notify HQ managers immediately when a branch files a return request.',
                    },
                  ].map((row) => (
                    <Paper
                      key={row.key}
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        px: 2,
                        py: 1.6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{row.title}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{row.description}</Typography>
                      </Box>
                      <Switch
                        checked={notificationPrefs[row.key]}
                        onChange={(event) =>
                          setNotificationPrefs((previous) => ({
                            ...previous,
                            [row.key]: event.target.checked,
                          }))
                        }
                      />
                    </Paper>
                  ))}
                </Box>

                <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button>Save Notification Settings</Button>
                </Box>
              </Box>
            ) : null}

            </Box>
          </Paper>
        </PageTransition>
      </Box>
    </Box>
  );
}