import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Paper, Avatar, Chip, Divider } from '@mui/material';
import { useNavigate, useParams } from '@tanstack/react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  MapPin,
  Phone,
  PencilLine,
  Save,
  ShoppingCart,
  UserPlus,
  Users,
  Warehouse,
  ChevronRight,
  Activity,
  ScrollText,
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import { Dropdown } from '../../components/UI/Dropdown';
import { TimePicker } from '../../components/UI/TimePicker';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import {
  BRANCHES_MOCK,
  BRANCH_OWNER_OPTIONS,
  BRANCH_MANAGER_OPTIONS,
  getBranchById,
  getBranchEmployeesById,
} from './mockData';
import type { Branch, BranchEmployee, BranchFormData, BranchStatus } from './types';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Operational)' },
  { value: 'setup', label: 'Setup Pending' },
];

const OWNER_OPTIONS = [
  { value: '', label: 'Unassigned (Optional)' },
  ...BRANCH_OWNER_OPTIONS,
];

const MANAGER_OPTIONS = [
  { value: '', label: 'Select a manager...' },
  ...BRANCH_MANAGER_OPTIONS,
];

type BranchTabKey = 'settings' | 'staff' | 'activity' | 'transactions';

interface BranchActivityLog {
  id: string;
  event: string;
  actor: string;
  happenedAt: string;
  category: 'staff' | 'inventory' | 'operations' | 'orders';
  outcome: 'successful' | 'pending' | 'flagged';
}

interface BranchTransactionRow {
  id: string;
  reference: string;
  type: 'Stock-In' | 'Stock-Out' | 'Transfer' | 'Adjustment';
  lineItems: number;
  netChange: number;
  postedBy: string;
  timestamp: string;
}

const toBranchFormData = (branch: Branch): BranchFormData => ({
  name: branch.name,
  address: branch.address,
  city: branch.city,
  contactNumber: branch.contactNumber,
  openTime: branch.openTime,
  closeTime: branch.closeTime,
  ownerUserId: branch.ownerUserId ?? '',
  managerUserId: branch.managerUserId,
  status: branch.status,
  picture: branch.imageUrl,
  notes: branch.notes ?? '',
});

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatSchedule = (time24: string) => {
  const [hour, minute] = time24.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const adjustedHour = hour % 12 || 12;
  return `${adjustedHour}:${String(minute).padStart(2, '0')} ${period}`;
};

const isOpenNow = (openTime: string, closeTime: string) => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
};

const getInitials = (label: string) =>
  label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

