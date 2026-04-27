import { useState } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Button } from '../../../components/UI/Button';
import { VariantModal } from './VariantModal';
import { MenuVariantCard } from './MenuVariantCard';
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
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
        Menu Variants
      </Typography>
      {variants.length === 0 ? (
        <Box
          sx={{
            py: 5,
            px: 2,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.default',
          }}
        >
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', fontWeight: 600 }}>
            No variants added yet.
          </Typography>
          {!readOnly && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
              Add at least one variant and set its ingredient quantities.
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {variants.map((variant) => (
            <MenuVariantCard
              key={variant.id}
              variant={variant}
              inventoryOptions={inventoryOptions}
              readOnly={readOnly}
              onEdit={() => handleEditVariant(variant)}
              onDelete={() => handleRemoveVariant(variant.id)}
            />
          ))}
        </Box>
      )}

      {!readOnly && (
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={handleAddVariant} sx={{ width: '100%' }}>
            Add Variant
          </Button>
        </Box>
      )}

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
