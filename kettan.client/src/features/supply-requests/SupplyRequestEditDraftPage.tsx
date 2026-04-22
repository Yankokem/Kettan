import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import type { AxiosError } from 'axios';
import { useNavigate, useParams } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { ConfirmDialog } from '../../components/UI/ConfirmDialog';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Dropdown } from '../../components/UI/Dropdown';
import { TextField } from '../../components/UI/TextField';
import { useAuthStore } from '../../store/useAuthStore';
import { updateSupplyRequest } from '../branch-operations/api';
import { InventorySelectionModal } from '../orders/components/InventorySelectionModal';
import type { InventoryItem } from '../orders/components/InventoryItemCard';
import { getSampleSupplyRequestDetail } from './components/SupplyRequestDetail.constants';
import {
  getSupplyRequestStatusLabel,
  SUPPLY_REQUEST_STATUS_COLORS,
} from './components/SupplyRequestDetail.constants';

interface EditLineItem {
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
  { id: '5', name: 'Whole Milk - 1L', sku: 'MLK-WHL-1L', unit: 'carton', category: 'ingredients', hqStock: 60 },
  { id: '6', name: 'Cup Lids (12oz)', sku: 'PKG-LID-12-500', unit: 'box', category: 'packaging', hqStock: 12 },
  { id: '7', name: 'Sugar Sachet Box', sku: 'SUG-SCH-1K', unit: 'box', category: 'ingredients', hqStock: 9 },
  { id: '8', name: 'Chocolate Syrup - 750ml', sku: 'SYR-CHO-750', unit: 'bottle', category: 'ingredients', hqStock: 2 },
];

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

