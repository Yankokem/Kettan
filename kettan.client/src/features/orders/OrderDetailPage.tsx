import { Box, Typography, Chip, Grid, Tooltip, Alert } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import BackpackRoundedIcon from '@mui/icons-material/BackpackRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import { useAuthStore } from '../../store/useAuthStore';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';

import { OrderFulfillmentStepper } from './components/OrderFulfillmentStepper';
import { OrderDetailsPanel } from './components/OrderDetailsPanel';
import DispatchAssignmentCard from './components/DispatchAssignmentCard';
import {
  fetchOrderById,
  submitPicking,
  submitPacking,
  submitDispatch,
  cancelOrder,
  confirmArrival,
  completeTransaction,
  getPickingSuggestions,
  type OrderDetail,
  type PickingSuggestion,
} from '../branch-operations/api';
import SRItemTable, { type SRTableMode } from '../supply-requests/components/SRItemTable';
import type { SupplyRequestDetailItem } from '../supply-requests/components/SupplyRequestDetail.types';
import { OrderMessagesModal } from './components/OrderMessagesModal';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

// How often to silently re-fetch the order for status changes (ms)
const POLL_INTERVAL_MS = 10_000;


function mapOrderItemsToViewModel(requestedItems: OrderDetail['requestedItems']): SupplyRequestDetailItem[] {
  return (requestedItems || []).map((i) => ({
    id: String(i.requestItemId),
    name: i.itemName,
    sku: i.itemSku,
    requestedQty: i.quantityRequested,
    approvedQty: i.quantityApproved,
    hqStock: i.hqStock ?? 0,
    availability: (i.hqStock ?? 0) >= i.quantityRequested ? 'Available' : 'Low Stock',
    isPicked: i.isPicked,
    sendQuantity: i.sendQuantity,
    isRejectedDuringPicking: i.isRejectedDuringPicking,
    pickingRejectionReason: i.pickingRejectionReason,
    isPacked: i.isPacked,
    isBranchChecked: i.isBranchChecked,
  }));
}

