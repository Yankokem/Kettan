import { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Dropdown } from '../../components/UI/Dropdown';
import { TextField } from '../../components/UI/TextField';
import { useAuthStore } from '../../store/useAuthStore';
import { logDirectConsumption, logSalesConsumption } from '../branch-operations/api';

interface DirectLine {
  id: string;
  itemId: number;
  quantity: number;
  reason: string;
}

interface SalesLine {
  id: string;
  menuItemId: number;
  quantitySold: number;
}

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

function makeLineId() {
  return `line-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function defaultLogDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ConsumptionCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role ?? '';
  const canAccessPage = role === 'BranchManager' || role === 'BranchOwner';
  const canCreateRequests = role === 'BranchManager';

  const [mode, setMode] = useState<'direct' | 'sales'>('direct');
  const [shift, setShift] = useState('Morning');
  const [logDate, setLogDate] = useState(defaultLogDate());
  const [remarks, setRemarks] = useState('');

  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Consumption');

  const [menuItemId, setMenuItemId] = useState('');
  const [quantitySold, setQuantitySold] = useState('');

  const [directLines, setDirectLines] = useState<DirectLine[]>([]);
  const [salesLines, setSalesLines] = useState<SalesLine[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddDirectLine = () => {
    const parsedItemId = Number(itemId);
    const parsedQuantity = Number(quantity);
    const trimmedReason = reason.trim() || 'Consumption';

    if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
      setError('Item ID must be a positive whole number.');
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    setDirectLines((previous) => {
      const existingIndex = previous.findIndex((line) => line.itemId === parsedItemId);

      if (existingIndex >= 0) {
        return previous.map((line, index) => {
          if (index !== existingIndex) {
            return line;
          }

          return {
            ...line,
            quantity: line.quantity + parsedQuantity,
            reason: trimmedReason,
          };
        });
      }

      return [
        ...previous,
        {
          id: makeLineId(),
          itemId: parsedItemId,
          quantity: parsedQuantity,
          reason: trimmedReason,
        },
      ];
    });

    setItemId('');
    setQuantity('');
    setError(null);
  };

  const handleAddSalesLine = () => {
    const parsedMenuItemId = Number(menuItemId);
    const parsedQuantitySold = Number(quantitySold);

    if (!Number.isInteger(parsedMenuItemId) || parsedMenuItemId <= 0) {
      setError('Menu item ID must be a positive whole number.');
      return;
    }

    if (!Number.isFinite(parsedQuantitySold) || parsedQuantitySold <= 0) {
      setError('Quantity sold must be greater than zero.');
      return;
    }

    setSalesLines((previous) => {
      const existingIndex = previous.findIndex((line) => line.menuItemId === parsedMenuItemId);

      if (existingIndex >= 0) {
        return previous.map((line, index) => {
          if (index !== existingIndex) {
            return line;
          }

          return {
            ...line,
            quantitySold: line.quantitySold + parsedQuantitySold,
          };
        });
      }

      return [
        ...previous,
        {
          id: makeLineId(),
          menuItemId: parsedMenuItemId,
          quantitySold: parsedQuantitySold,
        },
      ];
    });

    setMenuItemId('');
    setQuantitySold('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!canCreateRequests) {
      setError('Only Branch Manager can submit consumption logs.');
      return;
    }

    if (mode === 'direct' && directLines.length === 0) {
      setError('Add at least one direct consumption line.');
      return;
    }

    if (mode === 'sales' && salesLines.length === 0) {
      setError('Add at least one sales consumption line.');
      return;
    }

    const logDateIso = logDate ? new Date(`${logDate}T00:00:00`).toISOString() : new Date().toISOString();

    try {
      setIsSaving(true);
      setError(null);

      if (mode === 'direct') {
        await logDirectConsumption({
          logDate: logDateIso,
          shift,
          remarks: remarks || undefined,
          items: directLines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            reason: line.reason || remarks || 'Consumption',
          })),
        });
      } else {
        await logSalesConsumption({
          logDate: logDateIso,
          shift,
          remarks: remarks || undefined,
          sales: salesLines.map((line) => ({
            menuItemId: line.menuItemId,
            quantitySold: line.quantitySold,
          })),
        });
      }

      navigate({ to: '/consumption' });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const directColumns: ColumnDef<DirectLine>[] = [
    {
      key: 'itemId',
      label: 'Item ID',
      width: 100,
      sortable: true,
      render: (line) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#6B4C2A' }}>
          {line.itemId}
        </Typography>
      ),
    },
    {
      key: 'quantity',
      label: 'Qty',
      width: 80,
      align: 'center',
      sortable: true,
      render: (line) => <Typography sx={{ fontSize: 13 }}>{line.quantity}</Typography>,
    },
    {
      key: 'reason',
      label: 'Reason',
      sortable: true,
      render: (line) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{line.reason}</Typography>,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 95,
      align: 'right',
      render: (line) => (
        <Button
          size="small"
          variant="outlined"
          sx={{ height: 32, px: 1.2, minWidth: 0 }}
          onClick={() => setDirectLines((previous) => previous.filter((entry) => entry.id !== line.id))}
          startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />}
        >
          Remove
        </Button>
      ),
    },
  ];

  const salesColumns: ColumnDef<SalesLine>[] = [
    {
      key: 'menuItemId',
      label: 'Menu Item ID',
      width: 130,
      sortable: true,
      render: (line) => (
        <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#6B4C2A' }}>
          {line.menuItemId}
        </Typography>
      ),
    },
    {
      key: 'quantitySold',
      label: 'Qty Sold',
      width: 90,
      align: 'center',
      sortable: true,
      render: (line) => <Typography sx={{ fontSize: 13 }}>{line.quantitySold}</Typography>,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 95,
      align: 'right',
      render: (line) => (
        <Button
          size="small"
          variant="outlined"
          sx={{ height: 32, px: 1.2, minWidth: 0 }}
          onClick={() => setSalesLines((previous) => previous.filter((entry) => entry.id !== line.id))}
          startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />}
        >
          Remove
        </Button>
      ),
    },
  ];

  if (!canAccessPage) {
    return (
      <Box sx={{ pb: 3, pt: 1 }}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 0.5 }}>Create Consumption Log</Typography>
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
        <BackButton to="/consumption" />
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Add Consumption</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Create one direct or sales consumption transaction set for this day.
          </Typography>
        </Box>
      </Box>

      {!canCreateRequests ? (
        <Paper sx={{ p: 2.25, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 0.5 }}>Consumption Logging</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            Branch Owner can view consumption history, but only Branch Manager can submit consumption logs.
          </Typography>
        </Paper>
      ) : (
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
              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.6 }}>Transaction Details</Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2 }}>
                Set mode and metadata for this consumption transaction.
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
                  value={mode}
                  onChange={(event) => setMode(event.target.value as 'direct' | 'sales')}
                  options={[
                    { value: 'direct', label: 'Direct Consumption' },
                    { value: 'sales', label: 'Sales Consumption' },
                  ]}
                />
                <Dropdown
                  value={shift}
                  onChange={(event) => setShift(String(event.target.value))}
                  options={[
                    { value: 'Morning', label: 'Morning Shift' },
                    { value: 'Afternoon', label: 'Afternoon Shift' },
                    { value: 'Evening', label: 'Evening Shift' },
                  ]}
                />
                <TextField
                  label="Log Date"
                  type="date"
                  value={logDate}
                  onChange={(event) => setLogDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              <TextField
                label="Remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                multiline
                rows={3}
              />

              {error ? (
                <Typography sx={{ color: 'error.main', fontSize: 12.5, mt: 1.2 }}>{error}</Typography>
              ) : null}
            </Box>

            <Box sx={{ width: { xs: '100%', lg: '56%' }, pl: { xs: 0, lg: 2.5 }, pt: { xs: 2.5, lg: 0 } }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.6 }}>Line Composer</Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 1.4 }}>
                Add transaction lines for the selected mode, then submit the full set.
              </Typography>

              {mode === 'direct' ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr)) auto' }, gap: 1, mb: 1.2 }}>
                  <TextField label="Item ID" value={itemId} onChange={(event) => setItemId(event.target.value)} />
                  <TextField label="Quantity" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                  <TextField label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
                  <Button variant="outlined" startIcon={<AddRoundedIcon />} sx={{ minWidth: 122 }} onClick={handleAddDirectLine}>
                    Add Line
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr)) auto' }, gap: 1, mb: 1.2 }}>
                  <TextField label="Menu Item ID" value={menuItemId} onChange={(event) => setMenuItemId(event.target.value)} />
                  <TextField label="Qty Sold" type="number" value={quantitySold} onChange={(event) => setQuantitySold(event.target.value)} />
                  <Button variant="outlined" startIcon={<AddRoundedIcon />} sx={{ minWidth: 122 }} onClick={handleAddSalesLine}>
                    Add Line
                  </Button>
                </Box>
              )}

              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.6 }}>Transactions Added</Typography>

              {mode === 'direct' ? (
                <DataTable
                  data={directLines}
                  columns={directColumns}
                  keyExtractor={(line) => line.id}
                  emptyMessage="No direct lines added yet."
                  defaultRowsPerPage={5}
                  pageSizes={[5, 10, 25]}
                />
              ) : (
                <DataTable
                  data={salesLines}
                  columns={salesColumns}
                  keyExtractor={(line) => line.id}
                  emptyMessage="No sales lines added yet."
                  defaultRowsPerPage={5}
                  pageSizes={[5, 10, 25]}
                />
              )}
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
              Total lines: <strong>{mode === 'direct' ? directLines.length : salesLines.length}</strong>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button variant="outlined" onClick={() => navigate({ to: '/consumption' })}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={isSaving || (mode === 'direct' ? directLines.length === 0 : salesLines.length === 0)}>
                {isSaving ? 'Submitting...' : 'Submit Consumption'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
