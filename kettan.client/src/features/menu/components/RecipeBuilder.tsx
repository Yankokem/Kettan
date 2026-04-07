import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Button } from '../../../components/UI/Button';
import { FormDropdown } from '../../../components/Form/FormDropdown';
import { FormTextField } from '../../../components/Form/FormTextField';
import type { RecipeIngredient, InventoryItemOption } from '../types';

interface RecipeBuilderProps {
  ingredients: RecipeIngredient[];
  onIngredientsChange: (ingredients: RecipeIngredient[]) => void;
  inventoryOptions?: InventoryItemOption[];
}

const MOCK_INVENTORY_OPTIONS: InventoryItemOption[] = [
  { id: '1', name: 'Arabica Coffee Beans (Medium Roast) - 5kg', sku: 'BN-ARB-001', uom: 'kg', category: 'Coffee Beans' },
  { id: '2', name: 'Espresso Blend - 1kg', sku: 'BN-ESP-001', uom: 'kg', category: 'Coffee Beans' },
  { id: '3', name: 'Almond Milk - 1L', sku: 'MK-ALM-001', uom: 'L', category: 'Milk & Dairy' },
  { id: '4', name: 'Vanilla Syrup - 750ml', sku: 'SY-VAN-001', uom: 'ml', category: 'Syrups' },
  { id: '5', name: 'Paper Cups 12oz - Box of 500', sku: 'CP-PAP-001', uom: 'pcs', category: 'Cups & Packaging' },
  { id: '6', name: 'Plastic Lids - Box of 1000', sku: 'LID-PLS-001', uom: 'pcs', category: 'Cups & Packaging' },
];

export function RecipeBuilder({
  ingredients,
  onIngredientsChange,
  inventoryOptions = MOCK_INVENTORY_OPTIONS,
}: RecipeBuilderProps) {
  const [localIngredients, setLocalIngredients] = useState<RecipeIngredient[]>(ingredients);

  const handleAddRow = () => {
    const newIngredient: RecipeIngredient = {
      id: `temp-${Date.now()}`,
      itemId: '',
      itemName: '',
      qtyPerUnit: 0,
      uom: '',
    };
    const updated = [...localIngredients, newIngredient];
    setLocalIngredients(updated);
    onIngredientsChange(updated);
  };

  const handleRemoveRow = (id: string) => {
    const updated = localIngredients.filter(ing => ing.id !== id);
    setLocalIngredients(updated);
    onIngredientsChange(updated);
  };

  const handleItemChange = (index: number, itemId: string) => {
    const selected = inventoryOptions.find(opt => opt.id === itemId);
    if (selected) {
      const updated = [...localIngredients];
      updated[index] = {
        ...updated[index],
        itemId: selected.id,
        itemName: selected.name,
        uom: selected.uom,
      };
      setLocalIngredients(updated);
      onIngredientsChange(updated);
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...localIngredients];
    updated[index].qtyPerUnit = qty;
    setLocalIngredients(updated);
    onIngredientsChange(updated);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
        Recipe Ingredients
      </Typography>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.paper' }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: '40%' }}>Ingredient</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: '25%' }}>Qty Per Unit</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: '25%' }}>UOM</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: '10%', textAlign: 'center' }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localIngredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No ingredients added yet. Click "Add Ingredient" to start.
                  </TableCell>
                </TableRow>
              ) : (
                localIngredients.map((ingredient, index) => (
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
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
                        {ingredient.uom || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveRow(ingredient.id)}
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
            onClick={handleAddRow}
            sx={{ width: '100%' }}
          >
            Add Ingredient
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}