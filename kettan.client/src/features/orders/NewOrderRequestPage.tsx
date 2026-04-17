import React, { useMemo, useState } from 'react';
import { Alert, Box, Card, Chip, Divider, Grid, InputAdornment, Stack, TextField as MuiTextField, Typography } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ScheduleSendRoundedIcon from '@mui/icons-material/ScheduleSendRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { useAuthStore } from '../../store/useAuthStore';

import { SelectedItemsTable } from './components/SelectedItemsTable';
import { InventorySelectionModal } from './components/InventorySelectionModal';
import { RequestSnapshotCards } from './components/RequestSnapshotCards';
import type { InventoryItem } from './components/InventoryItemCard';

const BRANCHES = [
  { value: 'downtown', label: 'Downtown Main - Metro Core' },
  { value: 'qc', label: 'Quezon City Branch - North Hub' },
  { value: 'bgc', label: 'BGC Reserve - Central District' }
];

const VEHICLES = [
  { value: 'van_1', label: 'Juan Delivery Services - Van 1' },
  { value: 'van_2', label: 'Juan Delivery Services - Van 2' },
  { value: 'truck_1', label: 'Metro Fleet - Truck 1' },
];

const REQUEST_PRIORITIES = [
  { value: 'normal', label: 'Normal Priority' },
  { value: 'urgent', label: 'Urgent (same-day dispatch)' },
  { value: 'critical', label: 'Critical (operations at risk)' },
];

const REQUEST_TYPES = [
  { value: 'manual', label: 'Manual Internal Request' },
  { value: 'replenishment', label: 'Low-Stock Replenishment' },
  { value: 'event', label: 'Promo or Event Loadout' },
];

const DISPATCH_WINDOWS = [
  { value: 'next_4h', label: 'Next 4 Hours' },
  { value: 'today', label: 'Within Today' },
  { value: 'next_day', label: 'Next Business Day' },
];

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Arabica Coffee Beans (Medium Roast)', sku: 'CF-ARB-MR-5KG', category: 'Raw Materials', hqStock: 120, unit: '5kg bag', unitCost: 850 },
  { id: '2', name: 'Almond Milk', sku: 'MLK-ALM-1L', category: 'Dairy & Alternatives', hqStock: 10, unit: '1L carton', unitCost: 145 },
  { id: '3', name: 'Vanilla Syrup', sku: 'SYR-VAN-750', category: 'Flavorings', hqStock: 0, unit: '750ml bottle', unitCost: 320 },
  { id: '4', name: 'Paper Cups (12oz)', sku: 'PKG-CUP-12-500', category: 'Packaging', hqStock: 45, unit: 'Box of 500', unitCost: 510 },
  { id: '5', name: 'Matcha Powder (Premium)', sku: 'TEA-MAT-PRM-1KG', category: 'Raw Materials', hqStock: 30, unit: '1kg pack', unitCost: 1240 },
];

