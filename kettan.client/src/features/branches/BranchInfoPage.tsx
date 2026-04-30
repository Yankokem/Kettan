import { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Chip, Divider, Grid, Paper, Skeleton, Typography } from '@mui/material';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchBranch, fetchBranchStaff, fetchBranchInventory } from './branchesApi';
import { fetchMenuItems, type MenuItemDto } from '../menu/menuItemsApi';
import { 
  mapBranch, 
  mapEmployee, 
  mapInventoryItem, 
  formatSchedule, 
  isOpenNow, 
  getInitials,
  BRANCH_PROFILE_TABS,
  getKpisForTab
} from './branchProfileData';
import type { Branch, BranchEmployee, BranchInventoryItem, BranchProfileTabKey } from './types';
import { BranchProfileTabHeader } from './components/profile/BranchProfileTabHeader';
import { BranchDetailsTab } from './components/profile/BranchDetailsTab';
import { BranchStaffTab } from './components/profile/BranchStaffTab';
import { BranchInventoryTab } from './components/profile/BranchInventoryTab';
import { BranchMenuTab } from './components/profile/BranchMenuTab';

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

function SummaryCard({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.75,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#FAFAFA',
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{value}</Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

export function BranchInfoPage() {
  const { user } = useAuthStore();
  const branchId = user?.branchId;

  const [activeTab, setActiveTab] = useState<BranchProfileTabKey>('details');
  const [branch, setBranch] = useState<Branch | null>(null);
  const [staff, setStaff] = useState<BranchEmployee[]>([]);
  const [inventoryItems, setInventoryItems] = useState<BranchInventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Filter tabs for branch users (hide Activity and Transactions if they aren't supposed to see them here)
  // Actually, let's show what was in the BRANCH_PROFILE_TABS except maybe hide those that might be sensitive
  // But the user said "info of the branch just like company profile"
  // For now let's show Details, Staff, Inventory, Menu.
  const filteredTabs = useMemo(() => {
    return BRANCH_PROFILE_TABS.filter(tab => 
      ['details', 'staff', 'inventory', 'menu'].includes(tab.key)
    );
  }, []);

  const loadTabContent = async (tab: BranchProfileTabKey) => {
    if (!branchId) return;
    setTabLoading(true);
    try {
      const parsedId = Number(branchId);
      switch (tab) {
        case 'staff':
          if (staff.length === 0) {
            const dto = await fetchBranchStaff(parsedId);
            setStaff(dto.map(mapEmployee));
          }
          break;
        case 'inventory':
          if (inventoryItems.length === 0) {
            const dto = await fetchBranchInventory(parsedId);
            setInventoryItems(dto.map(mapInventoryItem));
          }
          break;
        case 'menu':
          const mDto = await fetchMenuItems();
          setMenuItems(mDto);
          // Also need inventory for availability cross-reference
          if (inventoryItems.length === 0) {
            const iDto = await fetchBranchInventory(parsedId);
            setInventoryItems(iDto.map(mapInventoryItem));
          }
          break;
      }
    } catch (err) {
      console.error(`Failed to load ${tab} content:`, err);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    loadTabContent(activeTab);
  }, [activeTab, branchId]);

  useEffect(() => {
    if (!branchId) return;

    let isMounted = true;

    const loadInitial = async () => {
      setLoading(true);
      try {
        const branchDto = await fetchBranch(Number(branchId));
        if (!isMounted) return;
        setBranch(mapBranch(branchDto));
      } catch (err) {
        console.error('Failed to load branch info:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadInitial();
    return () => { isMounted = false; };
  }, [branchId]);

  if (!branchId) {
    return (
      <Box sx={{ pb: 4, display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 4,
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <StoreRoundedIcon sx={{ fontSize: 48, color: '#C9A84C', opacity: 0.5, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            No Branch Assigned
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            You haven't been assigned to a branch yet. Please contact your administrator.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const branchCode = branch ? `BR-${branch.id.toString().padStart(5, '0')}` : '';
  const branchOpen = branch ? isOpenNow(branch.openTime, branch.closeTime) : false;
  const activeStaffCount = staff.length > 0 ? staff.filter((s) => s.isActive).length : 0;
  const lowStockCount = inventoryItems.filter((i) => i.status === 'low-stock' || i.status === 'out-of-stock').length;

  const tabBadges = useMemo(() => ({
    staff: staff.length || undefined,
    inventory: inventoryItems.length || undefined,
    menu: menuItems.length || undefined,
  }), [staff.length, inventoryItems.length, menuItems.length]);

  const kpis = useMemo(() => {
    if (!branch) return [];
    return getKpisForTab(activeTab, {
      branch,
      employees: staff,
      activityLogs: [], // Not used in filtered tabs
      transactions: [], // Not used in filtered tabs
      inventoryItems,
      menuItems: menuItems.map(m => ({ status: m.status }))
    });
  }, [activeTab, branch, staff, inventoryItems, menuItems]);

  return (
    <Box sx={{ pb: 5 }}>
      {/* Hero Banner */}
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
        {/* Gradient header */}
        <Box
          sx={{
            position: 'relative',
            height: 146,
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

          {loading ? (
            <Skeleton
              variant="rectangular"
              sx={{ position: 'absolute', top: 16, right: 16, width: 80, height: 30, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.1)' }}
            />
          ) : (
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
          )}
        </Box>

        {/* Branch info below banner */}
        <Box sx={{ px: { xs: 3, sm: 4 }, pb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: -9 }}>
            {loading ? (
              <Skeleton variant="rectangular" sx={{ width: 116, height: 116, borderRadius: 3, border: '4px solid #FFFFFF' }} />
            ) : (
              <Avatar
                src={branch?.imageUrl}
                sx={{
                  width: 116,
                  height: 116,
                  borderRadius: 3,
                  bgcolor: '#2E1F14',
                  border: '4px solid #FFFFFF',
                  fontWeight: 800,
                  fontSize: 38,
                }}
              >
                {branch ? getInitials(branch.name) : '??'}
              </Avatar>
            )}

            <Box sx={{ pb: 0.3, pt: 1.1, minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pt: 0.2 }}>
                {loading ? (
                  <Skeleton variant="text" width={280} height={48} />
                ) : (
                  <>
                    <Typography sx={{ fontSize: { xs: 24, sm: 40 }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                      {branch?.name}
                    </Typography>
                    <Chip
                      label={branch?.status === 'active' ? 'Active' : 'Setup Pending'}
                      size="small"
                      sx={{
                        height: 24,
                        borderRadius: 999,
                        bgcolor: branch?.status === 'active' ? 'success.light' : 'grey.200',
                        color: branch?.status === 'active' ? 'success.dark' : 'text.secondary',
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
                  </>
                )}
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
                      {branch?.city}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                      <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
                      {branch ? `${formatSchedule(branch.openTime)} - ${formatSchedule(branch.closeTime)}` : ''}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                      <CallRoundedIcon sx={{ fontSize: 14 }} />
                      {branch?.contactNumber}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Navigation Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 3, overflow: 'hidden' }}>
        <BranchProfileTabHeader 
          tabs={filteredTabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          badgeMap={tabBadges}
          loading={tabLoading}
        />

        {/* Summary Bar - same as BranchProfilePage */}
        <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2}>
            {kpis.map((kpi) => (
              <Grid item xs={6} sm={3} key={kpi.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: kpi.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <kpi.icon sx={{ fontSize: 16, color: kpi.iconColor }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>{kpi.value}</Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Tab Content */}
        <Box>
          {activeTab === 'details' && branch && (
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
                    <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Branch Details</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="Branch Name" value={branch.name} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="Status" value={branch.status === 'active' ? 'Active (Operational)' : 'Setup Pending'} />
                    </Grid>
                    <Grid item xs={12}>
                      <DetailRow label="Address" value={branch.address} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="City" value={branch.city} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="Contact" value={branch.contactNumber} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="Schedule" value={`${formatSchedule(branch.openTime)} - ${formatSchedule(branch.closeTime)}`} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="Manager" value={branch.manager || 'Unassigned'} />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <SummaryCard
                      icon={<PeopleRoundedIcon sx={{ fontSize: 18 }} />}
                      label="Staff"
                      value={activeStaffCount.toString()}
                      iconBg="linear-gradient(135deg, #8C6B43 0%, #C9A87D 100%)"
                    />
                    <SummaryCard
                      icon={<Inventory2RoundedIcon sx={{ fontSize: 18 }} />}
                      label="Inventory Items"
                      value={inventoryItems.length.toString()}
                      iconBg="linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)"
                    />
                    <SummaryCard
                      icon={<StoreRoundedIcon sx={{ fontSize: 18 }} />}
                      label="Issues"
                      value={lowStockCount.toString()}
                      iconBg={lowStockCount > 0 ? 'linear-gradient(135deg, #B91C1C 0%, #F87171 100%)' : 'linear-gradient(135deg, #718F58 0%, #B9CBAA 100%)'}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 'staff' && (
            <BranchStaffTab employees={staff} onOpenStaffProfile={() => {}} />
          )}

          {activeTab === 'inventory' && (
            <BranchInventoryTab items={inventoryItems} />
          )}

          {activeTab === 'menu' && (
            <BranchMenuTab menuItems={menuItems} branchInventoryItems={inventoryItems} />
          )}
        </Box>
      </Paper>
    </Box>
  );
}
