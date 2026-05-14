import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  alpha,
  IconButton,
  CircularProgress
} from '@mui/material';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import DownloadDoneRoundedIcon from '@mui/icons-material/DownloadDoneRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import ForwardToInboxRoundedIcon from '@mui/icons-material/ForwardToInboxRounded';
import WhereToVoteRoundedIcon from '@mui/icons-material/WhereToVoteRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';

import type { AxiosError } from 'axios';
import { useParams } from '@tanstack/react-router';
import { api } from '../../utils/api';

import { ReturnTrackerStepper } from './components/ReturnTrackerStepper';
import { SharedFloatingChat } from '../shared/components/SharedFloatingChat';
import { WorkflowStatusBanner } from '../shared/components/WorkflowStatusBanner';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import { useAuthStore } from '../../store/useAuthStore';
import {
  fetchReturnById,
  acknowledgeReturn,
  rejectReturn,
  rescheduleReturnPickup,
  confirmReturnDispatch,
  confirmReturnArrival,
  startReturnInspection,
  saveReturnInspection,
  completeReturn,
  type ReturnRecord,
  type ReturnItemDto,
} from '../branch-operations/api';
import { listVehicles, type Vehicle } from '../hq-inventory/vehicleApi';
import { fetchInventoryItems } from '../hq-inventory/hqInventoryApi';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

const HQ_ROLES = ['TenantAdmin', 'HqManager', 'HqStaff'];
const BRANCH_ROLES = ['BranchManager', 'BranchOwner'];

// ── Status styling ──
type StatusStyle = { bg: string; color: string; label: string };
function statusStyle(status: string): StatusStyle {
  switch (status) {
    case 'Draft':       return { bg: '#F5F5F5', color: '#757575', label: 'Draft' };
    case 'Submitted':   return { bg: '#FFF8E1', color: '#F57F17', label: 'Submitted' };
    case 'Acknowledged':return { bg: '#E3F2FD', color: '#1565C0', label: 'Acknowledged' };
    case 'Dispatched':  return { bg: '#E8F5E9', color: '#2E7D32', label: 'Dispatched' };
    case 'Arrived':     return { bg: '#E0F7FA', color: '#00695C', label: 'Arrived' };
    case 'Inspecting':  return { bg: '#F3E5F5', color: '#6A1B9A', label: 'Inspecting' };
    case 'Completed':   return { bg: '#E8F5E9', color: '#1B5E20', label: 'Completed' };
    case 'Rejected':    return { bg: '#FFEBEE', color: '#B71C1C', label: 'Rejected' };
    case 'Credited':    return { bg: '#E8F5E9', color: '#2E7D32', label: 'Stock Return' };
    case 'Replaced':    return { bg: '#E3F2FD', color: '#1565C0', label: 'Replaced' };
    case 'Restock':     return { bg: '#E8F5E9', color: '#16a34a', label: 'Restock' };
    case 'WriteOff':    return { bg: '#FFEBEE', color: '#B91C1C', label: 'Write-off' };
    case 'Pending':     return { bg: '#FFF8E1', color: '#F57F17', label: 'Pending' };
    default:            return { bg: '#F5F5F5', color: '#616161', label: status };
  }
}

function formatPeso(value: number): string {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatScheduleStatus(status?: string | null): string {
  switch (status) {
    case 'DueToday':    return 'Due Today';
    case 'NoSchedule':  return 'No Schedule';
    case 'OnTime':      return 'On Time';
    default:            return status || 'No Schedule';
  }
}

function scheduleColor(status?: string | null): string {
  if (status === 'Late') return '#D32F2F';
  if (status === 'DueToday') return '#ED6C02';
  if (status === 'OnTime') return '#2E7D32';
  if (status === 'Scheduled') return '#0288D1';
  return '#6B7280';
}

function StatusChip({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ fontSize: 11.5, fontWeight: 700, bgcolor: s.bg, color: s.color, border: `1px solid ${s.color}2b` }}
    />
  );
}

// --- Helper for vehicle icons ---
const getVehicleIcon = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('truck')) return <LocalShippingRoundedIcon sx={{ fontSize: 18 }} />;
  if (t.includes('bike') || t.includes('motorcycle')) return <Box component="span" sx={{ fontSize: 18 }}>🏍️</Box>; // fallback if icon not in scope
  return <LocalShippingRoundedIcon sx={{ fontSize: 18 }} />; // default to truck for now or localshipping
};

