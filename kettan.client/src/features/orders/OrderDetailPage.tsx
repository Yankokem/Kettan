import { Box, Typography, Chip, Grid } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import BackpackRoundedIcon from '@mui/icons-material/BackpackRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';

import { useAuthStore } from '../../store/useAuthStore';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';

import { OrderFulfillmentStepper } from './components/OrderFulfillmentStepper';
import { OrderDetailsPanel } from './components/OrderDetailsPanel';
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

  useEffect(() => {
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
          id: String(i.itemId),
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
      } catch {
        setError('Failed to load order details.');
      }
    };

    void loadOrder();
  }, [orderId]);

  const orderStatus = order?.status || 'Processing';


  const handleWorkflowAction = async (action: 'save-pick' | 'save-pack' | 'dispatch') => {
    if (!orderId) return;

    try {
      setIsSaving(true);
      setError(null);

      if (action === 'save-pick') {
        await submitPicking(Number(orderId), localItems.map(i => ({
          requestItemId: Number(i.id),
          isPicked: i.isPicked ?? false,
          sendQuantity: i.sendQuantity ?? i.approvedQty ?? i.requestedQty,
          isRejected: i.isRejectedDuringPicking ?? false,
          rejectionReason: i.pickingRejectionReason ?? null
        })));
      } else if (action === 'save-pack') {
        await submitPacking(Number(orderId), localItems.map(i => ({
          requestItemId: Number(i.id),
          isPacked: i.isPacked ?? false
        })));
      } else if (action === 'dispatch') {
        await submitDispatch(Number(orderId));
      }

      const refreshed = await fetchOrderById(Number(orderId));
      setOrder(refreshed);
      
      const items: SupplyRequestDetailItem[] = (refreshed.requestedItems || []).map(i => ({
          id: String(i.itemId),
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
  if (orderStatus === 'Processing' || orderStatus === 'Picking' || orderStatus === 'Allocated') tableMode = 'picking';
  else if (orderStatus === 'Packed') tableMode = 'packing';
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
          
          {(orderStatus === 'Processing' || orderStatus === 'Picking') && (
            <Button 
              startIcon={<InventoryRoundedIcon />} 
              onClick={() => void handleWorkflowAction('save-pick')} 
              loading={isSaving}
              disabled={isSaving || !localItems.some(i => i.isPicked || i.isRejectedDuringPicking)}
            >
              {orderStatus === 'Processing' ? 'Start Picking' : 'Update Picking'}
            </Button>
          )}

          {orderStatus === 'Picking' && (
            <Button 
              startIcon={<BackpackRoundedIcon />} 
              onClick={() => void handleWorkflowAction('save-pack')} 
              loading={isSaving}
              disabled={isSaving || !localItems.filter(i => !i.isRejectedDuringPicking).every(i => i.isPicked)}
            >
              Confirm Items Packed
            </Button>
          )}

          {orderStatus === 'Packed' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button 
                startIcon={<LocalShippingRoundedIcon />} 
                onClick={() => void handleWorkflowAction('dispatch')} 
                loading={isSaving}
                disabled={isSaving || localItems.filter(i => !i.isRejectedDuringPicking).some(i => !i.isPacked)}
              >
                Dispatch Order
              </Button>
            </Box>
          )}

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
          <OrderDetailsPanel orderId={`ORD-${order.orderId}`} />
        </Grid>

        <Grid size={{ xs: 12, md: 8.5 }}>
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


