import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Button } from '../../../components/UI/Button';
import { FormDropdown } from '../../../components/Form/FormDropdown';
import { FormTextField } from '../../../components/Form/FormTextField';
import type { MenuVariant, RecipeIngredient, InventoryItemOption } from '../types';

interface VariantModalProps {
  open: boolean;
  variant?: MenuVariant;
  onClose: () => void;
  onSave: (variant: MenuVariant) => void;
  inventoryOptions: InventoryItemOption[];
}

const MOCK_INVENTORY_OPTIONS: InventoryItemOption[] = [
  { id: '1', name: 'Arabica Coffee Beans (Medium Roast) - 5kg', sku: 'BN-ARB-001', uom: 'kg', category: 'Coffee Beans' },
  { id: '2', name: 'Espresso Blend - 1kg', sku: 'BN-ESP-001', uom: 'kg', category: 'Coffee Beans' },
  { id: '3', name: 'Almond Milk - 1L', sku: 'MK-ALM-001', uom: 'L', category: 'Milk & Dairy' },
  { id: '4', name: 'Vanilla Syrup - 750ml', sku: 'SY-VAN-001', uom: 'ml', category: 'Syrups' },
  { id: '5', name: 'Paper Cups 12oz - Box of 500', sku: 'CP-PAP-001', uom: 'pcs', category: 'Cups & Packaging' },
  { id: '6', name: 'Plastic Lids - Box of 1000', sku: 'LID-PLS-001', uom: 'pcs', category: 'Cups & Packaging' },
];

export function VariantModal({
  open,
  variant,
  onClose,
  onSave,
  inventoryOptions = MOCK_INVENTORY_OPTIONS,
}: VariantModalProps) {
  const [variantName, setVariantName] = useState(variant?.name || '');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(variant?.ingredients || []);

  const handleAddIngredient = () => {
    const newIngredient: RecipeIngredient = {
      id: `temp-${Date.now()}`,
      itemId: '',
      itemName: '',
      qtyPerUnit: 0,
      uom: '',
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const handleItemChange = (index: number, itemId: string) => {
    const selected = inventoryOptions.find(opt => opt.id === itemId);
    if (selected) {
      const updated = [...ingredients];
      updated[index] = {
        ...updated[index],
        itemId: selected.id,
        itemName: selected.name,
        uom: selected.uom,
      };
      setIngredients(updated);
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...ingredients];
    updated[index].qtyPerUnit = qty;
    setIngredients(updated);
  };

  const handleSave = () => {
    if (!variantName.trim()) {
      alert('Please enter a variant name');
      return;
    }
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    onSave({
      id: variant?.id || `variant-${Date.now()}`,
      name: variantName,
      ingredients,
    });

    setVariantName('');
    setIngredients([]);
  };

  const handleClose = () => {
    setVariantName('');
    setIngredients([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
        {variant ? 'Edit Variant' : 'Add New Variant'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <FormTextField
            label="Variant Name"
            placeholder="e.g., Small, Medium, Large"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            fullWidth
          />
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          Variant Ingredients
        </Typography>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.paper' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Ingredient</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 100 }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 80, textAlign: 'center' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ingredients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                      No ingredients added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  ingredients.map((ingredient, index) => (
                    <TableRow key={ingredient.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <TableCell>
                        <FormDropdown
                          label=""
                          value={ingredient.itemId}
                          displayEmpty
                          options={[
                            { value: '', label: 'Select ingredient' },
                            ...inventoryOptions.map(opt => ({ value: opt.id, label: opt.name })),
                          ]}
                          onChange={(e) => handleItemChange(index, e.target.value as string)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <FormTextField
                          label=""
                          type="number"
                          inputProps={{ step: '0.001', min: '0' }}
                          value={ingredient.qtyPerUnit}
                          onChange={(e) => handleQtyChange(index, parseFloat(e.target.value) || 0)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveIngredient(ingredient.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={handleAddIngredient}
              sx={{ width: '100%' }}
            >
              Add Ingredient
            </Button>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Variant
        </Button>
      </DialogActions>
    </Dialog>
  );
}
