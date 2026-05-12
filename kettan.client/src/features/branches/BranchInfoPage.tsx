import { useEffect, useState } from 'react';
import { Avatar, Box, Chip, Grid, Paper, Typography } from '@mui/material';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchBranch, fetchBranchStaff, fetchBranchInventory } from './branchesApi';
import { fetchReturns, fetchSupplyRequests } from '../branch-operations/api';
import { fetchMenuItems } from '../menu/menuItemsApi';
import { Skeleton } from '@mui/material';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import LocalPostOfficeRoundedIcon from '@mui/icons-material/LocalPostOfficeRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import { 
  mapBranch, 
  mapEmployee, 
  mapInventoryItem, 
  formatSchedule, 
  getInitials 
} from './branchProfileData';
import type { Branch, BranchEmployee, BranchInventoryItem } from './types';

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <Box sx={{ py: 1.1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.45 }}>
        {Icon && <Icon sx={{ fontSize: 13, color: '#6B4C2A' }} />}
        <Typography
          sx={{
            fontSize: 10.5,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: 'text.secondary',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 14.5, color: 'text.primary', fontWeight: 500, lineHeight: 1.35, pl: Icon ? 2.2 : 0 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SummaryMeter({
  label,
  current,
  limit,
  icon,
  tone,
}: {
  label: string;
  current: number;
  limit?: number;
  icon: React.ReactNode;
  tone: 'gold' | 'sage';
}) {
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: toneStyles.chipColor }}>{icon}</Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{label}</Typography>
        </Box>
        <Chip
          label={current}
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

      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500, mb: 1.2 }}>
        {limit ? `${current} / ${limit} in use` : 'Current operational count'}
      </Typography>

      <Box sx={{ width: '100%', height: 8, bgcolor: toneStyles.track, borderRadius: 999, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            width: limit ? `${Math.min((current / limit) * 100, 100)}%` : '100%', 
            height: '100%', 
            background: toneStyles.fill, 
            borderRadius: 999 
          }} 
        />
      </Box>
    </Box>
  );
}

export function BranchInfoPage() {
  const { user } = useAuthStore();
  const branchId = user?.branchId;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [staff, setStaff] = useState<BranchEmployee[]>([]);
  const [inventoryItems, setInventoryItems] = useState<BranchInventoryItem[]>([]);
  const [menuItemsCount, setMenuItemsCount] = useState<number>(0);
  const [returnsCount, setReturnsCount] = useState<number>(0);
  const [supplyRequestsCount, setSupplyRequestsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;

    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [branchDto, staffDto, invDto, menuItems, returns, supplyRequests] = await Promise.all([
          fetchBranch(Number(branchId)),
          fetchBranchStaff(Number(branchId)),
          fetchBranchInventory(Number(branchId)),
          fetchMenuItems(),
          fetchReturns(),
          fetchSupplyRequests()
        ]);

        if (!isMounted) return;

        setBranch(mapBranch(branchDto));
        setStaff(staffDto.map(mapEmployee));
        setInventoryItems(invDto.map(mapInventoryItem));
        setMenuItemsCount(menuItems.length);
        setReturnsCount(returns.length);
        setSupplyRequestsCount(supplyRequests.length);
      } catch (err) {
        console.error('Failed to load branch info:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    return () => { isMounted = false; };
  }, [branchId]);

  if (!branchId) {
    return (
      <Box sx={{ pb: 4, display: 'flex', justifyContent: 'center', pt: 4 }}>
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
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

          {/* Branch name — pinned to bottom-left of banner, matching Company Profile */}
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
              {loading ? <Skeleton width={200} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : (branch?.name || 'Loading Branch...')}
            </Typography>
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
                  fontWeight: 800
                }}
              >
                {branch ? getInitials(branch.name) : '??'}
              </Avatar>
            )}

            <Box sx={{ minWidth: 0, flex: 1, pb: 0.5, pt: 3.5 }}>
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
                      label={branch?.city && branch.city !== 'N/A' ? branch.city : 'Location Unspecified'}
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
                      label={branch?.status === 'active' ? 'Active Branch' : 'Setup Pending'}
                      size="small"
                      sx={{
                        bgcolor: branch?.status === 'active' ? 'rgba(113,143,88,0.15)' : 'rgba(201,168,76,0.18)',
                        color: branch?.status === 'active' ? '#3F5831' : '#6B4C2A',
                        borderRadius: 999,
                        height: 28,
                        fontWeight: 800,
                      }}
                    />
                    <Chip
                      label={`BR-${branchId?.toString().padStart(5, '0')}`}
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
                      {branch ? `${formatSchedule(branch.openTime)} - ${formatSchedule(branch.closeTime)}` : 'Schedule Not Set'}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                      <CallRoundedIcon sx={{ fontSize: 14, color: '#6B4C2A' }} />
                      {branch?.contactNumber || 'No Contact Number'}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                      <PeopleRoundedIcon sx={{ fontSize: 14, color: '#6B4C2A' }} />
                      {staff.length} Active Staff Members
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* ── Main Content Grid ── */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#6B4C2A' }}>
              <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Branch Information</Typography>
            </Box>

            <Grid container spacing={2.4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Legal Name / Entity" value={branch?.name || 'N/A'} icon={BadgeRoundedIcon} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Branch Status" value={branch?.status === 'active' ? 'Operational' : 'Onboarding'} icon={DescriptionRoundedIcon} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailRow label="Full Address" value={branch?.address || 'N/A'} icon={LocationOnRoundedIcon} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Operating City" value={branch?.city || 'N/A'} icon={MapRoundedIcon} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Official Contact" value={branch?.contactNumber || 'N/A'} icon={CallRoundedIcon} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Operating Schedule" value={branch ? `${formatSchedule(branch.openTime)} - ${formatSchedule(branch.closeTime)}` : 'N/A'} icon={AccessTimeRoundedIcon} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailRow label="Assigned Manager" value={branch?.manager || 'Unassigned'} icon={PeopleRoundedIcon} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.2, color: '#6B4C2A' }}>
              <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Branch Overview</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.4 }}>
              {loading ? (
                <>
                  <Skeleton variant="rectangular" height={90} sx={{ borderRadius: '14px' }} />
                  <Skeleton variant="rectangular" height={90} sx={{ borderRadius: '14px' }} />
                  <Skeleton variant="rectangular" height={90} sx={{ borderRadius: '14px' }} />
                  <Skeleton variant="rectangular" height={90} sx={{ borderRadius: '14px' }} />
                </>
              ) : (
                <>
                  <SummaryMeter 
                    label="Staff Members" 
                    current={staff.length} 
                    limit={5}
                    icon={<PeopleRoundedIcon fontSize="small" />} 
                    tone="sage" 
                  />
                  <SummaryMeter 
                    label="Inventory Items" 
                    current={inventoryItems.length} 
                    icon={<Inventory2RoundedIcon fontSize="small" />} 
                    tone="gold" 
                  />
                  <SummaryMeter 
                    label="Menu Items" 
                    current={menuItemsCount} 
                    icon={<RestaurantMenuRoundedIcon fontSize="small" />} 
                    tone="sage" 
                  />
                  <SummaryMeter 
                    label="Returns" 
                    current={returnsCount} 
                    icon={<AssignmentReturnRoundedIcon fontSize="small" />} 
                    tone="gold" 
                  />
                  <SummaryMeter 
                    label="Supply Requests" 
                    current={supplyRequestsCount} 
                    icon={<LocalPostOfficeRoundedIcon fontSize="small" />} 
                    tone="sage" 
                  />
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
