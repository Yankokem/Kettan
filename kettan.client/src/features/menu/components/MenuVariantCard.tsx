import { Box, IconButton, Typography } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import type { InventoryItemOption, MenuVariant } from '../types';

interface MenuVariantCardProps {
  variant: MenuVariant;
  inventoryOptions: InventoryItemOption[];
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function formatCurrency(value: number): string {
  return `P${value.toFixed(2)}`;
}

export function MenuVariantCard({
  variant,
  inventoryOptions,
  readOnly = false,
  onEdit,
  onDelete,
}: MenuVariantCardProps) {
  const inventoryById = new Map(inventoryOptions.map((item) => [item.id, item]));

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        background: (theme) => theme.custom.gradients.card,
        p: 2.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(107,76,42,0.35)',
          boxShadow: '0 5px 14px rgba(46,31,12,0.06)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>
            {variant.name}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
            {variant.ingredients.length} ingredient{variant.ingredients.length === 1 ? '' : 's'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ textAlign: 'right', minWidth: 92 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#6B4C2A', lineHeight: 1 }}>
              {formatCurrency(variant.price || 0)}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600, mt: 0.35 }}>
              Variant Price
            </Typography>
          </Box>
          {!readOnly && (
            <>
              <IconButton size="small" onClick={onEdit} sx={{ color: 'primary.main' }}>
                <EditRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={onDelete} sx={{ color: 'error.main' }}>
                <DeleteRoundedIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.25 }}>
        {variant.ingredients.length === 0 ? (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            No ingredients connected.
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1.4fr 0.8fr 0.8fr' },
                gap: 0.75,
                mb: 0.75,
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Ingredient
              </Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Required
              </Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Quantity Left
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {variant.ingredients.map((ingredient) => {
                const inventoryItem = inventoryById.get(ingredient.itemId);
                const stockCount = inventoryItem?.stockCount ?? 0;
                const threshold = inventoryItem?.defaultThreshold ?? 0;
                const unit = ingredient.uom || inventoryItem?.uom || '';
                const isLowStock = stockCount <= threshold;

                return (
                  <Box
                    key={ingredient.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1.4fr 0.8fr 0.8fr' },
                      gap: 0.75,
                      px: 1,
                      py: 0.85,
                      borderRadius: 2,
                      bgcolor: isLowStock ? 'rgba(220,38,38,0.05)' : 'background.default',
                    }}
                  >
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.primary' }}>
                      {ingredient.itemName}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
                      {ingredient.qtyPerUnit} {unit}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: isLowStock ? '#991B1B' : 'text.primary',
                      }}
                    >
                      {stockCount} {unit}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
