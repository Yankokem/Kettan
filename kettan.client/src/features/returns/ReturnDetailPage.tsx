import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
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
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import type { AxiosError } from 'axios';
import { useParams } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import { useAuthStore } from '../../store/useAuthStore';
import {
  fetchReturnById,
  fetchReturnMessages,
  sendReturnMessage,
  acknowledgeReturn,
  rejectReturn,
  rescheduleReturnPickup,
  confirmReturnDispatch,
  confirmReturnArrival,
  startReturnInspection,
  saveReturnInspection,
  completeReturn,
  type ReturnRecord,
  type ReturnMessage,
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
    case 'Credited':    return { bg: '#E8F5E9', color: '#2E7D32', label: 'Credited' };
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

// ── Timeline ──


function TimelinePanel({ row }: { row: ReturnRecord }) {
  const events: Array<{ label: string; time: string | null; actor?: string }> = [
    { label: 'Draft', time: row.loggedAt, actor: row.branchName },
    { label: 'Submitted', time: row.submittedAt },
    { label: 'Acknowledged', time: row.acknowledgedAt },
    { label: 'Dispatched', time: row.dispatchedAt },
    { label: 'Arrived', time: row.arrivedAt },
    { label: 'Inspecting', time: row.inspectingAt },
  ];

  if (row.status === 'Completed') {
    events.push({ label: 'Completed', time: row.completedAt });
  } else if (row.status === 'Rejected') {
    events.push({ label: 'Rejected', time: row.rejectedAt });
  }

  const reached = events.filter((e) => e.time !== null);

  return (
    <Paper sx={{ p: 2.2, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1.5 }}>Status Timeline</Typography>
      <Box sx={{ display: 'grid', gap: 0.8 }}>
        {reached.map((e) => (
          <Box key={e.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
              <StatusChip status={e.label} />
              {e.actor && (
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{e.actor}</Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {new Date(e.time!).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </Typography>
          </Box>
        ))}
      </Box>

      {row.status === 'Rejected' && row.rejectionReason && (
        <Alert severity="error" sx={{ mt: 1.5, fontSize: 12.5 }}>
          <strong>Rejection reason:</strong> {row.rejectionReason}
        </Alert>
      )}
    </Paper>
  );
}
function MessageContent({ content, onImageClick, isOwn }: { content: string; onImageClick: (url: string) => void; isOwn: boolean }) {
  // Regex to find Markdown images: ![alt](url)
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    // Add preceding text
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.substring(lastIndex, match.index) });
    }
    // Add image
    parts.push({ type: 'image', alt: match[1], url: match[2] });
    lastIndex = imgRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.substring(lastIndex) });
  }

  return (
    <Box sx={{ display: 'grid', gap: 0.8 }}>
      {parts.map((p, i) => {
        if (p.type === 'text') {
          return (
            <Typography 
              key={i} 
              sx={{ 
                fontSize: 13, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                lineHeight: 1.5
              }}
            >
              {p.value}
            </Typography>
          );
        }
        return (
          <Box
            key={i}
            onClick={() => onImageClick(p.url!)}
            sx={{
              width: '100%',
              maxWidth: 320,
              aspectRatio: '16/10',
              borderRadius: 2,
              overflow: 'hidden',
              cursor: 'pointer',
              border: '2px solid',
              borderColor: isOwn ? 'rgba(255,255,255,0.2)' : 'divider',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.02)' }
            }}
          >
            <Box 
              component="img" 
              src={p.url} 
              alt={p.alt}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </Box>
        );
      })}
    </Box>
  );
}

