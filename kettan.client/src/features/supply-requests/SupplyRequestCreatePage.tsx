import { useEffect, useMemo, useState } from 'react';
import { Box, Divider, Grid, Paper, Typography } from '@mui/material';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Dropdown } from '../../components/UI/Dropdown';
import { TextField } from '../../components/UI/TextField';
import { useAuthStore } from '../../store/useAuthStore';
import { createSupplyRequest, submitSupplyRequest, fetchSupplyRequests } from '../branch-operations/api';
import { InventorySelectionModal } from '../orders/components/InventorySelectionModal';
import type { InventoryItem } from '../orders/components/InventoryItemCard';
import { fetchInventoryItems } from '../hq-inventory/hqInventoryApi';

interface RequestLineItem {
  id: string;
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityRequested: number;
  unitCost: number;
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

  useEffect(() => {
    if (!canAccessPage) {
      navigate({ to: '/supply-requests' });
    }
  }, [canAccessPage, navigate]);

  if (!canAccessPage) return null;

  const canCreateRequests = role === 'BranchManager' || role === 'BranchOwner';

  const [, setNextRequestId] = useState<number | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [requestLines, setRequestLines] = useState<RequestLineItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [priority, setPriority] = useState('normal');
  const [dispatchDate, setDispatchDate] = useState('');
  const [subject, setSubject] = useState('');
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

    const loadNextRequestId = async () => {
      try {
        const requests = await fetchSupplyRequests();
        if (requests.length > 0) {
          const maxId = Math.max(...requests.map(r => r.requestId));
          setNextRequestId(maxId + 1);
        } else {
          setNextRequestId(1);
        }
      } catch {
        // If we can't fetch, just don't show the ID
        setNextRequestId(null);
      }
    };

    void loadInventory();
    void loadNextRequestId();
  }, []);
  
  const totalUnits = useMemo(
    () => requestLines.reduce((sum, line) => sum + line.quantityRequested, 0),
    [requestLines]
  );

  const estimatedCost = useMemo(
    () => requestLines.reduce((sum, line) => sum + line.quantityRequested * (line.unitCost ?? 0), 0),
    [requestLines]
  );

  const resetForm = () => {
    setRequestLines([]);
    setDispatchDate('');
    setSubject('');
    setNotes('');
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
          subject: subject.trim() || undefined,
          requestType: 'manual',
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
          unitCost: selected.item.unitCost ?? 0,
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
            width: { xs: '100%', md: '35%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, bgcolor: '#FAF7F2', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AssignmentRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Request Configuration
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingBagRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Subject / Title
                  </Typography>
                </Box>
                <TextField
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Example: Weekend restock - milk and cups"
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 80 } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <PriorityHighRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Priority Level
                    </Typography>
                  </Box>
                  <Dropdown
                    value={priority}
                    onChange={(event) => setPriority(String(event.target.value))}
                    options={[
                      { value: 'low', label: 'Low Priority' },
                      { value: 'normal', label: 'Normal Priority' },
                      { value: 'high', label: 'High Priority' },
                    ]}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CalendarTodayRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Preferred Delivery Date
                    </Typography>
                  </Box>
                  <TextField
                    type="date"
                    value={dispatchDate}
                    onChange={(event) => setDispatchDate(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    placeholder="mm/dd/yyyy"
                    fullWidth
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <NotesRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Additional Notes
                    </Typography>
                  </Box>
                  <TextField
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    multiline
                    rows={3}
                    placeholder="Add any special instructions or notes..."
                    fullWidth
                  />
                </Box>
              </Grid>
            </Grid>

            {error ? (
              <Typography sx={{ color: 'error.main', fontSize: 12.5, mt: 2, p: 1.5, bgcolor: 'error.lighter', borderRadius: 2 }}>
                {error}
              </Typography>
            ) : null}

            <Divider sx={{ my: 3, opacity: 0.6 }} />

            {/* Request Summary Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
              <Inventory2RoundedIcon sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Request Summary
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Line Items</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#2E7D32' }}>{requestLines.length}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Requested Units</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#2E7D32' }}>{totalUnits}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Estimated Cost</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#2E7D32' }}>₱{estimatedCost.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Right card — Item Composer */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 500
          }}
        >
          <Box sx={{ p: 2.5, bgcolor: '#FAF7F2', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Inventory2RoundedIcon sx={{ fontSize: 20, color: '#6B4C2A' }} />
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#6B4C2A' }}>Item Composer</Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500 }}>
                  Select items to add to your supply request
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
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

          <Box sx={{ p: 3, bgcolor: '#FAFAFA', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate({ to: '/supply-requests' })}>
              Cancel
            </Button>
            <Button
              startIcon={<AddShoppingCartRoundedIcon />}
              onClick={() => void handleCreate()}
              disabled={isSaving || requestLines.length === 0}
              sx={{ 
                bgcolor: '#6B4C2A', 
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 800,
                fontSize: 15,
                '&:hover': { bgcolor: '#543B21' },
                '&.Mui-disabled': { bgcolor: 'rgba(107,76,42,0.3)', color: 'rgba(255,255,255,0.7)' }
              }}
            >
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
