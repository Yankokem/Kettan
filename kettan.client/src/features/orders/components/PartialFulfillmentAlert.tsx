import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import ErrorOutlineRoundedIcon from '@/components/icons/lucide-mui/ErrorOutlineRoundedIcon';

export const PartialFulfillmentAlert: React.FC = () => {
  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid', 
        borderColor: 'error.main', 
        bgcolor: '#FEF2F2', 
        borderRadius: 3, 
        p: 2, 
        mb: 4, 
        display: 'flex', 
        gap: 2, 
        alignItems: 'flex-start' 
      }}
    >
      <ErrorOutlineRoundedIcon sx={{ color: 'error.main', mt: 0.5 }} />
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'error.dark' }}>
          Partial Fulfillment Required
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'error.main', mt: 0.5, lineHeight: 1.5 }}>
          HQ Inventory is insufficient to fulfill this order completely. Almond Milk and Vanilla Syrup are out of stock or low. Please adjust the approved quantities before sending to the packing floor.
        </Typography>
      </Box>
    </Card>
  );
};