function makeLineId() {
  return `line-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function SupplyRequestEditDraftPage() {
  const navigate = useNavigate();
  const { requestId } = useParams({ strict: false });
  const { user } = useAuthStore();

  const role = user?.role ?? '';
  const canAccessPage = role === 'BranchManager' || role === 'BranchOwner';

  const request = useMemo(() => {
    return getSampleSupplyRequestDetail(requestId);
  }, [requestId]);

  const isDraftStatus = request.status === 'Draft' || request.status === 'AutoDrafted';

  // ── Form state ──────────────────────────────────────────────────────────
  const [requestType, setRequestType] = useState('');
  const [priority, setPriority] = useState('');
  const [dispatchWindow, setDispatchWindow] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [notes, setNotes] = useState('');
  const [requestLines, setRequestLines] = useState<EditLineItem[]>([]);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // ── Pre-populate from sample data ───────────────────────────────────────
  useEffect(() => {
    setRequestType(mapRequestType(request.requestType));
    setPriority(mapPriority(request.priority));
    setDispatchWindow(mapDispatchWindow(request.dispatchWindow));
    setNotes(request.notes);
    setRequestLines(
      request.items.map((item) => ({
        id: makeLineId(),
        itemId: Number(item.id),
        itemName: item.name,
        itemSku: item.sku,
        quantityRequested: item.requestedQty,
      })),
    );
  }, [request]);

  // ── Map display labels back to form values ──────────────────────────────
  function mapRequestType(label: string): string {
    if (label.toLowerCase().includes('auto')) return 'auto';
    return 'manual';
  }

  function mapPriority(label: string): string {
    return label.toLowerCase();
  }

  function mapDispatchWindow(label: string): string {
    const lower = label.toLowerCase();
    if (lower.includes('today')) return 'today';
    if (lower.includes('tomorrow')) return 'tomorrow';
    return 'scheduled';
  }

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleRemoveLine = (lineId: string) => {
    setRequestLines((previous) => previous.filter((line) => line.id !== lineId));
  };

  const handleQuantityChange = (lineId: string, newQty: number) => {
    setRequestLines((previous) =>
      previous.map((line) => {
        if (line.id !== lineId) return line;
        return { ...line, quantityRequested: Math.max(1, newQty) };
      }),
    );
  };

  const handleItemSelected = (items: { item: InventoryItem; quantity: number; notes: string }[]) => {
    if (items.length === 0) return;

    setRequestLines((previous) => {
      let next = [...previous];

      for (const selected of items) {
        const parsedItemId = Number(selected.item.id);
        const parsedQty = Number(selected.quantity);

        if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) continue;
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) continue;

        const existingIndex = next.findIndex((line) => line.itemId === parsedItemId);

        if (existingIndex >= 0) {
          next = next.map((line, index) => {
            if (index !== existingIndex) return line;
            return { ...line, quantityRequested: line.quantityRequested + parsedQty };
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

  const handleSaveDraft = async () => {
    if (requestLines.length === 0) {
      setError('Add at least one item line before saving.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await updateSupplyRequest(Number(requestId), {
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

      navigate({ to: '/supply-requests/$requestId', params: { requestId: String(requestId) } });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    navigate({ to: '/supply-requests/$requestId', params: { requestId: String(requestId) } });
  };

  // ── Table columns ──────────────────────────────────────────────────────
  const lineColumns: ColumnDef<EditLineItem>[] = useMemo(
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
        width: 110,
        align: 'center',
        sortable: true,
        render: (line) => (
          <TextField
            type="number"
            value={line.quantityRequested}
            onChange={(event) => handleQuantityChange(line.id, Number(event.target.value))}
            slotProps={{
              htmlInput: { min: 1, style: { textAlign: 'center', width: 56 } },
            }}
            sx={{
              '& .MuiOutlinedInput-root': { height: 34, borderRadius: 2 },
            }}
          />
        ),
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
    [],
  );

  // ── Guards ──────────────────────────────────────────────────────────────
  if (!canAccessPage) {
    return (
      <Box sx={{ pb: 3, pt: 1 }}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 0.5 }}>Edit Supply Request</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            This page is available for Branch Manager and Branch Owner only.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!isDraftStatus) {
    const statusColor = SUPPLY_REQUEST_STATUS_COLORS[request.status];

    return (
      <Box sx={{ pb: 3, pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
          <BackButton to={`/supply-requests/${requestId}`} />
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Edit Supply Request</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {request.requestNumber}
            </Typography>
          </Box>
        </Box>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Cannot Edit</Typography>
            <Chip
              label={getSupplyRequestStatusLabel(request.status)}
              size="small"
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                bgcolor: statusColor.bg,
                color: statusColor.color,
                border: `1px solid ${statusColor.color}28`,
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            Only requests in <strong>Draft</strong> or <strong>Auto-Drafted</strong> status can be edited.
            This request has already been submitted and is now in a read-only state.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const statusColor = SUPPLY_REQUEST_STATUS_COLORS[request.status];

  return (
    <Box sx={{ pb: 3, pt: 1, display: 'grid', gap: 2.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <BackButton to={`/supply-requests/${requestId}`} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            <EditRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 17, fontWeight: 800 }}>
              Edit Draft — {request.requestNumber}
            </Typography>
            <Chip
              label={getSupplyRequestStatusLabel(request.status)}
              size="small"
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                bgcolor: statusColor.bg,
                color: statusColor.color,
                border: `1px solid ${statusColor.color}28`,
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Modify request details and items before submitting to HQ.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 2.25, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* ── Left panel: Request Details ─────────────────────────────── */}
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
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2 }}>
              Update request metadata for this supply request.
            </Typography>

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

          {/* ── Right panel: Item Composer ──────────────────────────────── */}
          <Box sx={{ width: { xs: '100%', lg: '56%' }, pl: { xs: 0, lg: 2.5 }, pt: { xs: 2.5, lg: 0 } }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.6 }}>Item Composer</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 1.4 }}>
              Edit quantities inline, add new items, or remove existing ones.
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
              emptyMessage="No items in this draft. Use Select Item above to add line items."
              defaultRowsPerPage={5}
              pageSizes={[5, 10, 25]}
            />
          </Box>
        </Box>

        {/* ── Footer ─────────────────────────────────────────────────── */}
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
            <Button variant="outlined" onClick={() => setShowDiscardDialog(true)}>
              Discard Changes
            </Button>
            <Button
              startIcon={<SaveRoundedIcon />}
              onClick={() => void handleSaveDraft()}
              disabled={isSaving || requestLines.length === 0}
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      <InventorySelectionModal
        open={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onItemsSelected={handleItemSelected}
        inventory={MOCK_INVENTORY}
      />

      <ConfirmDialog
        open={showDiscardDialog}
        title="Discard Changes?"
        message="All unsaved changes to this draft will be lost. This action cannot be undone."
        confirmText="Discard"
        cancelText="Keep Editing"
        confirmColor="error"
        onConfirm={handleDiscard}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </Box>
  );
}
