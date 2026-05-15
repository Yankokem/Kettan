import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Divider, Grid, Paper, TextField as MuiTextField, Typography } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ScheduleSendRoundedIcon from '@mui/icons-material/ScheduleSendRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchInventoryItems } from '../hq-inventory/hqInventoryApi';
import { fetchBranches } from '../branches/branchesApi';
import { createOrder } from '../branch-operations/api';

import { SelectedItemsTable } from './components/SelectedItemsTable';
import { InventorySelectionModal } from './components/InventorySelectionModal';
import type { InventoryItem } from './components/InventoryItemCard';

const BRANCHES = [{ value: '', label: 'Loading branches...' }];


const REQUEST_PRIORITIES = [
  { value: 'normal', label: 'Normal Priority' },
  { value: 'urgent', label: 'Urgent (same-day dispatch)' },
  { value: 'critical', label: 'Critical (operations at risk)' },
];

const REQUEST_TYPES = [
  { value: 'manual', label: 'Manual Internal Push' },
  { value: 'replenishment', label: 'Low-Stock Replenishment' },
  { value: 'event', label: 'Promo or Event Loadout' },
];

const DISPATCH_WINDOWS = [
  { value: 'next_4h', label: 'Next 4 Hours' },
  { value: 'today', label: 'Within Today' },
  { value: 'next_day', label: 'Next Business Day' },
];