// ── Messages Panel ──
function MessagesPanel({ returnId, currentUserId }: { returnId: number; currentUserId?: number }) {
  const [messages, setMessages] = useState<ReturnMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    const msgs = await fetchReturnMessages(returnId);
    setMessages(msgs);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => { void loadMessages(); }, [returnId]);

  const handleSend = async () => {
    if (!content.trim()) return;
    try {
      setSending(true);
      await sendReturnMessage(returnId, content.trim());
      setContent('');
      await loadMessages();
    } finally {
      setSending(false);
    }
  };

  return (
    <Paper sx={{ p: 2.2, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Messages</Typography>
      </Box>

      <Box sx={{ maxHeight: 300, overflowY: 'auto', display: 'grid', gap: 1, mb: 1.5, pr: 0.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        ) : messages.length === 0 ? (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', textAlign: 'center', py: 1.5 }}>
            No messages yet. Start the conversation.
          </Typography>
        ) : (
          messages.map((m) => {
            const isOwn = m.senderUserId === currentUserId;
            return (
              <Box
                key={m.messageId}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                }}
              >
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.3 }}>
                  {m.senderName} · {m.senderRole} ·{' '}
                  {new Date(m.sentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Typography>
                <Box
                  sx={{
                    maxWidth: '85%',
                    px: 1.4,
                    py: 0.9,
                    borderRadius: isOwn ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    bgcolor: isOwn ? '#6B4C2A' : 'action.hover',
                    color: isOwn ? '#fff' : 'text.primary',
                    boxShadow: isOwn ? '0 4px 12px rgba(107,76,42,0.15)' : 'none'
                  }}
                >
                  <MessageContent 
                    content={m.content} 
                    onImageClick={(url) => setPreviewImageUrl(url)} 
                    isOwn={isOwn}
                  />
                </Box>
              </Box>
            );
          })
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Message Image Lightbox */}
      <Dialog 
        open={Boolean(previewImageUrl)} 
        onClose={() => setPreviewImageUrl(null)}
        maxWidth="lg"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible', m: 2 } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewImageUrl(null)}
            sx={{ position: 'absolute', right: -12, top: -12, bgcolor: '#fff', boxShadow: 3, '&:hover': { bgcolor: '#f5f5f5' }, zIndex: 1 }}
          >
            <CloseRoundedIcon />
          </IconButton>
          {previewImageUrl && (
            <Box 
              component="img" 
              src={previewImageUrl} 
              sx={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 3, boxShadow: 24, objectFit: 'contain' }} 
            />
          )}
        </Box>
      </Dialog>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a message..."
          size="small"
          fullWidth
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
        />
        <Button onClick={() => void handleSend()} disabled={sending || !content.trim()} sx={{ minWidth: 44, px: 1.5 }}>
          <SendRoundedIcon sx={{ fontSize: 17 }} />
        </Button>
      </Box>
    </Paper>
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
  onSubmit: (payload: { vehicleId: number; pickupScheduledAt: string; resolution: string; note?: string }) => void;
}) {
  const [vehicleId, setVehicleId] = useState<string | number>('');
  const [pickupDate, setPickupDate] = useState('');
  const [resolution, setResolution] = useState('Credited');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!open) { setVehicleId(''); setPickupDate(''); setNote(''); setErr(null); } }, [open]);

  const handleSubmit = () => {
    const vid = Number(vehicleId);
    if (!Number.isInteger(vid) || vid <= 0) { setErr('Enter a valid Vehicle ID.'); return; }
    if (!pickupDate) { setErr('Select a pickup date/time.'); return; }
    setErr(null);
    onSubmit({ vehicleId: vid, pickupScheduledAt: new Date(pickupDate).toISOString(), resolution, note: note.trim() || undefined });
  };

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' }, elevation: 0 }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Acknowledge Return</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1.4, mt: 0.4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Vehicle</Typography>
              <Select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                size="small"
                fullWidth
                displayEmpty
                sx={{ fontSize: 13.5 }}
              >
                <MenuItem value="" disabled sx={{ fontSize: 13.5 }}>Select a vehicle</MenuItem>
                {vehicles.filter(v => v.isActive).map((v) => (
                  <MenuItem key={v.vehicleId} value={v.vehicleId} sx={{ fontSize: 13.5 }}>
                    {v.plateNumber} ({v.vehicleType})
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <TextField label="Pickup Date & Time" type="datetime-local" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Confirm Resolution</Typography>
            <Select value={resolution} onChange={(e) => setResolution(e.target.value)} size="small" fullWidth sx={{ fontSize: 13.5 }}>
              <MenuItem value="Credited">Credit</MenuItem>
              <MenuItem value="Replaced">Replacement</MenuItem>
            </Select>
          </Box>
          <TextField label="Note (optional)" multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} size="small" />
          {err && <Typography sx={{ color: 'error.main', fontSize: 12.5 }}>{err}</Typography>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
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
  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' }, elevation: 0 }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1, color: 'error.main' }}>Reject Return</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1.4, mt: 0.4 }}>
          <TextField label="Rejection Reason (required)" multiline minRows={3} value={reason} onChange={(e) => setReason(e.target.value)} size="small" />
          {err && <Typography sx={{ color: 'error.main', fontSize: 12.5 }}>{err}</Typography>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button
              sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
              onClick={() => { if (!reason.trim()) { setErr('Reason is required.'); return; } onSubmit(reason.trim()); }}
              disabled={isSaving}
            >
              {isSaving ? 'Rejecting...' : 'Reject Return'}
            </Button>
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
    if (!note.trim()) { setErr('A reschedule note is required.'); return; }
    setErr(null);
    onSubmit({ vehicleId: vid, pickupScheduledAt: new Date(pickupDate).toISOString(), note: note.trim() });
  };
  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' }, elevation: 0 }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Reschedule Pickup</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1.4, mt: 0.4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5 }}>Vehicle</Typography>
              <Select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                size="small"
                fullWidth
                displayEmpty
                sx={{ fontSize: 13.5 }}
              >
                <MenuItem value="" disabled sx={{ fontSize: 13.5 }}>Select a vehicle</MenuItem>
                {vehicles.filter(v => v.isActive).map((v) => (
                  <MenuItem key={v.vehicleId} value={v.vehicleId} sx={{ fontSize: 13.5 }}>
                    {v.plateNumber} ({v.vehicleType})
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <TextField label="New Date & Time" type="datetime-local" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          </Box>
          <TextField label="Reschedule Note (required)" multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} size="small" />
          {err && <Typography sx={{ color: 'error.main', fontSize: 12.5 }}>{err}</Typography>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Saving...' : 'Reschedule'}</Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── Remarks confirm dialog (generic) ──
function RemarksConfirmDialog({
  open, isSaving, title, ctaLabel, ctaColor, onClose, onSubmit,
}: {
  open: boolean;
  isSaving: boolean;
  title: string;
  ctaLabel: string;
  ctaColor?: string;
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
          <TextField label="Remarks (optional)" multiline minRows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} size="small" />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button
              sx={ctaColor ? { bgcolor: ctaColor, '&:hover': { bgcolor: ctaColor } } : undefined}
              onClick={() => onSubmit(remarks.trim() || undefined)}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : ctaLabel}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── Inspection Panel ──
const DISPOSITION_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Restock', label: 'Restock' },
  { value: 'WriteOff', label: 'Write-Off' },
];

interface InspectionLine {
  returnItemId: number;
  disposition: string;
  quantityInspected: string;
  restockBatchId: string;
  inspectionRemarks: string;
}

function InspectionPanel({
  items,
  returnId,
  onSaved,
}: {
  items: ReturnItemDto[];
  returnId: number;
  onSaved: () => void;
}) {
  const [lines, setLines] = useState<InspectionLine[]>(
    items.map((i) => ({
      returnItemId: i.returnItemId,
      disposition: i.disposition,
      quantityInspected: i.quantityInspected?.toString() ?? i.quantityReturned.toString(),
      restockBatchId: i.restockBatchId?.toString() ?? '',
      inspectionRemarks: i.inspectionRemarks ?? '',
    })),
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const updateLine = (id: number, field: keyof InspectionLine, value: string) => {
    setLines((prev) => prev.map((l) => (l.returnItemId === id ? { ...l, [field]: value } : l)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErr(null);
      await saveReturnInspection(
        returnId,
        lines.map((l) => ({
          returnItemId: l.returnItemId,
          disposition: l.disposition,
          quantityInspected: Number(l.quantityInspected) || undefined,
          restockBatchId: l.restockBatchId ? Number(l.restockBatchId) : undefined,
          inspectionRemarks: l.inspectionRemarks.trim() || undefined,
        })),
      );
      onSaved();
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 2.2, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1.5 }}>Inspection</Typography>
      <Table size="small" sx={{ mb: 1.5 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Item</TableCell>
            <TableCell align="center" sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 100 }}>Returned</TableCell>
            <TableCell align="center" sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 110 }}>Inspected Qty</TableCell>
            <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 130 }}>Disposition</TableCell>
            <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 100 }}>Restock Batch</TableCell>
            <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Remarks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, idx) => {
            const line = lines[idx];
            if (!line) return null;
            return (
              <TableRow key={item.returnItemId}>
                <TableCell>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{item.itemName}</Typography>
                  <Box sx={{ fontSize: 11.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {item.reasonCode} · <StatusChip status={item.disposition} />
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontSize: 13 }}>{item.quantityReturned}</Typography>
                </TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={line.quantityInspected}
                    onChange={(e) => updateLine(item.returnItemId, 'quantityInspected', e.target.value)}
                    inputProps={{ min: 0, step: 0.001 }}
                    sx={{ width: 90 }}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={line.disposition}
                    onChange={(e) => updateLine(item.returnItemId, 'disposition', e.target.value)}
                    size="small"
                    sx={{ fontSize: 13, width: '100%' }}
                  >
                    {DISPOSITION_OPTIONS.map((d) => (
                      <MenuItem key={d.value} value={d.value} sx={{ fontSize: 13 }}>{d.label}</MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    placeholder="Batch ID"
                    value={line.restockBatchId}
                    onChange={(e) => updateLine(item.returnItemId, 'restockBatchId', e.target.value)}
                    disabled={line.disposition !== 'Restock'}
                    sx={{ width: 90 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Optional"
                    value={line.inspectionRemarks}
                    onChange={(e) => updateLine(item.returnItemId, 'inspectionRemarks', e.target.value)}
                    sx={{ width: '100%' }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {err && <Typography sx={{ color: 'error.main', fontSize: 12.5, mb: 1 }}>{err}</Typography>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving...' : 'Save Inspection'}
        </Button>
      </Box>
    </Paper>
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 3 }}>
        <CircularProgress size={18} />
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Loading return...</Typography>
      </Box>
    );
  }

  if (!row) {
    return (
      <Box sx={{ display: 'grid', gap: 1.2 }}>
        <BackButton to="/returns" />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Return not found.</Typography>
        {error && <Typography sx={{ fontSize: 12.5, color: 'error.main' }}>{error}</Typography>}
      </Box>
    );
  }



  return (
    <Box sx={{ pb: 3, display: 'grid', gap: 2.2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <BackButton to="/returns" />
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Return RT-{row.returnId}</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              Order #{row.orderId} · {row.branchName}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
          <StatusChip status={row.status} />
          <StatusChip status={row.resolution} />
        </Box>
      </Box>

      {/* Vehicle conflict warning */}
      {row.hasVehicleScheduleConflict && (
        <Alert
          icon={<WarningAmberRoundedIcon fontSize="small" />}
          severity="warning"
          sx={{ fontSize: 12.5 }}
        >
          <strong>Vehicle schedule conflict:</strong> The assigned vehicle ({row.pickupVehiclePlateNumber}) has{' '}
          {row.vehicleScheduleConflicts.length} other pickup(s) on{' '}
          {row.pickupScheduledAt ? new Date(row.pickupScheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'that date'}.
        </Alert>
      )}

      {/* Error */}
      {error && <Alert severity="error" sx={{ fontSize: 12.5 }}>{error}</Alert>}

      {/* Meta card */}
      <Paper sx={{ p: 2.2, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.4 }}>Branch</Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{row.branchName}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.4 }}>Filed</Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
              {new Date(row.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          </Box>
          {row.pickupScheduledAt && (
            <Box>
              <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.4 }}>Pickup Scheduled</Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                {new Date(row.pickupScheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </Typography>
              {row.pickupVehiclePlateNumber && (
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Vehicle: {row.pickupVehiclePlateNumber}</Typography>
              )}
            </Box>
          )}
          {row.creditAmount != null && (
            <Box>
              <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.4 }}>Credit Amount</Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                {row.creditAmount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
              </Typography>
            </Box>
          )}
        </Box>

        {row.reason && (
          <Box sx={{ mt: 1.5 }}>
            <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.4 }}>Notes</Typography>
            <Typography sx={{ fontSize: 13.2 }}>{row.reason}</Typography>
          </Box>
        )}
      </Paper>

      {/* Action buttons */}
      <Paper sx={{ p: 2, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.2, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
          Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* HQ: Submitted → Acknowledge / Reject */}
          {isHq && row.status === 'Submitted' && (
            <>
              <Button onClick={() => setDialog('acknowledge')}>Acknowledge</Button>
              <Button variant="outlined" sx={{ color: 'error.main', borderColor: 'error.main' }} onClick={() => setDialog('reject')}>Reject</Button>
            </>
          )}

          {/* HQ: Acknowledged → Reschedule */}
          {isHq && row.status === 'Acknowledged' && (
            <Button variant="outlined" onClick={() => setDialog('reschedule')}>Reschedule Pickup</Button>
          )}

          {/* Branch: Acknowledged → Confirm Dispatch */}
          {isBranch && row.status === 'Acknowledged' && (
            <Button onClick={() => setDialog('dispatch')}>Confirm Handoff</Button>
          )}

          {/* HQ: Dispatched → Confirm Arrival */}
          {isHq && row.status === 'Dispatched' && (
            <Button onClick={() => setDialog('arrival')}>Confirm Arrival</Button>
          )}

          {/* HQ: Arrived → Start Inspection */}
          {isHq && row.status === 'Arrived' && (
            <Button onClick={() => setDialog('startInspect')}>Start Inspection</Button>
          )}

          {/* HQ: Inspecting → Complete */}
          {isHq && row.status === 'Inspecting' && (
            <Button
              disabled={row.items.some((i) => i.disposition === 'Pending')}
              onClick={() => setDialog('complete')}
            >
              Complete Return
            </Button>
          )}

          {isHq && row.status === 'Inspecting' && row.items.some((i) => i.disposition === 'Pending') && (
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', alignSelf: 'center' }}>
              All items must be dispositioned before completing.
            </Typography>
          )}

          {['Completed', 'Rejected'].includes(row.status) && (
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              This return has been {row.status.toLowerCase()}.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Items table */}
      <Paper sx={{ p: 2.2, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1.5 }}>Returned Items</Typography>
        {row.items.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No items on this return.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Item</TableCell>
                <TableCell align="center" sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 100 }}>Returned</TableCell>
                <TableCell align="center" sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 100 }}>Inspected</TableCell>
                <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 120 }}>Reason</TableCell>
                <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 130 }}>Disposition</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {row.items.map((item) => (
                <TableRow key={item.returnItemId}>
                  <TableCell>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{item.itemName}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>{item.itemSku}</Typography>
                  </TableCell>
                  <TableCell align="center"><Typography sx={{ fontSize: 13 }}>{item.quantityReturned}</Typography></TableCell>
                  <TableCell align="center">
                    <Typography sx={{ fontSize: 13 }}>{item.quantityInspected ?? '—'}</Typography>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{item.reasonCode}</Typography></TableCell>
                  <TableCell><StatusChip status={item.disposition} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Inspection panel (only while Inspecting, HQ only) */}
      {isHq && row.status === 'Inspecting' && (
        <InspectionPanel items={row.items} returnId={row.returnId} onSaved={() => void loadReturn()} />
      )}

      {/* Timeline */}
      <TimelinePanel row={row} />

      {/* Messages */}
      <MessagesPanel returnId={row.returnId} currentUserId={user ? Number(user.id) : undefined} />

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
  );
}