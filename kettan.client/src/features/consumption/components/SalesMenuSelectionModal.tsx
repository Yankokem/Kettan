import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

export interface SoldMenuItemOption {
  id: string;
  name: string;
  category: string;
  soldToday: number;
}

interface PendingSalesSelection {
  item: SoldMenuItemOption;
  quantity: number;
}

interface SalesMenuSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onItemsSelected: (items: PendingSalesSelection[]) => void;
  items: SoldMenuItemOption[];
}

export function SalesMenuSelectionModal({ open, onClose, onItemsSelected, items }: SalesMenuSelectionModalProps) {
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [pendingSelections, setPendingSelections] = useState<PendingSalesSelection[]>([]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (!query) {
        return true;
      }

      return (
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [items, search]);

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  const resetState = () => {
    setSearch('');
    setSelectedItemId(null);
    setQuantity('');
    setPendingSelections([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAddSelection = () => {
    if (!selectedItem) {
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return;
    }

    setPendingSelections((previous) => {
      const existingIndex = previous.findIndex((entry) => entry.item.id === selectedItem.id);

      if (existingIndex >= 0) {
        return previous.map((entry, index) => {
          if (index !== existingIndex) {
            return entry;
          }

          return {
            ...entry,
            quantity: entry.quantity + parsedQuantity,
          };
        });
      }

      return [
        ...previous,
        {
          item: selectedItem,
          quantity: parsedQuantity,
        },
      ];
    });

    setQuantity('');
  };

  const handleConfirm = () => {
    if (pendingSelections.length === 0) {
      return;
    }

    onItemsSelected(pendingSelections);
    resetState();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '78vh' } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <RestaurantMenuRoundedIcon color="primary" />
          <Typography sx={{ fontSize: 18, fontWeight: 800 }}>Select Sold Menu Items</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'grid', gridTemplateRows: 'auto 1fr auto', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search menu item ID, name, or category..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 19 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '46% 54%' }, minHeight: 0 }}>
          <Box sx={{ borderRight: { xs: 'none', md: '1px solid' }, borderColor: 'divider', overflowY: 'auto' }}>
            {filteredItems.map((item) => {
              const isSelected = selectedItemId === item.id;

              return (
                <Box
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  sx={{
                    p: 1.6,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Typography sx={{ fontSize: 13.8, fontWeight: 700, color: 'text.primary' }}>{item.name}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>MI-{item.id}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                    {item.category} • Sold Today: <strong>{item.soldToday}</strong>
                  </Typography>
                </Box>
              );
            })}

            {filteredItems.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No sold menu items match your search.</Typography>
              </Box>
            ) : null}
          </Box>

          <Box sx={{ p: 2.2, overflowY: 'auto' }}>
            {selectedItem ? (
              <>
                <Typography sx={{ fontSize: 15, fontWeight: 800, mb: 0.35 }}>{selectedItem.name}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.8 }}>
                  MI-{selectedItem.id} • {selectedItem.category}
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1 }}>
                  <TextField
                    label="Quantity Sold"
                    type="number"
                    size="small"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AddRoundedIcon />}
                    onClick={handleAddSelection}
                    sx={{ minWidth: 124 }}
                  >
                    Add Line
                  </Button>
                </Box>

                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 1 }}>
                  Sold today baseline: {selectedItem.soldToday}
                </Typography>
              </>
            ) : (
              <Box sx={{ display: 'flex', minHeight: 180, alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center' }}>
                  Select a sold menu item on the left, then enter quantity sold.
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2.25 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.8 }}>Pending Selections</Typography>
              {pendingSelections.length > 0 ? (
                <Box sx={{ display: 'grid', gap: 0.7 }}>
                  {pendingSelections.map((entry) => (
                    <Box key={entry.item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                      <Box>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{entry.item.name}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>MI-{entry.item.id}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{entry.quantity}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>No lines added yet.</Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{pendingSelections.length} item(s) selected</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              disabled={pendingSelections.length === 0}
              startIcon={<CheckCircleOutlineRoundedIcon />}
            >
              Confirm Selection
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