export function NewOrderRequestPage() {
  const navigate = useNavigate({ from: '/orders/new' });
  const { user } = useAuthStore();
  const isHqRole = user?.role === 'TenantAdmin' || user?.role === 'HqManager' || user?.role === 'HqStaff';

  const [branchOptions, setBranchOptions] = useState(BRANCHES);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].value);
  const [selectedPriority, setSelectedPriority] = useState(REQUEST_PRIORITIES[0].value);
  const [requestType, setRequestType] = useState(REQUEST_TYPES[0].value);
  const [dispatchWindow, setDispatchWindow] = useState(DISPATCH_WINDOWS[1].value);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
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

  useEffect(() => {
    const loadContext = async () => {
      try {
        setError(null);
        const [branches, items] = await Promise.all([fetchBranches(), fetchInventoryItems()]);

        const mappedBranches = branches
          .filter((branch) => branch.isActive)
          .map((branch) => ({
            value: String(branch.branchId),
            label: branch.location ? `${branch.name} - ${branch.location}` : branch.name,
          }));

        setBranchOptions(mappedBranches.length > 0 ? mappedBranches : [{ value: '', label: 'No active branches' }]);
        if (mappedBranches.length > 0) {
          setSelectedBranch((prev) => (prev ? prev : mappedBranches[0].value));
        }

        const mappedInventory: InventoryItem[] = items.map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category?.name ?? 'Uncategorized',
          hqStock: item.totalStock,
          unit: item.unit ?? 'unit',
          unitCost: item.unitCost,
        }));

        setInventory(mappedInventory);
      } catch {
        setError('Failed to load branches or inventory items.');
      }
    };

    void loadContext();
  }, []);

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

    const submit = async () => {
      if (!isHqRole) {
        setError('Only HQ roles can create HQ-initiated orders.');
        return;
      }

      if (!selectedBranch) {
        setError('Please select a destination branch.');
        return;
      }

      if (selectedItems.length === 0) {
        setError('Please add at least one item to your request.');
        return;
      }

      try {
        setIsSaving(true);
        setError(null);

        const created = await createOrder({
          branchId: Number(selectedBranch),
          subject: subject.trim() || undefined,
          requestType,
          priority: selectedPriority,
          dispatchWindow,
          dispatchDate: dispatchDate ? new Date(`${dispatchDate}T00:00:00`).toISOString() : undefined,
          notes: requestNotes || undefined,
          items: selectedItems.map((line) => ({
            itemId: Number(line.item.id),
            quantityRequested: Number(line.quantity),
          })),
        });

        navigate({ to: '/orders/$orderId', params: { orderId: String(created.orderId) } });
      } catch {
        setError('Failed to submit internal request.');
      } finally {
        setIsSaving(false);
      }
    };

    void submit();
  };

  return (
    <Box sx={{ pb: 3, display: 'grid', gap: 2.2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <BackButton to="/orders" />
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>New HQ Supply Push</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Build an HQ-initiated supply shipment to a branch — for proactive loadouts, new branch setups, or seasonal restocking.
          </Typography>
        </Box>
      </Box>

      {/* Main Content - Left/Right Layout */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        {/* Left Panel - Request Context & Summary */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '35%' },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, bgcolor: '#FAF7F2', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AssignmentRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#6B4C2A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Push Context
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <StorefrontRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Destination Branch
                    </Typography>
                  </Box>
                  <Dropdown
                    options={branchOptions}
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value as string)}
                    fullWidth
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CategoryRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Dispatch Subject
                    </Typography>
                  </Box>
                  <MuiTextField
                    fullWidth
                    size="small"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    inputProps={{ maxLength: 80 }}
                    placeholder="Example: Pre-weekend stock push"
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CategoryRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Push Type
                    </Typography>
                  </Box>
                  <Dropdown
                    options={REQUEST_TYPES}
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value as string)}
                    fullWidth
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Expected Dispatch Date
                    </Typography>
                  </Box>
                  <MuiTextField
                    type="date"
                    fullWidth
                    size="small"
                    value={dispatchDate}
                    onChange={(event) => setDispatchDate(event.target.value)}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <NotesRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Operational Notes
                    </Typography>
                  </Box>
                  <MuiTextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Example: prioritize milk and cups for weekend volume..."
                    value={requestNotes}
                    onChange={(event) => setRequestNotes(event.target.value)}
                  />
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3, opacity: 0.6 }} />

            {/* Request Summary Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
              <InventoryRoundedIcon sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Push Summary
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Line Items</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#2E7D32' }}>{selectedItems.length}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Units to Push</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#2E7D32' }}>{totalUnits}</Typography>
              </Box>

              {atRiskLines > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>At-Risk Lines</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>{atRiskLines}</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Estimated Cost</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#2E7D32' }}>₱{estimatedCost.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Right Panel - Requested Items */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 500
          }}
        >
          <Box sx={{ p: 2.5, bgcolor: '#FAF7F2', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Inventory2RoundedIcon sx={{ fontSize: 20, color: '#6B4C2A' }} />
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#6B4C2A' }}>Items to Push</Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500 }}>
                  Build the shipment inventory for this supply push
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
              <Button
                onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                variant="outlined"
                startIcon={<AddCircleOutlineRoundedIcon />}
              >
                Add Items
              </Button>
            </Box>

            <SelectedItemsTable
              items={selectedItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
            />

            {atRiskLines > 0 && (
              <Alert severity="warning" sx={{ mt: 3, borderRadius: '12px' }} icon={<ScheduleSendRoundedIcon fontSize="inherit" />}>
                {atRiskLines} line item(s) exceed available HQ stock.
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 3, borderRadius: '12px' }}>
                {error}
              </Alert>
            )}
          </Box>

          <Box sx={{ p: 3, bgcolor: '#FAFAFA', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate({ to: '/orders' })}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isSaving || selectedItems.length === 0}
              sx={{ 
                bgcolor: '#6B4C2A', 
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 800,
                fontSize: 15,
                '&:hover': { bgcolor: '#543B21' },
                '&.Mui-disabled': { bgcolor: 'rgba(107,76,42,0.3)', color: 'rgba(255,255,255,0.7)' }
              }}
            >
              {isSaving ? 'Submitting...' : 'Submit Supply Push'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <InventorySelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inventory={inventory}
        onItemsSelected={handleItemsSelected}
      />
    </Box>
  );
}