export function BranchProfilePage() {
  const navigate = useNavigate();
  const { branchId } = useParams({ from: '/layout/branches/$branchId' });

  const parsedBranchId = Number(branchId);
  const selectedBranch = useMemo(() => getBranchById(parsedBranchId), [parsedBranchId]);
  const employees = useMemo(() => getBranchEmployeesById(parsedBranchId), [parsedBranchId]);

  const [tabValue, setTabValue] = useState<BranchTabKey>('settings');
  const [isEditing, setIsEditing] = useState(false);
  const [showSavedNotice, setShowSavedNotice] = useState(false);
  const [formData, setFormData] = useState<BranchFormData | null>(
    selectedBranch ? toBranchFormData(selectedBranch) : null
  );

  useEffect(() => {
    setFormData(selectedBranch ? toBranchFormData(selectedBranch) : null);
    setTabValue('settings');
    setIsEditing(false);
    setShowSavedNotice(false);
  }, [selectedBranch]);

  useEffect(() => {
    if (!showSavedNotice) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setShowSavedNotice(false);
    }, 2200);

    return () => clearTimeout(timeoutHandle);
  }, [showSavedNotice]);

  if (!selectedBranch || !formData) {
    return (
      <Box sx={{ pb: 4, pt: 1, display: 'flex', justifyContent: 'center' }}>
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
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Branch not found
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 3 }}>
            The requested branch profile could not be loaded.
          </Typography>
          <Button onClick={() => navigate({ to: '/branches' })}>Back to Branches</Button>
        </Paper>
      </Box>
    );
  }

  const branchCode = `BR-${selectedBranch.id.toString().padStart(5, '0')}`;
  const activeStaffCount = employees.filter((employee) => employee.isActive).length;
  const inactiveStaffCount = employees.length - activeStaffCount;
  const branchOpen = isOpenNow(formData.openTime, formData.closeTime);

  const cityOptions = useMemo(() => {
    const knownCities = Array.from(new Set(BRANCHES_MOCK.map((branch) => branch.city).filter(Boolean)));
    if (formData.city && !knownCities.includes(formData.city)) {
      knownCities.push(formData.city);
    }

    return knownCities.map((city) => ({ value: city, label: city }));
  }, [formData.city]);

  const updateForm = <K extends keyof BranchFormData>(field: K, value: BranchFormData[K]) => {
    setFormData((previous) => {
      if (!previous) {
        return previous;
      }

      return { ...previous, [field]: value };
    });
  };

  const handleSave = () => {
    console.log('Saving branch profile:', {
      branchId: selectedBranch.id,
      ...formData,
    });

    setIsEditing(false);
    setShowSavedNotice(true);
  };

  const discardChanges = () => {
    setFormData(toBranchFormData(selectedBranch));
    setIsEditing(false);
  };

  const activityLogs = useMemo<BranchActivityLog[]>(
    () => [
      {
        id: `${selectedBranch.id}-log-1`,
        event: 'Completed weekly bean transfer from HQ warehouse',
        actor: selectedBranch.manager,
        happenedAt: '2026-04-08T09:42:00Z',
        category: 'inventory',
        outcome: 'successful',
      },
      {
        id: `${selectedBranch.id}-log-2`,
        event: 'Assigned a new shift supervisor to opening shift',
        actor: 'Patricia Lim',
        happenedAt: '2026-04-07T15:10:00Z',
        category: 'staff',
        outcome: 'successful',
      },
      {
        id: `${selectedBranch.id}-log-3`,
        event: 'Daily inventory count flagged syrup variance',
        actor: 'System Monitor',
        happenedAt: '2026-04-07T07:25:00Z',
        category: 'operations',
        outcome: 'flagged',
      },
      {
        id: `${selectedBranch.id}-log-4`,
        event: 'Prepared month-end stock valuation report',
        actor: selectedBranch.manager,
        happenedAt: '2026-04-06T17:00:00Z',
        category: 'operations',
        outcome: 'pending',
      },
    ],
    [selectedBranch.id, selectedBranch.manager]
  );

  const transactionRows = useMemo<BranchTransactionRow[]>(
    () => [
      {
        id: `${selectedBranch.id}-txn-1`,
        reference: `TR-${selectedBranch.id}-0410`,
        type: 'Transfer',
        lineItems: 4,
        netChange: 28,
        postedBy: selectedBranch.manager,
        timestamp: '2026-04-08T10:10:00Z',
      },
      {
        id: `${selectedBranch.id}-txn-2`,
        reference: `SO-${selectedBranch.id}-0409`,
        type: 'Stock-Out',
        lineItems: 6,
        netChange: -19,
        postedBy: 'System Auto',
        timestamp: '2026-04-08T07:35:00Z',
      },
      {
        id: `${selectedBranch.id}-txn-3`,
        reference: `SI-${selectedBranch.id}-0408`,
        type: 'Stock-In',
        lineItems: 5,
        netChange: 42,
        postedBy: 'Patricia Lim',
        timestamp: '2026-04-07T13:20:00Z',
      },
      {
        id: `${selectedBranch.id}-txn-4`,
        reference: `ADJ-${selectedBranch.id}-0407`,
        type: 'Adjustment',
        lineItems: 2,
        netChange: -3,
        postedBy: selectedBranch.manager,
        timestamp: '2026-04-07T11:05:00Z',
      },
    ],
    [selectedBranch.id, selectedBranch.manager]
  );

  const staffColumns: ColumnDef<BranchEmployee>[] = useMemo(
    () => [
      {
        key: 'employee',
        label: 'Employee',
        width: '28%',
        render: (employee) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 12,
                bgcolor: employee.isActive ? 'rgba(107,76,42,0.15)' : 'rgba(148,163,184,0.18)',
                color: employee.isActive ? '#6B4C2A' : 'text.secondary',
                fontWeight: 700,
              }}
            >
              {`${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                {employee.firstName} {employee.lastName}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                ID {employee.id}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        key: 'position',
        label: 'Position',
        width: '20%',
        render: (employee) => (
          <Chip
            label={employee.position}
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor: employee.position.toLowerCase().includes('lead') ? 'rgba(201,168,76,0.22)' : 'rgba(107,76,42,0.09)',
              color: employee.position.toLowerCase().includes('lead') ? '#5C4518' : '#6B4C2A',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        ),
      },
      {
        key: 'contact',
        label: 'Contact',
        width: '19%',
        render: (employee) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
            {employee.contactNumber}
          </Typography>
        ),
      },
      {
        key: 'dateHired',
        label: 'Date Hired',
        width: '18%',
        render: (employee) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
            {formatDate(employee.dateHired)}
          </Typography>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '15%',
        align: 'center',
        render: (employee) => (
          <Chip
            label={employee.isActive ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor: employee.isActive ? 'success.light' : 'grey.200',
              color: employee.isActive ? 'success.dark' : 'text.secondary',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        ),
      },
    ],
    []
  );

  const activityColumns: ColumnDef<BranchActivityLog>[] = useMemo(
    () => [
      {
        key: 'event',
        label: 'Event',
        width: '45%',
        render: (log) => (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{log.event}</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', textTransform: 'capitalize' }}>
              {log.category}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'actor',
        label: 'Actor',
        width: '20%',
        render: (log) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{log.actor}</Typography>,
      },
      {
        key: 'happenedAt',
        label: 'Timestamp',
        width: '22%',
        render: (log) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{formatDateTime(log.happenedAt)}</Typography>
        ),
      },
      {
        key: 'outcome',
        label: 'Outcome',
        width: '13%',
        align: 'center',
        render: (log) => (
          <Chip
            label={log.outcome}
            size="small"
            sx={{
              height: 24,
              textTransform: 'capitalize',
              borderRadius: 1.5,
              bgcolor:
                log.outcome === 'successful'
                  ? 'success.light'
                  : log.outcome === 'pending'
                    ? 'warning.light'
                    : 'error.light',
              color:
                log.outcome === 'successful'
                  ? 'success.dark'
                  : log.outcome === 'pending'
                    ? 'warning.dark'
                    : 'error.dark',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        ),
      },
    ],
    []
  );

  const transactionColumns: ColumnDef<BranchTransactionRow>[] = useMemo(
    () => [
      {
        key: 'reference',
        label: 'Reference',
        width: '22%',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.primary', fontWeight: 700, fontFamily: 'monospace' }}>
            {transaction.reference}
          </Typography>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '18%',
        render: (transaction) => (
          <Chip
            label={transaction.type}
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor:
                transaction.type === 'Stock-In'
                  ? 'success.light'
                  : transaction.type === 'Stock-Out'
                    ? 'error.light'
                    : transaction.type === 'Transfer'
                      ? 'info.light'
                      : 'warning.light',
              color:
                transaction.type === 'Stock-In'
                  ? 'success.dark'
                  : transaction.type === 'Stock-Out'
                    ? 'error.dark'
                    : transaction.type === 'Transfer'
                      ? 'info.dark'
                      : 'warning.dark',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        ),
      },
      {
        key: 'lineItems',
        label: 'Line Items',
        width: '14%',
        align: 'right',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.primary', fontWeight: 600 }}>
            {transaction.lineItems}
          </Typography>
        ),
      },
      {
        key: 'netChange',
        label: 'Net Qty',
        width: '14%',
        align: 'right',
        render: (transaction) => (
          <Typography
            sx={{
              fontSize: 12.5,
              color: transaction.netChange >= 0 ? 'success.main' : 'error.main',
              fontWeight: 700,
            }}
          >
            {transaction.netChange >= 0 ? '+' : ''}
            {transaction.netChange}
          </Typography>
        ),
      },
      {
        key: 'postedBy',
        label: 'Posted By',
        width: '18%',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{transaction.postedBy}</Typography>
        ),
      },
      {
        key: 'timestamp',
        label: 'Date',
        width: '14%',
        render: (transaction) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{formatDate(transaction.timestamp)}</Typography>
        ),
      },
    ],
    []
  );

  const tabItems: Array<{ key: BranchTabKey; label: string; icon: typeof PencilLine }> = [
    { key: 'settings', label: 'Settings', icon: PencilLine },
    { key: 'staff', label: `Staff Roster (${employees.length})`, icon: Users },
    { key: 'activity', label: 'Activity Logs', icon: Activity },
    { key: 'transactions', label: 'Transactions', icon: ScrollText },
  ];

  return (
    <Box sx={{ pb: 5, pt: 1 }}>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{ marginBottom: 16 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate({ to: '/branches' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 10,
              border: '1px solid #D6D3D1',
              background: '#FFFFFF',
              color: '#57534E',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={13} />
            Branches
          </button>

          <ChevronRight size={13} color="#A8A29E" />

          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary' }}>{formData.name}</Typography>

          <Chip
            label={branchCode}
            size="small"
            sx={{
              height: 22,
              borderRadius: 999,
              bgcolor: 'rgba(201,168,76,0.2)',
              color: '#5C4518',
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
      >
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

            <Box sx={{ position: 'absolute', left: { xs: 16, sm: 24 }, bottom: 14, pr: 14 }}>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.96)',
                  fontSize: { xs: 20, sm: 24 },
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                {formData.name}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: 600, mt: 0.4 }}>
                Branch Profile
              </Typography>
            </Box>

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

          <Box sx={{ px: { xs: 3, sm: 4 }, pb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: -6 }}>
                <Avatar
                  src={selectedBranch.imageUrl}
                  sx={{
                    width: 94,
                    height: 94,
                    borderRadius: 3,
                    bgcolor: '#2E1F14',
                    border: '4px solid #FFFFFF',
                    fontWeight: 800,
                    fontSize: 31,
                  }}
                >
                  {getInitials(formData.name)}
                </Avatar>

                <Box sx={{ pb: 0.3, pt: 0.65 }}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      mb: 0.5,
                    }}
                  >
                    Branch Name
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, letterSpacing: '-0.02em' }}>
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
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, mt: 1.1, flexWrap: 'wrap' }}>
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

              <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mt: { xs: 0.5, md: 1.5 } }}>
                <Button
                  variant="outlined"
                  startIcon={<Warehouse size={15} />}
                  onClick={() =>
                    navigate({
                      to: '/branch-inventory/$branchId',
                      params: { branchId: selectedBranch.id.toString() },
                    })
                  }
                >
                  View Inventory
                </Button>

                {isEditing ? (
                  <>
                    <Button variant="outlined" onClick={discardChanges}>
                      Discard
                    </Button>
                    <Button startIcon={<Save size={15} />} onClick={handleSave}>
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<PencilLine size={15} />}
                    onClick={() => {
                      setTabValue('settings');
                      setIsEditing(true);
                    }}
                  >
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
              <Grid size={{ xs: 6, md: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.8,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.3,
                    bgcolor: '#FAFAFA',
                  }}
                >
                  <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'rgba(107,76,42,0.18)', color: '#6B4C2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{employees.length}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>Total Staff</Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.8,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.3,
                    bgcolor: '#FAFAFA',
                  }}
                >
                  <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#DCFCE7', color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={16} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{activeStaffCount}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>Active Staff</Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.8,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.3,
                    bgcolor: '#FAFAFA',
                  }}
                >
                  <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#FEF3C7', color: 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={16} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{selectedBranch.lowStockItems}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>Low Stock Items</Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 6, md: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.8,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.3,
                    bgcolor: '#FAFAFA',
                  }}
                >
                  <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#DBEAFE', color: 'info.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart size={16} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{selectedBranch.totalItems}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>Tracked SKUs</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ px: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
            {tabItems.map((tabItem) => {
              const active = tabValue === tabItem.key;
              return (
                <button
                  key={tabItem.key}
                  type="button"
                  onClick={() => setTabValue(tabItem.key)}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: active ? '#6B4C2A' : '#78716C',
                    fontWeight: active ? 700 : 600,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    padding: '14px 16px',
                  }}
                >
                  <tabItem.icon size={14} />
                  {tabItem.label}

                  {active ? (
                    <motion.div
                      layoutId="branch-profile-tab-indicator"
                      transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 2.5,
                        borderTopLeftRadius: 999,
                        borderTopRightRadius: 999,
                        backgroundColor: '#C9A84C',
                      }}
                    />
                  ) : null}
                </button>
              );
            })}
          </Box>

          {tabValue === 'settings' ? (
            <motion.div key="settings-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ mb: 2.6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary' }}>Branch Settings</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
                      {isEditing
                        ? 'Editing is enabled. Update values below and save your changes.'
                        : 'View mode is enabled. Click Edit Branch to modify these settings.'}
                    </Typography>
                  </Box>
                  {!isEditing ? (
                    <Button
                      variant="outlined"
                      startIcon={<PencilLine size={15} />}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Branch
                    </Button>
                  ) : null}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
                  <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Location and Contact</Typography>
                </Box>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Branch Name</Typography>
                    <TextField
                      disabled={!isEditing}
                      value={formData.name}
                      onChange={(event) => updateForm('name', event.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Status</Typography>
                    <Dropdown
                      disabled={!isEditing}
                      value={formData.status}
                      fullWidth
                      options={STATUS_OPTIONS}
                      onChange={(event) => updateForm('status', event.target.value as BranchStatus)}
                      sx={{ width: '100%', minWidth: 'auto' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Address</Typography>
                    <TextField
                      disabled={!isEditing}
                      multiline
                      rows={2}
                      value={formData.address}
                      onChange={(event) => updateForm('address', event.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>City</Typography>
                    <Dropdown
                      disabled={!isEditing}
                      value={formData.city}
                      fullWidth
                      options={cityOptions}
                      onChange={(event) => updateForm('city', String(event.target.value))}
                      sx={{ width: '100%', minWidth: 'auto' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Contact Number</Typography>
                    <TextField
                      disabled={!isEditing}
                      value={formData.contactNumber}
                      onChange={(event) => updateForm('contactNumber', event.target.value)}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
                  <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Operations and Assignment</Typography>
                </Box>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Open Time</Typography>
                    <TimePicker
                      disabled={!isEditing}
                      value={formData.openTime}
                      onChange={(event) => updateForm('openTime', event.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Close Time</Typography>
                    <TimePicker
                      disabled={!isEditing}
                      value={formData.closeTime}
                      onChange={(event) => updateForm('closeTime', event.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Assigned Owner</Typography>
                    <Dropdown
                      disabled={!isEditing}
                      value={formData.ownerUserId}
                      fullWidth
                      options={OWNER_OPTIONS}
                      onChange={(event) => updateForm('ownerUserId', String(event.target.value))}
                      sx={{ width: '100%', minWidth: 'auto' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Branch Manager</Typography>
                    <Dropdown
                      disabled={!isEditing}
                      value={formData.managerUserId}
                      fullWidth
                      options={MANAGER_OPTIONS}
                      onChange={(event) => updateForm('managerUserId', String(event.target.value))}
                      sx={{ width: '100%', minWidth: 'auto' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Branch Notes</Typography>
                    <TextField
                      disabled={!isEditing}
                      multiline
                      rows={3}
                      value={formData.notes ?? ''}
                      onChange={(event) => updateForm('notes', event.target.value)}
                      placeholder="Optional notes for this branch"
                    />
                  </Grid>
                </Grid>

                {isEditing ? (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button variant="outlined" onClick={discardChanges}>Discard</Button>
                    <Button startIcon={<Save size={15} />} onClick={handleSave}>Save Changes</Button>
                  </Box>
                ) : null}
              </Box>
            </motion.div>
          ) : null}

          {tabValue === 'staff' ? (
            <motion.div key="staff-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2.8, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary' }}>Staff Roster</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
                      Click any staff row to open the employee profile.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
                      {activeStaffCount} active / {inactiveStaffCount} inactive
                    </Typography>
                    <Button
                      startIcon={<UserPlus size={15} />}
                      onClick={() =>
                        navigate({
                          to: '/staff/add',
                          search: {
                            branchId: selectedBranch.id.toString(),
                            branchName: selectedBranch.name,
                            returnTo: `/branches/${selectedBranch.id}`,
                          },
                        })
                      }
                    >
                      Add Staff
                    </Button>
                  </Box>
                </Box>

                <DataTable
                  data={employees}
                  columns={staffColumns}
                  keyExtractor={(employee) => String(employee.id)}
                  defaultPageSize={5}
                  pageSizes={[5, 10, 25]}
                  emptyMessage="No employees assigned to this branch yet."
                  onRowClick={(employee) =>
                    navigate({
                      to: '/staff/$staffId',
                      params: { staffId: employee.id.toString() },
                    })
                  }
                />
              </Box>
            </motion.div>
          ) : null}

          {tabValue === 'activity' ? (
            <motion.div key="activity-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary', mb: 0.8 }}>Activity Logs</Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.8 }}>
                  Latest operational events and branch-level updates.
                </Typography>

                <DataTable
                  data={activityLogs}
                  columns={activityColumns}
                  keyExtractor={(log) => log.id}
                  defaultPageSize={5}
                  pageSizes={[5, 10, 25]}
                  emptyMessage="No activity logs available for this branch."
                />
              </Box>
            </motion.div>
          ) : null}

          {tabValue === 'transactions' ? (
            <motion.div key="transactions-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary', mb: 0.8 }}>Transactions</Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.8 }}>
                  Branch stock movement ledger from recent operations.
                </Typography>

                <DataTable
                  data={transactionRows}
                  columns={transactionColumns}
                  keyExtractor={(transaction) => transaction.id}
                  defaultPageSize={5}
                  pageSizes={[5, 10, 25]}
                  emptyMessage="No transactions available for this branch."
                />
              </Box>
            </motion.div>
          ) : null}
        </Paper>
      </motion.div>
    </Box>
  );
}
