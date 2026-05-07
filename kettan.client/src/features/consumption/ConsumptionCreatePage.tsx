import { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Grid } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { TextField } from '../../components/UI/TextField';
import { useAuthStore } from '../../store/useAuthStore';
import { logSalesConsumption } from '../branch-operations/api';
import { fetchMenuItems } from '../menu/menuItemsApi';
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


export function ConsumptionCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role ?? '';
  const canAccessPage = role === 'BranchManager';
  const canCreateRequests = role === 'BranchManager';

  const [logDate, setLogDate] = useState(defaultLogDate());
  const [remarks, setRemarks] = useState('');
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  const [salesLines, setSalesLines] = useState<SalesLine[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<SoldMenuItemOption[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setIsLoadingMenu(true);
        const items = await fetchMenuItems();
        const mapped: SoldMenuItemOption[] = items.map(m => ({
          id: String(m.menuItemId),
          name: m.name,
          category: m.categoryName || 'Uncategorized',
          soldToday: 0
        }));
        setMenuItems(mapped);
      } catch (err) {
        setError('Failed to load menu items from HQ.');
      } finally {
        setIsLoadingMenu(false);
      }
    };
    void loadMenu();
  }, []);

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
        shift: 'Standard',
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
      <Box sx={{ pb: 3 }}>
        <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 0.5 }}>Create Consumption Log</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            This page is available for Branch Managers only.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3, display: 'grid', gap: 2.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <BackButton to="/consumption" />
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Add Consumption</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Create sales consumption transaction set for this day.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left card — Details */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '42%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            p: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
            <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Consumption Details</Typography>
          </Box>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <CalendarTodayRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Log Date
                  </Typography>
                </Box>
                <TextField
                  type="date"
                  value={logDate}
                  onChange={(event) => setLogDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <NotesRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Remarks
                  </Typography>
                </Box>
                <TextField
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  multiline
                  rows={4}
                  placeholder="Add any specific details about this log..."
                />
              </Box>
            </Grid>
          </Grid>

          {error ? (
            <Typography sx={{ color: 'error.main', fontSize: 12.5, mt: 2, p: 1.5, bgcolor: 'rgba(185, 28, 28, 0.05)', borderRadius: 2 }}>
              {error}
            </Typography>
          ) : null}
        </Paper>

        {/* Right card — Line Composer */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            p: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
              <LocalCafeRoundedIcon sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Line Composer</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<SearchRoundedIcon />}
                onClick={() => setIsSalesModalOpen(true)}
              >
                Select Sold Menu Items
              </Button>
            </Box>

            <DataTable
              data={salesLines}
              columns={salesColumns}
              keyExtractor={(line) => line.id}
              emptyMessage="No sales lines added yet. Use Select Sold Menu Items above."
              defaultRowsPerPage={5}
              pageSizes={[5, 10, 25]}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ mr: 'auto' }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                Total items: <strong>{salesLines.reduce((sum, l) => sum + l.quantitySold, 0)}</strong>
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => navigate({ to: '/consumption' })}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isSaving || salesLines.length === 0}>
              {isSaving ? 'Submitting...' : 'Submit Consumption'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <SalesMenuSelectionModal
        open={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        onItemsSelected={handleSalesItemsSelected}
        items={menuItems}
      />
    </Box>
  );
}
