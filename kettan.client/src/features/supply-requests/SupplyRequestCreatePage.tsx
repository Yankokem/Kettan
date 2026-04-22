import { useMemo, useState } from 'react';
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

interface RequestLineItem {
  id: string;
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityRequested: number;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Arabica Coffee Beans (Medium Roast) - 5kg', sku: 'CF-ARB-MR-5KG', unit: 'bag', category: 'ingredients', hqStock: 120 },
  { id: '2', name: 'Almond Milk - 1L Carton', sku: 'MLK-ALM-1L', unit: 'carton', category: 'ingredients', hqStock: 45 },
  { id: '3', name: 'Vanilla Syrup - 750ml Bottle', sku: 'SYR-VAN-750', unit: 'bottle', category: 'ingredients', hqStock: 0 },
  { id: '4', name: 'Paper Cups (12oz) - Box of 500', sku: 'PKG-CUP-12-500', unit: 'box', category: 'packaging', hqStock: 85 },
];

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
  const [requestType, setRequestType] = useState('manual');
  const [priority, setPriority] = useState('normal');
  const [dispatchWindow, setDispatchWindow] = useState('today');
  const [dispatchDate, setDispatchDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setRequestLines([]);
    setDispatchDate('');
    setNotes('');
    setRequestType('manual');
    setPriority('normal');
    setDispatchWindow('today');
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
        requestType,
        priority,
        dispatchWindow,
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
      <Box sx={{ pb: 3, pt: 1 }}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 0.5 }}>Create Supply Request</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            This page is available for Branch Manager and Branch Owner only.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3, pt: 1, display: 'grid', gap: 2.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <BackButton to="/supply-requests" />
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Create Supply Request</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Submit a branch replenishment request to HQ.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 2.25, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' } }}>
          <Box
            sx={{
              width: { xs: '100%', lg: '44%' },
              pr: { xs: 0, lg: 2.5 },
              pb: { xs: 2.5, lg: 0 },
              borderRight: { xs: 'none', lg: '1px solid' },
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.6 }}>Request Details</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2 }}>Add request metadata for this supply request.</Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.25,
                mb: 1.25,
              }}
            >
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
          </Box>

          <Box sx={{ width: { xs: '100%', lg: '56%' }, pl: { xs: 0, lg: 2.5 }, pt: { xs: 2.5, lg: 0 } }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.6 }}>Item Composer</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 1.4 }}>
              Select inventory items from the modal and set quantity there. Added lines will appear below.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.2 }}>
              <Button
                variant="outlined"
                onClick={() => setIsItemModalOpen(true)}
              >
                Select Item
              </Button>
            </Box>

            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.6 }}>Items Added</Typography>

            <DataTable
              data={requestLines}
              columns={lineColumns}
              keyExtractor={(line) => line.id}
              emptyMessage="No items added yet. Use Select Item above to add line items."
              defaultRowsPerPage={5}
              pageSizes={[5, 10, 25]}
            />
          </Box>
        </Box>

        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.2,
            flexWrap: 'wrap',
          }}
        >
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Total lines: <strong>{requestLines.length}</strong>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button variant="outlined" onClick={() => navigate({ to: '/supply-requests' })}>
              Cancel
            </Button>
            <Button startIcon={<AddShoppingCartRoundedIcon />} onClick={() => void handleCreate()} disabled={isSaving || requestLines.length === 0}>
              {isSaving ? 'Submitting...' : 'Create and Submit'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <InventorySelectionModal
        open={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onItemsSelected={handleItemSelected}
        inventory={MOCK_INVENTORY}
      />
    </Box>
  );
}
