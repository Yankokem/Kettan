import { useEffect, useState } from 'react';
import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
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
import type { AxiosError } from 'axios';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { TextField } from '../../components/UI/TextField';
import {
  fetchEligibleOrders,
  fetchEligibleOrderDetail,
  createReturnDraft,
  updateReturnDraft,
  submitReturn,
  type ReturnEligibleOrder,
} from '../branch-operations/api';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

const REASON_OPTIONS = [
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Expired', label: 'Expired' },
  { value: 'DeliveryError', label: 'Delivery Error' },
  { value: 'QualityIssue', label: 'Quality Issue' },
];

const RESOLUTION_OPTIONS = [
  { value: 'Credited', label: 'Credit' },
  { value: 'Replaced', label: 'Replacement' },
];

interface ItemLine {
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityDelivered: number;
  selected: boolean;
  quantityReturned: string;
  reasonCode: string;
}

type Step = 'select-order' | 'select-items' | 'confirm';

export function ReturnCreatePage() {
  const navigate = useNavigate();
  // Read optional ?orderId= deep-link
  const search = useSearch({ strict: false }) as { orderId?: string };
  const preselectedOrderId = search.orderId ? Number(search.orderId) : null;

  // Step state
  const [step, setStep] = useState<Step>('select-order');

  // Step 1 — order selection
  const [eligibleOrders, setEligibleOrders] = useState<ReturnEligibleOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [orderDetail, setOrderDetail] = useState<ReturnEligibleOrder | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  // Step 2 — item lines
  const [lines, setLines] = useState<ItemLine[]>([]);
  const [resolution, setResolution] = useState('Credited');
  const [reason, setReason] = useState('');
  const [photoUrls, setPhotoUrls] = useState('');

  // Draft tracking
  const [draftId, setDraftId] = useState<number | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load eligible orders on mount
  useEffect(() => {
    void (async () => {
      try {
        const orders = await fetchEligibleOrders();
        setEligibleOrders(orders);

        if (preselectedOrderId) {
          setSelectedOrderId(preselectedOrderId);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, []);

  // Load order detail whenever selectedOrderId changes
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderDetail(null);
      return;
    }

    void (async () => {
      try {
        setOrderDetailLoading(true);
        const detail = await fetchEligibleOrderDetail(Number(selectedOrderId));
        setOrderDetail(detail);
        setLines(
          detail.items.map((i) => ({
            itemId: i.itemId,
            itemName: i.itemName,
            itemSku: i.itemSku,
            quantityDelivered: i.quantityDelivered,
            selected: false,
            quantityReturned: '',
            reasonCode: 'Damaged',
          })),
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setOrderDetailLoading(false);
      }
    })();
  }, [selectedOrderId]);

  // Auto-advance if preselected order loads
  useEffect(() => {
    if (preselectedOrderId && orderDetail && step === 'select-order') {
      setStep('select-items');
    }
  }, [orderDetail]);

  const selectedLines = lines.filter((l) => l.selected);

  const toggleLine = (itemId: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.itemId === itemId ? { ...l, selected: !l.selected, quantityReturned: l.selected ? '' : l.quantityReturned } : l,
      ),
    );
  };

  const updateLine = (itemId: number, field: 'quantityReturned' | 'reasonCode', value: string) => {
    setLines((prev) => prev.map((l) => (l.itemId === itemId ? { ...l, [field]: value } : l)));
  };

  const validateLines = (): string | null => {
    if (selectedLines.length === 0) return 'Select at least one item to return.';
    for (const line of selectedLines) {
      const qty = Number(line.quantityReturned);
      if (!Number.isFinite(qty) || qty <= 0) return `Enter a valid quantity for ${line.itemName}.`;
      if (qty > line.quantityDelivered) return `Quantity for ${line.itemName} exceeds delivered amount (${line.quantityDelivered}).`;
    }
    return null;
  };

  const buildDraftPayload = () => ({
    orderId: Number(selectedOrderId),
    resolution,
    reason: reason.trim() || undefined,
    photoUrls: photoUrls.trim() || undefined,
    items: selectedLines.map((l) => ({
      itemId: l.itemId,
      quantityReturned: Number(l.quantityReturned),
      reasonCode: l.reasonCode,
    })),
  });

  const handleSaveDraft = async () => {
    const validationError = validateLines();
    if (validationError) { setError(validationError); return; }

    try {
      setIsSaving(true);
      setError(null);
      const payload = buildDraftPayload();

      let draft;
      if (draftId) {
        draft = await updateReturnDraft(draftId, payload);
      } else {
        draft = await createReturnDraft(payload);
        setDraftId(draft.returnId);
      }

      navigate({ to: '/returns/$returnId', params: { returnId: String(draft.returnId) } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateLines();
    if (validationError) { setError(validationError); return; }

    try {
      setIsSaving(true);
      setError(null);
      const payload = buildDraftPayload();

      let id = draftId;
      if (id) {
        await updateReturnDraft(id, payload);
      } else {
        const draft = await createReturnDraft(payload);
        id = draft.returnId;
        setDraftId(id);
      }

      await submitReturn(id!);
      navigate({ to: '/returns/$returnId', params: { returnId: String(id) } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Step 1: Order Selection ──
  const renderSelectOrder = () => (
    <Paper sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>Select a Delivered Order</Typography>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2 }}>
        Only orders that have been delivered to your branch are eligible for returns.
      </Typography>

      {ordersLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <CircularProgress size={16} />
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Loading eligible orders...</Typography>
        </Box>
      ) : eligibleOrders.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No eligible delivered orders found.</Typography>
      ) : (
        <Select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value as number)}
          displayEmpty
          size="small"
          fullWidth
          sx={{ fontSize: 13.5 }}
        >
          <MenuItem value="" disabled>
            <em>Select an order...</em>
          </MenuItem>
          {eligibleOrders.map((o) => (
            <MenuItem key={o.orderId} value={o.orderId}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#6B4C2A' }}>
                  #{o.orderId}
                </Typography>
                {o.referenceNumber && (
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    REF: {o.referenceNumber}
                  </Typography>
                )}
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', ml: 'auto' }}>
                  {new Date(o.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      )}

      {orderDetailLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mt: 1.5 }}>
          <CircularProgress size={14} />
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Loading order items...</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          disabled={!selectedOrderId || orderDetailLoading || !orderDetail}
          onClick={() => { setError(null); setStep('select-items'); }}
        >
          Next: Select Items
        </Button>
      </Box>
    </Paper>
  );

  // ── Step 2: Item Selection ──
  const renderSelectItems = () => (
    <Paper sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Select Items to Return</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Order #{selectedOrderId} · {orderDetail?.items.length} item{orderDetail?.items.length !== 1 ? 's' : ''} delivered
          </Typography>
        </Box>
        <Chip
          label={`${selectedLines.length} selected`}
          size="small"
          sx={{ fontSize: 11.5, fontWeight: 600, bgcolor: selectedLines.length > 0 ? '#F0EAE2' : 'action.hover', color: selectedLines.length > 0 ? '#6B4C2A' : 'text.secondary' }}
        />
      </Box>

      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Item</TableCell>
            <TableCell align="center" sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 100 }}>Delivered</TableCell>
            <TableCell align="center" sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 120 }}>Qty to Return</TableCell>
            <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', width: 160 }}>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => (
            <TableRow
              key={line.itemId}
              sx={{
                opacity: line.selected ? 1 : 0.6,
                '&:hover': { opacity: 1 },
                transition: 'opacity 0.15s',
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={line.selected}
                  onChange={() => toggleLine(line.itemId)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{line.itemName}</Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>{line.itemSku}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{line.quantityDelivered}</Typography>
              </TableCell>
              <TableCell align="center">
                <TextField
                  type="number"
                  size="small"
                  value={line.quantityReturned}
                  onChange={(e) => updateLine(line.itemId, 'quantityReturned', e.target.value)}
                  disabled={!line.selected}
                  inputProps={{ min: 0, max: line.quantityDelivered, step: 0.001 }}
                  sx={{ width: 100 }}
                />
              </TableCell>
              <TableCell>
                <Select
                  value={line.reasonCode}
                  onChange={(e) => updateLine(line.itemId, 'reasonCode', e.target.value)}
                  disabled={!line.selected}
                  size="small"
                  sx={{ fontSize: 13, width: '100%' }}
                >
                  {REASON_OPTIONS.map((r) => (
                    <MenuItem key={r.value} value={r.value} sx={{ fontSize: 13 }}>
                      {r.label}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.6 }}>
            Expected Resolution
          </Typography>
          <Select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            size="small"
            fullWidth
            sx={{ fontSize: 13.5 }}
          >
            {RESOLUTION_OPTIONS.map((r) => (
              <MenuItem key={r.value} value={r.value} sx={{ fontSize: 13 }}>
                {r.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <TextField
          label="General Notes (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          size="small"
        />
      </Box>

      <TextField
        label="Photo URLs (comma-separated, optional)"
        value={photoUrls}
        onChange={(e) => setPhotoUrls(e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 1.5 }}
      />

      {error && (
        <Typography sx={{ color: 'error.main', fontSize: 12.5, mb: 1.2 }}>{error}</Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Button variant="outlined" onClick={() => { setStep('select-order'); setError(null); }}>
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => void handleSaveDraft()}
            disabled={isSaving || selectedLines.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSaving || selectedLines.length === 0}
          >
            {isSaving ? 'Submitting...' : 'Submit Return'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  const stepLabels: { key: Step; label: string }[] = [
    { key: 'select-order', label: 'Select Order' },
    { key: 'select-items', label: 'Select Items' },
  ];

  return (
    <Box sx={{ pb: 3, display: 'grid', gap: 2.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <BackButton to="/returns" />
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>File Return</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Create a return request linked to a delivered order.
          </Typography>
        </Box>
      </Box>

      {/* Step indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {stepLabels.map((s, idx) => {
          const isActive = s.key === step;
          const isDone = stepLabels.findIndex((x) => x.key === step) > idx;
          return (
            <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: isActive ? '#6B4C2A' : isDone ? '#9B7A56' : 'action.hover',
                  color: isActive || isDone ? '#fff' : 'text.secondary',
                }}
              >
                {isDone ? '✓' : idx + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: 12.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'text.primary' : 'text.secondary',
                }}
              >
                {s.label}
              </Typography>
              {idx < stepLabels.length - 1 && (
                <Box sx={{ width: 24, height: 1, bgcolor: 'divider' }} />
              )}
            </Box>
          );
        })}
      </Box>

      {step === 'select-order' && renderSelectOrder()}
      {step === 'select-items' && renderSelectItems()}
    </Box>
  );
}