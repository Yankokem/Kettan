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
  Chip,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { Button } from '../../../components/UI/Button';
import { VariantModal } from './VariantModal';
import type { MenuVariant, InventoryItemOption } from '../types';

interface VariantsBuilderProps {
  variants: MenuVariant[];
  onVariantsChange: (variants: MenuVariant[]) => void;
  inventoryOptions?: InventoryItemOption[];
  readOnly?: boolean;
}

export function VariantsBuilder({
  variants,
  onVariantsChange,
  inventoryOptions = [],
  readOnly = false,
}: VariantsBuilderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | undefined>();

  const handleAddVariant = () => {
    setSelectedVariant(undefined);
    setModalOpen(true);
  };

  const handleEditVariant = (variant: MenuVariant) => {
    setSelectedVariant(variant);
    setModalOpen(true);
  };

  const handleSaveVariant = (variant: MenuVariant) => {
    const existingIndex = variants.findIndex(v => v.id === variant.id);
    let updated: MenuVariant[];

    if (existingIndex >= 0) {
      updated = [...variants];
      updated[existingIndex] = variant;
    } else {
      updated = [...variants, variant];
    }

    onVariantsChange(updated);
    setModalOpen(false);
    setSelectedVariant(undefined);
  };

  const handleRemoveVariant = (id: string) => {
    const updated = variants.filter(v => v.id !== id);
    onVariantsChange(updated);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
        Menu Variants
      </Typography>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.paper' }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: '30%' }}>Variant Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: '60%' }}>Ingredients</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: '10%', textAlign: 'center' }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No variants added yet. Click "Add Variant" to start.
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((variant) => (
                  <TableRow key={variant.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {variant.name}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {variant.ingredients.map((ing) => (
                          <Chip
                            key={ing.id}
                            label={`${ing.itemName} (${ing.qtyPerUnit} ${ing.uom})`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11 }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditVariant(variant)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveVariant(variant.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!readOnly && (
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={handleAddVariant}
              sx={{ width: '100%' }}
            >
              Add Variant
            </Button>
          </Box>
        )}
      </Paper>

      <VariantModal
        open={modalOpen}
        variant={selectedVariant}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveVariant}
        inventoryOptions={inventoryOptions}
      />
    </Box>
  );
}
