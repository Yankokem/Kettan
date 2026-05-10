import { Box, Typography, Chip, Tooltip, Alert } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import BackpackRoundedIcon from '@mui/icons-material/BackpackRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import WhereToVoteRoundedIcon from '@mui/icons-material/WhereToVoteRounded';
import { WorkflowStatusBanner } from '../shared/components/WorkflowStatusBanner';

import { useAuthStore } from '../../store/useAuthStore';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';

import { OrderFulfillmentStepper } from './components/OrderFulfillmentStepper';
import { OrderDetailsPanel } from './components/OrderDetailsPanel';
import { DispatchDialog } from './components/DispatchDialog';
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
import { SharedFloatingChat } from '../shared/components/SharedFloatingChat';
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
    branchStock: i.branchStock ?? 0,
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
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  // Track whether user has made local changes (to avoid blowing them away during poll)
  const isHq = ['TenantAdmin', 'HqManager', 'HqStaff'].includes(user?.role || '');
  const isBranch = ['BranchManager', 'BranchOwner', 'BranchStaff'].includes(user?.role || '');
  
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

      // Fetch picking suggestions when in picking stage (HQ only)
      if (
        isHq &&
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
      if (action === 'dispatch') setDispatchModalOpen(false);
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
    setSummaryModalOpen(true);
  };

  const handleConfirmAndComplete = async () => {
    try {
      setIsSaving(true);
      setError(null);
      const payload = localItems.map((i) => ({
        requestItemId: Number(i.id),
        isChecked: i.isBranchChecked ?? false,
      }));
      await completeTransaction(Number(orderId), payload);
      hasPendingChanges.current = false;
      
      setSummaryModalOpen(false);
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
  
  if (isHq) {
    if (orderStatus === 'Processing' || orderStatus === 'Allocated' || orderStatus === 'Picking') {
      tableMode = 'picking';
    } else if (orderStatus === 'Packing') {
      tableMode = 'packing';
    } else if (orderStatus === 'Packed' || orderStatus === 'Dispatched' || orderStatus === 'InTransit' || orderStatus === 'Arrived') {
      tableMode = 'readonly-packed';
    } else if (orderStatus === 'Completed' || orderStatus === 'Cancelled' || orderStatus === 'Delivered') {
      tableMode = 'readonly-packed';
    }
  } else if (isBranch) {
    if (orderStatus === 'Arrived') {
      tableMode = 'branch-check';
    } else {
      // Branch side is READ-ONLY for all preparation and transit phases
      tableMode = 'readonly-packed';
    }
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

      {/* ── Dispatch Order Modal ── */}
      <DispatchDialog 
        open={dispatchModalOpen}
        isSaving={isSaving}
        onClose={() => setDispatchModalOpen(false)}
        onConfirm={(data) => void handleWorkflowAction('dispatch', data)}
      />

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BackButton to="/orders" size="small" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Typography
                sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}
              >
                #{order.orderId}
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
                  fontSize: 11,
                  fontWeight: 700,
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
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.2 }}>
              {order.isHqInitiated
                ? <>HQ-initiated supply dispatch to <strong>{order.branchName}</strong>. Reason: {order.dispatchReason || 'Manual'}.</>
                : <>Workflow management for order fulfillment, picking, and dispatch to <strong>{order.branchName}</strong>.</>}
            </Typography>
          </Box>
        </Box>

        {/* ── Header Actions ── */}
        <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Cancel Order — HQ only, cancellable statuses only */}
          {isHq && ['Processing', 'Picking', 'Packing', 'Packed'].includes(orderStatus) && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelRoundedIcon />}
              onClick={() => setCancelModalOpen(true)}
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
                  color="success"
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
                  color="success"
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

          {/* Dispatch Order — only once items are confirmed packed (Packed status) */}
          {isHq && orderStatus === 'Packed' && (
            <Button
              startIcon={<LocalShippingRoundedIcon />}
              color="success"
              onClick={() => setDispatchModalOpen(true)}
              disabled={isSaving}
            >
              Prepare Dispatch
            </Button>
          )}



          {/* Package Arrived — branch only, dispatched status */}
          {orderStatus === 'Dispatched' && isBranch && (
            <Button
              startIcon={<CheckCircleRoundedIcon />}
              color="success"
              onClick={() => void handleConfirmArrival()}
              loading={isSaving}
              disabled={isSaving}
            >
              Confirm Arrival
            </Button>
          )}

          {/* Complete Transaction — branch only, arrived status */}
          {orderStatus === 'Arrived' && isBranch && (
            <Button
              variant="contained"
              startIcon={<FactCheckRoundedIcon />}
              color="success"
              onClick={() => void handleCompleteTransaction()}
              loading={isSaving}
              disabled={isSaving}
            >
              Complete Shipment
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

      {/* ── Status Banners (Passive Wait States) ── */}
      
      {/* 1. Preparation Phase (Branch Side) */}
      {['Processing', 'Picking', 'Packing', 'Packed'].includes(orderStatus) && isBranch && order.isHqInitiated && (
        <WorkflowStatusBanner
          icon={<AccessTimeFilledRoundedIcon sx={{ fontSize: 22 }} />}
          title="Shipment in Progress"
          description={
            <>
              HQ is currently preparing this dispatch for your branch. 
              We'll notify you once the items are out for delivery.
            </>
          }
        />
      )}

      {/* 2. In Transit (Both) */}
      {orderStatus === 'Dispatched' && (
        <WorkflowStatusBanner
          icon={<LocalShippingRoundedIcon sx={{ fontSize: 22 }} />}
          title="Shipment in Transit"
          description={
            <>
              The package has been dispatched and is currently on its way to <strong>{order.branchName}</strong>. 
              {isBranch ? "Please confirm once the delivery has arrived at your location." : "We are awaiting confirmation from the branch upon arrival."}
            </>
          }
        />
      )}

      {/* 3. Arrived (Both) */}
      {orderStatus === 'Arrived' && (
        <WorkflowStatusBanner
          icon={<WhereToVoteRoundedIcon sx={{ fontSize: 22, color: '#2563EB' }} />}
          title="Shipment Arrived"
          description={
            <>
              The shipment has arrived at the branch. 
              {isBranch 
                ? "Please reconcile the items in the list below. Once all items are checked, you can complete the transaction." 
                : "The branch is currently checking and reconciling the received items."}
            </>
          }
        />
      )}

      {/* 4. Completed (Both) */}
      {orderStatus === 'Completed' && (
        <WorkflowStatusBanner
          icon={<CheckCircleRoundedIcon sx={{ fontSize: 22, color: 'success.main' }} />}
          title="Shipment Received & Completed"
          description="The items have been successfully delivered and verified by the branch. The inventory has been updated."
        />
      )}

      {orderStatus === 'Cancelled' && (
        <WorkflowStatusBanner
          variant="error"
          icon={<CancelRoundedIcon sx={{ fontSize: 22 }} />}
          title="Order Cancelled"
          description="This order has been cancelled. Any allocated inventory has been returned to HQ stock."
        />
      )}

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
      <OrderFulfillmentStepper status={orderStatus} variant={order.isHqInitiated ? 'hq-dispatch' : 'default'} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '400px 1fr' }, gap: 3, alignItems: 'start' }}>
        <Box>
          {order && <OrderDetailsPanel order={order} />}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Item Reconciliation Table */}
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
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <FactCheckRoundedIcon sx={{ color: '#6B4C2A', fontSize: 18 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              }
            />
        </Box>
      </Box>

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
      <SharedFloatingChat contextType="order" id={Number(orderId)} open={chatOpen} onOpenChange={setChatOpen} />

      {/* ── Completion Summary Modal ── */}
      <Dialog 
        open={summaryModalOpen} 
        onClose={() => !isSaving && setSummaryModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '14px',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #FAF5EF 0%, #F5EFE6 100%)',
          borderBottom: '1px solid',
          borderColor: 'rgba(140,107,67,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <FactCheckRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#6B4C2A', letterSpacing: '-0.01em' }}>
            Complete Transaction
          </Typography>
        </Box>

        <DialogContent sx={{ px: 3, pt: 3 }}>
          <Box sx={{ 
            bgcolor: '#FAF5EF', 
            p: 2.5, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'rgba(140,107,67,0.12)',
            mb: 3
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#8C6B43', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
              Request Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 1.2 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Request ID</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800, textAlign: 'right', color: 'text.primary' }}>
                #{order?.requestId || orderId}
              </Typography>

              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Date Arrived</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, textAlign: 'right', color: 'text.primary' }}>
                {order?.arrivedAt ? new Date(order.arrivedAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                }) : '-'}
              </Typography>

              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Confirmed By</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, textAlign: 'right', color: 'text.primary' }}>{order?.arrivedConfirmedByName || '-'}</Typography>
            </Box>
          </Box>

          {/* Items Received Table */}
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, px: 0.5 }}>
            Items Received ({localItems.filter(i => i.isBranchChecked).length})
          </Typography>

          {localItems.filter(i => i.isBranchChecked).length === 0 ? (
            <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
              No items were checked. This shipment will be marked as not received.
            </Alert>
          ) : (
            <Box sx={{ mb: 4, px: 0.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>ITEM</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>CURRENT</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>SENT</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>NEW QTY</Typography>
              </Box>
              {localItems.filter(i => i.isBranchChecked).map(item => {
                const sent = item.sendQuantity ?? item.approvedQty ?? item.requestedQty;
                const current = item.branchStock ?? 0;
                const newQty = current + sent;
                
                return (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
                      py: 1.5,
                      borderBottom: '1px dashed',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>{item.name}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 400 }}>{item.sku}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, textAlign: 'center', color: 'text.secondary', fontWeight: 500 }}>{current}</Typography>
                    <Typography sx={{ fontSize: 13, textAlign: 'center', fontWeight: 600, color: 'success.main' }}>+{sent}</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, textAlign: 'right', color: '#6B4C2A' }}>{newQty}</Typography>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Items Not Checked (Marked Lost) */}
          {localItems.filter(i => !i.isBranchChecked && !i.isRejectedDuringPicking).length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'rgba(217,119,6,0.04)', borderRadius: 2, border: '1px dashed rgba(217,119,6,0.3)', mb: 2 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'warning.main', textTransform: 'uppercase', mb: 1 }}>
                Not Checked — Marked Lost ({localItems.filter(i => !i.isBranchChecked && !i.isRejectedDuringPicking).length})
              </Typography>
              {localItems.filter(i => !i.isBranchChecked && !i.isRejectedDuringPicking).map(item => (
                <Typography key={item.id} sx={{ fontSize: 12, color: 'warning.dark', opacity: 0.8 }}>
                  • {item.name} ({item.sendQuantity ?? item.approvedQty ?? item.requestedQty} units)
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1.5 }}>
          <Button variant="outlined" onClick={() => setSummaryModalOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            color="success"
            onClick={() => void handleConfirmAndComplete()} 
            loading={isSaving}
            sx={{ px: 4 }}
          >
            Confirm &amp; Complete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}