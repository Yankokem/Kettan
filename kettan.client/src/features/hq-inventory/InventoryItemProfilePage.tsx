import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Button } from '../../components/UI/Button';
import { BackButton } from '../../components/UI/BackButton';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { BatchList } from './components/BatchList';
import { TransactionsTable } from './components/TransactionsTable';
import { AdjustmentModal } from './components/AdjustmentModal';
import {
  fetchInventoryItemDetail,
  fetchInventoryItemTransactions,
  fetchItemCategories,
  updateInventoryItem,
} from './hqInventoryApi';
import type {
  AdjustmentFormData,
  Batch,
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
} from './types';

interface ItemFormState {
  name: string;
  sku: string;
  categoryId: string;
  unit: string;
  defaultThreshold: string;
  unitCost: string;
}

function toItemFormState(item: InventoryItem): ItemFormState {
  return {
    name: item.name,
    sku: item.sku,
    categoryId: item.categoryId,
    unit: item.unit,
    defaultThreshold: String(item.defaultThreshold),
    unitCost: String(item.unitCost),
  };
}

export function InventoryItemProfilePage() {
  const { itemId } = useParams({ from: '/layout/hq-inventory/$itemId' });
  const navigate = useNavigate();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [form, setForm] = useState<ItemFormState | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadItem = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setSaveError(null);

        const [detail, liveCategories] = await Promise.all([
          fetchInventoryItemDetail(itemId),
          fetchItemCategories(),
        ]);

        const liveTransactions = await fetchInventoryItemTransactions(itemId, {
          item: detail.item,
          batches: detail.batches,
        }).catch(() => []);

        if (!isMounted) {
          return;
        }

        setItem(detail.item);
        setBatches(detail.batches);
        setTransactions(liveTransactions);
        setCategories(liveCategories);
        setForm(toItemFormState(detail.item));
      } catch {
        if (!isMounted) {
          return;
        }

        setItem(null);
        setBatches([]);
        setTransactions([]);
        setCategories([]);
        setForm(null);
        setErrorMessage('Unable to load item details from the API.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadItem();

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  const defaultThreshold = useMemo(() => {
    if (!form) {
      return item?.defaultThreshold ?? 0;
    }

    const parsed = Number(form.defaultThreshold);
    return Number.isFinite(parsed) ? parsed : item?.defaultThreshold ?? 0;
  }, [form, item]);

  const currentUnitCost = useMemo(() => {
    if (!form) {
      return item?.unitCost ?? 0;
    }

    const parsed = Number(form.unitCost);
    return Number.isFinite(parsed) ? parsed : item?.unitCost ?? 0;
  }, [form, item]);

  const selectedUnit = form?.unit ?? item?.unit ?? '';

  const handleCancelEdit = () => {
    if (item) {
      setForm(toItemFormState(item));
    }

    setSaveError(null);
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!item || !form) {
      return;
    }

    const threshold = Number(form.defaultThreshold);
    const unitCost = Number(form.unitCost);

    if (!form.name.trim() || !form.sku.trim()) {
      setSaveError('Item name and SKU are required.');
      return;
    }

    if (!form.unit) {
      setSaveError('Unit of measure is required.');
      return;
    }

    if (!Number.isFinite(threshold) || threshold < 0) {
      setSaveError('Reorder threshold must be zero or greater.');
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setSaveError('Unit cost must be zero or greater.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      await updateInventoryItem(item.id, {
        sku: form.sku,
        name: form.name,
        unit: form.unit,
        itemCategoryId: form.categoryId || undefined,
        defaultThreshold: threshold,
        unitCost,
      });

      const refreshedDetail = await fetchInventoryItemDetail(item.id);
      const refreshedTransactions = await fetchInventoryItemTransactions(item.id, {
        item: refreshedDetail.item,
        batches: refreshedDetail.batches,
      }).catch(() => []);

      setItem(refreshedDetail.item);
      setBatches(refreshedDetail.batches);
      setTransactions(refreshedTransactions);
      setForm(toItemFormState(refreshedDetail.item));
      setIsEditing(false);
    } catch {
      setSaveError('Unable to save item changes right now.');
    } finally {
      setIsSaving(false);
    }
  };


  if (!item && !isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">{errorMessage || 'Item not found'}</Typography>
      </Box>
    );
  }

  const isLowStock = item ? item.totalStock <= defaultThreshold : false;
  const costChange = item?.previousUnitCost
    ? ((currentUnitCost - item.previousUnitCost) / item.previousUnitCost) * 100
    : 0;

  const categoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];

  const unitOptions = [
    { value: 'pc', label: 'Piece (pc)' },
    { value: 'pack', label: 'Pack (pack)' },
    { value: 'box', label: 'Box (box)' },
    { value: 'case', label: 'Case (case)' },
    { value: 'can', label: 'Can (can)' },
    { value: 'bottle', label: 'Bottle (bottle)' },
    { value: 'roll', label: 'Roll (roll)' },
  ];

  const handleAdjustBatch = (batchId: string) => {
    const batch = batches.find((entry) => entry.id === batchId);
    if (batch) {
      setSelectedBatch(batch);
      setAdjustmentOpen(true);
    }
  };

  const handleAdjustmentConfirm = (data: AdjustmentFormData) => {
    console.log('Adjustment confirmed:', data);
    setAdjustmentOpen(false);
    setSelectedBatch(null);
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/hq-inventory" />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Item Profile</Typography>
              {isLowStock && (
                <Chip
                  icon={<WarningRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Low Stock"
                  size="small"
                  sx={{
                    bgcolor: 'error.main',
                    color: 'white',
                    fontWeight: 700,
                    height: 24,
                    '& .MuiChip-icon': { color: 'white' },
                  }}
                />
              )}
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
              Manage item details and history
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<CallReceivedRoundedIcon />}
            onClick={() => navigate({ to: '/hq-inventory/transaction', search: { itemId: item?.id || '' } })}
          >
            New Transaction
          </Button>
          {!isEditing ? (
            <Button startIcon={<EditRoundedIcon />} onClick={() => setIsEditing(true)}>
              Edit Item
            </Button>
          ) : (
            <>
              <Button variant="outlined" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {saveError && (
        <Typography sx={{ fontSize: 13, color: 'error.main', mb: 2 }}>
          {saveError}
        </Typography>
      )}

      {/* Two Column Layout */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Column - Item Details */}
        <Box sx={{ width: { xs: '100%', md: '40%' } }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', overflow: 'hidden', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Hero Header — name & SKU on warm gradient */}
            <Box
              sx={{
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(170deg, rgba(46, 31, 20, 0.96) 0%, rgba(58, 39, 24, 0.92) 100%)'
                    : 'linear-gradient(170deg, rgba(250, 245, 239, 0.98) 0%, rgba(240, 230, 211, 0.98) 100%)',
                px: 3,
                pt: 3,
                pb: 2.5,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'radial-gradient(ellipse at 80% 20%, rgba(201,168,77,0.08) 0%, transparent 62%)'
                      : 'radial-gradient(ellipse at 80% 20%, rgba(201,168,77,0.12) 0%, transparent 62%)',
                  pointerEvents: 'none',
                },
              }}
            >
              {isLowStock && (
                <Chip
                  icon={<WarningRoundedIcon sx={{ fontSize: 14 }} />}
                  label="Low Stock"
                  size="small"
                  sx={{
                    mb: 1.5,
                    bgcolor: 'rgba(220,38,38,0.85)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 11,
                    height: 22,
                    backdropFilter: 'blur(4px)',
                    '& .MuiChip-icon': { color: 'white' },
                  }}
                />
              )}
              <Typography sx={{ fontSize: 26, fontWeight: 800, color: (theme) => (theme.palette.mode === 'dark' ? '#E8D3A9' : '#2E1F0C'), lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                {item?.name || '...'}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: (theme) => (theme.palette.mode === 'dark' ? 'rgba(232,211,169,0.72)' : 'rgba(140,107,67,0.9)'), fontFamily: 'monospace', mt: 0.75, letterSpacing: '0.04em' }}>
                SKU: {item?.sku || '...'}
              </Typography>
            </Box>

            {/* Body */}
            <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Quick Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: isLowStock ? 'error.main' : 'text.primary' }}>
                  {item?.totalStock ?? 0}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
                  {selectedUnit} Stock
                </Typography>
              </Box>
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
                    ₱{currentUnitCost}
                  </Typography>
                  {costChange !== 0 && (
                    costChange > 0 ? (
                      <TrendingUpRoundedIcon sx={{ fontSize: 18, color: 'error.main' }} />
                    ) : (
                      <TrendingDownRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    )
                  )}
                </Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
                  Per {selectedUnit}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
                  {batches.length}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
                  Batches
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Form Fields */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <FormTextField
                label="Item Name"
                value={form?.name ?? item?.name ?? ''}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                disabled={!isEditing}
              />
              <FormTextField
                label="SKU"
                value={form?.sku ?? item?.sku ?? ''}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, sku: event.target.value } : prev))}
                disabled={!isEditing}
              />
              <FormDropdown
                label="Category"
                value={form?.categoryId ?? item?.categoryId ?? ''}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, categoryId: String(event.target.value) } : prev))}
                options={categoryOptions}
                disabled={!isEditing}
              />
              <FormDropdown
                label="Unit of Measure"
                value={form?.unit ?? item?.unit ?? ''}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, unit: String(event.target.value) } : prev))}
                options={unitOptions}
                disabled={!isEditing}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormTextField
                    label="Reorder Threshold"
                    type="number"
                    value={form?.defaultThreshold ?? (item ? String(item.defaultThreshold) : '0')}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, defaultThreshold: event.target.value } : prev))
                    }
                    disabled={!isEditing}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormTextField
                    label={`Unit Cost (₱)`}
                    type="number"
                    value={form?.unitCost ?? (item ? String(item.unitCost) : '0')}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, unitCost: event.target.value } : prev))
                    }
                    disabled={!isEditing}
                  />
                </Box>
              </Box>
              {costChange !== 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    Previous cost: ₱{item?.previousUnitCost || 0}
                  </Typography>
                  <Chip
                    label={`${costChange > 0 ? '+' : ''}${costChange.toFixed(1)}%`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: costChange > 0 ? 'error.light' : 'success.light',
                      color: costChange > 0 ? 'error.dark' : 'success.dark',
                    }}
                  />
                </Box>
              )}
            </Box>
            </Box>{/* end Body */}
          </Paper>
        </Box>

        {/* Right Column - Batches & Transactions */}
        <Box sx={{ width: { xs: '100%', md: '60%' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Batches Section */}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 3 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
              Batches ({batches.length})
            </Typography>
            {selectedUnit && (
              <BatchList
                batches={batches}
                unit={selectedUnit}
                onAdjust={handleAdjustBatch}
              />
            )}
          </Paper>

          {/* Recent Transactions Section */}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 3 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
              Recent Transactions
            </Typography>
            <TransactionsTable transactions={transactions} compact />
          </Paper>
        </Box>
      </Box>

      {/* Modals */}
      <AdjustmentModal
        open={adjustmentOpen}
        onClose={() => { setAdjustmentOpen(false); setSelectedBatch(null); }}
        onConfirm={handleAdjustmentConfirm}
        batch={selectedBatch}
        item={item}
      />
    </Box>
  );
}