import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Typography, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import { useNavigate, useParams } from '@tanstack/react-router';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { 
  fetchSupplyRequestById, 
  submitSupplyRequest,
  approveSupplyRequest,
  rejectSupplyRequest,
  cancelSupplyRequest,
  getPickingSuggestions,
  confirmArrival,
  completeTransaction,
  type PickingSuggestion,
  type SupplyRequest as ApiSupplyRequest
} from '../branch-operations/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/UI/Button';
import { OrderFulfillmentStepper } from '../orders/components/OrderFulfillmentStepper';
import { SupplyRequestDetailHeader } from './components/SupplyRequestDetailHeader';
import { SupplyRequestDetailsPanel } from './components/SupplyRequestDetailsPanel';
import SRItemTable, { type SRTableMode } from './components/SRItemTable';
import { SupplyRequestStatusTimeline } from './components/SupplyRequestStatusTimeline';
import { OrderMessagesModal } from '../orders/components/OrderMessagesModal';
import type { SupplyRequestDetailViewModel, SupplyRequestDetailItem } from './components/SupplyRequestDetail.types';

// Poll interval for real-time status updates (ms)
const POLL_INTERVAL_MS = 10_000;

function toDetailViewModel(request: ApiSupplyRequest): SupplyRequestDetailViewModel {
  const requestNumber = request.referenceNumber || `SR-${String(request.requestId).padStart(5, '0')}`;
  
  return {
    requestNumber,
    status: (request.orderStatus || request.status) as SupplyRequestDetailViewModel['status'],
    branchName: request.branchName,
    requestedByName: request.requestedByName,
    requestedByRole: 'Branch Manager',
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
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!requestId) return;
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const row = await fetchSupplyRequestById(Number(requestId));
      const vm = toDetailViewModel(row);
      setRequest(vm);
      setLocalItems(vm.items);

      // Fetch picking suggestions when order is in picking stage
      if (vm.status === 'Picking' && vm.linkedOrderId) {
        try {
          const sugs = await getPickingSuggestions(Number(vm.linkedOrderId));
          setSuggestions(sugs);
        } catch {
          // non-critical
        }
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.message || 'Failed to load details.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  // Real-time polling
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      void loadData(true);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadData]);

  // ── Actions ──
  const handleAction = async (action: () => Promise<any>) => {
    try {
      setActionLoading(true);
      setError(null);
      await action();
      await loadData(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Action failed.');
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

  const handleConfirmArrival = async () => {
    if (!request?.linkedOrderId) return;
    await handleAction(() => confirmArrival(Number(request.linkedOrderId)));
  };

  const handleCompleteTransaction = async () => {
    if (!request?.linkedOrderId) return;
    try {
      setActionLoading(true);
      setError(null);
      const payload = localItems.map(i => ({
        requestItemId: Number(i.id),
        isChecked: i.isBranchChecked ?? false
      }));
      await completeTransaction(Number(request.linkedOrderId), payload);
      setIsSummaryModalOpen(false);
      await loadData(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to complete transaction.');
    } finally {
      setActionLoading(false);
    }
  };

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
  const isInProgress = ['Approved', 'Processing', 'Picking', 'Packed', 'InFulfillment'].includes(request.status);
  
  const isBranch = user?.role === 'BranchManager' || user?.role === 'BranchOwner';

  // ── Table mode ──
  let tableMode: SRTableMode = 'readonly';
  if (request.status === 'Arrived' && isBranch) {
    tableMode = 'branch-check';
  } else if (['Packed', 'Dispatched', 'InFulfillment', 'Completed', 'Fulfilled', 'Arrived'].includes(request.status)) {
    tableMode = 'readonly-packed';
  }

  // Items for the completion summary
  const checkedItems = localItems.filter(i => i.isBranchChecked);
  const rejectedItems = localItems.filter(i => i.isRejectedDuringPicking);
  const uncheckedNonRejected = localItems.filter(i => !i.isBranchChecked && !i.isRejectedDuringPicking);

  // The messages button should only be shown when an order is linked.
  // IMPORTANT: We pass the orderId to the modal, not the requestId.
  // This avoids the 403 that happens when branch tries to open messages
  // right after approval (before the order record is fully propagated) —
  // the modal handles a null orderId gracefully by showing empty state.
  const linkedOrderIdNum = request.linkedOrderId ? Number(request.linkedOrderId) : null;

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
        onConfirmArrival={handleConfirmArrival}
        onCompleteTransaction={() => setIsSummaryModalOpen(true)}
        onMessagesClick={() => setChatOpen(true)}
        hasLinkedOrder={!!request.linkedOrderId}
      />

      {isInProgress && !isBranch && (
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
              {tableMode === 'branch-check' && (
                <Typography variant="caption" color="text.secondary">
                  {localItems.filter(i => i.isBranchChecked).length} / {localItems.filter(i => !i.isRejectedDuringPicking).length} Checked
                </Typography>
              )}
            </Box>
            <SRItemTable 
              items={localItems} 
              mode={tableMode} 
              suggestions={suggestions}
              onItemsChange={tableMode === 'branch-check' ? setLocalItems : undefined}
            />
          </Box>
          <SupplyRequestStatusTimeline entries={request.timeline} />
        </Box>
      </Box>

      {/* ── Completion Summary Modal ── */}
      <Dialog open={isSummaryModalOpen} onClose={() => !actionLoading && setIsSummaryModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Complete Transaction</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Review the summary before completing this transaction.
          </Typography>

          <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.secondary' }}>Request Details</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 3, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">Request Number:</Typography>
            <Typography variant="body2" fontWeight={600} align="right">{request.requestNumber}</Typography>

            <Typography variant="body2" color="text.secondary">Branch:</Typography>
            <Typography variant="body2" fontWeight={600} align="right">{request.branchName}</Typography>

            <Typography variant="body2" color="text.secondary">Date Arrived:</Typography>
            <Typography variant="body2" fontWeight={600} align="right">
              {request.arrivedAt ? new Date(request.arrivedAt).toLocaleString() : '-'}
            </Typography>

            <Typography variant="body2" color="text.secondary">Confirmed By:</Typography>
            <Typography variant="body2" fontWeight={600} align="right">
              {request.arrivedConfirmedByName || '-'}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Items Received */}
          <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Items Received ({checkedItems.length})
          </Typography>
          <Box sx={{ mt: 1, mb: 2 }}>
            {checkedItems.length === 0 ? (
              <Typography variant="body2" color="error.main" sx={{ fontStyle: 'italic', mt: 1 }}>
                No items were checked. This shipment will be marked as not received.
              </Typography>
            ) : (
              checkedItems.map(item => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 0.75,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    {item.name} ({item.sku})
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    Qty: {item.sendQuantity ?? item.approvedQty ?? item.requestedQty}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          {/* Items Not Checked (not received) */}
          {uncheckedNonRejected.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" sx={{ fontWeight: 600, color: 'warning.main' }}>
                Not Checked — Marked Lost ({uncheckedNonRejected.length})
              </Typography>
              <Box sx={{ mt: 1, mb: 2 }}>
                {uncheckedNonRejected.map(item => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 0.75,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                      opacity: 0.75,
                    }}
                  >
                    <Typography variant="body2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.name} ({item.sku})
                    </Typography>
                    <Typography variant="body2" color="warning.main" fontWeight={600}>
                      Qty: {item.sendQuantity ?? item.approvedQty ?? item.requestedQty}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Items Rejected During Picking */}
          {rejectedItems.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" sx={{ fontWeight: 600, color: 'error.main' }}>
                Rejected by HQ During Picking ({rejectedItems.length})
              </Typography>
              <Box sx={{ mt: 1 }}>
                {rejectedItems.map(item => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      py: 0.75,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                      opacity: 0.75,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }} color="error.main">
                        <CancelRoundedIcon sx={{ fontSize: 16 }} />
                        {item.name} ({item.sku})
                      </Typography>
                      {item.pickingRejectionReason && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                          Reason: {item.pickingRejectionReason}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      Not sent
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1.5 }}>
          <Button variant="outlined" onClick={() => setIsSummaryModalOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={() => void handleCompleteTransaction()} 
            loading={actionLoading}
          >
            Confirm &amp; Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Messages Modal ──
          NOTE: We guard with linkedOrderIdNum. When a branch user opens this page
          immediately after approval (before the order is fully propagated), linkedOrderId
          may momentarily cause a 403 — passing null lets the modal show empty state
          instead of throwing an error at the page level. */}
      <OrderMessagesModal 
        open={chatOpen} 
        onClose={() => setChatOpen(false)} 
        orderId={linkedOrderIdNum}
      />
    </Box>
  );
}