import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import type { AxiosError } from 'axios';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { SearchInput } from '../../components/UI/SearchInput';
import { TextField } from '../../components/UI/TextField';
import { createReturn, fetchReturns, resolveReturn, type ReturnRecord } from '../branch-operations/api';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

function resolutionStyle(resolution: string) {
  const normalized = resolution.toLowerCase();

  if (normalized === 'pending') {
    return { color: '#B45309', bg: 'rgba(180,83,9,0.12)' };
  }

  if (normalized === 'credited') {
    return { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' };
  }

  return { color: '#047857', bg: 'rgba(4,120,87,0.12)' };
}

export function ReturnsPage() {
  const [rows, setRows] = useState<ReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [resolutionFilter, setResolutionFilter] = useState('');

  const [orderId, setOrderId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantityReturned, setQuantityReturned] = useState('');
  const [reason, setReason] = useState('');
  const [photoUrls, setPhotoUrls] = useState('');

  const loadRows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await fetchReturns(resolutionFilter || undefined);
      setRows(results);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, [resolutionFilter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        row.returnId.toString().includes(query) ||
        row.orderId.toString().includes(query) ||
        row.branchName.toLowerCase().includes(query) ||
        row.reason.toLowerCase().includes(query) ||
        row.resolution.toLowerCase().includes(query)
      );
    });
  }, [rows, search]);

  const columns: ColumnDef<ReturnRecord>[] = [
    {
      key: 'returnId',
      label: 'Return ID',
      width: 110,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          RT-{row.returnId}
        </Typography>
      ),
    },
    {
      key: 'orderId',
      label: 'Order',
      width: 90,
      sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600 }}>#{row.orderId}</Typography>,
    },
    {
      key: 'branchName',
      label: 'Branch',
      render: (row) => <Typography sx={{ fontSize: 13 }}>{row.branchName || `Branch ${row.branchId}`}</Typography>,
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.reason}</Typography>,
    },
    {
      key: 'resolution',
      label: 'Resolution',
      width: 130,
      render: (row) => {
        const style = resolutionStyle(row.resolution);
        return (
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
        );
      },
    },
    {
      key: 'loggedAt',
      label: 'Logged',
      width: 130,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 130,
      align: 'right',
      render: (row) => (
        <Button
          size="small"
          variant="outlined"
          sx={{ height: 32, px: 1.5 }}
          disabled={row.resolution !== 'Pending' || isSaving}
          onClick={() => void handleResolve(row.returnId)}
        >
          Resolve
        </Button>
      ),
    },
  ];

  const handleCreate = async () => {
    const parsedOrderId = Number(orderId);
    const parsedItemId = Number(itemId);
    const parsedQty = Number(quantityReturned);

    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      setError('Order ID must be a positive whole number.');
      return;
    }

    if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
      setError('Item ID must be a positive whole number.');
      return;
    }

    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setError('Returned quantity must be greater than zero.');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await createReturn({
        orderId: parsedOrderId,
        reason: reason.trim(),
        photoUrls: photoUrls || undefined,
        items: [
          {
            itemId: parsedItemId,
            quantityReturned: parsedQty,
            reason: reason.trim(),
          },
        ],
      });

      setOrderId('');
      setItemId('');
      setQuantityReturned('');
      setReason('');
      setPhotoUrls('');
      await loadRows();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolve = async (returnId: number) => {
    try {
      setIsSaving(true);
      setError(null);
      await resolveReturn(returnId, {
        resolution: 'Credited',
      });
      await loadRows();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ pb: 3, pt: 1, display: 'grid', gap: 2.5 }}>
      <Paper sx={{ p: 2.25, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>File Return</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.4 }}>
              Branch workflow for damaged, wrong, or missing-delivery items.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => void loadRows()} disabled={isLoading}>
            Refresh
          </Button>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.25,
            mb: 1.25,
          }}
        >
          <TextField label="Order ID" value={orderId} onChange={(event) => setOrderId(event.target.value)} />
          <TextField label="Item ID" value={itemId} onChange={(event) => setItemId(event.target.value)} />
          <TextField label="Qty Returned" type="number" value={quantityReturned} onChange={(event) => setQuantityReturned(event.target.value)} />
        </Box>

        <TextField label="Return Reason" value={reason} onChange={(event) => setReason(event.target.value)} sx={{ mb: 1.25 }} />
        <TextField label="Photo URLs (comma separated)" value={photoUrls} onChange={(event) => setPhotoUrls(event.target.value)} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
          <Button onClick={() => void handleCreate()} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Submit Return'}
          </Button>
        </Box>

        {error ? (
          <Typography sx={{ color: 'error.main', fontSize: 12.5, mt: 1.2 }}>{error}</Typography>
        ) : null}
      </Paper>

      <DataTable
        title="Returns"
        data={filtered}
        columns={columns}
        keyExtractor={(row) => row.returnId.toString()}
        emptyMessage={isLoading ? 'Loading returns...' : 'No return records yet.'}
        toolbar={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchInput
              placeholder="Search return id, order id, branch..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 280, maxWidth: 420 }}
            />
            <Dropdown
              value={resolutionFilter}
              onChange={(event) => setResolutionFilter(String(event.target.value))}
              options={[
                { value: '', label: 'All Resolutions' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Credited', label: 'Credited' },
                { value: 'Replaced', label: 'Replaced' },
              ]}
            />
          </Box>
        }
      />
    </Box>
  );
}
