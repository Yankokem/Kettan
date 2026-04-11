import { Dialog, DialogContent, DialogTitle, IconButton, Box, TextField, Grid, Typography, InputAdornment, Button, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Checkbox } from '@mui/material';
import CloseIcon from '@/components/icons/lucide-mui/CloseIcon';
import SearchIcon from '@/components/icons/lucide-mui/SearchIcon';
import FilterListIcon from '@/components/icons/lucide-mui/FilterListIcon';
import SortIcon from '@/components/icons/lucide-mui/SortIcon';
import InventoryIcon from '@/components/icons/lucide-mui/InventoryIcon';
import { InventoryItemCard } from './InventoryItemCard';
import type { InventoryItem } from './InventoryItemCard';
import { InventoryItemDetails } from './InventoryItemDetails';
import { useState, useMemo } from 'react';
import CheckCircleOutlineIcon from '@/components/icons/lucide-mui/CheckCircleOutlineIcon';

interface InventorySelectionModalProps {
  open: boolean;
  onClose: () => void;
  onItemsSelected: (items: { item: InventoryItem; quantity: number; notes: string }[]) => void;
  inventory: InventoryItem[];
}

export function InventorySelectionModal({ open, onClose, onItemsSelected, inventory }: InventorySelectionModalProps) {
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingSelections, setPendingSelections] = useState<{ item: InventoryItem; quantity: number; notes: string }[]>([]);

  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'stock_asc' | 'stock_desc'>('name_asc');
  const [filterInStock, setFilterInStock] = useState<boolean>(false);

  const filteredInventory = useMemo(() => {
    let result = inventory.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );

    if (filterInStock) {
      result = result.filter(item => item.hqStock > 0);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'stock_asc': return a.hqStock - b.hqStock;
        case 'stock_desc': return b.hqStock - a.hqStock;
        default: return 0;
      }
    });

    return result;
  }, [inventory, search, sortBy, filterInStock]);

  const selectedItem = inventory.find(i => i.id === selectedItemId);

  const handleAddItem = (item: InventoryItem, quantity: number, notes: string) => {
    setPendingSelections(prev => {
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        return prev.map(p => p.item.id === item.id ? { ...p, quantity: p.quantity + quantity, notes: notes || p.notes } : p);
      }
      return [...prev, { item, quantity, notes }];
    });
  };

  const handleConfirm = () => {
    if (pendingSelections.length > 0) {
      onItemsSelected(pendingSelections);
    }
    setPendingSelections([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '80vh' } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>Select Inventory Items</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Search by item name, SKU, or category..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Filter">
            <IconButton 
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }} 
              size="small"
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sort">
            <IconButton 
              onClick={(e) => setSortAnchorEl(e.currentTarget)}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }} 
              size="small"
            >
              <SortIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container sx={{ flex: 1, minHeight: 0 }}>
          <Grid size={{ xs: 5 }} sx={{ borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto', height: '100%' }}>
            {filteredInventory.map(item => (
              <InventoryItemCard
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                onClick={() => setSelectedItemId(item.id)}
              />
            ))}
            {filteredInventory.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No items found matching search criteria.</Typography>
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 7 }} sx={{ height: '100%', overflowY: 'auto' }}>
            {selectedItem ? (
              <InventoryItemDetails item={selectedItem} onAddItem={handleAddItem} />
            ) : (
              <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <Typography color="text.secondary" align="center">
                  Select an item from the list on the left to view details and add it to your request.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {pendingSelections.length} item(s) selected
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={onClose} size="small">Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            size="small"
            disabled={pendingSelections.length === 0}
            startIcon={<CheckCircleOutlineIcon />}
          >
            Confirm Selection
          </Button>
        </Box>
      </Box>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        <MenuItem selected={sortBy === 'name_asc'} onClick={() => { setSortBy('name_asc'); setSortAnchorEl(null); }}>
          <ListItemText>Name (A-Z)</ListItemText>
        </MenuItem>
        <MenuItem selected={sortBy === 'name_desc'} onClick={() => { setSortBy('name_desc'); setSortAnchorEl(null); }}>
          <ListItemText>Name (Z-A)</ListItemText>
        </MenuItem>
        <MenuItem selected={sortBy === 'stock_desc'} onClick={() => { setSortBy('stock_desc'); setSortAnchorEl(null); }}>
          <ListItemText>Stock (High to Low)</ListItemText>
        </MenuItem>
        <MenuItem selected={sortBy === 'stock_asc'} onClick={() => { setSortBy('stock_asc'); setSortAnchorEl(null); }}>
          <ListItemText>Stock (Low to High)</ListItemText>
        </MenuItem>
      </Menu>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem onClick={() => setFilterInStock(!filterInStock)}>
          <ListItemIcon>
            <Checkbox checked={filterInStock} edge="start" disableRipple />
          </ListItemIcon>
          <ListItemText>In Stock Only</ListItemText>
        </MenuItem>
      </Menu>

    </Dialog>
  );
}


