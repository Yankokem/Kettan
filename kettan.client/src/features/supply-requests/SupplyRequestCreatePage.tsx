import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Dropdown } from '../../components/UI/Dropdown';
import { TextField } from '../../components/UI/TextField';
import { useAuthStore } from '../../store/useAuthStore';
import { createSupplyRequest, submitSupplyRequest } from '../branch-operations/api';
import { InventorySelectionModal } from '../orders/components/InventorySelectionModal';
import type { InventoryItem } from '../orders/components/InventoryItemCard';
import { fetchInventoryItems } from '../hq-inventory/hqInventoryApi';

interface RequestLineItem {
  id: string;
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityRequested: number;
}

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

function makeLineId() {
  return `line-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function SupplyRequestCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role ?? '';
  const canAccessPage = role === 'BranchManager' || role === 'BranchOwner';
  const canCreateRequests = role === 'BranchManager' || role === 'BranchOwner';

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [requestLines, setRequestLines] = useState<RequestLineItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [requestType, setRequestType] = useState('manual');
  const [priority, setPriority] = useState('normal');
  const [dispatchDate, setDispatchDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const rows = await fetchInventoryItems(undefined, { hqOnly: true });
        const mapped: InventoryItem[] = rows.map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          unit: item.unit || 'unit',
          category: item.category?.name ?? 'Uncategorized',
          hqStock: item.totalStock,
          unitCost: item.unitCost,
        }));
        setInventory(mapped);
      } catch {
        setError('Failed to load inventory items.');
      }
    };

    void loadInventory();
  }, []);

  const resetForm = () => {
    setRequestLines([]);
    setReferenceNumber('');
    setDispatchDate('');
    setNotes('');
    setRequestType('manual');
    setPriority('normal');
    setError(null);
  };

  const handleRemoveLine = (lineId: string) => {
    setRequestLines((previous) => previous.filter((line) => line.id !== lineId));
  };

  const handleCreate = async () => {
    if (!canCreateRequests) {
      setError('You do not have permission to create supply requests.');
      return;
    }

    if (requestLines.length === 0) {
      setError('Add at least one item line before submitting.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const created = await createSupplyRequest({
        branchId: user?.branchId ?? undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        requestType,
        priority,
        dispatchWindow: 'scheduled',
        dispatchDate: dispatchDate || undefined,
        notes: notes || undefined,
        items: requestLines.map((line) => ({
          itemId: line.itemId,
          quantityRequested: line.quantityRequested,
        })),
      });

      await submitSupplyRequest(created.requestId, created.notes ?? undefined);
      resetForm();
      navigate({ to: '/supply-requests/$requestId', params: { requestId: String(created.requestId) } });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleItemSelected = (items: { item: InventoryItem; quantity: number; notes: string }[]) => {
    if (items.length === 0) {
      return;
    }

    setRequestLines((previous) => {
      let next = [...previous];

      for (const selected of items) {
        const parsedItemId = Number(selected.item.id);
        const parsedQty = Number(selected.quantity);

        if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
          continue;
        }

        if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
          continue;
        }

        const existingIndex = next.findIndex((line) => line.itemId === parsedItemId);

        if (existingIndex >= 0) {
          next = next.map((line, index) => {
            if (index !== existingIndex) {
              return line;
            }

            return {
              ...line,
              quantityRequested: line.quantityRequested + parsedQty,
            };
          });
          continue;
        }

        next.push({
          id: makeLineId(),
          itemId: parsedItemId,
          itemName: selected.item.name,
          itemSku: selected.item.sku,
          quantityRequested: parsedQty,
        });
      }

      return next;
    });

    setError(null);

    setIsItemModalOpen(false);
  };

  const lineColumns: ColumnDef<RequestLineItem>[] = useMemo(
    () => [
      {
        key: 'itemName',
        label: 'Item',
        sortable: true,
        render: (line) => (
          <Box>
            <Typography sx={{ fontSize: 13.5, color: 'text.primary', fontWeight: 600 }}>{line.itemName}</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>{line.itemSku}</Typography>
          </Box>
        ),
      },
      {
        key: 'quantityRequested',
        label: 'Qty',
        width: 80,
        align: 'center',
        sortable: true,
        render: (line) => <Typography sx={{ fontSize: 13 }}>{line.quantityRequested}</Typography>,
      },
      {
        key: 'actions',
        label: 'Actions',
        width: 90,
        align: 'right',
        render: (line) => (
          <Button
            size="small"
            variant="outlined"
            sx={{ height: 32, px: 1.2, minWidth: 0 }}
            onClick={() => handleRemoveLine(line.id)}
            startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />}
          >
            Remove
          </Button>
        ),
      },
    ],
    []
  );

  if (!canAccessPage) {
    return (
      <Box sx={{ pb: 3 }}>
        <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 0.5 }}>Create Supply Request</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            This page is available for Branch Manager and Branch Owner only.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3, display: 'grid', gap: 2.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <BackButton to="/supply-requests" />
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Create Supply Request</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Submit a branch replenishment request to HQ.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left card — Request Details */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '38%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            p: 3.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
            Request Details
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 1.25,
              mb: 1.25,
            }}
          >
            <TextField
              label="Reference Number"
              value={referenceNumber}
              placeholder="e.g., SR-2026-001"
              onChange={(event) => setReferenceNumber(event.target.value)}
            />
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
            <TextField
              label="Dispatch Date"
              type="date"
              value={dispatchDate}
              onChange={(event) => setDispatchDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <TextField
            label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            multiline
            rows={3}
            sx={{ mt: 1.2 }}
          />

          {error ? (
            <Typography sx={{ color: 'error.main', fontSize: 12.5, mt: 1.2 }}>{error}</Typography>
          ) : null}
        </Paper>

        {/* Right card — Item Composer */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            p: 3.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              Item Composer
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setIsItemModalOpen(true)}
              >
                Select Item
              </Button>
            </Box>

            <DataTable
              data={requestLines}
              columns={lineColumns}
              keyExtractor={(line) => line.id}
              emptyMessage="No items added yet. Use Select Item above to add line items."
              defaultRowsPerPage={5}
              pageSizes={[5, 10, 25]}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, pt: 2 }}>
            <Button variant="outlined" onClick={() => navigate({ to: '/supply-requests' })}>
              Cancel
            </Button>
            <Button startIcon={<AddShoppingCartRoundedIcon />} onClick={() => void handleCreate()} disabled={isSaving || requestLines.length === 0}>
              {isSaving ? 'Submitting...' : 'Create and Submit'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <InventorySelectionModal
        open={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onItemsSelected={handleItemSelected}
        inventory={inventory}
        showStock={false}
      />
    </Box>
  );
}
