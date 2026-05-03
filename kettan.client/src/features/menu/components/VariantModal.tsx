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

export function VariantModal({
  open,
  variant,
  onClose,
  onSave,
  inventoryOptions = [],
}: VariantModalProps) {
  const [variantName, setVariantName] = useState(variant?.name || '');
  const [variantPrice, setVariantPrice] = useState(variant?.price || 0);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(variant?.ingredients || []);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  // Reset form when variant changes or modal opens
  useEffect(() => {
    if (open) {
      setVariantName(variant?.name || '');
      setVariantPrice(variant?.price || 0);
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
    if (!Number.isFinite(variantPrice) || variantPrice <= 0) {
      alert('Please enter a valid variant price');
      return;
    }

    onSave({
      id: variant?.id || `variant-${Date.now()}`,
      name: variantName,
      price: variantPrice,
      ingredients,
    });

    setVariantName('');
    setVariantPrice(0);
    setIngredients([]);
  };

  const handleClose = () => {
    setVariantName('');
    setVariantPrice(0);
    setIngredients([]);
    setShowInventoryModal(false);
    onClose();
  };

  // Get IDs of already selected items to show checkmarks in inventory modal
  const selectedItemIds = ingredients.map(ing => ing.itemId);

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '70vh' } }}>
        <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
            {variant ? 'Edit Variant' : 'Add New Variant'}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
                  Variant Name
                </Typography>
                <FormTextField
                  placeholder="e.g., Small, Medium, Large"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  fullWidth
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
                  Variant Price
                </Typography>
                <FormTextField
                  type="number"
                  placeholder="e.g. 70.00"
                  inputProps={{ step: '0.01', min: '0' }}
                  value={variantPrice || ''}
                  onChange={(e) => setVariantPrice(parseFloat(e.target.value) || 0)}
                  fullWidth
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
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

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(107,76,42,0.05)' }}>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: 12 }}>Ingredient</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: 12, width: 120 }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: 12, width: 100 }}>Cost</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: 12, width: 80, textAlign: 'center' }}>
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
                          <TableRow key={ingredient.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell>
                              <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                                  {ingredient.itemName}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                                  {ingredient.uom}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <FormTextField
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
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  bgcolor: 'rgba(201,168,76,0.15)',
                                  color: '#6B4C2A',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveIngredient(ingredient.id)}
                                sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.lighter' } }}
                              >
                                <DeleteRoundedIcon sx={{ fontSize: 18 }} />
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
              <Box sx={{ mt: 2.5, p: 2, bgcolor: 'rgba(107,76,42,0.05)', borderRadius: 2, border: '1px solid', borderColor: 'rgba(107,76,42,0.2)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                    Total Variant Cost:
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#6B4C2A' }}>
                    ₱{ingredients.reduce((sum, ing) => sum + ((ing.unitCost || 0) * ing.qtyPerUnit), 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Variant
          </Button>
        </Box>
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
