import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Box, Paper, Typography } from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { BackButton } from '../../components/UI/BackButton';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormActions } from '../../components/Form/FormActions';
import {
  createInventoryItem,
  fetchInventoryItems,
  fetchItemCategories,
  generateBatchNumber,
  stockInInventoryItem,
  stockOutInventoryItem,
} from './hqInventoryApi';
import type { InventoryCategory, InventoryItem } from './types';
import { TransactionItemComposer } from './components/TransactionItemComposer';
import { TransactionItemsReview } from './components/TransactionItemsReview';
import {
  TRANSACTION_TYPE_OPTIONS,
  createEmptyTransactionItemDraft,
  type InventoryTransactionKind,
  type TransactionItemDraft,
  type TransactionLineItem,
} from './components/transactionModels';

const LINE_ID_PREFIX = 'txn-line';

const INVENTORY_UNITS = [
  { value: 'pc', label: 'Piece (pc)' },
  { value: 'pack', label: 'Pack (pack)' },
  { value: 'box', label: 'Box (box)' },
  { value: 'case', label: 'Case (case)' },
  { value: 'can', label: 'Can (can)' },
  { value: 'bottle', label: 'Bottle (bottle)' },
  { value: 'roll', label: 'Roll (roll)' },
];

function makeLineId() {
  return `${LINE_ID_PREFIX}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export default function InventoryTransactionPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { itemId?: string; itemIds?: string };

  const [catalogItems, setCatalogItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [transactionType, setTransactionType] = useState<InventoryTransactionKind>('Stock-In');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<TransactionLineItem[]>([]);
  const [draft, setDraft] = useState<TransactionItemDraft>(createEmptyTransactionItemDraft('existing'));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [prefillApplied, setPrefillApplied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      try {
        setIsLoadingCatalog(true);
        setLoadError(null);

        const [liveItems, liveCategories] = await Promise.all([
          fetchInventoryItems(),
          fetchItemCategories(),
        ]);

        if (!isMounted) {
          return;
        }

        setCatalogItems(liveItems);
        setCategories(liveCategories);
      } catch {
        if (!isMounted) {
          return;
        }

        setCatalogItems([]);
        setCategories([]);
        setLoadError('Unable to load inventory catalog from the API.');
      } finally {
        if (isMounted) {
          setIsLoadingCatalog(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const prefillIds = useMemo(() => {
    const ids: string[] = [];

    if (typeof search.itemId === 'string' && search.itemId.trim()) {
      ids.push(search.itemId.trim());
    }

    if (typeof search.itemIds === 'string' && search.itemIds.trim()) {
      ids.push(...search.itemIds.split(',').map((id) => id.trim()).filter(Boolean));
    }

    return Array.from(new Set(ids));
  }, [search.itemId, search.itemIds]);

  useEffect(() => {
    if (isLoadingCatalog || prefillApplied || prefillIds.length === 0 || catalogItems.length === 0) {
      return;
    }

    const preloadedItems: TransactionLineItem[] = prefillIds
      .map((id) => catalogItems.find((item) => item.id === id))
      .filter((item): item is InventoryItem => Boolean(item))
      .map((item) => ({
        id: makeLineId(),
        itemId: item.id,
        itemName: item.name,
        itemSku: item.sku,
        unit: item.unit || '',
        categoryName: item.category?.name,
        currentStock: item.totalStock,
        quantity: 1,
        unitCost: transactionType === 'Stock-In' ? item.unitCost : undefined,
        batchNumber: transactionType === 'Stock-In' ? generateBatchNumber(item.sku) : undefined,
        reason: transactionType !== 'Stock-In' ? draft.reason : undefined,
        isNewItem: false,
      }));

    if (preloadedItems.length > 0) {
      setItems((prev) => (prev.length > 0 ? prev : preloadedItems));
    }

    setPrefillApplied(true);
  }, [catalogItems, draft.reason, isLoadingCatalog, prefillApplied, prefillIds, transactionType]);

  useEffect(() => {
    if (transactionType !== 'Stock-In' && draft.mode === 'new') {
      setDraft((prev) => ({ ...prev, mode: 'existing' }));
    }
  }, [transactionType, draft.mode]);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories]
  );

  const unitOptions = INVENTORY_UNITS;

  const availableItems = useMemo(() => {
    const lockedItemIds = new Set(
      items
        .filter((_, index) => index !== editingIndex)
        .filter((line) => !line.isNewItem)
        .map((line) => line.itemId)
    );

    return catalogItems.filter((item) => !lockedItemIds.has(item.id));
  }, [catalogItems, items, editingIndex]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const estimatedValue = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * (item.unitCost || 0), 0),
    [items]
  );

  const resetDraft = (mode: TransactionItemDraft['mode'] = 'existing') => {
    setDraft(createEmptyTransactionItemDraft(mode));
    setComposerError(null);
  };

  const patchDraft = (patch: Partial<TransactionItemDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    if (composerError) {
      setComposerError(null);
    }
  };

  const getItemById = (itemId: string): InventoryItem | undefined =>
    catalogItems.find((item) => item.id === itemId);

  const handleTypeChange = (nextType: InventoryTransactionKind) => {
    if (nextType === transactionType) return;

    if (items.length > 0) {
      const confirmed = window.confirm('Changing transaction type will clear current item lines. Continue?');
      if (!confirmed) return;

      setItems([]);
      setEditingIndex(null);
    }

    setTransactionType(nextType);
    setComposerError(null);

    if (nextType !== 'Stock-In') {
      setReferenceNumber('');
      resetDraft('existing');
      return;
    }

    resetDraft('existing');
  };

  const handleModeChange = (mode: TransactionItemDraft['mode']) => {
    setDraft((prev) => ({
      ...createEmptyTransactionItemDraft(mode),
      reason: prev.reason,
    }));
    setComposerError(null);
  };

  const handleComposerSubmit = () => {
    const quantity = parsePositiveNumber(draft.quantity);
    if (quantity === null) {
      setComposerError('Enter a valid quantity greater than zero.');
      return;
    }

    if (draft.mode === 'existing') {
      const selectedItem = getItemById(draft.selectedItemId);

      if (!selectedItem) {
        setComposerError('Select an existing item from the catalog first.');
        return;
      }

      if (transactionType !== 'Stock-In' && quantity > selectedItem.totalStock) {
        setComposerError('Quantity cannot exceed current stock for this transaction type.');
        return;
      }

      const unitCost = parsePositiveNumber(draft.unitCost);
      if (transactionType === 'Stock-In' && unitCost === null) {
        setComposerError('Enter a valid unit cost for Stock-In transactions.');
        return;
      }

      const nextLine: TransactionLineItem = {
        id: editingIndex !== null ? items[editingIndex].id : makeLineId(),
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        itemSku: selectedItem.sku,
        unit: selectedItem.unit || '',
        categoryName: selectedItem.category?.name,
        currentStock: selectedItem.totalStock,
        quantity,
        unitCost: transactionType === 'Stock-In' ? unitCost || selectedItem.unitCost : undefined,
        batchNumber: transactionType === 'Stock-In' ? generateBatchNumber(selectedItem.sku) : undefined,
        expiryDate: transactionType === 'Stock-In' && draft.expiryDate ? draft.expiryDate : undefined,
        reason: transactionType !== 'Stock-In' ? draft.reason : undefined,
        isNewItem: false,
      };

      if (editingIndex !== null) {
        setItems((prev) => prev.map((line, index) => (index === editingIndex ? nextLine : line)));
      } else {
        setItems((prev) => [...prev, nextLine]);
      }

      setEditingIndex(null);
      resetDraft(transactionType === 'Stock-In' ? draft.mode : 'existing');
      return;
    }

    if (transactionType !== 'Stock-In') {
      setComposerError('Quick create is only available for Stock-In transactions.');
      return;
    }

    if (!draft.newItemName.trim()) {
      setComposerError('Enter a name for the new inventory item.');
      return;
    }

    const unit = INVENTORY_UNITS.find((entry) => entry.value === draft.newUnit);
    if (!unit) {
      setComposerError('Select a valid unit for the new item.');
      return;
    }

    const unitCost = parsePositiveNumber(draft.unitCost);
    if (unitCost === null) {
      setComposerError('Enter a valid unit cost for the new item.');
      return;
    }

    const sku = draft.newSku.trim() || `NEW-${Date.now().toString().slice(-6)}`;

    const nextLine: TransactionLineItem = {
      id: editingIndex !== null ? items[editingIndex].id : makeLineId(),
      itemId: `new-${Date.now()}`,
      itemName: draft.newItemName.trim(),
      itemSku: sku,
      unit: unit.value,
      categoryName: categories.find((entry) => entry.id === draft.newCategoryId)?.name,
      currentStock: 0,
      quantity,
      unitCost,
      batchNumber: generateBatchNumber(sku),
      expiryDate: draft.expiryDate || undefined,
      reason: undefined,
      isNewItem: true,
      newCategoryId: draft.newCategoryId,
      newUnit: draft.newUnit,
    };

    if (editingIndex !== null) {
      setItems((prev) => prev.map((line, index) => (index === editingIndex ? nextLine : line)));
    } else {
      setItems((prev) => [...prev, nextLine]);
    }

    setEditingIndex(null);
    resetDraft('new');
  };

  const handleEditLine = (index: number) => {
    const line = items[index];

    setEditingIndex(index);
    setComposerError(null);
    setDraft({
      mode: line.isNewItem ? 'new' : 'existing',
      searchQuery: line.itemName,
      selectedItemId: line.isNewItem ? '' : line.itemId,
      newItemName: line.isNewItem ? line.itemName : '',
      newSku: line.isNewItem ? line.itemSku : '',
      newCategoryId: line.newCategoryId || '',
      newUnit: line.newUnit || '',
      quantity: String(line.quantity),
      unitCost: line.unitCost?.toString() || '',
      expiryDate: line.expiryDate || '',
      reason: line.reason || 'Wastage',
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    resetDraft('existing');
  };

  const handleRemoveLine = (index: number) => {
    setItems((prev) => prev.filter((_, lineIndex) => lineIndex !== index));

    if (editingIndex === index) {
      handleCancelEdit();
      return;
    }

    if (editingIndex !== null && index < editingIndex) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleSaveTransaction = async () => {
    if (items.length === 0) {
      alert('Add at least one item line before saving.');
      return;
    }

    if (transactionType === 'Stock-In' && !referenceNumber.trim()) {
      alert('Reference number is required for Stock-In transactions.');
      return;
    }

    if (transactionType !== 'Stock-In' && !remarks.trim()) {
      alert('Remarks are required for Stock-Out and Adjustment transactions.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const sharedRemarks = (() => {
        const trimmedRemarks = remarks.trim();
        if (transactionType === 'Stock-In' && referenceNumber.trim()) {
          return trimmedRemarks
            ? `Ref ${referenceNumber.trim()} | ${trimmedRemarks}`
            : `Ref ${referenceNumber.trim()}`;
        }

        return trimmedRemarks || undefined;
      })();

      for (const line of items) {
        let resolvedItemId = line.itemId;

        if (line.isNewItem) {
          if (!line.newUnit) {
            throw new Error('New item is missing unit information.');
          }

          const createdItem = await createInventoryItem({
            sku: line.itemSku,
            name: line.itemName,
            unit: line.newUnit,
            inventoryCategoryId: line.newCategoryId || undefined,
            defaultThreshold: 0,
            unitCost: line.unitCost ?? 0,
          });

          resolvedItemId = createdItem.id;
        }

        if (transactionType === 'Stock-In') {
          await stockInInventoryItem(resolvedItemId, {
            quantity: line.quantity,
            batchNumber: line.batchNumber || generateBatchNumber(line.itemSku),
            expiryDate: line.expiryDate,
            unitCost: line.unitCost,
            remarks: sharedRemarks,
          });

          continue;
        }

        await stockOutInventoryItem(resolvedItemId, {
          quantity: line.quantity,
          reason: transactionType === 'Adjustment' ? 'Adjustment' : line.reason || 'Wastage',
          remarks: sharedRemarks,
        });
      }

      navigate({ to: '/hq-inventory' });
    } catch {
      setSaveError('Unable to save this transaction to the API.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/hq-inventory" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            New Inventory Transaction
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            {isLoadingCatalog
              ? 'Fetching latest catalog data in background...'
              : 'Record stock movement with a single, unified flow for existing and quick-created items.'}
          </Typography>
        </Box>
      </Box>

      {(loadError || saveError) && (
        <Typography sx={{ fontSize: 13, color: 'error.main', mb: 2 }}>
          {saveError || loadError}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left card — Transaction Details */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '38%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 3.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
            Transaction Details
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormDropdown
              label="Transaction Type"
              value={transactionType}
              onChange={(event) => handleTypeChange(String(event.target.value) as InventoryTransactionKind)}
              options={TRANSACTION_TYPE_OPTIONS}
              fullWidth
            />

            {transactionType === 'Stock-In' && (
              <FormTextField
                label="Reference / Invoice Number"
                value={referenceNumber}
                placeholder="INV-2026-001"
                onChange={(event) => setReferenceNumber(event.target.value)}
              />
            )}

            <FormTextField
              label={transactionType === 'Stock-In' ? 'Remarks (Optional)' : 'Remarks / Reason'}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              multiline
              rows={4}
              placeholder="Add context for this transaction"
            />
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: 'text.primary', mb: 1.75 }}>
              Transaction Snapshot
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 1.25, columnGap: 1.5 }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Lines Added</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right' }}>{items.length}</Typography>

              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Total Quantity</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right' }}>{totalQuantity}</Typography>

              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Estimated Value</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right' }}>
                ₱{estimatedValue.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Right card — Item Entry + Review + Actions */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: 3.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <TransactionItemComposer
            transactionType={transactionType}
            draft={draft}
            availableItems={availableItems}
            categoryOptions={categoryOptions}
            unitOptions={unitOptions}
            editingIndex={editingIndex}
            errorMessage={composerError}
            onModeChange={handleModeChange}
            onDraftChange={patchDraft}
            onSubmit={handleComposerSubmit}
            onCancelEdit={handleCancelEdit}
          />

          <TransactionItemsReview
            items={items}
            transactionType={transactionType}
            onEdit={handleEditLine}
            onRemove={handleRemoveLine}
          />

          <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormActions
              cancelTo="/hq-inventory"
              saveText={isSaving ? 'Saving...' : 'Save Transaction'}
              saveIcon={<ReceiptLongRoundedIcon />}
              onSave={handleSaveTransaction}
              saveDisabled={items.length === 0 || isSaving}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}