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
import { ProfileImageUploader } from '../../components/UI/ProfileImageUploader';
import { BatchList } from './components/BatchList';
import { TransactionsTable } from './components/TransactionsTable';
import { AdjustmentModal } from './components/AdjustmentModal';
import {
  fetchInventoryItemDetail,
  fetchInventoryItemTransactions,
  fetchItemCategories,
  fetchUnits,
  updateInventoryItem,
} from './hqInventoryApi';
import type {
  AdjustmentFormData,
  Batch,
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
  Unit,
} from './types';

interface ItemFormState {
  name: string;
  sku: string;
  categoryId: string;
  unitId: string;
  defaultThreshold: string;
  unitCost: string;
  imageUrl?: string | null;
  imageFile?: File | null;
}

function toItemFormState(item: InventoryItem): ItemFormState {
  return {
    name: item.name,
    sku: item.sku,
    categoryId: item.categoryId,
    unitId: item.unitId,
    defaultThreshold: String(item.defaultThreshold),
    unitCost: String(item.unitCost),
    imageUrl: item.imageUrl,
  };
}

export function InventoryItemProfilePage() {
  const { itemId } = useParams({ from: '/layout/hq-inventory/$itemId' });
  const navigate = useNavigate();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
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

        const [detail, liveCategories, liveUnits] = await Promise.all([
          fetchInventoryItemDetail(itemId),
          fetchItemCategories(),
          fetchUnits(),
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
        setUnits(liveUnits);
        setForm(toItemFormState(detail.item));
      } catch {
        if (!isMounted) {
          return;
        }

        setItem(null);
        setBatches([]);
        setTransactions([]);
        setCategories([]);
        setUnits([]);
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

  const selectedUnit = useMemo(() => {
    if (!item) {
      return undefined;
    }

    if (!form?.unitId) {
      return item.unit;
    }

    return units.find((unit) => unit.id === form.unitId) ?? item.unit;
  }, [form?.unitId, item, units]);

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

    if (!form.unitId) {
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

      let uploadedImageUrl = form.imageUrl;

      if (form.imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', form.imageFile);
        const uploadRes = await fetch('/api/uploads/image', {
          method: 'POST',
          credentials: 'include',
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedImageUrl = uploadData.Url ?? uploadData.url ?? null;
          console.log('[Upload] Inventory item image updated URL:', uploadedImageUrl);
        }
      }

      await updateInventoryItem(item.id, {
        sku: form.sku,
        name: form.name,
        unitId: form.unitId,
        itemCategoryId: form.categoryId || undefined,
        defaultThreshold: threshold,
        unitCost,
        imageUrl: uploadedImageUrl,
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

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">Loading item details...</Typography>
      </Box>
    );
  }

  if (!item) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">{errorMessage || 'Item not found'}</Typography>
      </Box>
    );
  }

  const isLowStock = item.totalStock <= defaultThreshold;
  const costChange = item.previousUnitCost
    ? ((currentUnitCost - item.previousUnitCost) / item.previousUnitCost) * 100
    : 0;

  const categoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];

  const unitOptions = units.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.symbol})` }));

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
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{item.name}</Typography>
              {isLowStock && (
                <Chip
                  icon={<WarningRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Low Stock"
                  size="small"
                  sx={{
                    bgcolor: 'error.main',
                    color: 'white',
                    fontWeight: 600,
                    height: 24,
                    '& .MuiChip-icon': { color: 'white' },
                  }}
                />
              )}
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', fontFamily: 'monospace', mt: 0.5 }}>
              SKU: {item.sku}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<CallReceivedRoundedIcon />}
            onClick={() => navigate({ to: '/hq-inventory/transaction', search: { itemId: item.id } })}
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
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 3 }}>Item Details</Typography>

            {/* Quick Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: isLowStock ? 'error.main' : 'text.primary' }}>
                  {item.totalStock}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
                  {selectedUnit?.symbol} Stock
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
                  Per {selectedUnit?.symbol}
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

            <Box sx={{ mb: 3 }}>
              <ProfileImageUploader
                imageFile={form?.imageFile ?? undefined}
                imageUrl={form?.imageUrl ?? item.imageUrl}
                onFileChange={(file) => setForm(prev => prev ? { ...prev, imageFile: file } : null)}
                readOnly={!isEditing}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Form Fields */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <FormTextField
                label="Item Name"
                value={form?.name ?? item.name}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                disabled={!isEditing}
              />
              <FormTextField
                label="SKU"
                value={form?.sku ?? item.sku}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, sku: event.target.value } : prev))}
                disabled={!isEditing}
              />
              <FormDropdown
                label="Category"
                value={form?.categoryId ?? item.categoryId}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, categoryId: String(event.target.value) } : prev))}
                options={categoryOptions}
                disabled={!isEditing}
              />
              <FormDropdown
                label="Unit of Measure"
                value={form?.unitId ?? item.unitId}
                onChange={(event) => setForm((prev) => (prev ? { ...prev, unitId: String(event.target.value) } : prev))}
                options={unitOptions}
                disabled={!isEditing}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormTextField
                    label="Reorder Threshold"
                    type="number"
                    value={form?.defaultThreshold ?? String(item.defaultThreshold)}
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
                    value={form?.unitCost ?? String(item.unitCost)}
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
                    Previous cost: ₱{item.previousUnitCost}
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
          </Paper>
        </Box>

        {/* Right Column - Batches & Transactions */}
        <Box sx={{ width: { xs: '100%', md: '60%' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Batches Section */}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
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
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
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