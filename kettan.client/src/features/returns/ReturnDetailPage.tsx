import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import DownloadDoneRoundedIcon from '@mui/icons-material/DownloadDoneRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import ForwardToInboxRoundedIcon from '@mui/icons-material/ForwardToInboxRounded';

import type { AxiosError } from 'axios';
import { useParams } from '@tanstack/react-router';
import { api } from '../../utils/api';

import { ReturnTrackerStepper } from './components/ReturnTrackerStepper';
import { SharedFloatingChat } from '../shared/components/SharedFloatingChat';

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
    case 'Pending':     return { bg: '#FFF8E1', color: '#F57F17', label: 'Pending' };
    default:            return { bg: '#F5F5F5', color: '#616161', label: status };
  }
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
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' }, elevation: 0 }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Acknowledge Return</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1.4, mt: 0.4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Vehicle</Typography>
              <Select size="small" fullWidth value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={isSaving}>
                {vehicles.map((v) => (
                  <MenuItem key={v.vehicleId} value={v.vehicleId}>
                    {v.plateNumber} ({v.vehicleType}) {!v.isActive ? '[Inactive]' : ''}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Pickup Schedule</Typography>
              <TextField type="datetime-local" size="small" fullWidth value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} disabled={isSaving} InputLabelProps={{ shrink: true }} />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Notes (Optional)</Typography>
            <TextField size="small" fullWidth multiline rows={3} value={note} onChange={(e) => setNote(e.target.value)} disabled={isSaving} placeholder="Instructions for driver or branch..." />
          </Box>
          {err && <Alert severity="error" sx={{ fontSize: 12.5 }}>{err}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Saving...' : 'Acknowledge'}</Button>
          </Box>
        </Box>
      </DialogContent>
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
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'error.main' }, elevation: 0 }}>
      <DialogTitle sx={{ fontWeight: 800, color: 'error.main', pb: 1 }}>Reject Return</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1.4, mt: 0.4 }}>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            Are you sure you want to reject this return? The branch will be notified.
          </Typography>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Rejection Reason</Typography>
            <TextField size="small" fullWidth multiline rows={3} value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSaving} placeholder="Explain why this return is rejected..." />
          </Box>
          {err && <Alert severity="error" sx={{ fontSize: 12.5 }}>{err}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button variant="outlined" sx={{ color: 'error.main', borderColor: 'error.main' }} onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Rejecting...' : 'Reject Return'}</Button>
          </Box>
        </Box>
      </DialogContent>
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
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' }, elevation: 0 }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Reschedule Pickup</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1.4, mt: 0.4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Vehicle</Typography>
              <Select size="small" fullWidth value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={isSaving}>
                {vehicles.map((v) => (
                  <MenuItem key={v.vehicleId} value={v.vehicleId}>
                    {v.plateNumber} ({v.vehicleType}) {!v.isActive ? '[Inactive]' : ''}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>New Schedule</Typography>
              <TextField type="datetime-local" size="small" fullWidth value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} disabled={isSaving} InputLabelProps={{ shrink: true }} />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Note</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={note} onChange={(e) => setNote(e.target.value)} disabled={isSaving} placeholder="Reason for rescheduling..." />
          </Box>
          {err && <Alert severity="error" sx={{ fontSize: 12.5 }}>{err}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Saving...' : 'Reschedule'}</Button>
          </Box>
        </Box>
      </DialogContent>
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
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' }, elevation: 0 }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1.4, mt: 0.4 }}>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Remarks (Optional)</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={isSaving} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={() => onSubmit(remarks.trim() || undefined)} disabled={isSaving}>{isSaving ? 'Processing...' : ctaLabel}</Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── Return Item Table Row ──
function ReturnItemTableRow({
  item, returnId, isHq, isInspecting, onSaved
}: {
  item: ReturnItemDto; returnId: number; isHq: boolean; isInspecting: boolean; onSaved: () => void;
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

  return (
    <>
      <TableRow>
        <TableCell sx={{ borderBottom: '1px dashed', borderColor: 'divider', pb: err ? 0 : undefined }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{item.itemName}</Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>{item.itemSku}</Typography>
        </TableCell>
        <TableCell align="left" sx={{ borderBottom: '1px dashed', borderColor: 'divider', pb: err ? 0 : undefined }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{item.quantityReturned}</Typography>
        </TableCell>
        <TableCell align="left" sx={{ borderBottom: '1px dashed', borderColor: 'divider', pb: err ? 0 : undefined }}>
          {showEditControls ? (
            <TextField type="number" size="small" sx={{ width: 80 }} inputProps={{ style: { padding: '4px 8px' } }} value={qty} onChange={(e) => setQty(Number(e.target.value))} disabled={isSaving} />
          ) : (
            <Typography sx={{ fontSize: 13.5 }}>{item.quantityInspected ?? '—'}</Typography>
          )}
        </TableCell>
        <TableCell align="left" sx={{ borderBottom: '1px dashed', borderColor: 'divider', pb: err ? 0 : undefined }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{item.reasonCode}</Typography>
        </TableCell>
        <TableCell align="left" sx={{ borderBottom: '1px dashed', borderColor: 'divider', pb: err ? 0 : undefined }}>
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
            <StatusChip status={item.disposition} />
          )}
        </TableCell>
      </TableRow>
      {err && (
        <TableRow>
          <TableCell colSpan={5} sx={{ pt: 0, borderBottom: '1px dashed', borderColor: 'divider' }}>
            <Alert severity="error" sx={{ py: 0, px: 2, fontSize: 13, '& .MuiAlert-icon': { py: 0.5 } }}>{err}</Alert>
          </TableCell>
        </TableRow>
      )}
      {!err && isInspecting && isDamagedOrExpired && disp === 'Restock' && (
        <TableRow>
          <TableCell colSpan={5} sx={{ pt: 0, borderBottom: '1px dashed', borderColor: 'divider' }}>
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
            connection.invoke('LeaveGroup', `Return_${numericReturnId}`).finally(() => void connection.stop());
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <BackButton to="/returns" />
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Return RT-{row.returnId}</Typography>
          </Box>
          <StatusChip status={row.status} />
          <StatusChip status={row.resolution} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
          {/* HQ: Submitted -> Acknowledge / Reject */}
          {isHq && row.status === 'Submitted' && (
            <>
              <Button 
                variant="outlined" 
                sx={{ color: 'error.main', borderColor: 'error.main' }} 
                onClick={() => setDialog('reject')}
                startIcon={<CancelRoundedIcon />}
              >
                Reject
              </Button>
              <Button 
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
              onClick={() => setDialog('dispatch')}
              startIcon={<LocalShippingRoundedIcon />}
            >
              Confirm Handoff
            </Button>
          )}

          {/* HQ: Dispatched -> Confirm Arrival */}
          {isHq && row.status === 'Dispatched' && (
            <Button 
              onClick={() => setDialog('arrival')}
              startIcon={<DownloadDoneRoundedIcon />}
            >
              Confirm Arrival
            </Button>
          )}

          {/* HQ: Arrived -> Start Inspection */}
          {isHq && row.status === 'Arrived' && (
            <Button 
              onClick={() => setDialog('startInspect')}
              startIcon={<FactCheckRoundedIcon />}
            >
              Start Inspection
            </Button>
          )}

          {/* HQ: Inspecting -> Complete */}
          {isHq && row.status === 'Inspecting' && (
            <Button
              disabled={row.items.some((i) => i.disposition === 'Pending')}
              onClick={() => setDialog('complete')}
              startIcon={<CheckCircleRoundedIcon />}
            >
              Complete Return
            </Button>
          )}

          {/* Branch Status Messages */}
          {isBranch && row.status === 'Submitted' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, bgcolor: 'action.hover', borderRadius: 2 }}>
              <HourglassEmptyRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary' }}>Awaiting HQ acknowledgement...</Typography>
            </Box>
          )}
          {isBranch && (row.status === 'Dispatched' || row.status === 'Arrived') && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, bgcolor: 'action.hover', borderRadius: 2 }}>
              <LocalShippingRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary' }}>Return in transit to HQ...</Typography>
            </Box>
          )}
          {isBranch && row.status === 'Inspecting' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, bgcolor: 'action.hover', borderRadius: 2 }}>
              <FactCheckRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary' }}>HQ is currently inspecting items...</Typography>
            </Box>
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
      {error && <Alert severity="error" sx={{ fontSize: 12.5 }}>{error}</Alert>}
      
      {/* Rejection Alert */}
      {row.status === 'Rejected' && row.rejectionReason && (
        <Alert severity="error" sx={{ fontSize: 12.5 }}>
          <strong>Rejection reason:</strong> {row.rejectionReason}
        </Alert>
      )}

      {/* Tracker Stepper */}
      <ReturnTrackerStepper status={row.status as any} timeline={timelineEvents} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: 2.2, alignItems: 'start' }}>
        {/* Info Column */}
        <Paper sx={{ p: 0, borderRadius: '14px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }} elevation={0}>
          {/* Order/Branch Header */}
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Return Details</Typography>
              </Box>
              <Typography sx={{ fontSize: 18, fontWeight: 800 }}>Order #{row.orderId}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', mt: 0.5 }}>
                  <StorefrontRoundedIcon sx={{ fontSize: 15 }} />
                  <Typography sx={{ fontSize: 13 }}>{row.branchName}</Typography>
              </Box>
          </Box>

          <Box sx={{ p: 2, display: 'grid', gap: 2 }}>
              {/* Timeline info */}
              <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                      <EventAvailableRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</Typography>
                  </Box>
                  <Box sx={{ pl: 3 }}>
                      <Typography sx={{ fontSize: 13, mb: 0.2 }}>
                          <span style={{ color: '#757575', marginRight: 4 }}>Filed:</span> 
                          {new Date(row.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                      {row.pickupScheduledAt && (
                          <Typography sx={{ fontSize: 13 }}>
                              <span style={{ color: '#757575', marginRight: 4 }}>Pickup:</span> 
                              {new Date(row.pickupScheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </Typography>
                      )}
                      {row.pickupVehiclePlateNumber && (
                          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
                              Vehicle {row.pickupVehiclePlateNumber}
                          </Typography>
                      )}
                  </Box>
              </Box>

              {row.creditAmount != null && (
                  <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                          <ReceiptLongRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</Typography>
                      </Box>
                      <Typography sx={{ pl: 3, fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
                          {row.creditAmount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                      </Typography>
                  </Box>
              )}

              {row.reason && (
                  <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                          <NotesRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Notes</Typography>
                      </Box>
                      <Typography sx={{ pl: 3, fontSize: 13, color: 'text.secondary', lineHeight: 1.5 }}>
                          {row.reason}
                      </Typography>
                  </Box>
              )}
          </Box>
        </Paper>

        {/* Right Column (Items Table + Inspection) */}
        <Box sx={{ display: 'grid', gap: 2.2 }}>
          <Paper sx={{ p: 2.2, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1.5 }}>Returned Items</Typography>
            {row.items.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No items on this return.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: 'divider' }}>Item</TableCell>
                    <TableCell align="left" sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: 'divider' }}>Returned</TableCell>
                    <TableCell align="left" sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: 'divider' }}>Inspected</TableCell>
                    <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: 'divider' }}>Reason</TableCell>
                    <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid', borderColor: 'divider' }}>Disposition</TableCell>
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
                    />
                  ))}
                </TableBody>
              </Table>
            )}
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
      <RemarksConfirmDialog
        open={dialog === 'complete'}
        isSaving={isSaving}
        title="Complete Return"
        ctaLabel="Complete"
        onClose={() => setDialog(null)}
        onSubmit={(remarks) => void withSave(() => completeReturn(row.returnId, remarks).then(() => {}))}
      />
    </Box>
    </>
  );
}
