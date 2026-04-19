import { useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { useParams } from '@tanstack/react-router';
import { OrderFulfillmentStepper } from '../orders/components/OrderFulfillmentStepper';
import { getSampleSupplyRequestDetail } from './components/SupplyRequestDetail.constants';
import { SupplyRequestDetailHeader } from './components/SupplyRequestDetailHeader';
import { SupplyRequestDetailsPanel } from './components/SupplyRequestDetailsPanel';
import { SupplyRequestItemsTable } from './components/SupplyRequestItemsTable';
import { SupplyRequestStatusTimeline } from './components/SupplyRequestStatusTimeline';

export function SupplyRequestDetailPage() {
  const { requestId } = useParams({ strict: false });

  const request = useMemo(() => {
    return getSampleSupplyRequestDetail(requestId);
  }, [requestId]);

  const showStepper = request.status !== 'Draft' && request.status !== 'AutoDrafted' && request.status !== 'Rejected';

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      <SupplyRequestDetailHeader
        requestId={requestId ?? ''}
        requestNumber={request.requestNumber}
        status={request.status}
        branchName={request.branchName}
      />

      {showStepper ? <OrderFulfillmentStepper status={request.status} /> : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3.5 }}>
          <SupplyRequestDetailsPanel request={request} />
        </Grid>

        <Grid size={{ xs: 12, md: 8.5 }}>
          <SupplyRequestItemsTable items={request.items} />
          <SupplyRequestStatusTimeline entries={request.timeline} />
        </Grid>
      </Grid>
    </Box>
  );
}
