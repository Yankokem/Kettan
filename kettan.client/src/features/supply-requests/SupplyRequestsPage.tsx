import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import type { AxiosError } from 'axios';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { SearchInput } from '../../components/UI/SearchInput';
import { TextField } from '../../components/UI/TextField';
import {
  createSupplyRequest,
  fetchSupplyRequests,
  submitSupplyRequest,
  type SupplyRequest,
} from '../branch-operations/api';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

function statusChip(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('pending')) {
    return { color: '#B45309', bg: 'rgba(180,83,9,0.12)' };
  }

  if (normalized.includes('approved')) {
    return { color: '#047857', bg: 'rgba(4,120,87,0.12)' };
  }

  if (normalized.includes('rejected')) {
    return { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' };
  }

  return { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' };
}

export function SupplyRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [itemId, setItemId] = useState('');
  const [quantityRequested, setQuantityRequested] = useState('');
  const [requestType, setRequestType] = useState('manual');
  const [priority, setPriority] = useState('normal');
  const [dispatchWindow, setDispatchWindow] = useState('today');
  const [dispatchDate, setDispatchDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const rows = await fetchSupplyRequests(statusFilter || undefined);
      setRequests(rows);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [statusFilter]);

  const rows = useMemo(() => {
    const source = requests;
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return source;
    }

    return source.filter((row) => {
      return (
        row.requestId.toString().includes(query) ||
        row.branchName.toLowerCase().includes(query) ||
        row.requestedByName.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery]);

  const columns: ColumnDef<SupplyRequest>[] = [
    {
      key: 'requestId',
      label: 'Request',
      width: 120,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
          #{row.requestId}
        </Typography>
      ),
    },
    {
      key: 'branchName',
      label: 'Branch',
      sortable: true,
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.branchName || `Branch ${row.branchId}`}</Typography>,
    },
    {
      key: 'requestedByName',
      label: 'Requested By',
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.requestedByName || `User ${row.requestedByUserId}`}</Typography>,
    },
    {
      key: 'items',
      label: 'Lines',
      width: 90,
      align: 'center',
      render: (row) => <Typography sx={{ fontSize: 13 }}>{row.items.length}</Typography>,
    },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      render: (row) => {
        const style = statusChip(row.status);
        return (
          <Chip
            label={row.status}
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
      key: 'updatedAt',
      label: 'Updated',
      width: 130,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      ),
    },
  ];

  const handleSubmit = async () => {
    setFormError(null);

    const parsedItemId = Number(itemId);
    const parsedQty = Number(quantityRequested);

    if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
      setFormError('Item ID must be a positive whole number.');
      return;
    }

    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setFormError('Quantity requested must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createSupplyRequest({
        requestType,
        priority,
        dispatchWindow,
        dispatchDate: dispatchDate || undefined,
        notes: notes || undefined,
        items: [{ itemId: parsedItemId, quantityRequested: parsedQty }],
      });

      await submitSupplyRequest(created.requestId, created.notes ?? undefined);
      resetForm();
      await loadRequests();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  function resetForm() {
    setItemId('');
    setQuantityRequested('');
    setDispatchDate('');
    setNotes('');
    setRequestType('manual');
    setPriority('normal');
    setDispatchWindow('today');
    setFormError(null);
  }

  return (
    <Box sx={{ pb: 3, pt: 1, display: 'grid', gap: 2.5 }}>
      <Paper sx={{ p: 2.25, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Create Supply Request</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.4 }}>
              Quick create for branch users. You can add multiple items by submitting one request per line for now.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => void loadRequests()}
            disabled={isLoading}
          >
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
          <TextField label="Item ID" value={itemId} onChange={(event) => setItemId(event.target.value)} />
          <TextField label="Quantity Requested" type="number" value={quantityRequested} onChange={(event) => setQuantityRequested(event.target.value)} />
          <TextField label="Dispatch Date" type="date" value={dispatchDate} onChange={(event) => setDispatchDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <Dropdown
            value={requestType}
            onChange={(event) => setRequestType(String(event.target.value))}
            options={[
              { value: 'manual', label: 'Manual Request' },
              { value: 'auto', label: 'Auto Triggered' },
            ]}
          />
          <Dropdown
            value={priority}
            onChange={(event) => setPriority(String(event.target.value))}
            options={[
              { value: 'low', label: 'Low Priority' },
              { value: 'normal', label: 'Normal Priority' },
              { value: 'high', label: 'High Priority' },
            ]}
          />
          <Dropdown
            value={dispatchWindow}
            onChange={(event) => setDispatchWindow(String(event.target.value))}
            options={[
              { value: 'today', label: 'Dispatch Today' },
              { value: 'tomorrow', label: 'Dispatch Tomorrow' },
              { value: 'scheduled', label: 'Scheduled' },
            ]}
          />
        </Box>

        <TextField
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          multiline
          rows={2}
        />

        {formError ? (
          <Typography sx={{ color: 'error.main', fontSize: 12.5, mt: 1.2 }}>{formError}</Typography>
        ) : null}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
          <Button startIcon={<AddShoppingCartRoundedIcon />} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Create and Submit'}
          </Button>
        </Box>
      </Paper>

      <DataTable
        title="Supply Requests"
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.requestId.toString()}
        emptyMessage={isLoading ? 'Loading requests...' : 'No supply requests yet.'}
        toolbar={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchInput
              placeholder="Search request id, branch, requestor..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              sx={{ minWidth: 280, maxWidth: 420 }}
            />
            <Dropdown
              value={statusFilter}
              onChange={(event) => setStatusFilter(String(event.target.value))}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Draft', label: 'Draft' },
                { value: 'PendingApproval', label: 'Pending Approval' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Rejected', label: 'Rejected' },
              ]}
            />
            <Button
              variant="outlined"
              startIcon={<SendRoundedIcon />}
              disabled
              title="Inline submit is available from the create flow."
            >
              Submit Existing
            </Button>
          </Box>
        }
      />

      {loadError ? (
        <Typography sx={{ color: 'error.main', fontSize: 12.5 }}>{loadError}</Typography>
      ) : null}
    </Box>
  );
}
