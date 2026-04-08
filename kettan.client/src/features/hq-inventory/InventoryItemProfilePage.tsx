import { useState } from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
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
  MOCK_INVENTORY_ITEMS,
  MOCK_UNITS,
  MOCK_CATEGORIES,
  getBatchesForItem,
  getTransactionsForItem,
} from './mockData';
import type { AdjustmentFormData, Batch } from './types';

export function InventoryItemProfilePage() {
  const { itemId } = useParams({ from: '/layout/hq-inventory/$itemId' });
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Find the item from mock data
  const item = MOCK_INVENTORY_ITEMS.find(i => i.id === itemId);
  const batches = item ? getBatchesForItem(item.id) : [];
  const transactions = item ? getTransactionsForItem(item.id) : [];

  if (!item) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">Item not found</Typography>
      </Box>
    );
  }

  const isLowStock = item.totalStock <= item.defaultThreshold;
  const costChange = item.previousUnitCost
    ? ((item.unitCost - item.previousUnitCost) / item.previousUnitCost) * 100
    : 0;

  const categoryOptions = MOCK_CATEGORIES.map(c => ({ value: c.id, label: c.name }));
  const unitOptions = MOCK_UNITS.map(u => ({ value: u.id, label: `${u.name} (${u.symbol})` }));

  const handleAdjustBatch = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
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
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate({ to: '/hq-inventory/stock-in' })}
          >
            Stock-In
          </Button>
          {!isEditing ? (
            <Button startIcon={<EditRoundedIcon />} onClick={() => setIsEditing(true)}>
              Edit Item
            </Button>
          ) : (
            <>
              <Button variant="outlined" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsEditing(false)}>
                Save Changes
              </Button>
            </>
          )}
        </Box>
      </Box>

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
                  {item.unit?.symbol} Stock
                </Typography>
              </Box>
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
                    ₱{item.unitCost}
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
                  Per {item.unit?.symbol}
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

            <Divider sx={{ my: 2 }} />

            {/* Form Fields */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <FormTextField
                label="Item Name"
                value={item.name}
                disabled={!isEditing}
              />
              <FormTextField
                label="SKU"
                value={item.sku}
                disabled={!isEditing}
              />
              <FormDropdown
                label="Category"
                value={item.categoryId}
                options={categoryOptions}
                disabled={!isEditing}
              />
              <FormDropdown
                label="Unit of Measure"
                value={item.unitId}
                options={unitOptions}
                disabled={!isEditing}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <FormTextField
                    label="Reorder Threshold"
                    type="number"
                    value={item.defaultThreshold}
                    disabled={!isEditing}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormTextField
                    label={`Unit Cost (₱)`}
                    type="number"
                    value={item.unitCost}
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
            {item.unit && (
              <BatchList
                batches={batches}
                unit={item.unit}
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