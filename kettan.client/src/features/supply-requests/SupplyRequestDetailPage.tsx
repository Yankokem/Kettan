import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate, useParams } from '@tanstack/react-router';
import { fetchSupplyRequestById, submitSupplyRequest } from '../branch-operations/api';
import { OrderFulfillmentStepper } from '../orders/components/OrderFulfillmentStepper';
import { SupplyRequestDetailHeader } from './components/SupplyRequestDetailHeader';
import { SupplyRequestDetailsPanel } from './components/SupplyRequestDetailsPanel';
import { SupplyRequestItemsTable } from './components/SupplyRequestItemsTable';
import { SupplyRequestStatusTimeline } from './components/SupplyRequestStatusTimeline';
import type { SupplyRequestDetailViewModel } from './components/SupplyRequestDetail.types';

function toDetailViewModel(request: Awaited<ReturnType<typeof fetchSupplyRequestById>>): SupplyRequestDetailViewModel {
  const requestNumber = `SR-${String(request.requestId).padStart(5, '0')}`;
  const requestedByRole = 'Branch Manager';
  const submittedAtLabel = new Date(request.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return {
    requestNumber,
    status: request.status as SupplyRequestDetailViewModel['status'],
    branchName: request.branchName,
    requestedByName: request.requestedByName,
    requestedByRole,
    submittedAtLabel,
    priority: (request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1)) as SupplyRequestDetailViewModel['priority'],
    requestType: request.requestType,
    dispatchWindow: request.dispatchWindow,
    notes: request.notes ?? '',
    linkedOrderId: undefined,
    items: request.items.map((item) => ({
      id: String(item.requestItemId),
      name: item.itemName,
      sku: item.itemSku,
      requestedQty: Number(item.quantityRequested),
      approvedQty: item.quantityApproved != null ? Number(item.quantityApproved) : null,
      hqStock: Number(item.quantityApproved ?? item.quantityRequested),
      availability: item.quantityApproved == null || Number(item.quantityApproved) >= Number(item.quantityRequested)
        ? 'Available'
        : 'Low Stock',
    })),
    timeline: [
      {
        status: request.status as SupplyRequestDetailViewModel['status'],
        timestamp: request.updatedAt,
        actor: request.requestedByName,
        remarks: request.notes ?? undefined,
      },
    ],
  };
}

export function SupplyRequestDetailPage() {
  const { requestId } = useParams({ strict: false });
  const navigate = useNavigate();
  const [request, setRequest] = useState<SupplyRequestDetailViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequest = async () => {
      if (!requestId) {
        setError('Missing request id.');
        return;
      }

      try {
        setError(null);
        const row = await fetchSupplyRequestById(Number(requestId));
        setRequest(toDetailViewModel(row));
      } catch {
        setError('Failed to load supply request details.');
      }
    };

    void loadRequest();
  }, [requestId]);

  const handleSubmit = async () => {
    if (!requestId) {
      return;
    }

    try {
      await submitSupplyRequest(Number(requestId), request?.notes);
      const refreshed = await fetchSupplyRequestById(Number(requestId));
      setRequest(toDetailViewModel(refreshed));
    } catch {
      setError('Failed to submit the supply request.');
    }
  };

  const handleFileReturn = () => {
    navigate({ to: '/returns/new' });
  };

  if (error) {
    return (
      <Box sx={{ pb: 3 }}>
        <Typography sx={{ color: 'error.main', fontSize: 14 }}>{error}</Typography>
      </Box>
    );
  }

  if (!request) {
    return (
      <Box sx={{ pb: 3 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Loading supply request…</Typography>
      </Box>
    );
  }

  const showStepper = request.status !== 'Draft' && request.status !== 'AutoDrafted' && request.status !== 'Rejected';

  return (
    <Box sx={{ pb: 3 }}>
      <SupplyRequestDetailHeader
        requestId={requestId ?? ''}
        requestNumber={request.requestNumber}
        status={request.status}
        branchName={request.branchName}
        onSubmit={() => void handleSubmit()}
        onFileReturn={handleFileReturn}
      />

      {showStepper ? <OrderFulfillmentStepper status={request.status} /> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3.5fr 8.5fr' }, gap: 3 }}>
        <Box>
          <SupplyRequestDetailsPanel request={request} />
        </Box>

        <Box>
          <SupplyRequestItemsTable items={request.items} />
          <SupplyRequestStatusTimeline entries={request.timeline} />
        </Box>
      </Box>
    </Box>
  );
}