export function NewOrderRequestPage() {
  const navigate = useNavigate({ from: '/orders/new' });
  const { user } = useAuthStore();

  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].value);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0].value);
  const [selectedPriority, setSelectedPriority] = useState(REQUEST_PRIORITIES[0].value);
  const [requestType, setRequestType] = useState(REQUEST_TYPES[0].value);
  const [dispatchWindow, setDispatchWindow] = useState(DISPATCH_WINDOWS[1].value);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestNotes, setRequestNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [selectedItems, setSelectedItems] = useState<{ item: InventoryItem; quantity: number; notes: string }[]>([]);

  const totalUnits = useMemo(
    () => selectedItems.reduce((sum, line) => sum + line.quantity, 0),
    [selectedItems]
  );

  const atRiskLines = useMemo(
    () => selectedItems.filter((line) => line.quantity > line.item.hqStock).length,
    [selectedItems]
  );

  const estimatedCost = useMemo(
    () => selectedItems.reduce((sum, line) => sum + line.quantity * (line.item.unitCost ?? 0), 0),
    [selectedItems]
  );

  const requesterLabel = user ? `${user.name} (${user.role})` : 'Current User (Admin)';

  const handleItemsSelected = (newItems: { item: InventoryItem; quantity: number; notes: string }[]) => {
    setSelectedItems((prev) => {
      const combined = [...prev];
      newItems.forEach((ni) => {
        const existingIdx = combined.findIndex((c) => c.item.id === ni.item.id);
        if (existingIdx >= 0) {
          combined[existingIdx].quantity += ni.quantity;
          if (ni.notes) {
            combined[existingIdx].notes = combined[existingIdx].notes
              ? `${combined[existingIdx].notes} | ${ni.notes}`
              : ni.notes;
          }
        } else {
          combined.push(ni);
        }
      });
      return combined;
    });
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(p => p.item.id !== id));
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    setSelectedItems(prev => prev.map(p => p.item.id === id ? { ...p, quantity: newQuantity } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Please add at least one item to your request.');
      return;
    }

    navigate({ to: '/orders' });
  };

  return (
    <Box sx={{ pb: 4, pt: 1 }}>
      <Stack spacing={2.2} sx={{ mb: 3.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackButton to="/orders" />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                New Internal Request
              </Typography>
              <Chip label="Draft" size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
              <Chip
                label="Internal Transfer"
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: 11,
                  bgcolor: 'rgba(107,76,42,0.12)',
                  color: '#6B4C2A',
                  border: '1px solid rgba(107,76,42,0.24)',
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
              Build a branch replenishment request with stock-aware line items, dispatch intent, and clear operational notes.
            </Typography>
          </Box>
        </Box>

        <RequestSnapshotCards
          totalLines={selectedItems.length}
          totalUnits={totalUnits}
          riskLines={atRiskLines}
          estimatedCost={estimatedCost}
        />
      </Stack>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: { xs: 3, md: 4 } }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4.5 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', mb: 1.8 }}>
              Request Context
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.7 }}>
              Set where this loadout is going, how urgent it is, and which dispatch lane will carry it.
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.2, color: 'text.secondary' }}>Destination Branch</Typography>
                <Dropdown
                  options={BRANCHES}
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value as string)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.2, color: 'text.secondary' }}>Courier Vehicle</Typography>
                <Dropdown
                  options={VEHICLES}
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value as string)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.2, color: 'text.secondary' }}>Priority Level</Typography>
                <Dropdown
                  options={REQUEST_PRIORITIES}
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as string)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.2, color: 'text.secondary' }}>Request Type</Typography>
                <Dropdown
                  options={REQUEST_TYPES}
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as string)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.2, color: 'text.secondary' }}>Dispatch Window</Typography>
                <Dropdown
                  options={DISPATCH_WINDOWS}
                  value={dispatchWindow}
                  onChange={(e) => setDispatchWindow(e.target.value as string)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.2, color: 'text.secondary' }}>Expected Dispatch Date</Typography>
                <MuiTextField
                  type="date"
                  fullWidth
                  size="small"
                  value={dispatchDate}
                  onChange={(event) => setDispatchDate(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.2, color: 'text.secondary' }}>Requesting Personnel</Typography>
                <MuiTextField
                  fullWidth
                  disabled
                  value={requesterLabel}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root.Mui-disabled': { bgcolor: 'action.hover' },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.2, color: 'text.secondary' }}>Operational Notes</Typography>
                <MuiTextField
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Example: prioritize milk and cups for weekend volume; partial fulfillment is acceptable for syrups."
                  value={requestNotes}
                  onChange={(event) => setRequestNotes(event.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3.5 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.3, mb: 2.2 }}>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
              Requested Items
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
                Add inventory lines with requested quantities. Availability checks are shown before submission.
              </Typography>
            </Box>
            <Button
              onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
              variant="outlined"
              startIcon={<AddCircleOutlineRoundedIcon />}
              size="small"
              sx={{ color: 'text.primary', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
            >
              Add Items
            </Button>
          </Box>

          <Box sx={{ mb: 3.2 }}>
            <SelectedItemsTable
              items={selectedItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
            />
          </Box>

          {atRiskLines > 0 ? (
            <Alert severity="warning" sx={{ mb: 3 }} icon={<ScheduleSendRoundedIcon fontSize="inherit" />}>
              {atRiskLines} line item(s) exceed available HQ stock. You can still submit this request, but fulfillment may be partial.
            </Alert>
          ) : null}

          <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate({ to: '/orders' })}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={(event) => {
                event.preventDefault();
                alert('Draft saved locally in this prototype.');
              }}
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              variant="contained"
            >
              Submit Internal Request
            </Button>
          </Box>
        </form>
      </Card>

      <InventorySelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inventory={MOCK_INVENTORY}
        onItemsSelected={handleItemsSelected}
      />
    </Box>
  );
}
