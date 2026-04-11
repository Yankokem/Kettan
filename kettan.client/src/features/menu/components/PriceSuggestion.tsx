import { Box, Typography } from '@mui/material';
import LightbulbRoundedIcon from '@/components/icons/lucide-mui/LightbulbRoundedIcon';
import type { MenuVariant } from '../types';

interface PriceSuggestionProps {
  variants: MenuVariant[];
}

export function PriceSuggestion({ variants }: PriceSuggestionProps) {
  // Default markup percentage (can be changed in settings later)
  const MARKUP_PERCENTAGE = 50;

  // Calculate total ingredient cost across all variants
  const calculateTotalCost = (): number => {
    return variants.reduce((total, variant) => {
      const variantCost = variant.ingredients.reduce((sum, ingredient) => {
        const cost = (ingredient.unitCost || 0) * ingredient.qtyPerUnit;
        return sum + cost;
      }, 0);
      return total + variantCost;
    }, 0);
  };

  // Calculate average cost per variant
  const totalCost = calculateTotalCost();
  const avgCostPerVariant = variants.length > 0 ? totalCost / variants.length : 0;
  
  // Calculate suggested price with markup
  const suggestedPrice = avgCostPerVariant * (1 + MARKUP_PERCENTAGE / 100);

  if (variants.length === 0) {
    return (
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <LightbulbRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
          Add variants to see price suggestion
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 1, ml: 0.5 }}>
        Price Suggestion
      </Typography>
      <Box
        sx={{
          p: 2.5,
          border: '2px solid',
          borderColor: 'success.main',
          borderRadius: 2,
          bgcolor: 'rgba(113, 143, 88, 0.08)',
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <LightbulbRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
          <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 700, color: 'success.main', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Suggested Price
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', mb: 0.5 }}>
          ₱{suggestedPrice.toFixed(2)}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>
          Based on {MARKUP_PERCENTAGE}% markup
        </Typography>
      </Box>
    </Box>
  );
}