// ── Acknowledge Dialog ──
function AcknowledgeDialog({
  open, isSaving, vehicles, onClose, onSubmit,
}: {
  open: boolean;
  isSaving: boolean;
  vehicles: Vehicle[];
  onClose: () => void;
  onSubmit: (payload: { vehicleId: number; pickupScheduledAt: string; note?: string }) => void;
}) {
  const [vehicleId, setVehicleId] = useState<string | number>('');
  const [pickupDate, setPickupDate] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!open) { setVehicleId(''); setPickupDate(''); setNote(''); setErr(null); } }, [open]);

  const handleSubmit = () => {
    const vid = Number(vehicleId);
    if (!Number.isInteger(vid) || vid <= 0) { setErr('Enter a valid Vehicle ID.'); return; }
    if (!pickupDate) { setErr('Select a pickup date/time.'); return; }
    setErr(null);
    onSubmit({ vehicleId: vid, pickupScheduledAt: new Date(pickupDate).toISOString(), note: note.trim() || undefined });
  };

  return (
    <Dialog 
        open={open} 
        onClose={isSaving ? undefined : onClose} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ 
            sx: { 
                borderRadius: '20px', 
                overflow: 'hidden',
                boxShadow: '0 20px 40px -12px rgba(107, 76, 42, 0.15)'
            } 
        }}
    >
      <Box sx={{ 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: '#FAF7F2',
          borderBottom: '1px solid',
          borderColor: 'rgba(107, 76, 42, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentTurnedInRoundedIcon sx={{ fontSize: 24, color: '#6B4C2A' }} />
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#3E2723', letterSpacing: '-0.01em' }}>
            Acknowledge Return
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isSaving} sx={{ color: '#6B4C2A' }}>
            <CancelRoundedIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ display: 'grid', gap: 3.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>Vehicle</Typography>
              <Select 
                size="small" 
                fullWidth 
                value={vehicleId} 
                onChange={(e) => setVehicleId(e.target.value)} 
                disabled={isSaving}
                sx={{ 
                    borderRadius: '10px', 
                    bgcolor: '#FDFCFB',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(107, 76, 42, 0.12)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B4C2A' }
                }}
              >
                {vehicles.map((v) => (
                  <MenuItem key={v.vehicleId} value={v.vehicleId} sx={{ py: 1, borderRadius: '8px', mx: 1, my: 0.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        {getVehicleIcon(v.vehicleType)}
                        <Box>
                            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{v.plateNumber}</Typography>
                            <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600 }}>{v.vehicleType}</Typography>
                        </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>Pickup Date</Typography>
              <TextField 
                type="date" 
                size="small" 
                fullWidth 
                value={pickupDate} 
                onChange={(e) => setPickupDate(e.target.value)} 
                disabled={isSaving} 
                InputLabelProps={{ shrink: true }} 
                sx={{ 
                    '& .MuiOutlinedInput-root': { 
                        borderRadius: '10px',
                        bgcolor: '#FDFCFB',
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B4C2A' }
                    } 
                }}
              />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>Notes (Optional)</Typography>
            <TextField 
                size="small" 
                fullWidth 
                multiline 
                rows={3} 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                disabled={isSaving} 
                placeholder="Instructions for driver or branch..." 
                sx={{ 
                    '& .MuiOutlinedInput-root': { 
                        borderRadius: '10px',
                        bgcolor: '#FDFCFB',
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B4C2A' }
                    } 
                }}
            />
          </Box>
          {err && <Alert severity="error" sx={{ borderRadius: '10px', fontSize: 12.5 }}>{err}</Alert>}
        </Box>
      </DialogContent>
      <Box sx={{ p: 3, px: 4, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid', borderColor: 'rgba(107, 76, 42, 0.05)' }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving} sx={{ px: 3 }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving} sx={{ px: 4, height: 42 }}>{isSaving ? 'Saving...' : 'Confirm Acknowledgement'}</Button>
      </Box>
    </Dialog>
  );
}

// ── Reject Dialog ──
function RejectDialog({
  open, isSaving, onClose, onSubmit,
}: {
  open: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!open) { setReason(''); setErr(null); } }, [open]);

  const handleSubmit = () => {
    if (!reason.trim()) { setErr('Providing a reason is required.'); return; }
    setErr(null);
    onSubmit(reason.trim());
  };

  return (
    <Dialog 
        open={open} 
        onClose={isSaving ? undefined : onClose} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ 
            sx: { 
                borderRadius: '20px', 
                overflow: 'hidden',
                boxShadow: '0 20px 40px -12px rgba(185, 28, 28, 0.15)'
            } 
        }}
    >
      <Box sx={{ 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: '#FFF5F5',
          borderBottom: '1px solid',
          borderColor: 'rgba(185, 28, 28, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CancelRoundedIcon sx={{ fontSize: 24, color: '#B91C1C' }} />
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#7F1D1D', letterSpacing: '-0.01em' }}>
            Reject Return Request
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isSaving} sx={{ color: '#B91C1C' }}>
            <CancelRoundedIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.5 }}>
            Are you sure you want to reject this return? This action will notify the branch and halt the return process.
          </Typography>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>Rejection Reason</Typography>
            <TextField 
                size="small" 
                fullWidth 
                multiline 
                rows={3} 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                disabled={isSaving} 
                placeholder="Explain why this return is rejected..." 
                sx={{ 
                    '& .MuiOutlinedInput-root': { 
                        borderRadius: '10px',
                        bgcolor: '#FDFCFB',
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#B91C1C' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#B91C1C' }
                    } 
                }}
            />
          </Box>
          {err && <Alert severity="error" sx={{ borderRadius: '10px', fontSize: 12.5 }}>{err}</Alert>}
        </Box>
      </DialogContent>
      <Box sx={{ p: 3, px: 4, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid', borderColor: 'rgba(185, 28, 28, 0.05)' }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving} sx={{ px: 3 }}>Cancel</Button>
            <Button 
                onClick={handleSubmit} 
                disabled={isSaving} 
                sx={{ 
                    px: 4, 
                    height: 42, 
                    bgcolor: '#B91C1C', 
                    '&:hover': { bgcolor: '#991B1B' } 
                }}
            >
                {isSaving ? 'Rejecting...' : 'Reject Return'}
            </Button>
      </Box>
    </Dialog>
  );
}

// ── Reschedule Dialog ──
function RescheduleDialog({
  open, isSaving, vehicles, onClose, onSubmit,
}: {
  open: boolean;
  isSaving: boolean;
  vehicles: Vehicle[];
  onClose: () => void;
  onSubmit: (payload: { vehicleId: number; pickupScheduledAt: string; note: string }) => void;
}) {
  const [vehicleId, setVehicleId] = useState<string | number>('');
  const [pickupDate, setPickupDate] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!open) { setVehicleId(''); setPickupDate(''); setNote(''); setErr(null); } }, [open]);

  const handleSubmit = () => {
    const vid = Number(vehicleId);
    if (!Number.isInteger(vid) || vid <= 0) { setErr('Enter a valid Vehicle ID.'); return; }
    if (!pickupDate) { setErr('Select a pickup date/time.'); return; }
    setErr(null);
    onSubmit({ vehicleId: vid, pickupScheduledAt: new Date(pickupDate).toISOString(), note });
  };

  return (
    <Dialog 
        open={open} 
        onClose={isSaving ? undefined : onClose} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ 
            sx: { 
                borderRadius: '20px', 
                overflow: 'hidden',
                boxShadow: '0 20px 40px -12px rgba(107, 76, 42, 0.15)'
            } 
        }}
    >
      <Box sx={{ 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: '#FAF7F2',
          borderBottom: '1px solid',
          borderColor: 'rgba(107, 76, 42, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EventRepeatRoundedIcon sx={{ fontSize: 24, color: '#6B4C2A' }} />
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#3E2723', letterSpacing: '-0.01em' }}>
            Reschedule Pickup
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isSaving} sx={{ color: '#6B4C2A' }}>
            <CancelRoundedIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ display: 'grid', gap: 3.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>Vehicle</Typography>
              <Select 
                size="small" 
                fullWidth 
                value={vehicleId} 
                onChange={(e) => setVehicleId(e.target.value)} 
                disabled={isSaving}
                sx={{ 
                    borderRadius: '10px', 
                    bgcolor: '#FDFCFB',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(107, 76, 42, 0.12)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B4C2A' }
                }}
              >
                {vehicles.map((v) => (
                  <MenuItem key={v.vehicleId} value={v.vehicleId} sx={{ py: 1, borderRadius: '8px', mx: 1, my: 0.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        {getVehicleIcon(v.vehicleType)}
                        <Box>
                            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{v.plateNumber}</Typography>
                            <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600 }}>{v.vehicleType}</Typography>
                        </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>New Pickup Date</Typography>
              <TextField 
                type="date" 
                size="small" 
                fullWidth 
                value={pickupDate} 
                onChange={(e) => setPickupDate(e.target.value)} 
                disabled={isSaving} 
                InputLabelProps={{ shrink: true }} 
                sx={{ 
                    '& .MuiOutlinedInput-root': { 
                        borderRadius: '10px',
                        bgcolor: '#FDFCFB',
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B4C2A' }
                    } 
                }}
              />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>Rescheduling Reason</Typography>
            <TextField 
                size="small" 
                fullWidth 
                multiline 
                rows={2} 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                disabled={isSaving} 
                placeholder="Brief explanation for the branch..." 
                sx={{ 
                    '& .MuiOutlinedInput-root': { 
                        borderRadius: '10px',
                        bgcolor: '#FDFCFB',
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B4C2A' }
                    } 
                }}
            />
          </Box>
          {err && <Alert severity="error" sx={{ borderRadius: '10px', fontSize: 12.5 }}>{err}</Alert>}
        </Box>
      </DialogContent>
      <Box sx={{ p: 3, px: 4, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid', borderColor: 'rgba(107, 76, 42, 0.05)' }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving} sx={{ px: 3 }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving} sx={{ px: 4, height: 42 }}>{isSaving ? 'Saving...' : 'Update Schedule'}</Button>
      </Box>
    </Dialog>
  );
}

// ── Complete Transaction Summary Modal ──
function CompleteReturnTransactionDialog({
  open, isSaving, row, onClose, onSubmit,
}: {
  open: boolean;
  isSaving: boolean;
  row: ReturnRecord;
  onClose: () => void;
  onSubmit: (remarks?: string) => void;
}) {
  const [remarks, setRemarks] = useState('');
  const [hqStock, setHqStock] = useState<Record<number, number>>({});
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  useEffect(() => {
    if (open) {
      setRemarks('');
      void loadHqStock();
    }
  }, [open, row.items]);

  const loadHqStock = async () => {
    try {
      setIsLoadingStock(true);
      // Fetch all HQ items to get current total stock
      const items = await fetchInventoryItems(undefined, { hqOnly: true });
      const stockMap: Record<number, number> = {};
      items.forEach(i => {
        stockMap[Number(i.id)] = i.totalStock;
      });
      setHqStock(stockMap);
    } catch (e) {
      console.error('Failed to load HQ stock for reconciliation:', e);
    } finally {
      setIsLoadingStock(false);
    }
  };

  const restockItems = row.items.filter(i => i.disposition === 'Restock');
  const writeOffItems = row.items.filter(i => i.disposition === 'WriteOff' || i.disposition === 'Wastage');

  return (
    <Dialog 
        open={open} 
        onClose={isSaving ? undefined : onClose} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ 
            sx: { 
                borderRadius: '20px', 
                overflow: 'hidden',
                boxShadow: '0 24px 48px -12px rgba(62, 39, 35, 0.2)'
            } 
        }}
    >
      {/* Header */}
      <Box sx={{ 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: '#FAF7F2',
          borderBottom: '1px solid',
          borderColor: 'rgba(107, 76, 42, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentTurnedInRoundedIcon sx={{ fontSize: 26, color: '#6B4C2A' }} />
          <Typography sx={{ fontSize: 19, fontWeight: 800, color: '#3E2723', letterSpacing: '-0.02em' }}>
            Complete Transaction
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isSaving} sx={{ color: '#6B4C2A' }}>
            <CancelRoundedIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, pt: 3.5 }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 3.5, fontWeight: 500, lineHeight: 1.5 }}>
          Please review the final reconciliation summary below. Confirming will finalize the return status and update the HQ warehouse inventory for restocked items.
        </Typography>

        {/* Request Info Card */}
        <Box sx={{ 
          bgcolor: '#FAF7F2', 
          p: 2.5, 
          borderRadius: 4, 
          border: '1px solid', 
          borderColor: 'rgba(107, 76, 42, 0.12)',
          mb: 4
        }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#8C6B43', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>
            Return Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 1.5 }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Return ID</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 800, textAlign: 'right', color: '#3E2723', fontFamily: 'monospace' }}>
              {row.transactionCode}
            </Typography>

            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Date Arrived at HQ</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'text.primary' }}>
              {row.arrivedAt ? new Date(row.arrivedAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
              }) : '-'}
            </Typography>

            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Inspected By</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'text.primary' }}>-</Typography>
          </Box>
        </Box>

        {/* Items to Restock */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Items to Restock ({restockItems.length})
            </Typography>
            {isLoadingStock && <CircularProgress size={14} sx={{ color: '#6B4C2A' }} />}
          </Box>

          {restockItems.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: 'text.disabled', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
              No items marked for restock.
            </Typography>
          ) : (
            <Box sx={{ px: 0.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'text.secondary' }}>ITEM</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'text.secondary', textAlign: 'center' }}>HQ STOCK</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'text.secondary', textAlign: 'center' }}>RETURN</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'text.secondary', textAlign: 'right' }}>NEW QTY</Typography>
              </Box>
              {restockItems.map(item => {
                const returned = item.quantityInspected ?? item.quantityReturned;
                const current = hqStock[item.itemId] ?? 0;
                const newQty = current + returned;
                
                return (
                  <Box
                    key={item.returnItemId}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
                      py: 2,
                      borderBottom: '1px dashed',
                      borderColor: alpha('#6B4C2A', 0.1),
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 0.2 }}>{item.itemName}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, fontFamily: 'monospace' }}>{item.itemSku}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, textAlign: 'center', color: 'text.secondary', fontWeight: 600, alignSelf: 'center' }}>{current}</Typography>
                    <Typography sx={{ fontSize: 13, textAlign: 'center', fontWeight: 700, color: '#16a34a', alignSelf: 'center' }}>+{returned}</Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 900, textAlign: 'right', color: '#6B4C2A', alignSelf: 'center' }}>{newQty}</Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Write-offs / Wastage */}
        {writeOffItems.length > 0 && (
          <Box sx={{ 
            p: 2.2, 
            bgcolor: 'rgba(185, 28, 28, 0.03)', 
            borderRadius: 3, 
            border: '1px dashed rgba(185, 28, 28, 0.2)', 
            mb: 4 
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
              Marked as Write-off / Wastage ({writeOffItems.length})
            </Typography>
            <Box sx={{ display: 'grid', gap: 0.8 }}>
              {writeOffItems.map(item => (
                <Typography key={item.returnItemId} sx={{ fontSize: 12.5, color: '#B91C1C', fontWeight: 500, opacity: 0.85 }}>
                  • {item.itemName} ({item.quantityInspected ?? item.quantityReturned} units)
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {/* Remarks Section */}
        <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.2 }}>Final Remarks (Optional)</Typography>
            <TextField 
                size="small" 
                fullWidth 
                multiline 
                rows={2} 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                disabled={isSaving} 
                placeholder="Add any final reconciliation notes here..."
                sx={{ 
                    '& .MuiOutlinedInput-root': { 
                        borderRadius: '12px',
                        bgcolor: '#FDFCFB',
                        fontSize: 13.5,
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B4C2A' }
                    } 
                }}
            />
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box sx={{ 
        p: 3, 
        pt: 2,
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 2, 
        borderTop: '1px solid', 
        borderColor: 'rgba(107, 76, 42, 0.05)',
        bgcolor: '#FAF7F2'
      }}>
        <Button 
          variant="outlined" 
          onClick={onClose} 
          disabled={isSaving}
          sx={{ borderRadius: '10px', px: 3 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => onSubmit(remarks.trim() || undefined)} 
          disabled={isSaving || isLoadingStock} 
          color="success"
          sx={{ 
            borderRadius: '10px', 
            px: 4,
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
            '&:hover': { boxShadow: '0 6px 16px rgba(22, 163, 74, 0.3)' }
          }}
        >
          {isSaving ? 'Finalizing...' : 'Confirm & Complete'}
        </Button>
      </Box>
    </Dialog>
  );
}

// ── Generic Remarks Confirm Dialog ──
function RemarksConfirmDialog({
  open, isSaving, title, ctaLabel, onClose, onSubmit,
}: {
  open: boolean;
  isSaving: boolean;
  title: string;
  ctaLabel: string;
  onClose: () => void;
  onSubmit: (remarks?: string) => void;
}) {
  const [remarks, setRemarks] = useState('');

  useEffect(() => { if (!open) setRemarks(''); }, [open]);

  return (
    <Dialog 
        open={open} 
        onClose={isSaving ? undefined : onClose} 
        maxWidth="xs" 
        fullWidth 
        PaperProps={{ 
            sx: { 
                borderRadius: '20px', 
                overflow: 'hidden',
                boxShadow: '0 20px 40px -12px rgba(107, 76, 42, 0.15)'
            } 
        }}
    >
      <Box sx={{ 
          p: 2.2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: '#FAF7F2',
          borderBottom: '1px solid',
          borderColor: 'rgba(107, 76, 42, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <AssignmentRoundedIcon sx={{ fontSize: 22, color: '#6B4C2A' }} />
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#3E2723', letterSpacing: '-0.01em' }}>
            {title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isSaving} size="small" sx={{ color: '#6B4C2A' }}>
            <CancelRoundedIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, pt: 2 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.2 }}>Remarks (Optional)</Typography>
            <TextField 
                size="small" 
                fullWidth 
                multiline 
                rows={2} 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                disabled={isSaving} 
                sx={{ 
                    '& .MuiOutlinedInput-root': { 
                        borderRadius: '10px',
                        bgcolor: '#FDFCFB',
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B4C2A' }
                    } 
                }}
            />
          </Box>
        </Box>
      </DialogContent>
      <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid', borderColor: 'rgba(107, 76, 42, 0.05)' }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving} size="small">Cancel</Button>
            <Button onClick={() => onSubmit(remarks.trim() || undefined)} disabled={isSaving} size="small" sx={{ px: 3 }}>
                {isSaving ? 'Processing...' : ctaLabel}
            </Button>
      </Box>
    </Dialog>
  );
}

// ── Return Item Table Row ──
function ReturnItemTableRow({
  item, returnId, isHq, isInspecting, onSaved, onPhotoClick
}: {
  item: ReturnItemDto; returnId: number; isHq: boolean; isInspecting: boolean; onSaved: () => void;
  onPhotoClick: (url: string) => void;
}) {
  const [qty, setQty] = useState<number>(item.quantityInspected ?? item.quantityReturned);
  const isDamagedOrExpired = item.reasonCode === 'Damaged' || item.reasonCode === 'Expired';
  const defaultDisp = isDamagedOrExpired ? 'WriteOff' : 'Restock';
  const [disp, setDisp] = useState<string>(item.disposition === 'Pending' ? defaultDisp : item.disposition);
  const [isSaving, setIsSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setQty(item.quantityInspected ?? item.quantityReturned);
    setDisp(item.disposition === 'Pending' ? defaultDisp : item.disposition);
  }, [item, defaultDisp]);

  const handleSave = async () => {
    if (qty < 0 || qty > item.quantityReturned) {
      setErr(`Quantity must be between 0 and ${item.quantityReturned}`);
      return;
    }
    try {
      setIsSaving(true);
      setErr(null);
      await saveReturnInspection(returnId, [{
        returnItemId: item.returnItemId,
        quantityInspected: qty,
        disposition: disp,
      }]);
      onSaved();
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  const showEditControls = isHq && isInspecting;
  const isDirty = (qty !== item.quantityInspected) || (disp !== item.disposition);
  const dispStyle = statusStyle(item.disposition);

  return (
    <>
      <TableRow>
        <TableCell sx={{ borderBottom: '1px dashed', borderColor: alpha('#8C6B43', 0.2), pb: err ? 0 : undefined }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{item.itemName}</Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{item.itemSku}</Typography>
        </TableCell>
        <TableCell align="left" sx={{ borderBottom: '1px dashed', borderColor: alpha('#8C6B43', 0.2), pb: err ? 0 : undefined }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{item.quantityReturned}</Typography>
        </TableCell>
        <TableCell align="left" sx={{ borderBottom: '1px dashed', borderColor: alpha('#8C6B43', 0.2), pb: err ? 0 : undefined }}>
          {showEditControls ? (
            <TextField type="number" size="small" sx={{ width: 80 }} inputProps={{ style: { padding: '4px 8px' } }} value={qty} onChange={(e) => setQty(Number(e.target.value))} disabled={isSaving} />
          ) : (
            <Typography sx={{ fontSize: 13.5 }}>{item.quantityInspected ?? '—'}</Typography>
          )}
        </TableCell>
        <TableCell align="left" sx={{ borderBottom: '1px dashed', borderColor: alpha('#8C6B43', 0.2), pb: err ? 0 : undefined }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{item.reasonCode}</Typography>
        </TableCell>
        <TableCell align="left" sx={{ borderBottom: '1px dashed', borderColor: alpha('#8C6B43', 0.2), pb: err ? 0 : undefined }}>
          {showEditControls ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Select size="small" value={disp} onChange={(e) => setDisp(e.target.value)} disabled={isSaving} sx={{ fontSize: 12.5 }}>
                <MenuItem value="Restock" sx={{ fontSize: 12.5 }}>Restock</MenuItem>
                <MenuItem value="WriteOff" sx={{ fontSize: 12.5 }}>WriteOff</MenuItem>
              </Select>
              <Button variant="contained" size="small" onClick={handleSave} disabled={!isDirty || isSaving} sx={{ minWidth: 60, boxShadow: 'none' }}>
                {isSaving ? 'Saving' : (isDirty ? 'Save' : 'Saved')}
              </Button>
            </Box>
          ) : (
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: dispStyle.color }}>
              {dispStyle.label}
            </Typography>
          )}
        </TableCell>
      </TableRow>
      {(item.notes || item.photoUrls) && (
        <TableRow>
          <TableCell colSpan={5} sx={{ pt: 1, pb: err ? 0 : 2, borderBottom: '1px dashed', borderColor: alpha('#8C6B43', 0.2) }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
              {item.notes && (
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Item Notes
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.primary', fontStyle: 'italic' }}>
                    "{item.notes}"
                  </Typography>
                </Box>
              )}
              {item.photoUrls && (
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Proof Photos
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {item.photoUrls.split(',').filter(Boolean).map((url, idx) => (
                      <Box 
                        key={idx}
                        component="div" 
                        onClick={() => onPhotoClick(url)} 
                        sx={{
                          display: 'block',
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': { 
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Box component="img" src={url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </TableCell>
        </TableRow>
      )}
      {err && (
        <TableRow>
          <TableCell colSpan={5} sx={{ pt: 0, borderBottom: '1px dashed', borderColor: alpha('#8C6B43', 0.2) }}>
            <Alert severity="error" sx={{ py: 0, px: 2, fontSize: 13, '& .MuiAlert-icon': { py: 0.5 } }}>{err}</Alert>
          </TableCell>
        </TableRow>
      )}
      {!err && isInspecting && isDamagedOrExpired && disp === 'Restock' && (
        <TableRow>
          <TableCell colSpan={5} sx={{ pt: 0, borderBottom: '1px dashed', borderColor: alpha('#8C6B43', 0.2) }}>
            <Alert severity="warning" sx={{ py: 0, px: 2, fontSize: 13, '& .MuiAlert-icon': { py: 0.5 } }}>
              Careful: This item was flagged as Damaged/Expired by the branch.
            </Alert>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── Main page ──
export function ReturnDetailPage() {
  const { returnId } = useParams({ from: '/layout/returns/$returnId' });
  const numericReturnId = Number(returnId);
  const { user } = useAuthStore();

  const [row, setRow] = useState<ReturnRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Dialog visibility
  const [dialog, setDialog] = useState<
    'acknowledge' | 'reject' | 'reschedule' | 'dispatch' | 'arrival' | 'startInspect' | 'complete' | null
  >(null);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const isHq = HQ_ROLES.includes(user?.role ?? '');
  const isBranch = BRANCH_ROLES.includes(user?.role ?? '');

  const loadReturn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [result, vList] = await Promise.all([
        fetchReturnById(numericReturnId),
        listVehicles(),
      ]);
      setRow(result);
      setVehicles(vList);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadReturn(); }, [numericReturnId]);

  // Real-time Status Sync via SignalR
  useEffect(() => {
    let url = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : '';
    if (url && !url.startsWith('http')) {
        url = window.location.origin + url;
    }
    
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${url}/hub/workflow`, {
            withCredentials: true,
            accessTokenFactory: () => useAuthStore.getState().token || ''
        })
        .withAutomaticReconnect()
        .build();

    // Listen for status changes
    connection.on('ReceiveStatusUpdate', (pReturnId: number) => {
        if (pReturnId === numericReturnId) {
            void loadReturn();
        }
    });

    connection.start()
        .then(() => connection.invoke('JoinReturn', numericReturnId))
        .catch(err => console.error('SignalR Status Sync Error: ', err));

    return () => {
        if (connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke('LeaveReturn', numericReturnId).finally(() => void connection.stop());
        }
    };
  }, [numericReturnId]);

  const withSave = async (fn: () => Promise<void>) => {
    try {
      setIsSaving(true);
      setError(null);
      await fn();
      setDialog(null);
      await loadReturn();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !row) return <LoadingOverlay open={true} />;

  if (!row) {
    return (
      <Box sx={{ display: 'grid', gap: 1.2 }}>
        <BackButton to="/returns" />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Return not found.</Typography>
        {error && <Typography sx={{ fontSize: 12.5, color: 'error.main' }}>{error}</Typography>}
      </Box>
    );
  }

  const timelineEvents = [
    { status: 'Draft', date: row.loggedAt, user: row.branchName },
    { status: 'Submitted', date: row.submittedAt },
    { status: 'Acknowledged', date: row.acknowledgedAt },
    { status: 'Dispatched', date: row.dispatchedAt },
    { status: 'Arrived', date: row.arrivedAt },
    { status: 'Inspecting', date: row.inspectingAt },
    ...(row.completedAt ? [{ status: 'Completed', date: row.completedAt }] : []),
    ...(row.rejectedAt ? [{ status: 'Rejected', date: row.rejectedAt }] : []),
  ].filter(e => e.date != null) as { status: string; date: string; user?: string }[];

  return (
    <>
      <LoadingOverlay open={isLoading} />
      <Box sx={{ pb: 3, display: 'grid', gap: 2.2 }}>
      {/* Header Area */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BackButton to="/returns" size="small" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>Return Reconciliation</Typography>
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.2 }}>
              Manage item returns and inspections for <strong>{row.branchName}</strong>.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
          {/* HQ: Submitted -> Acknowledge / Reject */}
          {isHq && row.status === 'Submitted' && (
            <>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => setDialog('reject')}
                startIcon={<CancelRoundedIcon />}
              >
                Reject
              </Button>
              <Button 
                color="success"
                onClick={() => setDialog('acknowledge')}
                startIcon={<AssignmentTurnedInRoundedIcon />}
              >
                Acknowledge
              </Button>
            </>
          )}

          {/* HQ: Acknowledged -> Reschedule */}
          {isHq && row.status === 'Acknowledged' && (
            <Button 
              variant="outlined" 
              onClick={() => setDialog('reschedule')}
              startIcon={<EventRepeatRoundedIcon />}
            >
              Reschedule Pickup
            </Button>
          )}

          {/* Branch: Acknowledged -> Confirm Dispatch */}
          {isBranch && row.status === 'Acknowledged' && (
            <Button 
              color="success"
              onClick={() => setDialog('dispatch')}
              startIcon={<LocalShippingRoundedIcon />}
            >
              Confirm Handoff
            </Button>
          )}

          {/* HQ: Dispatched -> Confirm Arrival */}
          {isHq && row.status === 'Dispatched' && (
            <Button 
              color="success"
              onClick={() => setDialog('arrival')}
              startIcon={<DownloadDoneRoundedIcon />}
            >
              Confirm Arrival
            </Button>
          )}

          {/* HQ: Arrived -> Start Inspection */}
          {isHq && row.status === 'Arrived' && (
            <Button 
              color="success"
              onClick={() => setDialog('startInspect')}
              startIcon={<FactCheckRoundedIcon />}
            >
              Start Inspection
            </Button>
          )}

          {/* HQ: Inspecting -> Complete */}
          {isHq && row.status === 'Inspecting' && (
            <Button
              color="success"
              disabled={row.items.some((i) => i.disposition === 'Pending')}
              onClick={() => setDialog('complete')}
              startIcon={<CheckCircleRoundedIcon />}
            >
              Complete Return
            </Button>
          )}

          {isHq && row.status === 'Inspecting' && row.items.some((i) => i.disposition === 'Pending') && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              <ForwardToInboxRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
                All items must be dispositioned.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Vehicle conflict warning */}
      {row.hasVehicleScheduleConflict && (
        <Alert icon={<WarningAmberRoundedIcon fontSize="small" />} severity="warning" sx={{ fontSize: 12.5 }}>
          <strong>Vehicle schedule conflict:</strong> The assigned vehicle ({row.pickupVehiclePlateNumber}) has{' '}
          {row.vehicleScheduleConflicts.length} other pickup(s) on{' '}
          {row.pickupScheduledAt ? new Date(row.pickupScheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'that date'}.
        </Alert>
      )}

      {/* Error */}
      {error && <Alert severity="error" sx={{ fontSize: 12.5, mb: 2 }}>{error}</Alert>}

      {/* ── Workflow Status Banners ── */}

      {/* 1. Submitted (Branch Only) */}
      {row.status === 'Submitted' && isBranch && !isHq && (
        <WorkflowStatusBanner
          icon={<HourglassEmptyRoundedIcon sx={{ fontSize: 22 }} />}
          title="Awaiting HQ Acknowledgement"
          description="Your return request has been submitted. We are waiting for the HQ fulfillment team to review the items and schedule a pickup."
        />
      )}

      {/* 2. Acknowledged (Both) */}
      {row.status === 'Acknowledged' && (
        <WorkflowStatusBanner
          icon={<EventAvailableRoundedIcon sx={{ fontSize: 22, color: '#6B4C2A' }} />}
          title="Pickup Scheduled"
          description={
            <>
              HQ has acknowledged your return. Pickup is scheduled for <strong>{row.pickupScheduledAt ? new Date(row.pickupScheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</strong>
              {row.pickupVehiclePlateNumber && <> using vehicle <strong>{row.pickupVehiclePlateNumber}</strong></>}.
              {isBranch ? " Please ensure items are packed and ready for the driver." : " Awaiting branch to dispatch the items."}
            </>
          }
        />
      )}

      {/* 3. Dispatched (Both) */}
      {row.status === 'Dispatched' && (
        <WorkflowStatusBanner
          icon={<LocalShippingRoundedIcon sx={{ fontSize: 22 }} />}
          title="Return in Transit"
          description={
            <>
              The return items have been dispatched from the branch and are currently on their way to HQ.
              {isHq ? " Please confirm arrival once the vehicle reaches the warehouse." : " We will notify you once HQ confirms the arrival."}
            </>
          }
        />
      )}

      {/* 4. Arrived (Both) */}
      {row.status === 'Arrived' && (
        <WorkflowStatusBanner
          icon={<WhereToVoteRoundedIcon sx={{ fontSize: 22, color: '#2563EB' }} />}
          title="Arrived at HQ"
          description={
            <>
              The shipment has arrived at HQ. 
              {isHq ? "Please start the inspection process to verify item conditions and quantities." : "Items are awaiting quality inspection and reconciliation by the HQ team."}
            </>
          }
        />
      )}

      {/* 5. Inspecting (Both) */}
      {row.status === 'Inspecting' && (
        <WorkflowStatusBanner
          icon={<FactCheckRoundedIcon sx={{ fontSize: 22, color: '#6B4C2A' }} />}
          title="Quality Inspection in Progress"
          description={
            <>
              HQ is currently inspecting the returned items. 
              {isHq ? "Once all items have been dispositioned (Restock/Wastage), you can complete the return." : "You will be notified once the final inspection report is completed."}
            </>
          }
        />
      )}
      
      {/* Rejection Alert */}
      {row.status === 'Rejected' && row.rejectionReason && (
        <WorkflowStatusBanner
          variant="error"
          icon={<CancelRoundedIcon sx={{ fontSize: 22 }} />}
          title="Return Request Rejected"
          description={
            <>
              <strong>Reason:</strong> {row.rejectionReason}
            </>
          }
        />
      )}

      {row.status === 'Completed' && (
        <WorkflowStatusBanner
          icon={<CheckCircleRoundedIcon sx={{ fontSize: 22, color: 'success.main' }} />}
          title="Return Process Completed"
          description="The items have been inspected and dispositioned. The return transaction is now finalized."
        />
      )}

      {/* Tracker Stepper */}
      <ReturnTrackerStepper status={row.status as any} timeline={timelineEvents} />

      <Box sx={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 2.5, alignItems: 'start' }}>
        {/* Info Column */}
        <Paper sx={{ p: 0, borderRadius: '14px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }} elevation={0}>
          {/* Order/Branch Header */}
          <Box sx={{ 
              p: 2.2, 
              background: 'linear-gradient(170deg, #F0E6D3 0%, #FAF5EF 100%)', 
              borderBottom: '1px solid', 
              borderColor: 'divider'
          }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                  <AssignmentRoundedIcon sx={{ color: '#6B4C2A', fontSize: 18 }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Return Details</Typography>
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>{row.transactionCode}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary', mt: -0.5 }}>From Order ORD-{row.orderId}</Typography>
          </Box>


          <Box sx={{ p: 2, display: 'grid', gap: 2.5 }}>
              {/* Details Section */}
                  <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                          <StorefrontRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branch</Typography>
                      </Box>
                      <Typography sx={{ pl: 3.2, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
                          {row.branchName}
                      </Typography>
                  </Box>

              {/* Subject */}
              <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                      <DescriptionRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</Typography>
                  </Box>
                  <Typography sx={{ pl: 3.2, fontSize: 14, fontWeight: 500, color: row.subject ? 'text.primary' : 'text.secondary' }}>
                      {row.subject || 'No subject'}
                  </Typography>
              </Box>

              {/* Pickup Schedule Status */}
              <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                      <ScheduleRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pickup SLA</Typography>
                  </Box>
                  <Typography sx={{ pl: 3.2, fontSize: 14, fontWeight: 700, color: scheduleColor(row.pickupScheduleStatus) }}>
                      {formatScheduleStatus(row.pickupScheduleStatus)}
                  </Typography>
              </Box>

              {/* Value Summary */}
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FAF7F2', border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.1)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                      <AccountBalanceWalletRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valuation</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gap: 1, pl: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Returned Value</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>{formatPeso(row.totalReturnedValue ?? 0)}</Typography>
                      </Box>
                      {(row.totalLossValue ?? 0) > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Loss Value</Typography>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#D32F2F' }}>{formatPeso(row.totalLossValue ?? 0)}</Typography>
                          </Box>
                      )}
                      {row.creditAmount != null && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.8, borderTop: '1px dashed', borderColor: 'rgba(107, 76, 42, 0.15)' }}>
                              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>Credit Amount</Typography>
                              <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#2E7D32' }}>{formatPeso(row.creditAmount)}</Typography>
                          </Box>
                      )}
                  </Box>
              </Box>
              {/* Workflow Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                          <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filed By</Typography>
                      </Box>
                      <Typography sx={{ pl: 3.2, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
                          {row.submittedByName || 'Branch Manager'} 
                          <Typography component="span" sx={{ fontSize: 12, color: 'text.disabled', ml: 0.5 }}>
                              (Branch Manager)
                          </Typography>
                      </Typography>
                  </Box>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <NotesRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Notes</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, color: row.reason ? '#334155' : 'text.disabled', fontStyle: row.reason ? 'normal' : 'italic' }}>
                      {row.reason || 'No additional notes.'}
                  </Typography>
              </Box>
          </Box>
        </Paper>

        {/* Right Column (Items Table + Inspection) */}
        <Box sx={{ display: 'grid', gap: 2.2 }}>
          <Paper sx={{ p: 0, borderRadius: '14px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }} elevation={0}>
            <Box sx={{ 
              p: 2, 
              background: 'linear-gradient(170deg, #F0E6D3 0%, #FAF5EF 100%)', 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1.2
            }}>
              <Inventory2RoundedIcon sx={{ color: '#6B4C2A', fontSize: 18 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Returned Items</Typography>
            </Box>
            <Box sx={{ p: 2.2 }}>
            {row.items.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No items on this return.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: alpha('#C9A84C', 0.3) }}>Item</TableCell>
                    <TableCell align="left" sx={{ fontSize: 11.5, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: alpha('#C9A84C', 0.3) }}>Returned</TableCell>
                    <TableCell align="left" sx={{ fontSize: 11.5, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: alpha('#C9A84C', 0.3) }}>Inspected</TableCell>
                    <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: alpha('#C9A84C', 0.3) }}>Reason</TableCell>
                    <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: alpha('#C9A84C', 0.3) }}>Disposition</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.items.map((item) => (
                    <ReturnItemTableRow
                      key={item.returnItemId}
                      item={item}
                      returnId={row.returnId}
                      isHq={isHq}
                      isInspecting={row.status === 'Inspecting'}
                      onSaved={() => void loadReturn()}
                      onPhotoClick={setSelectedPhoto}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Floating Chat Widget */}
      <SharedFloatingChat contextType="return" id={Number(row.returnId)} />

      {/* ── Dialogs ── */}
      <AcknowledgeDialog
        open={dialog === 'acknowledge'}
        isSaving={isSaving}
        vehicles={vehicles}
        onClose={() => setDialog(null)}
        onSubmit={(payload) => void withSave(() => acknowledgeReturn(row.returnId, payload).then(() => {}))}
      />
      <RejectDialog
        open={dialog === 'reject'}
        isSaving={isSaving}
        onClose={() => setDialog(null)}
        onSubmit={(reason) => void withSave(() => rejectReturn(row.returnId, reason).then(() => {}))}
      />
      <RescheduleDialog
        open={dialog === 'reschedule'}
        isSaving={isSaving}
        vehicles={vehicles}
        onClose={() => setDialog(null)}
        onSubmit={(payload) => void withSave(() => rescheduleReturnPickup(row.returnId, payload).then(() => {}))}
      />
      <RemarksConfirmDialog
        open={dialog === 'dispatch'}
        isSaving={isSaving}
        title="Confirm Handoff to Pickup Vehicle"
        ctaLabel="Confirm Handoff"
        onClose={() => setDialog(null)}
        onSubmit={(remarks) => void withSave(() => confirmReturnDispatch(row.returnId, remarks).then(() => {}))}
      />
      <RemarksConfirmDialog
        open={dialog === 'arrival'}
        isSaving={isSaving}
        title="Confirm Return Arrived at HQ"
        ctaLabel="Confirm Arrival"
        onClose={() => setDialog(null)}
        onSubmit={(remarks) => void withSave(() => confirmReturnArrival(row.returnId, remarks).then(() => {}))}
      />
      <RemarksConfirmDialog
        open={dialog === 'startInspect'}
        isSaving={isSaving}
        title="Start Inspection"
        ctaLabel="Start Inspection"
        onClose={() => setDialog(null)}
        onSubmit={(remarks) => void withSave(() => startReturnInspection(row.returnId, remarks).then(() => {}))}
      />
      <CompleteReturnTransactionDialog
        open={dialog === 'complete'}
        isSaving={isSaving}
        row={row}
        onClose={() => setDialog(null)}
        onSubmit={(remarks) => void withSave(() => completeReturn(row.returnId, remarks).then(() => {}))}
      />

      {/* Photo Preview Lightbox */}
      <Dialog 
        open={Boolean(selectedPhoto)} 
        onClose={() => setSelectedPhoto(null)}
        maxWidth="lg"
        PaperProps={{
          sx: { 
            bgcolor: 'transparent', 
            boxShadow: 'none', 
            overflow: 'visible',
            m: 2
          }
        }}
      >
        <Box 
          onClick={() => setSelectedPhoto(null)}
          sx={{
            position: 'absolute',
            right: -12,
            top: -12,
            bgcolor: '#FFFFFF',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 3,
            cursor: 'pointer',
            '&:hover': { bgcolor: '#F5F5F5' },
            zIndex: 1
          }}
        >
          <CancelRoundedIcon sx={{ color: 'text.secondary' }} />
        </Box>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {selectedPhoto && (
            <Box 
              component="img" 
              src={selectedPhoto} 
              sx={{ 
                maxWidth: '100%', 
                maxHeight: '90vh', 
                borderRadius: 2, 
                boxShadow: 24,
                objectFit: 'contain'
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
    </>
  );
}
