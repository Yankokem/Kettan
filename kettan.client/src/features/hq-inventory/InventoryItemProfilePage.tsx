import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Chip, Divider, Grid, Stack } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Button } from '../../components/UI/Button';
import { PageHeader } from '../../components/UI/PageHeader';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { TransactionsTable } from './components/TransactionsTable';
import { AdjustmentModal } from './components/AdjustmentModal';
import {
  fetchInventoryItemDetail,
  fetchInventoryItemTransactions,
  fetchItemCategories,
  updateInventoryItem,
} from './hqInventoryApi';
import { listSuppliers, type Supplier } from './supplierApi';
import type {
  AdjustmentFormData,
  Batch,
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
} from './types';

// Kettan Brand Colors
const KETTAN_BROWN = '#6D4C41';
const KETTAN_LABEL = '#8D6E63';

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

function InfoRow({ 
  label, 
  value, 
  editing = false, 
  children,
  color = 'text.primary'
}: { 
  label: string; 
  value?: string | number | React.ReactNode; 
  editing?: boolean; 
  children?: React.ReactNode;
  color?: string;
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ 
        fontSize: 13, 
        fontWeight: 700, 
        color: KETTAN_LABEL, 
        textTransform: 'none', 
        mb: 0.5
      }}>
        {label}
      </Typography>
      {editing ? (
        <Box sx={{ mt: 1 }}>{children}</Box>
      ) : (
        <Typography component="div" sx={{ fontSize: 13, fontWeight: 500, color }}>
          {value ?? '-'}
        </Typography>
      )}
    </Box>
  );
}

