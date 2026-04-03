import React, { useState } from 'react';
import { Box, Typography, Card, Grid, TextField as MuiTextField, InputAdornment } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';

import { SelectedItemsTable } from './components/SelectedItemsTable';
import { InventorySelectionModal } from './components/InventorySelectionModal';
import type { InventoryItem } from './components/InventoryItemCard';

const BRANCHES = [
  { value: 'downtown', label: 'Downtown Main' },
  { value: 'qc', label: 'Quezon City Branch' },
  { value: 'bgc', label: 'BGC Reserve' }
];

const VEHICLES = [
  { value: 'van_1', label: 'Van 1 (Toyota Hiace)' },
  { value: 'van_2', label: 'Van 2 (Nissan Urvan)' },
  { value: 'truck_1', label: 'Delivery Truck 1' },
];

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Arabica Coffee Beans (Medium Roast)', sku: 'CF-ARB-MR-5KG', category: 'Raw Materials', hqStock: 120, unit: '5kg' },
  { id: '2', name: 'Almond Milk', sku: 'MLK-ALM-1L', category: 'Dairy & Alternatives', hqStock: 10, unit: '1L Carton' },
  { id: '3', name: 'Vanilla Syrup', sku: 'SYR-VAN-750', category: 'Flavorings', hqStock: 0, unit: '750ml Bottle' },
  { id: '4', name: 'Paper Cups (12oz)', sku: 'PKG-CUP-12-500', category: 'Packaging', hqStock: 45, unit: 'Box of 500' },
  { id: '5', name: 'Matcha Powder (Premium)', sku: 'TEA-MAT-PRM-1KG', category: 'Raw Materials', hqStock: 30, unit: '1kg' },
];

export function NewOrderRequestPage() {
  const navigate = useNavigate({ from: '/orders/new' });
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].value);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0].value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [selectedItems, setSelectedItems] = useState<{ item: InventoryItem; quantity: number; notes: string }[]>([]);

  const handleItemsSelected = (newItems: { item: InventoryItem; quantity: number; notes: string }[]) => {
    setSelectedItems(prev => {
      const combined = [...prev];
      newItems.forEach(ni => {
        const existingIdx = combined.findIndex(c => c.item.id === ni.item.id);
        if (existingIdx >= 0) {
          combined[existingIdx].quantity += ni.quantity;
          if (ni.notes) combined[existingIdx].notes = combined[existingIdx].notes ? ` | ` : ni.notes;
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
    // Simulate submission and redirect back to orders (or tracking)
    navigate({ to: '/orders' });
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>       
        <BackButton to="/orders" />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>        
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              New Internal Request
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>  
            Directly submit an internal supply request for a specific branch outside of standard scheduling.
          </Typography>
        </Box>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: { xs: 3, md: 4 } }}>
        <form onSubmit={handleSubmit}>
          
          <Box sx={{ mb: 5 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', mb: 3 }}>
              Request Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>Destination Branch</Typography>
                <Dropdown
                  options={BRANCHES}
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value as string)}   
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>Assigned Vehicle</Typography>
                <Dropdown
                  options={VEHICLES}
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value as string)}   
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>Requesting Personnel</Typography>
                <MuiTextField
                  fullWidth
                  disabled
                  value="Current User (Admin)"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                         <PersonOutlineIcon fontSize="small"/>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root.Mui-disabled': {
                      bgcolor: 'action.hover',
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
              Requested Items
            </Typography>
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

          <Box sx={{ mb: 4 }}>
            <SelectedItemsTable
              items={selectedItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
            />
          </Box>

          <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate({ to: '/orders' })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
            >
              Submit Request
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
