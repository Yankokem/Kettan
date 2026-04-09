import { useMemo } from 'react';
import { Box, Paper, Typography, Chip, Alert } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { SearchInput } from '../../../components/UI/SearchInput';
import { FormDropdown } from '../../../components/Form/FormDropdown';
import { FormTextField } from '../../../components/Form/FormTextField';
import { Button } from '../../../components/UI/Button';
import type { InventoryItem } from '../types';
import {
  STOCK_OUT_REASON_OPTIONS,
  type InventoryTransactionKind,
  type TransactionEntryMode,
  type TransactionItemDraft,
} from './transactionModels';

interface Option {
  value: string;
  label: string;
}

interface TransactionItemComposerProps {
  transactionType: InventoryTransactionKind;
  draft: TransactionItemDraft;
  availableItems: InventoryItem[];
  categoryOptions: Option[];
  unitOptions: Option[];
  editingIndex: number | null;
  errorMessage: string | null;
  onModeChange: (mode: TransactionEntryMode) => void;
  onDraftChange: (patch: Partial<TransactionItemDraft>) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
}

export function TransactionItemComposer({
  transactionType,
  draft,
  availableItems,
  categoryOptions,
  unitOptions,
  editingIndex,
  errorMessage,
  onModeChange,
  onDraftChange,
  onSubmit,
  onCancelEdit,
}: TransactionItemComposerProps) {
  const allowQuickCreate = transactionType === 'Stock-In';

  const filteredItems = useMemo(() => {
    const query = draft.searchQuery.trim().toLowerCase();
    if (!query) return availableItems;

    return availableItems.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      (item.category?.name || '').toLowerCase().includes(query)
    );
  }, [availableItems, draft.searchQuery]);

  const selectedItem = useMemo(
    () => availableItems.find((item) => item.id === draft.selectedItemId),
    [availableItems, draft.selectedItemId]
  );

  const quantityLabel =
    transactionType === 'Stock-Out'
      ? 'Quantity Deducted'
      : transactionType === 'Adjustment'
        ? 'Adjusted Quantity'
        : 'Quantity Received';

  const existingItemOptions: Option[] = [
    {
      value: '',
      label: filteredItems.length > 0 ? 'Select an item' : 'No matching items found',
    },
    ...filteredItems.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.sku})`,
    })),
  ];

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary' }}>
            Item Entry
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
            {allowQuickCreate
              ? 'Pick an existing catalog item or quick-create a new one inline.'
              : 'Select an existing inventory item and enter transaction details.'}
          </Typography>
        </Box>

        {editingIndex !== null && (
          <Chip
            icon={<EditRoundedIcon sx={{ fontSize: 14 }} />}
            label="Editing item"
            size="small"
            sx={{
              height: 24,
              fontSize: 11,
              fontWeight: 600,
              bgcolor: 'rgba(201, 168, 76, 0.12)',
              color: '#6B4C2A',
            }}
          />
        )}
      </Box>

      {allowQuickCreate ? (
        <Box sx={{ display: 'flex', gap: 1, p: 0.5, mb: 2.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Button
            fullWidth
            variant={draft.mode === 'existing' ? 'contained' : 'text'}
            startIcon={<SearchRoundedIcon />}
            onClick={() => onModeChange('existing')}
            sx={{ height: 36 }}
          >
            Existing Item
          </Button>
          <Button
            fullWidth
            variant={draft.mode === 'new' ? 'contained' : 'text'}
            startIcon={<AddRoundedIcon />}
            onClick={() => onModeChange('new')}
            sx={{ height: 36 }}
          >
            Quick Create
          </Button>
        </Box>
      ) : (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2.5 }}>
          Stock-Out and Adjustment only allow existing catalog items.
        </Typography>
      )}

      {draft.mode === 'existing' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <SearchInput
            placeholder="Search by item name, SKU, or category"
            value={draft.searchQuery}
            onChange={(event) => onDraftChange({ searchQuery: event.target.value, selectedItemId: '' })}
          />
          <FormDropdown
            label="Catalog Item"
            value={draft.selectedItemId}
            options={existingItemOptions}
            onChange={(event) => onDraftChange({ selectedItemId: String(event.target.value) })}
            fullWidth
          />

          {selectedItem && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(84, 107, 63, 0.05)',
                border: '1px solid rgba(84, 107, 63, 0.18)',
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: 'text.primary' }}>
                  {selectedItem.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace' }}>
                  {selectedItem.sku}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
                Stock: {selectedItem.totalStock} {selectedItem.unit?.symbol}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <FormTextField
            label="New Item Name"
            value={draft.newItemName}
            placeholder="e.g. Arabica Beans"
            onChange={(event) => onDraftChange({ newItemName: event.target.value })}
          />
          <FormTextField
            label="SKU"
            value={draft.newSku}
            placeholder="e.g. BN-ARB-001"
            onChange={(event) => onDraftChange({ newSku: event.target.value.toUpperCase() })}
          />
          <FormDropdown
            label="Category"
            value={draft.newCategoryId}
            options={[{ value: '', label: 'Select category' }, ...categoryOptions]}
            onChange={(event) => onDraftChange({ newCategoryId: String(event.target.value) })}
            fullWidth
          />
          <FormDropdown
            label="Unit"
            value={draft.newUnitId}
            options={[{ value: '', label: 'Select unit' }, ...unitOptions]}
            onChange={(event) => onDraftChange({ newUnitId: String(event.target.value) })}
            fullWidth
          />
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary', mb: 2 }}>Transaction Fields</Typography>
        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <FormTextField
            label={quantityLabel}
            type="number"
            value={draft.quantity}
            placeholder="0"
            onChange={(event) => onDraftChange({ quantity: event.target.value })}
          />

          {transactionType === 'Stock-In' ? (
            <FormTextField
              label="Cost Per Unit"
              type="number"
              value={draft.unitCost}
              placeholder="0.00"
              onChange={(event) => onDraftChange({ unitCost: event.target.value })}
            />
          ) : (
            <FormDropdown
              label="Reason"
              value={draft.reason}
              options={STOCK_OUT_REASON_OPTIONS}
              onChange={(event) => onDraftChange({ reason: String(event.target.value) as TransactionItemDraft['reason'] })}
              fullWidth
            />
          )}

          {transactionType === 'Stock-In' && (
            <FormTextField
              label="Expiry Date (Optional)"
              type="date"
              value={draft.expiryDate}
              onChange={(event) => onDraftChange({ expiryDate: event.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          )}
        </Box>
      </Box>

      {errorMessage && (
        <Alert severity="warning" sx={{ mt: 2.5, borderRadius: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
        {editingIndex !== null && (
          <Button variant="outlined" onClick={onCancelEdit}>
            Cancel Edit
          </Button>
        )}
        <Button onClick={onSubmit}>
          {editingIndex !== null ? 'Update Item' : 'Add Item'}
        </Button>
      </Box>
    </Paper>
  );
}