export function InventoryItemProfilePage() {
  const { itemId } = useParams({ from: '/layout/hq-inventory/$itemId' });
  const navigate = useNavigate();

  const [item, setItem] = useState<InventoryItem | null>(null);

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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

        const [detail, liveCategories, liveSuppliers] = await Promise.all([
          fetchInventoryItemDetail(itemId),
          fetchItemCategories(),
          listSuppliers(),
        ]);

        const liveTransactions = await fetchInventoryItemTransactions(itemId, {
          item: detail.item,
          batches: detail.batches,
        }).catch(() => []);

        if (!isMounted) {
          return;
        }

        setItem(detail.item);

        setTransactions(liveTransactions);
        setCategories(liveCategories);
        setSuppliers(liveSuppliers);
        setForm(toItemFormState(detail.item));
      } catch {
        if (!isMounted) {
          return;
        }

        setItem(null);

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
        inventoryCategoryId: form.categoryId || undefined,
        defaultThreshold: threshold,
        unitCost,
      });

      const refreshedDetail = await fetchInventoryItemDetail(item.id);
      const refreshedTransactions = await fetchInventoryItemTransactions(item.id, {
        item: refreshedDetail.item,
        batches: refreshedDetail.batches,
      }).catch(() => []);

      setItem(refreshedDetail.item);

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



  const handleAdjustmentConfirm = (data: AdjustmentFormData) => {
    console.log('Adjustment confirmed:', data);
    setAdjustmentOpen(false);
    setSelectedBatch(null);
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header */}
      <PageHeader
        title="Item Profile"
        description="View and manage item information and stock levels."
        backTo="/hq-inventory"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<CallReceivedRoundedIcon />}
              onClick={() => navigate({ to: '/hq-inventory/transaction', search: { itemId: item?.id || '' } })}
            >
              New Transaction
            </Button>
            {!isEditing ? (
              <Button 
                startIcon={<EditRoundedIcon />} 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Stack>
            )}
          </Box>
        }
      />

      {saveError && (
        <Typography sx={{ fontSize: 13, color: 'error.main', mb: 2, px: 1 }}>
          {saveError}
        </Typography>
      )}

      {/* Main Grid */}
      <Grid container spacing={4}>
        {/* Left Column - COMPREHENSIVE Item Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: '24px',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            {/* Header / Summary Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
               <Box 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: '16px', 
                  bgcolor: 'action.hover', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Inventory2RoundedIcon sx={{ fontSize: 32, color: KETTAN_BROWN }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                  {item?.name || '...'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label={item?.category?.name || 'Uncategorized'} 
                    size="small" 
                    sx={{ fontWeight: 800, fontSize: 11, height: 22, bgcolor: KETTAN_BROWN, color: 'background.paper' }} 
                  />
                  {isLowStock && (
                    <Chip 
                      label="Low Stock" 
                      size="small" 
                      color="error"
                      sx={{ fontWeight: 800, fontSize: 11, height: 22 }} 
                    />
                  )}
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Specifications Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <BadgeRoundedIcon sx={{ fontSize: 20, color: KETTAN_BROWN }} />
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: KETTAN_BROWN }}>
                  Item Specifications
                </Typography>
              </Box>
              <Stack spacing={0.5}>
                <InfoRow 
                  label="SKU / Barcode" 
                  value={item?.sku} 
                  editing={isEditing}
                >
                  <FormTextField
                    value={form?.sku ?? ''}
                    label="Update SKU"
                    onChange={(e) => setForm(f => f ? { ...f, sku: e.target.value } : f)}
                    size="small"
                    fullWidth
                  />
                </InfoRow>
                <InfoRow 
                  label="Category" 
                  value={item?.category?.name || 'Uncategorized'} 
                  editing={isEditing}
                >
                  <FormDropdown
                    value={form?.categoryId ?? ''}
                    label="Update Category"
                    onChange={(e) => setForm(f => f ? { ...f, categoryId: String(e.target.value) } : f)}
                    options={categoryOptions}
                    size="small"
                    fullWidth
                  />
                </InfoRow>
                <InfoRow 
                  label="Unit of Measure" 
                  value={item?.unit} 
                />
                <InfoRow 
                  label="Linked Suppliers" 
                  value={
                    item?.supplierIds && item.supplierIds.length > 0
                      ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                          {item.supplierIds.map((sid, idx) => {
                            const supplier = suppliers.find(s => String(s.supplierId) === sid);
                            if (!supplier) return null;
                            const isLatest = idx === item.supplierIds!.length - 1;
                            return (
                              <Chip
                                key={sid}
                                label={isLatest ? `${supplier.name} (Active)` : supplier.name}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  bgcolor: isLatest ? 'rgba(84,107,63,0.12)' : 'action.hover',
                                  color: isLatest ? '#546B3F' : 'text.secondary',
                                  border: `1px solid ${isLatest ? 'rgba(84,107,63,0.25)' : 'divider'}`,
                                }}
                              />
                            );
                          })}
                        </Box>
                      )
                      : 'Not Linked'
                  }
                />
              </Stack>
            </Box>

            <Divider />

            {/* Pricing Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <PaymentsRoundedIcon sx={{ fontSize: 20, color: KETTAN_BROWN }} />
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: KETTAN_BROWN }}>
                  Inventory & Pricing
                </Typography>
              </Box>
              <Stack spacing={0.5}>
                <InfoRow 
                  label="Weighted Average Cost" 
                  value={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      ₱{currentUnitCost}
                      {costChange !== 0 && (
                        <Chip
                          label={`${costChange > 0 ? '+' : ''}${costChange.toFixed(1)}%`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 10,
                            fontWeight: 800,
                            bgcolor: costChange > 0 ? 'error.light' : 'success.light',
                            color: costChange > 0 ? 'error.dark' : 'success.dark',
                            border: 'none'
                          }}
                        />
                      )}
                    </Box>
                  }
                  editing={isEditing}
                >
                  <FormTextField
                    type="number"
                    label="Override Base Cost"
                    value={form?.unitCost ?? ''}
                    onChange={(e) => setForm(f => f ? { ...f, unitCost: e.target.value } : f)}
                    size="small"
                    fullWidth
                  />
                </InfoRow>
                <InfoRow 
                  label="Reorder Threshold" 
                  value={`${item?.defaultThreshold ?? 0} ${selectedUnit}`}
                  editing={isEditing}
                >
                  <FormTextField
                    type="number"
                    label="Low Stock Warning"
                    value={form?.defaultThreshold ?? ''}
                    onChange={(e) => setForm(f => f ? { ...f, defaultThreshold: e.target.value } : f)}
                    size="small"
                    fullWidth
                  />
                </InfoRow>
              </Stack>
            </Box>

            <Divider />

            {/* System Info */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <NotificationsActiveRoundedIcon sx={{ fontSize: 20, color: KETTAN_BROWN }} />
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: KETTAN_BROWN }}>
                  System Metrics
                </Typography>
              </Box>
              <Stack spacing={0.5}>
                <InfoRow 
                  label="Total Inventory" 
                  value={`${item?.totalStock ?? 0} ${selectedUnit}`}
                  color={isLowStock ? 'error.main' : 'text.primary'}
                />
                <InfoRow 
                  label="Last Transaction" 
                  value={item?.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                />
                <InfoRow 
                  label="Item System ID" 
                  value={String(item?.id).padStart(6, '0')}
                />
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Batches & History */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>


            {/* History Table */}
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: '24px' }}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: KETTAN_BROWN, mb: 3 }}>
                Transaction History
              </Typography>
              <TransactionsTable transactions={transactions} compact />
            </Paper>
          </Stack>
        </Grid>
      </Grid>

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