import React, { useState } from 'react';
import { Box, Typography, Card, IconButton } from '@mui/material';

import { useNavigate } from '@tanstack/react-router';

import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { TextField } from '../../components/UI/TextField';

interface RequestItemInput {
  id: number;
  item: string;
  qty: number;
}

const BRANCHES = [
  { value: 'downtown', label: 'Downtown Main' },
  { value: 'qc', label: 'Quezon City Branch' },
  { value: 'bgc', label: 'BGC Reserve' }
];

const ITEMS = [
  { value: 'coffee_beans', label: 'Arabica Coffee Beans - 5kg' },
  { value: 'milk', label: 'Almond Milk - 1L' },
  { value: 'syrup', label: 'Vanilla Syrup - 750ml' },
  { value: 'cups', label: 'Paper Cups (12oz) - Box' }
];

export function NewOrderRequestPage() {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].value);
  const [items, setItems] = useState<RequestItemInput[]>([
    { id: Date.now(), item: '', qty: 1 }
  ]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { id: Date.now(), item: '', qty: 1 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: number, field: keyof RequestItemInput, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          {/* Destination Details */}
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary', mb: 2 }}>
            Destination Details
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
            <Box sx={{ flex: 1, maxWidth: { md: '50%' } }}>
              <Dropdown
                options={BRANCHES}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value as string)}
                fullWidth
              />
            </Box>
          </Box>

          {/* Requested Items */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
              Requested Items
            </Typography>
            <Button
              onClick={handleAddItem}
              variant="outlined"
              startIcon={<AddCircleOutlineRoundedIcon />}
              size="small"
              sx={{ color: 'text.primary', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
            >
              Add Item
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            {items.map((row) => (
              <Box key={row.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 2 }}>
                  <Dropdown
                    options={ITEMS}
                    value={row.item}
                    onChange={(e) => handleItemChange(row.id, 'item', e.target.value)}
                    fullWidth
                    // A trick to make Dropdown act like a standard select with placeholder
                    // By default if no value, maybe show a hint if we mapped it
                  />
                </Box>
                <Box sx={{ width: 120 }}>
                  <TextField
                    type="number"
                    value={row.qty}
                    onChange={(e) => handleItemChange(row.id, 'qty', parseInt(e.target.value))}
                    inputProps={{ min: 1 }}
                    fullWidth
                  />
                </Box>
                <IconButton 
                  onClick={() => handleRemoveItem(row.id)} 
                  disabled={items.length === 1}
                  sx={{ color: 'error.main', mt: 0.5, p: 1, '&.Mui-disabled': { opacity: 0.3 } }}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* Action Footer */}
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
    </Box>
  );
}