export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false });
  const { user } = useAuthStore();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [localItems, setLocalItems] = useState<SupplyRequestDetailItem[]>([]);
  const [suggestions, setSuggestions] = useState<PickingSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [pickingModalOpen, setPickingModalOpen] = useState(false);
  const [packingModalOpen, setPackingModalOpen] = useState(false);

  // Track whether user has made local changes (to avoid blowing them away during poll)
  const hasPendingChanges = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrder = useCallback(async (silent = false) => {
    if (!orderId) {
      if (!silent) setError('Missing order id.');
      return;
    }

    try {
      if (!silent) setError(null);
      const row = await fetchOrderById(Number(orderId));

      setOrder(row);

      // Only overwrite localItems from server if we don't have pending edits
      // (prevents clobbering picks the user hasn't submitted yet)
      if (!hasPendingChanges.current) {
        setLocalItems(mapOrderItemsToViewModel(row.requestedItems));
      }

      // Fetch picking suggestions when in picking stage
      if (
        (row.status === 'Processing' || row.status === 'Picking' || row.status === 'Allocated') &&
        suggestions.length === 0
      ) {
        try {
          const sugs = await getPickingSuggestions(Number(orderId));
          setSuggestions(sugs);
        } catch {
          // suggestions are nice-to-have, don't block the page
        }
      }
    } catch {
      if (!silent) setError('Failed to load order details.');
    }
  }, [orderId]);

  // Initial load
  useEffect(() => {
    void loadOrder(false);
  }, [loadOrder]);

  // Real-time polling: silently re-fetch every POLL_INTERVAL_MS
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      // Don't poll if user is mid-edit
      if (!hasPendingChanges.current) {
        void loadOrder(true);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadOrder]);

  // Mark pending changes when user edits items
  const handleItemsChange = (items: SupplyRequestDetailItem[]) => {
    hasPendingChanges.current = true;
    setLocalItems(items);
  };

  const orderStatus = order?.status || 'Processing';

  const isHq =
    user?.role === 'TenantAdmin' ||
    user?.role === 'HqManager' ||
    user?.role === 'HqStaff';

  const isBranch = user?.role === 'BranchManager' || user?.role === 'BranchOwner';

  // ── Threshold validation for send quantities ──
  // Warn if any item's sendQty would push HQ stock below zero
  const thresholdWarnings = localItems
    .filter((i) => !i.isRejectedDuringPicking && i.isPicked)
    .filter((i) => {
      const sendQty = i.sendQuantity ?? i.approvedQty ?? i.requestedQty ?? 0;
      return (i.hqStock ?? 0) < sendQty;
    });

  const handleWorkflowAction = async (
    action: 'save-pick' | 'save-pack' | 'dispatch',
    dispatchData?: { vehicleId: number; trackingNumber: string; estimatedArrival: string }
  ) => {
    if (!orderId) return;

    try {
      setIsSaving(true);
      setError(null);

      if (action === 'save-pick') {
        // Block if any sendQty exceeds HQ stock
        if (thresholdWarnings.length > 0) {
          setError(
            `Cannot save: ${thresholdWarnings.map((i) => i.name).join(', ')} exceed${thresholdWarnings.length === 1 ? 's' : ''} available HQ stock.`
          );
          setIsSaving(false);
          return;
        }

        const payload = localItems.map((i) => ({
          requestItemId: Number(i.id),
          isPicked: i.isPicked ?? false,
          sendQuantity: i.sendQuantity ?? i.approvedQty ?? i.requestedQty,
          isRejected: i.isRejectedDuringPicking ?? false,
          rejectionReason: i.pickingRejectionReason ?? null,
        }));
        await submitPicking(Number(orderId), payload);
      } else if (action === 'save-pack') {
        const payload = localItems.map((i) => ({
          requestItemId: Number(i.id),
          isPacked: i.isPacked ?? false,
        }));
        await submitPacking(Number(orderId), payload);
      } else if (action === 'dispatch') {
        if (!dispatchData) return;
        const unpackedCount = localItems.filter(
          (i) => !i.isRejectedDuringPicking && !i.isPacked
        ).length;
        if (unpackedCount > 0 && orderStatus !== 'Packed') {
          setError(`Cannot dispatch yet. ${unpackedCount} items are still unpacked.`);
          setIsSaving(false);
          return;
        }
        await submitDispatch(Number(orderId), dispatchData);
      }

      // After a successful save, clear pending-changes flag and reload fresh
      hasPendingChanges.current = false;
      const refreshed = await fetchOrderById(Number(orderId));
      setOrder(refreshed);
      setLocalItems(mapOrderItemsToViewModel(refreshed.requestedItems));

      if (action === 'save-pick') setPickingModalOpen(false);
      if (action === 'save-pack') setPackingModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update order workflow.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId || !cancelReason.trim()) return;
    try {
      setIsSaving(true);
      setError(null);
      await cancelOrder(Number(orderId), { reason: cancelReason });
      setCancelModalOpen(false);
      hasPendingChanges.current = false;
      await loadOrder(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel order.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmArrival = async () => {
    if (!orderId) return;
    try {
      setIsSaving(true);
      setError(null);
      await confirmArrival(Number(orderId));
      hasPendingChanges.current = false;
      await loadOrder(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm arrival.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!orderId) return;
    try {
      setIsSaving(true);
      setError(null);
      const payload = localItems.map((i) => ({
        requestItemId: Number(i.id),
        isChecked: i.isBranchChecked ?? false,
      }));
      await completeTransaction(Number(orderId), payload);
      hasPendingChanges.current = false;
      await loadOrder(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to complete transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Table mode logic ──
  // Processing / Allocated → picking stage (show ✅ ❌ action buttons)
  // Picking → still picking stage (HQ is mid-pick, hasn't confirmed yet)
  // Packing → packing checkboxes
  // Packed and beyond → readonly-packed (inventory already deducted, nothing to edit)
  let tableMode: SRTableMode = 'readonly';
  if (orderStatus === 'Processing' || orderStatus === 'Allocated' || orderStatus === 'Picking') {
    tableMode = 'picking';
  } else if (orderStatus === 'Packing') {
    tableMode = 'packing';
  } else if (orderStatus === 'Packed' || orderStatus === 'Dispatched' || orderStatus === 'InTransit') {
    tableMode = 'readonly-packed';
  } else if (orderStatus === 'Arrived') {
    tableMode = isBranch ? 'branch-check' : 'readonly-packed';
  } else if (orderStatus === 'Completed' || orderStatus === 'Cancelled' || orderStatus === 'Delivered') {
    tableMode = 'readonly-packed';
  }

  if (!order) {
    return (
      <Box sx={{ pb: 3 }}>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Loading order…</Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/orders" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}
              >
                ORD-{order.orderId}
              </Typography>
              <Chip
                label={orderStatus.replace(/([A-Z])/g, ' $1').trim()}
                icon={
                  orderStatus === 'Processing' ? (
                    <AccessTimeFilledRoundedIcon sx={{ fontSize: 14 }} />
                  ) : undefined
                }
                size="small"
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  bgcolor:
                    orderStatus === 'Cancelled'
                      ? 'rgba(185,28,28,0.1)'
                      : orderStatus === 'Completed'
                      ? 'rgba(22,163,74,0.1)'
                      : 'rgba(37,99,235,0.12)',
                  color:
                    orderStatus === 'Cancelled'
                      ? '#B91C1C'
                      : orderStatus === 'Completed'
                      ? '#15803d'
                      : '#2563EB',
                  border: `1px solid ${
                    orderStatus === 'Cancelled'
                      ? 'rgba(185,28,28,0.28)'
                      : orderStatus === 'Completed'
                      ? 'rgba(22,163,74,0.28)'
                      : 'rgba(37,99,235,0.28)'
                  }`,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
              Requested by <strong>{order.branchName}</strong> on{' '}
              {new Date(order.pushedToFulfillmentAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Typography>
          </Box>
        </Box>

        {/* ── Header Actions ── */}
        <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>

          {/* Messages button — always visible */}
          <Button
            variant="outlined"
            startIcon={<QuestionAnswerRoundedIcon />}
            onClick={() => setChatOpen(true)}
            sx={{ bgcolor: 'white' }}
          >
            Messages
          </Button>

          {/* Cancel Order — HQ only, cancellable statuses only */}
          {isHq && ['Processing', 'Picking', 'Packing', 'Packed'].includes(orderStatus) && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelRoundedIcon />}
              onClick={() => setCancelModalOpen(true)}
              sx={{ bgcolor: 'white' }}
            >
              Cancel Order
            </Button>
          )}

          {/* Save Picking — Processing, Allocated, or Picking status */}
          {isHq && (orderStatus === 'Processing' || orderStatus === 'Picking' || orderStatus === 'Allocated') && (
            <Tooltip
              title={
                !localItems.some((i) => i.isPicked || i.isRejectedDuringPicking)
                  ? 'Pick or reject at least one item'
                  : thresholdWarnings.length > 0
                  ? 'Some send quantities exceed HQ stock'
                  : ''
              }
            >
              <span>
                <Button
                  startIcon={<InventoryRoundedIcon />}
                  onClick={() => setPickingModalOpen(true)}
                  disabled={
                    isSaving ||
                    !localItems.some((i) => i.isPicked || i.isRejectedDuringPicking)
                  }
                >
                  {orderStatus === 'Processing' || orderStatus === 'Allocated' ? 'Confirm Picking' : 'Update Picking'}
                </Button>
              </span>
            </Tooltip>
          )}

          {/* Confirm Items Packed — only once picking is confirmed (Packing status) */}
          {isHq && orderStatus === 'Packing' && (
            <Tooltip
              title={
                localItems.filter((i) => !i.isRejectedDuringPicking).some((i) => !i.isPacked)
                  ? 'All non-rejected items must be packed first'
                  : ''
              }
            >
              <span>
                <Button
                  startIcon={<BackpackRoundedIcon />}
                  onClick={() => setPackingModalOpen(true)}
                  disabled={
                    isSaving ||
                    localItems.filter((i) => !i.isRejectedDuringPicking).some((i) => !i.isPacked) ||
                    localItems.length === 0
                  }
                >
                  Confirm Items Packed
                </Button>
              </span>
            </Tooltip>
          )}

          {/* Awaiting branch confirmation — plain chip, NOT a button */}
          {orderStatus === 'Dispatched' && isHq && (
            <Chip
              label="Awaiting Branch Delivery Confirmation"
              variant="outlined"
              icon={<LocalShippingRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                px: 0.5,
                pointerEvents: 'none', // absolutely not a button
              }}
            />
          )}

          {/* Package Arrived — branch only, dispatched status */}
          {orderStatus === 'Dispatched' && isBranch && (
            <Button
              startIcon={<CheckCircleRoundedIcon />}
              onClick={() => void handleConfirmArrival()}
              loading={isSaving}
              disabled={isSaving}
            >
              Package Arrived
            </Button>
          )}

          {/* Complete Transaction — branch only, arrived status, all items checked */}
          {orderStatus === 'Arrived' && isBranch && localItems.every((i) => i.isBranchChecked) && (
            <Button
              startIcon={<CheckCircleRoundedIcon />}
              onClick={() => void handleCompleteTransaction()}
              loading={isSaving}
              disabled={isSaving}
            >
              Complete Transaction
            </Button>
          )}

          {orderStatus === 'Delivered' && (
            <Button
              variant="outlined"
              startIcon={<AssignmentReturnRoundedIcon />}
              sx={{ color: '#B45309', borderColor: '#B45309' }}
            >
              File Return
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Threshold Warning Banner ── */}
      {thresholdWarnings.length > 0 && tableMode === 'picking' && (
        <Alert
          severity="warning"
          icon={<WarningAmberRoundedIcon />}
          sx={{ mb: 2 }}
        >
          <strong>Stock Warning:</strong> The following item(s) have a send quantity that exceeds
          available HQ stock:{' '}
          <strong>{thresholdWarnings.map((i) => `${i.name} (${i.sendQuantity ?? i.approvedQty ?? i.requestedQty} requested, ${i.hqStock} available)`).join(', ')}</strong>.
          Reduce the send quantity before confirming.
        </Alert>
      )}

      {/* ── Stepper ── */}
      <OrderFulfillmentStepper status={orderStatus} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3.5 }}>
          {order && <OrderDetailsPanel order={order} />}
        </Grid>

        <Grid size={{ xs: 12, md: 8.5 }}>
          {/* Dispatch Assignment Card (only when Packed) */}
          {orderStatus === 'Packed' && isHq && (
            <Box sx={{ mt: 2 }}>
              <DispatchAssignmentCard
                isLoading={isSaving}
                onDispatch={(data) => void handleWorkflowAction('dispatch', data)}
              />
            </Box>
          )}

          {/* Item Reconciliation Table */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>
                Item Reconciliation
              </Typography>
              {tableMode !== 'readonly' && tableMode !== 'readonly-packed' && (
                <Typography variant="caption" color="text.secondary">
                  {
                    localItems.filter((i) =>
                      tableMode === 'picking'
                        ? i.isPicked
                        : tableMode === 'packing'
                        ? i.isPacked
                        : i.isBranchChecked
                    ).length
                  }{' '}
                  /{' '}
                  {localItems.filter((i) => !i.isRejectedDuringPicking).length} Processed
                </Typography>
              )}
            </Box>
            <SRItemTable
              items={localItems}
              mode={tableMode}
              suggestions={suggestions}
              onItemsChange={
                // Only allow edits during active HQ stages or branch-check
                tableMode === 'picking' || tableMode === 'packing' || tableMode === 'branch-check'
                  ? handleItemsChange
                  : undefined
              }
            />
          </Box>
        </Grid>
      </Grid>

      {/* ── Cancel Order Modal ── */}
      <Dialog open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to cancel this order? All allocated inventory will be returned to HQ
            stock. The branch will be notified.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Cancellation Reason (Required)"
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelModalOpen(false)} color="inherit" disabled={isSaving}>
            Close
          </Button>
          <Button
            onClick={() => void handleCancelOrder()}
            color="error"
            variant="contained"
            disabled={!cancelReason.trim() || isSaving}
            loading={isSaving}
          >
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Picking Confirm Modal ── */}
      <Dialog open={pickingModalOpen} onClose={() => setPickingModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Picking Progress</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You have marked <strong>{localItems.filter((i) => i.isPicked).length}</strong> item(s) as
            picked and <strong>{localItems.filter((i) => i.isRejectedDuringPicking).length}</strong>{' '}
            item(s) as rejected.
          </Typography>
          {localItems.filter((i) => i.isRejectedDuringPicking).length > 0 && (
            <Box sx={{ bgcolor: 'rgba(244,67,54,0.05)', p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="body2" fontWeight={600} color="error.main" sx={{ mb: 1 }}>
                Rejected Items:
              </Typography>
              {localItems
                .filter((i) => i.isRejectedDuringPicking)
                .map((i) => (
                  <Typography key={i.id} variant="caption" display="block" color="text.secondary">
                    • {i.name} — {i.pickingRejectionReason || 'No reason provided'}
                  </Typography>
                ))}
            </Box>
          )}
          {thresholdWarnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {thresholdWarnings.map((i) => i.name).join(', ')} exceed{thresholdWarnings.length === 1 ? 's' : ''}{' '}
              available HQ stock. Please reduce send quantities before confirming.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPickingModalOpen(false)} color="inherit" disabled={isSaving}>
            Close
          </Button>
          <Button
            onClick={() => void handleWorkflowAction('save-pick')}
            variant="contained"
            loading={isSaving}
            disabled={thresholdWarnings.length > 0}
          >
            Confirm &amp; Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Packing Confirm Modal ── */}
      <Dialog open={packingModalOpen} onClose={() => setPackingModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Packing Complete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You have marked all{' '}
            <strong>{localItems.filter((i) => !i.isRejectedDuringPicking && i.isPacked).length}</strong>{' '}
            valid item(s) as packed and ready for dispatch.
          </Typography>
          {localItems.filter((i) => i.isRejectedDuringPicking).length > 0 && (
            <Box sx={{ bgcolor: 'rgba(244,67,54,0.05)', p: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} color="error.main" sx={{ mb: 1 }}>
                The following items were rejected during picking and will NOT be dispatched:
              </Typography>
              {localItems
                .filter((i) => i.isRejectedDuringPicking)
                .map((i) => (
                  <Typography key={i.id} variant="caption" display="block" color="text.secondary">
                    • {i.name} — {i.pickingRejectionReason || 'No reason provided'}
                  </Typography>
                ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPackingModalOpen(false)} color="inherit" disabled={isSaving}>
            Close
          </Button>
          <Button
            onClick={() => void handleWorkflowAction('save-pack')}
            variant="contained"
            loading={isSaving}
          >
            Confirm Packed
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Order Messages Modal ── */}
      <OrderMessagesModal open={chatOpen} onClose={() => setChatOpen(false)} orderId={Number(orderId)} />
    </Box>
  );
}