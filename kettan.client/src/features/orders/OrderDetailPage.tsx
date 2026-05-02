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
  type OrderDetail,
} from '../branch-operations/api';
import SRItemTable, { type SRTableMode } from '../supply-requests/components/SRItemTable';
import type { SupplyRequestDetailItem } from '../supply-requests/components/SupplyRequestDetail.types';




export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false });
  const { user } = useAuthStore();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [localItems, setLocalItems] = useState<SupplyRequestDetailItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    } catch (err: any) {
      setError(err.message || 'Failed to update order workflow.');
    } finally {
      setIsSaving(false);
    }
  };



  let tableMode: SRTableMode = 'readonly';
  if (orderStatus === 'Processing' || orderStatus === 'Allocated') tableMode = 'picking';
  else if (orderStatus === 'Picking' || orderStatus === 'Packing') tableMode = 'packing';
  // Packed, Dispatched, Arrived, Completed are all read-only for HQ

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
          
          {(orderStatus === 'Processing' || orderStatus === 'Picking' || orderStatus === 'Allocated') && (
            <Tooltip title={!localItems.some(i => i.isPicked || i.isRejectedDuringPicking) ? "Pick or reject at least one item to save progress" : ""}>
              <span>
                <Button 
                  startIcon={<InventoryRoundedIcon />} 
                  onClick={() => void handleWorkflowAction('save-pick')} 
                  loading={isSaving}
                  disabled={isSaving || !localItems.some(i => i.isPicked || i.isRejectedDuringPicking)}
                >
                  {orderStatus === 'Processing' ? 'Start Picking' : 'Update Picking'}
                </Button>
              </span>
            </Tooltip>
          )}

          {(orderStatus === 'Picking' || orderStatus === 'Packing' || orderStatus === 'Allocated') && (
            <Tooltip title={localItems.filter(i => !i.isRejectedDuringPicking).some(i => !i.isPacked) ? "All non-rejected items must be packed before moving to Packed status" : ""}>
              <span>
                <Button 
                  startIcon={<BackpackRoundedIcon />} 
                  onClick={() => void handleWorkflowAction('save-pack')} 
                  loading={isSaving}
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


    </Box>
  );
}


