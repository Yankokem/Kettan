import { Alert, Box, Chip, Paper, Typography } from '@mui/material';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import {
  fetchMultiBranchSupplyPushById,
  type MultiBranchSupplyPushDetail,
  type BranchOrder
} from '../branch-operations/api';

function formatStatus(status: string): string {
  return status.replace(/([A-Z])/g, ' $1').trim();
}

export function MultiBranchSupplyPushDetailPage() {
  const { batchId } = useParams({ from: '/layout/orders/multi-branch/$batchId' });
  const navigate = useNavigate();
  const [batch, setBatch] = useState<MultiBranchSupplyPushDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!batchId) {
        setError('Missing batch ID.');
        setBatch(null);
        return;
      }

      const parsedBatchId = Number(batchId);
      if (!Number.isInteger(parsedBatchId) || parsedBatchId <= 0) {
        setError('Invalid batch ID.');
        setBatch(null);
        return;
      }

      try {
        setError(null);
        const data = await fetchMultiBranchSupplyPushById(parsedBatchId);
        setBatch(data);
      } catch {
        setBatch(null);
        setError('Failed to load batch details.');
      }
    };

    void load();
  }, [batchId]);

  return (
    <Box sx={{ pb: 3, display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BackButton to="/orders" />
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
            Multi-Branch Supply Push
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {batch ? `${batch.transactionCode} · ${batch.totalBranches} branch orders` : 'Loading...'}
          </Typography>
        </Box>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {batch ? (
        <>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>Status Breakdown</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(batch.statusBreakdown ?? []).map((row) => (
                <Chip
                  key={row.status}
                  label={`${formatStatus(row.status)}: ${row.count}`}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>Branch Orders</Typography>
            <Box sx={{ display: 'grid', gap: 1.2 }}>
              {(batch.branchOrders || []).map((order: BranchOrder) => (
                <Box
                  key={order.orderId}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    p: 1.5,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                      {order.branchName || `Branch ${order.branchId}`}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      {order.transactionCode} · {formatStatus(order.status)}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: String(order.orderId) } })}
                  >
                    View Order
                  </Button>
                </Box>
              ))}
            </Box>
          </Paper>
        </>
      ) : null}
    </Box>
  );
}
