import { useState, useEffect } from 'react';
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
  Chip,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Button } from '../../../components/UI/Button';
import { FormTextField } from '../../../components/Form/FormTextField';
import { InventorySelectionModal } from './InventorySelectionModal';
import type { MenuVariant, RecipeIngredient, InventoryItemOption } from '../types';

interface VariantModalProps {
  open: boolean;
  variant?: MenuVariant;
  onClose: () => void;
  onSave: (variant: MenuVariant) => void;
  inventoryOptions: InventoryItemOption[];
}

const MOCK_INVENTORY_OPTIONS: InventoryItemOption[] = [
  { id: '1', name: 'Arabica Coffee Beans (Medium Roast) - 5kg', sku: 'BN-ARB-001', uom: 'g', category: 'Coffee Beans', unitCost: 0.8, stockCount: 15000 },
  { id: '2', name: 'Espresso Blend - 1kg', sku: 'BN-ESP-001', uom: 'g', category: 'Coffee Beans', unitCost: 1.2, stockCount: 8000 },
  { id: '3', name: 'Almond Milk - 1L', sku: 'MK-ALM-001', uom: 'ml', category: 'Milk & Dairy', unitCost: 0.15, stockCount: 5000 },
  { id: '4', name: 'Vanilla Syrup - 750ml', sku: 'SY-VAN-001', uom: 'ml', category: 'Syrups', unitCost: 0.2, stockCount: 3000 },
  { id: '5', name: 'Caramel Syrup - 750ml', sku: 'SY-CAR-001', uom: 'ml', category: 'Syrups', unitCost: 0.22, stockCount: 2800 },
  { id: '6', name: 'Whole Milk - 1L', sku: 'MK-WHL-001', uom: 'ml', category: 'Milk & Dairy', unitCost: 0.12, stockCount: 8000 },
  { id: '7', name: 'Oat Milk - 1L', sku: 'MK-OAT-001', uom: 'ml', category: 'Milk & Dairy', unitCost: 0.18, stockCount: 4000 },
  { id: '8', name: 'Sugar - 1kg', sku: 'ADD-SUG-001', uom: 'g', category: 'Additives', unitCost: 0.05, stockCount: 10000 },
  { id: '9', name: 'Paper Cups 12oz - Box of 500', sku: 'CP-PAP-001', uom: 'pcs', category: 'Cups & Packaging', unitCost: 2.5, stockCount: 500 },
  { id: '10', name: 'Plastic Lids - Box of 1000', sku: 'LID-PLS-001', uom: 'pcs', category: 'Cups & Packaging', unitCost: 1.8, stockCount: 1000 },
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
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  // Reset form when variant changes or modal opens
  useEffect(() => {
    if (open) {
      setVariantName(variant?.name || '');
      setIngredients(variant?.ingredients || []);
    }
  }, [open, variant]);

  const handleAddIngredientFromInventory = (ingredient: RecipeIngredient) => {
    setIngredients([...ingredients, ingredient]);
    setShowInventoryModal(false);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const handleQtyChange = (id: string, qty: number) => {
    const updated = ingredients.map(ing => 
      ing.id === id ? { ...ing, qtyPerUnit: qty } : ing
    );
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
    setShowInventoryModal(false);
    onClose();
  };

  // Get IDs of already selected items to show checkmarks in inventory modal
  const selectedItemIds = ingredients.map(ing => ing.itemId);

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Variant Ingredients
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => setShowInventoryModal(true)}
            >
              Add Ingredient
            </Button>
          </Box>

          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Ingredient</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 120 }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 100 }}>Cost</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 80, textAlign: 'center' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ingredients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        No ingredients added yet. Click "Add Ingredient" to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ingredients.map((ingredient) => {
                      const totalCost = (ingredient.unitCost || 0) * ingredient.qtyPerUnit;
                      
                      return (
                        <TableRow key={ingredient.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                                {ingredient.itemName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                                {ingredient.uom}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <FormTextField
                              label=""
                              type="number"
                              inputProps={{ step: '0.001', min: '0' }}
                              value={ingredient.qtyPerUnit}
                              onChange={(e) => handleQtyChange(ingredient.id, parseFloat(e.target.value) || 0)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`₱${totalCost.toFixed(2)}`}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: 12,
                                fontWeight: 700,
                                bgcolor: 'rgba(107, 76, 42, 0.1)',
                                color: 'text.primary',
                              }}
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {ingredients.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Total Variant Cost:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  ₱{ingredients.reduce((sum, ing) => sum + ((ing.unitCost || 0) * ing.qtyPerUnit), 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
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

      <InventorySelectionModal
        open={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        onSelect={handleAddIngredientFromInventory}
        inventoryOptions={inventoryOptions}
        selectedItemIds={selectedItemIds}
      />
    </>
  );
}
