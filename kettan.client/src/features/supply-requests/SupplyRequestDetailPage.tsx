import { useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { Box, Typography, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { LoadingOverlay } from '../../components/UI/LoadingOverlay';
import { WorkflowActionModal } from '../../components/UI/WorkflowActionModal';
import { useParams, useNavigate } from '@tanstack/react-router';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
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
import { SharedFloatingChat } from '../shared/components/SharedFloatingChat';
import { WorkflowStatusBanner } from '../shared/components/WorkflowStatusBanner';
import { 
  LocalShippingRounded as TruckIcon,
  CheckCircleRounded as SuccessIcon,
  CancelRounded as CancelIcon
} from '@mui/icons-material';
import type { SupplyRequestDetailViewModel, SupplyRequestDetailItem, SupplyRequestTimelineEntry } from './components/SupplyRequestDetail.types';



const stripPrefix = (code: string) => code.replace(/^[A-Z]+-/, '');

function toDetailViewModel(request: ApiSupplyRequest): SupplyRequestDetailViewModel {
  const rawNumber = request.transactionCode || request.referenceNumber || `SR-${String(request.requestId).padStart(5, '0')}`;
  const requestNumber = stripPrefix(rawNumber);
  
  return {
    requestNumber,
    transactionCode: stripPrefix(request.transactionCode || ''),
    subject: request.subject ?? undefined,
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
    dispatchScheduleStatus: request.dispatchScheduleStatus,
    notes: request.notes ?? '',
    totalRequestedValue: request.totalRequestedValue,
    totalApprovedValue: request.totalApprovedValue,
    totalFulfilledValue: request.totalFulfilledValue,
    linkedOrderId: request.orderId?.toString(),
    orderStatus: request.orderStatus ?? undefined,
    rejectionReason: request.rejectionReason ?? request.rejectReason ?? request.reason ?? undefined,
    cancellationReason: request.cancellationReason ?? request.cancelReason ?? request.reason ?? undefined,
    items: request.items.map((item) => ({
      id: String(item.requestItemId),
      name: item.itemName,
      sku: item.itemSku,
      requestedQty: Number(item.quantityRequested),
      approvedQty: item.quantityApproved != null ? Number(item.quantityApproved) : null,
      hqStock: item.hqStock ?? 0,
      availability:
        (item.hqStock ?? 0) === 0
          ? 'Out of Stock'
          : (item.hqStock ?? 0) < Number(item.quantityRequested)
          ? 'Low Stock'
          : 'Available',
      isPicked: item.isPicked,
      sendQuantity: item.sendQuantity,
      isRejectedDuringPicking: item.isRejectedDuringPicking,
      pickingRejectionReason: item.pickingRejectionReason,
      isPacked: item.isPacked,
      isBranchChecked: item.isBranchChecked,
      branchStock: item.branchStock ?? 0,
    })),
    timeline: ([
      {
        status: 'PendingApproval' as const,
        timestamp: request.createdAt,
        actor: request.requestedByName,
        remarks: request.notes ?? undefined,
      },
      ...(request.arrivedAt ? [{ 
        status: 'Arrived' as const, 
        timestamp: request.arrivedAt, 
        actor: request.arrivedConfirmedByName || 'System' 
      }] : []),
      ...(request.completedAt ? [{ 
        status: 'Completed' as const, 
        timestamp: request.completedAt, 
        actor: request.completedByName || 'System' 
      }] : []),
    ] as SupplyRequestTimelineEntry[]).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
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

  // ── Modal states ──
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [arrivalModalOpen, setArrivalModalOpen] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null); // Kept for legacy if needed, but primary is SignalR

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

      // ── BUG FIX: State Merging ──
      // If we are in an interactive status (Picking, Packing, or Arrived),
      // we must NOT blindly overwrite local workflow state from the server
      // until the user actually saves/completes the step.
      setLocalItems(prev => {
        const interactiveStatuses = ['Picking', 'Packing', 'Arrived'];
        if (!interactiveStatuses.includes(vm.status)) return vm.items;
        
        return vm.items.map(newItem => {
          const matchingPrev = prev.find(p => p.id === newItem.id);
          if (!matchingPrev) return newItem;

          return {
            ...newItem,
            // Preserve local checkbox/quantity states
            isPicked: matchingPrev.isPicked ?? newItem.isPicked,
            isPacked: matchingPrev.isPacked ?? newItem.isPacked,
            isBranchChecked: matchingPrev.isBranchChecked ?? newItem.isBranchChecked,
            sendQuantity: matchingPrev.sendQuantity ?? newItem.sendQuantity,
          };
        });
      });

      // We need suggestions for Picking/Packing (HQ) and Arrived (Branch)
      // These are tied to the Order record, not the Supply Request record.
      const needsSuggestions = ['Picking', 'Packing', 'Arrived'].includes(vm.status || '');
      const orderId = vm.linkedOrderId ? Number(vm.linkedOrderId) : null;

      if (needsSuggestions && orderId) {
        try {
          const data = await getPickingSuggestions(orderId);
          setSuggestions(data);
          
          // Merge branch stock into local items so table/modal show correct values
          setLocalItems(prev => prev.map(item => {
            const suggestion = data.find(s => s.requestItemId.toString() === item.id);
            if (suggestion) {
              return { ...item, branchStock: suggestion.branchCurrentStock };
            }
            return item;
          }));
        } catch (err) {
          console.error('Failed to fetch suggestions:', err);
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

  // ── Real-time Status Sync via SignalR ──
  useEffect(() => {
    if (!requestId) return;

    const url = import.meta.env.VITE_API_URL || '';
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${url}/hub/workflow`, {
            withCredentials: true,
            accessTokenFactory: () => useAuthStore.getState().token || ''
        })
        .withAutomaticReconnect()
        .build();

    connection.on('ReceiveStatusUpdate', (updatedId: number) => {
        if (Number(updatedId) === Number(requestId)) {
            void loadData(true);
        }
    });

    connection.start()
        .then(() => {
            void connection.invoke('JoinSupplyRequest', Number(requestId));
        })
        .catch(err => console.error('Supply Request Detail SignalR Error: ', err));

    return () => {
        if (connection.state === signalR.HubConnectionState.Connected) {
            void connection.invoke('LeaveSupplyRequest', Number(requestId))
                .finally(() => void connection.stop());
        }
    };
  }, [requestId, loadData]);

  // Fallback Polling (Reduced frequency since SignalR is primary)
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      void loadData(true);
    }, 30_000); // 30s fallback
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

  const onSubmitDraft = (message: string) => handleAction(() => submitSupplyRequest(Number(requestId), message || request?.notes));
  
  const onApprove = (message: string) => handleAction(() => approveSupplyRequest(Number(requestId), {
    notes: message || request?.notes,
    items: localItems.map(i => ({ requestItemId: Number(i.id), quantityApproved: i.approvedQty ?? i.requestedQty }))
  }));

  const onReject = (reason: string) => handleAction(() => rejectSupplyRequest(Number(requestId), { reason }));

  const onCancel = (reason: string) => handleAction(() => cancelSupplyRequest(Number(requestId), { reason }));

  const handleFileReturn = () => { navigate({ to: '/returns/new' }); };

  const handleConfirmArrival = async (_message?: string) => {
    if (!request?.linkedOrderId) return;
    // _message is captured from the modal but confirmArrival API doesn't accept it yet—future-proof
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
    return <LoadingOverlay open={true} />;
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
  const uncheckedNonRejected = localItems.filter(i => !i.isBranchChecked && !i.isRejectedDuringPicking);

  // The messages button should only be shown when an order is linked.
  // IMPORTANT: We pass the orderId to the modal, not the requestId.
  // This avoids the 403 that happens when branch tries to open messages
  // right after approval (before the order record is fully propagated) —
  // the modal handles a null orderId gracefully by showing empty state.

  return (
    <Box sx={{ pb: 3 }}>
      <LoadingOverlay open={actionLoading} />
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      
      <SupplyRequestDetailHeader
        requestId={requestId!}
        requestNumber={request.requestNumber}
        status={request.status}
        branchName={request.branchName}
        role={user?.role || ''}
        isSubmitting={actionLoading}
        onSubmitDraft={() => setSubmitModalOpen(true)}
        onApprove={() => setApproveModalOpen(true)}
        onReject={() => setRejectModalOpen(true)}
        onCancel={() => setCancelModalOpen(true)}
        onFileReturn={handleFileReturn}
        onConfirmArrival={() => setArrivalModalOpen(true)}
        onCompleteTransaction={() => setIsSummaryModalOpen(true)}
      />

      {/* ── Status Banners (Workflow Information) ── */}
      {request.status === 'PendingApproval' && isBranch && (
        <WorkflowStatusBanner
          loading
          title="Awaiting HQ Review"
          description="Your request has been submitted successfully. An HQ administrator will review and approve the item quantities shortly."
        />
      )}

      {request.status === 'Rejected' && (
        <WorkflowStatusBanner
          variant="error"
          icon={<CancelIcon sx={{ fontSize: 22 }} />}
          title="Supply Request Rejected"
          description={request.rejectionReason
            ? `Reason: ${request.rejectionReason}`
            : 'Your request has been rejected by HQ. Please check the chat or request history for more information.'
          }
        />
      )}

      {request.status === 'Cancelled' && (
        <WorkflowStatusBanner
          variant="error"
          icon={<CancelIcon sx={{ fontSize: 22 }} />}
          title="Supply Request Cancelled"
          description={request.cancellationReason
            ? `Reason: ${request.cancellationReason}`
            : 'This request has been cancelled and is no longer being processed.'
          }
        />
      )}

      {isInProgress && !isBranch && (
        <WorkflowStatusBanner
          loading
          title="Fulfillment in Progress"
          description="This request has been approved and is currently being processed by the HQ fulfillment team."
        />
      )}

      {request.status === 'Dispatched' && isBranch && (
        <WorkflowStatusBanner
          icon={<TruckIcon sx={{ fontSize: 22 }} />}
          title="Package in Transit"
          description={
            <>
              HQ has dispatched your requested items. Please click <strong>"Package Arrived"</strong> above once the vehicle reaches your branch.
            </>
          }
        />
      )}

      {request.status === 'Arrived' && isBranch && (
        <WorkflowStatusBanner
          icon={<SuccessIcon sx={{ fontSize: 22, color: 'success.main' }} />}
          title="Package Arrived"
          description="Please verify the received items in the table below and click 'Complete Transaction' to update your inventory."
        />
      )}

      {(request.status === 'Completed' || request.status === 'Fulfilled') && (
        <WorkflowStatusBanner
          icon={<SuccessIcon sx={{ fontSize: 22, color: 'success.main' }} />}
          title="Transaction Completed"
          description="Your inventory has been successfully updated with the received items. This request is now closed."
        />
      )}

      {showStepper ? (
        <OrderFulfillmentStepper 
          status={request.status} 
          timeline={request.timeline} 
          variant={request.requestType === 'HqInitiated' ? 'hq-dispatch' : 'default'}
        />
      ) : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '400px 1fr' }, gap: 3 }}>
        <Box>
          <SupplyRequestDetailsPanel request={request} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <SRItemTable 
            items={localItems} 
            mode={tableMode} 
            suggestions={suggestions}
            onItemsChange={tableMode === 'branch-check' ? setLocalItems : undefined}
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Inventory2RoundedIcon sx={{ color: '#6B4C2A', fontSize: 18 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requested Items</Typography>
                {tableMode === 'branch-check' && (
                  <Typography variant="caption" color="text.secondary">
                    {localItems.filter(i => i.isBranchChecked).length} / {localItems.filter(i => !i.isRejectedDuringPicking).length} Checked
                  </Typography>
                )}
              </Box>
            }
          />

        </Box>
      </Box>

      {/* ── Completion Summary Modal ── */}
      <Dialog 
        open={isSummaryModalOpen} 
        onClose={() => !actionLoading && setIsSummaryModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '14px',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, px: 3, pt: 3, pb: 0, fontSize: 24, letterSpacing: '-0.02em' }}>
          Complete Transaction
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 8, mt: 2 }}>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 4, fontWeight: 500 }}>
            Please review the reconciliation summary below. Confirming will update your branch inventory with the checked items.
          </Typography>
          <Box sx={{ 
            bgcolor: '#FAF5EF', 
            p: 2.5, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'rgba(140,107,67,0.12)',
            mb: 4
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#8C6B43', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
              Request Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 1.2 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Request ID</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800, textAlign: 'right', color: '#3E2723', fontFamily: 'monospace' }}>
                {request.transactionCode}
              </Typography>

              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Date Arrived</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, textAlign: 'right', color: 'text.primary' }}>
                {request.arrivedAt ? new Date(request.arrivedAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                }) : '-'}
              </Typography>

              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>Confirmed By</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, textAlign: 'right', color: 'text.primary' }}>{request.arrivedConfirmedByName || '-'}</Typography>
            </Box>
          </Box>

          {/* Items Received Table */}
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, px: 0.5 }}>
            Items Received ({checkedItems.length})
          </Typography>

          {checkedItems.length === 0 ? (
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
              {checkedItems.map(item => {
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
          {uncheckedNonRejected.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'rgba(217,119,6,0.04)', borderRadius: 2, border: '1px dashed rgba(217,119,6,0.3)', mb: 2 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'warning.main', textTransform: 'uppercase', mb: 1 }}>
                Not Checked — Marked Lost ({uncheckedNonRejected.length})
              </Typography>
              {uncheckedNonRejected.map(item => (
                <Typography key={item.id} sx={{ fontSize: 12, color: 'warning.dark', opacity: 0.8 }}>
                  • {item.name} ({item.sendQuantity ?? item.approvedQty ?? item.requestedQty} units)
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1.5 }}>
          <Button variant="outlined" onClick={() => setIsSummaryModalOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            color="success"
            onClick={() => void handleCompleteTransaction()} 
            loading={actionLoading}
            sx={{ px: 4 }}
          >
            Confirm &amp; Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Messages / Chat ──
          Only available when an order is linked (during order processing). */}
      {request.linkedOrderId && (
        <SharedFloatingChat 
          contextType="order"
          id={Number(request.linkedOrderId)}
          open={chatOpen}
          onOpenChange={setChatOpen}
        />
      )}

      {/* ── Workflow Action Modals ── */}
      <WorkflowActionModal
        open={rejectModalOpen}
        title="Reject Supply Request"
        description="Are you sure you want to reject this supply request? The branch will be notified of your decision."
        inputLabel="Rejection Reason"
        inputPlaceholder="Explain why this request is being rejected..."
        confirmLabel="Reject Request"
        severity="danger"
        requireInput
        loading={actionLoading}
        onConfirm={(reason) => { setRejectModalOpen(false); void onReject(reason); }}
        onCancel={() => setRejectModalOpen(false)}
      />

      <WorkflowActionModal
        open={cancelModalOpen}
        title="Cancel Supply Request"
        description="Are you sure you want to cancel this request? This action cannot be undone."
        inputLabel="Cancellation Reason"
        inputPlaceholder="Explain why you are cancelling this request..."
        confirmLabel="Cancel Request"
        severity="warning"
        requireInput
        loading={actionLoading}
        onConfirm={(reason) => { setCancelModalOpen(false); void onCancel(reason); }}
        onCancel={() => setCancelModalOpen(false)}
      />

      <WorkflowActionModal
        open={submitModalOpen}
        title="Submit to HQ"
        description="Your request will be sent to HQ for review and approval. You can add any notes below."
        inputLabel="Notes (Optional)"
        inputPlaceholder="Any additional details for the HQ team..."
        confirmLabel="Submit Request"
        severity="info"
        loading={actionLoading}
        onConfirm={(message) => { setSubmitModalOpen(false); void onSubmitDraft(message); }}
        onCancel={() => setSubmitModalOpen(false)}
      />

      <WorkflowActionModal
        open={approveModalOpen}
        title="Approve Supply Request"
        description="This will approve the request and generate a fulfillment order. You can add any remarks below."
        inputLabel="Remarks (Optional)"
        inputPlaceholder="Any notes for the fulfillment team..."
        confirmLabel="Approve & Generate Order"
        severity="success"
        loading={actionLoading}
        onConfirm={(message) => { setApproveModalOpen(false); void onApprove(message); }}
        onCancel={() => setApproveModalOpen(false)}
      />

      <WorkflowActionModal
        open={arrivalModalOpen}
        title="Confirm Package Arrival"
        description="Confirm that the package has arrived at your branch. You can add any arrival notes below."
        inputLabel="Arrival Notes (Optional)"
        inputPlaceholder="Any remarks about the delivery condition..."
        confirmLabel="Confirm Arrival"
        severity="success"
        loading={actionLoading}
        onConfirm={(message) => { setArrivalModalOpen(false); void handleConfirmArrival(message); }}
        onCancel={() => setArrivalModalOpen(false)}
      />
    </Box>
  );
}
