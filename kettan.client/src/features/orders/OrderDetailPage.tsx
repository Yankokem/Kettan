import { Box, Typography, Chip, Grid, Tooltip } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import BackpackRoundedIcon from '@mui/icons-material/BackpackRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

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
  type OrderDetail,
} from '../branch-operations/api';
import SRItemTable, { type SRTableMode } from '../supply-requests/components/SRItemTable';
import type { SupplyRequestDetailItem } from '../supply-requests/components/SupplyRequestDetail.types';
import { OrderMessagesModal } from './components/OrderMessagesModal';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';




export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false });
  const { user } = useAuthStore();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [localItems, setLocalItems] = useState<SupplyRequestDetailItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [pickingModalOpen, setPickingModalOpen] = useState(false);
  const [packingModalOpen, setPackingModalOpen] = useState(false);

  const loadOrder = async () => {
    if (!orderId) {
      setError('Missing order id.');
      return;
    }

    try {
      setError(null);
      const row = await fetchOrderById(Number(orderId));
      setOrder(row);
      
      // Map OrderDetail items to SupplyRequestDetailItem for SRItemTable
      const items: SupplyRequestDetailItem[] = (row.requestedItems || []).map(i => ({
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
        isBranchChecked: i.isBranchChecked
      }));
      console.log('[DEBUG] Loaded items:', items);
      setLocalItems(items);
    } catch {
      setError('Failed to load order details.');
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  const orderStatus = order?.status || 'Processing';


  const handleWorkflowAction = async (action: 'save-pick' | 'save-pack' | 'dispatch', dispatchData?: { vehicleId: number; trackingNumber: string; estimatedArrival: string }) => {
    if (!orderId) return;

    try {
      setIsSaving(true);
      setError(null);

      if (action === 'save-pick') {
        const payload = localItems.map(i => ({
          requestItemId: Number(i.id),
          isPicked: i.isPicked ?? false,
          sendQuantity: i.sendQuantity ?? i.approvedQty ?? i.requestedQty,
          isRejected: i.isRejectedDuringPicking ?? false,
          rejectionReason: i.pickingRejectionReason ?? null
        }));
        console.log('[DEBUG] Submitting picking:', payload);
        await submitPicking(Number(orderId), payload);
      } else if (action === 'save-pack') {
        const payload = localItems.map(i => ({
          requestItemId: Number(i.id),
          isPacked: i.isPacked ?? false
        }));
        console.log('[DEBUG] Submitting packing:', payload);
        await submitPacking(Number(orderId), payload);
      } else if (action === 'dispatch') {
        if (!dispatchData) return;
        
        // Final sanity check before dispatching
        const unpackedCount = localItems.filter(i => !i.isRejectedDuringPicking && !i.isPacked).length;
        if (unpackedCount > 0 && orderStatus !== 'Packed') {
           setError(`Cannot dispatch yet. ${unpackedCount} items are still unpacked.`);
           setIsSaving(false);
           return;
        }

        console.log('[DEBUG] Submitting dispatch:', dispatchData);
        await submitDispatch(Number(orderId), dispatchData);
      }

      const refreshed = await fetchOrderById(Number(orderId));
      setOrder(refreshed);
      
      const items: SupplyRequestDetailItem[] = (refreshed.requestedItems || []).map(i => ({
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
          isBranchChecked: i.isBranchChecked
      }));
      setLocalItems(items);
      
      if (action === 'save-pick') setPickingModalOpen(false);
      if (action === 'save-pack') setPackingModalOpen(false);

    } catch (err: any) {
      setError(err.message || 'Failed to update order workflow.');
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
      await loadOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order.');
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
      await loadOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm arrival.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!orderId) return;

    try {
      setIsSaving(true);
      setError(null);
      const payload = localItems.map(i => ({
        requestItemId: Number(i.id),
        isChecked: i.isBranchChecked ?? false
      }));
      await completeTransaction(Number(orderId), payload);
      await loadOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to complete transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  let tableMode: SRTableMode = 'readonly';
  if (orderStatus === 'Processing' || orderStatus === 'Allocated') tableMode = 'picking';
  else if (orderStatus === 'Picking' || orderStatus === 'Packing') tableMode = 'packing';
  else if (orderStatus === 'Packed' || orderStatus === 'Dispatched') tableMode = 'packing'; // keep them checked
  else if (orderStatus === 'Arrived') tableMode = 'branch-check';

  if (error) {
    return (
      <Box sx={{ pb: 3 }}>
        <Typography sx={{ color: 'error.main', fontSize: 14 }}>{error}</Typography>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ pb: 3 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Loading order…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/orders" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
                ORD-{order.orderId}
              </Typography>
              <Chip
                label={orderStatus.replace(/([A-Z])/g, ' $1').trim()}
                icon={orderStatus === 'Processing' ? <AccessTimeFilledRoundedIcon sx={{ fontSize: 14 }} /> : undefined}
                size="small"
                sx={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  bgcolor: orderStatus === 'Returned' ? 'rgba(185,28,28,0.1)' : 'rgba(37,99,235,0.12)', 
                  color: orderStatus === 'Returned' ? '#B91C1C' : '#2563EB', 
                  border: `1px solid ${orderStatus === 'Returned' ? 'rgba(185,28,28,0.28)' : 'rgba(37,99,235,0.28)'}` 
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
              Requested by <strong>{order.branchName}</strong> on {new Date(order.pushedToFulfillmentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          </Box>
        </Box>
        {/* Header Actions (Dynamic based on status and role) */}
        <Box sx={{ display: 'flex', gap: 1.5, pt: 0.5, alignItems: 'center' }}>
          
          {/* Chat Button */}
          <Button
            variant="outlined"
            startIcon={<QuestionAnswerRoundedIcon />}
            onClick={() => setChatOpen(true)}
            sx={{ bgcolor: 'white' }}
          >
            Messages
          </Button>

          {/* Cancel Order (HQ only, up to Packed) */}
          {['Processing', 'Picking', 'Packing', 'Packed'].includes(orderStatus) && (
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

          {(orderStatus === 'Processing' || orderStatus === 'Picking' || orderStatus === 'Allocated') && (
            <Tooltip title={!localItems.some(i => i.isPicked || i.isRejectedDuringPicking) ? "Pick or reject at least one item to save progress" : ""}>
              <span>
                <Button 
                  startIcon={<InventoryRoundedIcon />} 
                  onClick={() => setPickingModalOpen(true)} 
                  disabled={isSaving || !localItems.some(i => i.isPicked || i.isRejectedDuringPicking)}
                >
                  {orderStatus === 'Processing' ? 'Confirm Picking' : 'Update Picking'}
                </Button>
              </span>
            </Tooltip>
          )}

          {(orderStatus === 'Picking' || orderStatus === 'Packing' || orderStatus === 'Allocated') && (
            <Tooltip title={localItems.filter(i => !i.isRejectedDuringPicking).some(i => !i.isPacked) ? "All non-rejected items must be packed before moving to Packed status" : ""}>
              <span>
                <Button 
                  startIcon={<BackpackRoundedIcon />} 
                  onClick={() => setPackingModalOpen(true)} 
                  disabled={isSaving || localItems.filter(i => !i.isRejectedDuringPicking).some(i => !i.isPacked) || localItems.length === 0}
                >
                  Confirm Items Packed
                </Button>
              </span>
            </Tooltip>
          )}

          {/* Removed redundant top-level dispatch button here as it's now handled by DispatchAssignmentCard */}

          {/* If dispatched, branch confirms delivery, HQ cannot override */}
          {orderStatus === 'Dispatched' && user?.role !== 'BranchManager' && user?.role !== 'BranchOwner' && (
            <Chip label="Awaiting Branch Delivery Confirmation" variant="outlined" sx={{ fontWeight: 600, color: 'text.secondary' }} />
          )}

          {/* Package Arrived button for branch users when status is Dispatched */}
          {orderStatus === 'Dispatched' && (user?.role === 'BranchManager' || user?.role === 'BranchOwner') && (
            <Button 
              startIcon={<CheckCircleRoundedIcon />} 
              onClick={() => void handleConfirmArrival()} 
              loading={isSaving}
              disabled={isSaving}
            >
              Package Arrived
            </Button>
          )}

          {/* Complete Transaction button for branch users when status is Arrived and all items checked */}
          {orderStatus === 'Arrived' && (user?.role === 'BranchManager' || user?.role === 'BranchOwner') && localItems.every(i => i.isBranchChecked) && (
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
            <Button variant="outlined" startIcon={<AssignmentReturnRoundedIcon />} sx={{ color: '#B45309', borderColor: '#B45309' }}>
              File Return
            </Button>
          )}

        </Box>
      </Box>

      {/* Stepper Visual */}
      <OrderFulfillmentStepper status={orderStatus} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3.5 }}>
          {order && <OrderDetailsPanel order={order} />}
        </Grid>

        <Grid size={{ xs: 12, md: 8.5 }}>
          {orderStatus === 'Packed' && (
            <Box sx={{ mt: 2 }}>
              {localItems.some(i => !i.isRejectedDuringPicking && !i.isPacked) && (
                <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                  Warning: Some items appear unpacked in the list above. Please check them before assigning logistics.
                </Typography>
              )}
              <DispatchAssignmentCard 
                isLoading={isSaving}
                onDispatch={(data) => void handleWorkflowAction('dispatch', data)} 
              />
            </Box>
          )}
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>Item Reconciliation</Typography>
              {tableMode !== 'readonly' && (
                <Typography variant="caption" color="text.secondary">
                  {localItems.filter(i => (tableMode === 'picking' ? i.isPicked : tableMode === 'packing' ? i.isPacked : i.isBranchChecked)).length} / {localItems.filter(i => !i.isRejectedDuringPicking).length} Processed
                </Typography>
              )}
            </Box>
            <SRItemTable 
              items={localItems} 
              mode={tableMode} 
              onItemsChange={setLocalItems}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Cancel Order Modal */}
      <Dialog open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to cancel this order? All allocated inventory will be returned to HQ stock.
            The branch will be notified.
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
          <Button onClick={() => setCancelModalOpen(false)} color="inherit" disabled={isSaving}>Close</Button>
          <Button onClick={handleCancelOrder} color="error" variant="contained" disabled={!cancelReason.trim() || isSaving} loading={isSaving}>Confirm Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Picking Confirm Modal */}
      <Dialog open={pickingModalOpen} onClose={() => setPickingModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Picking Progress</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You have marked <strong>{localItems.filter(i => i.isPicked).length}</strong> item(s) as picked, and <strong>{localItems.filter(i => i.isRejectedDuringPicking).length}</strong> item(s) as rejected.
          </Typography>
          {localItems.filter(i => i.isRejectedDuringPicking).length > 0 && (
            <Box sx={{ bgcolor: 'rgba(244, 67, 54, 0.05)', p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="body2" fontWeight={600} color="error.main" sx={{ mb: 1 }}>Rejected Items:</Typography>
              {localItems.filter(i => i.isRejectedDuringPicking).map(i => (
                <Typography key={i.id} variant="caption" display="block" color="text.secondary">• {i.name} ({i.pickingRejectionReason})</Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPickingModalOpen(false)} color="inherit" disabled={isSaving}>Close</Button>
          <Button onClick={() => void handleWorkflowAction('save-pick')} variant="contained" loading={isSaving}>Confirm & Save</Button>
        </DialogActions>
      </Dialog>

      {/* Packing Confirm Modal */}
      <Dialog open={packingModalOpen} onClose={() => setPackingModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Packing Complete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You have marked all <strong>{localItems.filter(i => i.isPacked).length}</strong> valid item(s) as packed and ready for dispatch.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPackingModalOpen(false)} color="inherit" disabled={isSaving}>Close</Button>
          <Button onClick={() => void handleWorkflowAction('save-pack')} variant="contained" loading={isSaving}>Confirm Packed</Button>
        </DialogActions>
      </Dialog>

      {/* Order Messages Modal */}
      <OrderMessagesModal open={chatOpen} onClose={() => setChatOpen(false)} orderId={Number(orderId)} />
    </Box>
  );
}


