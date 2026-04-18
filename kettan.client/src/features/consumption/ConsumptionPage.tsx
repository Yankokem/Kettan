import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import type { AxiosError } from 'axios';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { SearchInput } from '../../components/UI/SearchInput';
import { TextField } from '../../components/UI/TextField';
import {
  fetchConsumptionLogs,
  logDirectConsumption,
  logSalesConsumption,
  type ConsumptionLog,
} from '../branch-operations/api';

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Something went wrong.';
}

export function ConsumptionPage() {
  const [mode, setMode] = useState<'direct' | 'sales'>('direct');
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [menuItemId, setMenuItemId] = useState('');
  const [quantitySold, setQuantitySold] = useState('');
  const [shift, setShift] = useState('Morning');
  const [remarks, setRemarks] = useState('');

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rows = await fetchConsumptionLogs();
      setLogs(rows);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const filtered = useMemo(() => {
    const source = Array.isArray(logs) ? logs : [];
    const query = search.trim().toLowerCase();

    if (!query) {
      return source;
    }

    return source.filter((log) => {
      return (
        log.consumptionLogId.toString().includes(query) ||
        log.method.toLowerCase().includes(query) ||
        (log.shift ?? '').toLowerCase().includes(query) ||
        (log.remarks ?? '').toLowerCase().includes(query)
      );
    });
  }, [logs, search]);

  const columns: ColumnDef<ConsumptionLog>[] = [
    {
      key: 'consumptionLogId',
      label: 'Log ID',
      width: 110,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          CL-{row.consumptionLogId}
        </Typography>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      width: 130,
      render: (row) => {
        const isSales = row.method === 'Sales';
        return (
          <Chip
            icon={isSales ? <LocalCafeRoundedIcon sx={{ fontSize: 15 }} /> : <PrecisionManufacturingRoundedIcon sx={{ fontSize: 15 }} />}
            label={row.method}
            size="small"
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              color: isSales ? '#2563EB' : '#6B4C2A',
              bgcolor: isSales ? 'rgba(37,99,235,0.1)' : 'rgba(107,76,42,0.12)',
              border: `1px solid ${isSales ? 'rgba(37,99,235,0.25)' : 'rgba(107,76,42,0.25)'}`,
            }}
          />
        );
      },
    },
    {
      key: 'shift',
      label: 'Shift',
      width: 100,
      render: (row) => <Typography sx={{ fontSize: 13 }}>{row.shift ?? '--'}</Typography>,
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (row) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{row.remarks || '--'}</Typography>,
    },
    {
      key: 'logDate',
      label: 'Log Date',
      width: 130,
      sortable: true,
      render: (row) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(row.logDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      ),
    },
  ];

  const submitDirect = async () => {
    const parsedItemId = Number(itemId);
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
      setError('Item ID must be a positive whole number.');
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await logDirectConsumption({
        logDate: new Date().toISOString(),
        shift,
        remarks: remarks || undefined,
        items: [
          {
            itemId: parsedItemId,
            quantity: parsedQuantity,
            reason: remarks || 'Consumption',
          },
        ],
      });
      setItemId('');
      setQuantity('');
      setRemarks('');
      await loadLogs();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const submitSales = async () => {
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

    try {
      setIsSaving(true);
      setError(null);
      await logSalesConsumption({
        logDate: new Date().toISOString(),
        shift,
        remarks: remarks || undefined,
        sales: [
          {
            menuItemId: parsedMenuItemId,
            quantitySold: parsedQuantitySold,
          },
        ],
      });
      setMenuItemId('');
      setQuantitySold('');
      setRemarks('');
      await loadLogs();
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
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Log Branch Consumption</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.4 }}>
              Log direct wastage/usage or sales-based auto consumption.
            </Typography>
          </Box>
          <Dropdown
            value={mode}
            onChange={(event) => setMode(event.target.value as 'direct' | 'sales')}
            options={[
              { value: 'direct', label: 'Direct Consumption' },
              { value: 'sales', label: 'Sales Consumption' },
            ]}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.25,
            mb: 1.25,
          }}
        >
          {mode === 'direct' ? (
            <>
              <TextField label="Item ID" value={itemId} onChange={(event) => setItemId(event.target.value)} />
              <TextField label="Quantity" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </>
          ) : (
            <>
              <TextField label="Menu Item ID" value={menuItemId} onChange={(event) => setMenuItemId(event.target.value)} />
              <TextField label="Qty Sold" type="number" value={quantitySold} onChange={(event) => setQuantitySold(event.target.value)} />
            </>
          )}
          <Dropdown
            value={shift}
            onChange={(event) => setShift(String(event.target.value))}
            options={[
              { value: 'Morning', label: 'Morning Shift' },
              { value: 'Afternoon', label: 'Afternoon Shift' },
              { value: 'Evening', label: 'Evening Shift' },
            ]}
          />
        </Box>

        <TextField
          label="Remarks"
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          multiline
          rows={2}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
          <Button onClick={() => void (mode === 'direct' ? submitDirect() : submitSales())} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Submit Consumption Log'}
          </Button>
        </Box>

        {error ? (
          <Typography sx={{ color: 'error.main', fontSize: 12.5, mt: 1.2 }}>{error}</Typography>
        ) : null}
      </Paper>

      <DataTable
        title="Consumption History"
        data={filtered || []}
        columns={columns}
        keyExtractor={(row) => row.consumptionLogId.toString()}
        emptyMessage={isLoading ? 'Loading logs...' : 'No consumption logs yet.'}
        toolbar={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchInput
              placeholder="Search log id, method, shift..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 280, maxWidth: 420 }}
            />
            <Button variant="outlined" onClick={() => void loadLogs()} disabled={isLoading}>
              Refresh
            </Button>
          </Box>
        }
      />
    </Box>
  );
}
