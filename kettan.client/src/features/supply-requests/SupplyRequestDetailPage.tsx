import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { useNavigate, useParams } from '@tanstack/react-router';
import { 
  fetchSupplyRequestById, 
  submitSupplyRequest,
  approveSupplyRequest,
  rejectSupplyRequest,
  cancelSupplyRequest,
  getPickingSuggestions,
  type PickingSuggestion,
  type SupplyRequest as ApiSupplyRequest
} from '../branch-operations/api';
import { useAuthStore } from '../../store/useAuthStore';
import { OrderFulfillmentStepper } from '../orders/components/OrderFulfillmentStepper';
import { SupplyRequestDetailHeader } from './components/SupplyRequestDetailHeader';
import { SupplyRequestDetailsPanel } from './components/SupplyRequestDetailsPanel';
import SRItemTable, { type SRTableMode } from './components/SRItemTable';
import { SupplyRequestStatusTimeline } from './components/SupplyRequestStatusTimeline';
import type { SupplyRequestDetailViewModel, SupplyRequestDetailItem } from './components/SupplyRequestDetail.types';

function toDetailViewModel(request: ApiSupplyRequest): SupplyRequestDetailViewModel {
  const requestNumber = request.referenceNumber || `SR-${String(request.requestId).padStart(5, '0')}`;
  
  return {
    requestNumber,
    status: (request.orderStatus || request.status) as SupplyRequestDetailViewModel['status'],
    branchName: request.branchName,
    requestedByName: request.requestedByName,
    requestedByRole: 'Branch Manager', // In a real app, this might come from the DTO
    submittedAtLabel: new Date(request.createdAt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    }),
    priority: (request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1)) as SupplyRequestDetailViewModel['priority'],
    requestType: request.requestType,
    dispatchWindow: request.dispatchWindow,
    notes: request.notes ?? '',
    linkedOrderId: request.orderId?.toString(),
    items: request.items.map((item) => ({
      id: String(item.requestItemId),
      name: item.itemName,
      sku: item.itemSku,
      requestedQty: Number(item.quantityRequested),
      approvedQty: item.quantityApproved != null ? Number(item.quantityApproved) : null,
      hqStock: item.hqStock ?? 0,
      availability: (item.hqStock ?? 0) > 0 ? 'Available' : 'Out of Stock',
      
      isPicked: item.isPicked,
      sendQuantity: item.sendQuantity,
      isRejectedDuringPicking: item.isRejectedDuringPicking,
      pickingRejectionReason: item.pickingRejectionReason,
      isPacked: item.isPacked,
      isBranchChecked: item.isBranchChecked,
    })),
    timeline: [
      {
        status: request.status as SupplyRequestDetailViewModel['status'],
        timestamp: request.updatedAt,
        actor: request.requestedByName,
        remarks: request.notes ?? undefined,
      },
    ],
    arrivedAt: request.arrivedAt,
    arrivedConfirmedByName: request.arrivedConfirmedByName,
    completedAt: request.completedAt,
    completedByName: request.completedByName,
  };
}

export function SupplyRequestDetailPage() {
  const { requestId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [request, setRequest] = useState<SupplyRequestDetailViewModel | null>(null);
  const [localItems, setLocalItems] = useState<SupplyRequestDetailItem[]>([]);
  const [suggestions, setSuggestions] = useState<PickingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setError(null);
      const row = await fetchSupplyRequestById(Number(requestId));
      const vm = toDetailViewModel(row);
      setRequest(vm);
      setLocalItems(vm.items);

      // If in picking stage, fetch suggestions
      if (vm.status === 'Picking' && vm.linkedOrderId) {
        const sugs = await getPickingSuggestions(Number(vm.linkedOrderId));
        setSuggestions(sugs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Actions
  const handleAction = async (action: () => Promise<any>) => {
    try {
      setActionLoading(true);
      setError(null);
      await action();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const onSubmitDraft = () => handleAction(() => submitSupplyRequest(Number(requestId), request?.notes));
  
  const onApprove = () => handleAction(() => approveSupplyRequest(Number(requestId), {
    notes: request?.notes,
    items: localItems.map(i => ({ requestItemId: Number(i.id), quantityApproved: i.approvedQty ?? i.requestedQty }))
  }));

  const onReject = () => handleAction(() => rejectSupplyRequest(Number(requestId), { reason: 'Rejected by HQ' }));

  const onCancel = () => handleAction(() => cancelSupplyRequest(Number(requestId), { reason: 'Cancelled by branch' }));

  const handleFileReturn = () => navigate({ to: '/returns/new' });

  if (loading && !request) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} thickness={5} sx={{ color: '#C9A84C' }} />
      </Box>
    );
  }

  if (error && !request) {
    return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
  }

  if (!request) return null;

  const showStepper = request.status !== 'Draft' && request.status !== 'AutoDrafted' && request.status !== 'Rejected';
  const isInProgress = ['Approved', 'Processing', 'Picking', 'Packed', 'Dispatched', 'InTransit'].includes(request.status);
  
  // Determine table mode
  let tableMode: SRTableMode = 'readonly';



  return (
    <Box sx={{ pb: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      
      <SupplyRequestDetailHeader
        requestId={requestId ?? ''}
        requestNumber={request.requestNumber}
        status={request.status}
        branchName={request.branchName}
        role={user?.role || ''}
        isSubmitting={actionLoading}
        onSubmitDraft={onSubmitDraft}
        onApprove={onApprove}
        onReject={onReject}
        onCancel={onCancel}
        onFileReturn={handleFileReturn}
      />

      {isInProgress && (
        <Box 
          sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: 'rgba(201,168,77,0.08)', 
            borderRadius: 2, 
            border: '1px solid rgba(201,168,77,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.5s ease-out'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} thickness={6} sx={{ color: '#C9A84C' }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#6B4C2A">
                Fulfillment in Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This request has been approved and is currently being processed by HQ.
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => navigate({ to: '/orders' })}
            sx={{ borderColor: '#C9A84C', color: '#6B4C2A', '&:hover': { bgcolor: 'rgba(201,168,77,0.1)', borderColor: '#6B4C2A' } }}
          >
            View Order Processing
          </Button>
        </Box>
      )}

      {showStepper ? <OrderFulfillmentStepper status={request.status} /> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3.5fr 8.5fr' }, gap: 3 }}>
        <Box>
          <SupplyRequestDetailsPanel request={request} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700}>Requested Items</Typography>
              {tableMode !== 'readonly' && (
                 <Typography variant="caption" color="text.secondary">
                    {localItems.filter(i => (tableMode === 'picking' ? i.isPicked : tableMode === 'packing' ? i.isPacked : i.isBranchChecked)).length} / {localItems.filter(i => !i.isRejectedDuringPicking).length} Processed
                 </Typography>
              )}
            </Box>
            <SRItemTable 
              items={localItems} 
              mode={tableMode} 
              suggestions={suggestions}
              onItemsChange={setLocalItems}
            />
          </Box>
          <SupplyRequestStatusTimeline entries={request.timeline} />
        </Box>
      </Box>
    </Box>
  );
}
