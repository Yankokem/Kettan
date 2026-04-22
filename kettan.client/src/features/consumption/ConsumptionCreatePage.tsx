import { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Dropdown } from '../../components/UI/Dropdown';
import { TextField } from '../../components/UI/TextField';
import { useAuthStore } from '../../store/useAuthStore';
import { logSalesConsumption } from '../branch-operations/api';
import { SalesMenuSelectionModal, type SoldMenuItemOption } from './components/SalesMenuSelectionModal';

interface SalesLine {
  id: string;
  menuItemId: number;
  menuItemName: string;
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

const MOCK_TODAY_SOLD_MENU_ITEMS: SoldMenuItemOption[] = [
  { id: '101', name: 'Iced Americano', category: 'Coffee', soldToday: 38 },
  { id: '102', name: 'Vanilla Latte', category: 'Coffee with Milk', soldToday: 29 },
  { id: '103', name: 'Caramel Frappe', category: 'Frappe', soldToday: 16 },
  { id: '104', name: 'Matcha Green Tea', category: 'Tea', soldToday: 13 },
  { id: '105', name: 'Cold Brew', category: 'Coffee', soldToday: 21 },
  { id: '106', name: 'Cafe Mocha', category: 'Coffee with Milk', soldToday: 18 },
  { id: '107', name: 'Blueberry Cheesecake', category: 'Pastry', soldToday: 9 },
  { id: '108', name: 'Mango Smoothie', category: 'Smoothie', soldToday: 12 },
];

export function ConsumptionCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role ?? '';
  const canAccessPage = role === 'BranchManager' || role === 'BranchOwner';
  const canCreateRequests = role === 'BranchManager';

  const [shift, setShift] = useState('Morning');
  const [logDate, setLogDate] = useState(defaultLogDate());
  const [remarks, setRemarks] = useState('');
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  const [salesLines, setSalesLines] = useState<SalesLine[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSalesItemsSelected = (items: { item: SoldMenuItemOption; quantity: number }[]) => {
    if (items.length === 0) {
      return;
    }

    setSalesLines((previous) => {
      let next = [...previous];

      for (const selected of items) {
        const parsedMenuItemId = Number(selected.item.id);
        const parsedQuantitySold = Number(selected.quantity);

        if (!Number.isInteger(parsedMenuItemId) || parsedMenuItemId <= 0) {
          continue;
        }

        if (!Number.isFinite(parsedQuantitySold) || parsedQuantitySold <= 0) {
          continue;
        }

        const existingIndex = next.findIndex((line) => line.menuItemId === parsedMenuItemId);

        if (existingIndex >= 0) {
          next = next.map((line, index) => {
            if (index !== existingIndex) {
              return line;
            }

            return {
              ...line,
              quantitySold: line.quantitySold + parsedQuantitySold,
            };
          });
          continue;
        }

        next.push({
          id: makeLineId(),
          menuItemId: parsedMenuItemId,
          menuItemName: selected.item.name,
          quantitySold: parsedQuantitySold,
        });
      }

      return next;
    });

    setError(null);
    setIsSalesModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!canCreateRequests) {
      setError('Only Branch Manager can submit consumption logs.');
      return;
    }

    if (salesLines.length === 0) {
      setError('Add at least one sales consumption line.');
      return;
    }

    const logDateIso = logDate ? new Date(`${logDate}T00:00:00`).toISOString() : new Date().toISOString();

    try {
      setIsSaving(true);
      setError(null);

      await logSalesConsumption({
        logDate: logDateIso,
        shift,
        remarks: remarks || undefined,
        sales: salesLines.map((line) => ({
          menuItemId: line.menuItemId,
          quantitySold: line.quantitySold,
        })),
      });

      navigate({ to: '/consumption' });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const salesColumns: ColumnDef<SalesLine>[] = [
    {
      key: 'menuItemName',
      label: 'Menu Item',
      sortable: true,
      render: (line) => (
        <Box>
          <Typography sx={{ fontSize: 13.5, color: 'text.primary', fontWeight: 600 }}>{line.menuItemName}</Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>MI-{line.menuItemId}</Typography>
        </Box>
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
            Create sales consumption transaction set for this day.
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
                Set shift/date metadata for this sales consumption transaction.
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
                Select sold menu items using the modal, then submit the full set.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.2 }}>
                <Button variant="outlined" startIcon={<SearchRoundedIcon />} sx={{ minWidth: 188 }} onClick={() => setIsSalesModalOpen(true)}>
                  Select Sold Menu Items
                </Button>
              </Box>

              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.6 }}>Transactions Added</Typography>

              <DataTable
                data={salesLines}
                columns={salesColumns}
                keyExtractor={(line) => line.id}
                emptyMessage="No sales lines added yet. Use Select Sold Menu Items above."
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
              Total lines: <strong>{salesLines.length}</strong>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button variant="outlined" onClick={() => navigate({ to: '/consumption' })}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={isSaving || salesLines.length === 0}>
                {isSaving ? 'Submitting...' : 'Submit Consumption'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      <SalesMenuSelectionModal
        open={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        onItemsSelected={handleSalesItemsSelected}
        items={MOCK_TODAY_SOLD_MENU_ITEMS}
      />
    </Box>
  );
}
