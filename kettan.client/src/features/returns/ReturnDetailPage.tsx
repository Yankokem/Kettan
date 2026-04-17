import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import type { AxiosError } from 'axios';
import { useParams } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { fetchReturnById, resolveReturn, type ReturnItem, type ReturnRecord } from '../branch-operations/api';
import { useAuthStore } from '../../store/useAuthStore';
import { recordAuditLog } from '../audit-logs/auditLogStore';
import { resolutionStyle } from './resolutionStyle';
import { ReturnResolutionDialog } from './components/ReturnResolutionDialog';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

const HQ_RESOLVER_ROLES = ['TenantAdmin', 'HqManager', 'HqStaff'];

export function ReturnDetailPage() {
  const { returnId } = useParams({ from: '/layout/returns/$returnId' });
  const numericReturnId = Number(returnId);
  const { user } = useAuthStore();

  const [row, setRow] = useState<ReturnRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  const hasLoggedViewRef = useRef(false);

  const canResolve = HQ_RESOLVER_ROLES.includes(user?.role || '');

  const loadReturn = async () => {
    if (!Number.isFinite(numericReturnId) || numericReturnId <= 0) {
      setError('Invalid return id.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchReturnById(numericReturnId);
      setRow(result);

      if (!hasLoggedViewRef.current) {
        recordAuditLog({
          action: 'ReturnDetailViewed',
          entityName: 'Return',
          entityId: result.returnId,
          details: `Viewed return detail for RT-${result.returnId}.`,
        });
        hasLoggedViewRef.current = true;
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReturn();
  }, [numericReturnId]);

  const columns: ColumnDef<ReturnItem>[] = [
    {
      key: 'itemName',
      label: 'Item',
      sortable: true,
      render: (item) => <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{item.itemName}</Typography>,
    },
    {
      key: 'quantityReturned',
      label: 'Qty Returned',
      width: 130,
      align: 'center',
      sortable: true,
      render: (item) => <Typography sx={{ fontSize: 13 }}>{item.quantityReturned}</Typography>,
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (item) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{item.reason}</Typography>,
    },
  ];

  const timelineRows = useMemo(() => {
    if (!row) {
      return [];
    }

    const events = [
      {
        id: 'filed',
        label: 'Filed',
        time: row.loggedAt,
        actor: row.branchName || `Branch ${row.branchId}`,
      },
    ];

    if (!row.resolvedAt) {
      events.push({
        id: 'under-review',
        label: 'UnderReview',
        time: row.loggedAt,
        actor: 'HQ Reviewer Queue',
      });
    } else {
      events.push({
        id: 'resolved',
        label: row.resolution,
        time: row.resolvedAt,
        actor: 'HQ Resolver',
      });
    }

    return events;
  }, [row]);

  const handleResolveSubmit = async (payload: {
    resolution: 'Credited' | 'Replaced' | 'Rejected';
    creditAmount?: number;
    remarks?: string;
  }) => {
    if (!row) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await resolveReturn(row.returnId, payload);

      recordAuditLog({
        action: payload.resolution === 'Rejected' ? 'ReturnRejected' : 'ReturnResolved',
        entityName: 'Return',
        entityId: row.returnId,
        details:
          payload.resolution === 'Rejected'
            ? `Rejected return RT-${row.returnId} with remarks: ${payload.remarks || 'No remarks'}.`
            : `Resolved return RT-${row.returnId} as ${payload.resolution}.`,
      });

      setResolveDialogOpen(false);
      await loadReturn();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Loading return detail...</Typography>;
  }

  if (!row) {
    return (
      <Box sx={{ display: 'grid', gap: 1.2 }}>
        <BackButton to="/returns" />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Return not found.</Typography>
        {error ? <Typography sx={{ fontSize: 12.5, color: 'error.main' }}>{error}</Typography> : null}
      </Box>
    );
  }

  const style = resolutionStyle(row.resolution);

  return (
    <Box sx={{ pb: 3, pt: 1, display: 'grid', gap: 2.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <BackButton to="/returns" />
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Return RT-{row.returnId}</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Linked to Order #{row.orderId}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Chip
            label={row.resolution}
            size="small"
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              bgcolor: style.bg,
              color: style.color,
              border: `1px solid ${style.color}2b`,
            }}
          />
          <Button
            disabled={!canResolve || row.resolution !== 'Pending'}
            onClick={() => setResolveDialogOpen(true)}
          >
            Resolve Return
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2.2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.4 }}>
          <Box>
            <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.4 }}>
              Branch
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{row.branchName || `Branch ${row.branchId}`}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.4 }}>
              Filed At
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
              {new Date(row.loggedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.4 }}>
              Credit Amount
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
              {row.creditAmount ? row.creditAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '--'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 1.6 }}>
          <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.4 }}>
            Root Reason
          </Typography>
          <Typography sx={{ fontSize: 13.2, color: 'text.primary' }}>{row.reason}</Typography>
        </Box>

        {error ? <Typography sx={{ fontSize: 12.5, color: 'error.main', mt: 1.4 }}>{error}</Typography> : null}
      </Paper>

      <DataTable
        title="Returned Items"
        data={row.items}
        columns={columns}
        keyExtractor={(item) => `${row.returnId}-${item.itemId}`}
        emptyMessage="No item lines on this return."
        defaultRowsPerPage={5}
      />

      <Paper sx={{ p: 2.2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Typography sx={{ fontSize: 15, fontWeight: 800, mb: 1.3 }}>Return Timeline</Typography>
        <Box sx={{ display: 'grid', gap: 0.9 }}>
          {timelineRows.map((event) => {
            const eventStyle = resolutionStyle(event.label);
            return (
              <Box key={event.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
                  <Chip
                    label={event.label}
                    size="small"
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      bgcolor: eventStyle.bg,
                      color: eventStyle.color,
                      border: `1px solid ${eventStyle.color}2b`,
                    }}
                  />
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{event.actor}</Typography>
                </Box>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                  {new Date(event.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      <ReturnResolutionDialog
        open={resolveDialogOpen}
        isSaving={isSaving}
        returnIdLabel={`RT-${row.returnId}`}
        onClose={() => setResolveDialogOpen(false)}
        onSubmit={handleResolveSubmit}
      />
    </Box>
  );
}
