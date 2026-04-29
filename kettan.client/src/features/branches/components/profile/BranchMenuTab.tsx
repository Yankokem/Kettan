import { useMemo, useState } from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import { DataTable, type ColumnDef } from '../../../../components/UI/DataTable';
import { SearchInput } from '../../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../../components/UI/FilterAndSort';
import type { MenuItemDto } from '../../../menu/menuItemsApi';
import type { BranchInventoryItem } from '../../types';

interface BranchMenuTabProps {
  menuItems: MenuItemDto[];
  branchInventoryItems: BranchInventoryItem[];
}

type AvailabilityStatus = 'available' | 'partial' | 'unavailable' | 'no-recipe';

interface MenuItemWithAvailability extends MenuItemDto {
  availability: AvailabilityStatus;
  missingIngredients: string[];
}

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'price-low', label: 'Price: Low to High' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Out of Stock', label: 'Out of Stock' },
];

const AVAILABILITY_FILTER_OPTIONS = [
  { value: 'available', label: '✅ Available' },
  { value: 'partial', label: '⚠️ Partial' },
  { value: 'unavailable', label: '❌ Unavailable' },
  { value: 'no-recipe', label: 'No Recipe' },
];

function getAvailabilityChip(availability: AvailabilityStatus, missingIngredients: string[]) {
  switch (availability) {
    case 'available':
      return (
        <Chip
          icon={<CheckCircleRoundedIcon sx={{ fontSize: 14 }} />}
          label="Available"
          size="small"
          sx={{
            height: 24,
            borderRadius: 1.5,
            bgcolor: 'rgba(22,163,74,0.08)',
            color: '#166534',
            fontSize: 11,
            fontWeight: 700,
            '& .MuiChip-icon': { color: '#166534' },
          }}
        />
      );
    case 'partial':
      return (
        <Tooltip
          title={
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5 }}>Missing ingredients:</Typography>
              {missingIngredients.map((name) => (
                <Typography key={name} sx={{ fontSize: 11 }}>• {name}</Typography>
              ))}
            </Box>
          }
          arrow
          placement="left"
        >
          <Chip
            icon={<WarningAmberRoundedIcon sx={{ fontSize: 14 }} />}
            label="Partial"
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor: 'rgba(217,119,6,0.08)',
              color: '#92400E',
              fontSize: 11,
              fontWeight: 700,
              '& .MuiChip-icon': { color: '#B45309' },
              cursor: 'help',
            }}
          />
        </Tooltip>
      );
    case 'unavailable':
      return (
        <Tooltip title="None of the required ingredients are in this branch's inventory" arrow>
          <Chip
            icon={<CancelRoundedIcon sx={{ fontSize: 14 }} />}
            label="Unavailable"
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor: 'rgba(220,38,38,0.08)',
              color: '#991B1B',
              fontSize: 11,
              fontWeight: 700,
              '& .MuiChip-icon': { color: '#991B1B' },
              cursor: 'help',
            }}
          />
        </Tooltip>
      );
    case 'no-recipe':
    default:
      return (
        <Chip
          icon={<HelpOutlineRoundedIcon sx={{ fontSize: 14 }} />}
          label="No Recipe"
          size="small"
          sx={{
            height: 24,
            borderRadius: 1.5,
            bgcolor: 'rgba(148,163,184,0.12)',
            color: 'text.secondary',
            fontSize: 11,
            fontWeight: 700,
            '& .MuiChip-icon': { color: 'text.secondary' },
          }}
        />
      );
  }
}

export function BranchMenuTab({ menuItems, branchInventoryItems }: BranchMenuTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [statusFilter, setStatusFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Build a Set of item IDs that this branch has in inventory
  const branchItemIds = useMemo(
    () => new Set(branchInventoryItems.map((item) => item.id)),
    [branchInventoryItems]
  );

  // Compute availability for each menu item based on ingredient cross-reference
  const menuItemsWithAvailability = useMemo<MenuItemWithAvailability[]>(() => {
    return menuItems.map((menuItem) => {
      // Collect all unique ingredient itemIds from all variants
      const allIngredientItemIds = new Set<number>();
      const ingredientNameMap = new Map<number, string>();

      for (const variant of menuItem.variants) {
        for (const ingredient of variant.ingredients) {
          allIngredientItemIds.add(ingredient.itemId);
          ingredientNameMap.set(ingredient.itemId, ingredient.itemName);
        }
      }

      // Also check base-level ingredients
      for (const ingredient of menuItem.ingredients) {
        allIngredientItemIds.add(ingredient.itemId);
        ingredientNameMap.set(ingredient.itemId, ingredient.itemName);
      }

      if (allIngredientItemIds.size === 0) {
        return { ...menuItem, availability: 'no-recipe' as const, missingIngredients: [] };
      }

      const missingIds: number[] = [];
      for (const itemId of allIngredientItemIds) {
        if (!branchItemIds.has(String(itemId))) {
          missingIds.push(itemId);
        }
      }

      const missingIngredients = missingIds.map((id) => ingredientNameMap.get(id) || `Item #${id}`);

      let availability: AvailabilityStatus;
      if (missingIds.length === 0) {
        availability = 'available';
      } else if (missingIds.length < allIngredientItemIds.size) {
        availability = 'partial';
      } else {
        availability = 'unavailable';
      }

      return { ...menuItem, availability, missingIngredients };
    });
  }, [menuItems, branchItemIds]);

  // Filter and sort
  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    let result = menuItemsWithAvailability.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.categoryName.toLowerCase().includes(normalizedQuery);

      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesAvailability = !availabilityFilter || item.availability === availabilityFilter;

      return matchesQuery && matchesStatus && matchesAvailability;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-high':
          return b.basePrice - a.basePrice;
        case 'price-low':
          return a.basePrice - b.basePrice;
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [menuItemsWithAvailability, searchQuery, sortBy, statusFilter, availabilityFilter]);

  // Category filter options
  const categoryOptions = useMemo(() => {
    const categories = new Set(menuItems.map((item) => item.categoryName).filter(Boolean));
    return Array.from(categories).sort().map((cat) => ({ value: cat, label: cat }));
  }, [menuItems]);

  const columns = useMemo<ColumnDef<MenuItemWithAvailability>[]>(
    () => [
      {
        key: 'name',
        label: 'Menu Item',
        width: '28%',
        render: (item) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: '#FAF5EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {item.imageUrl ? (
                <Box
                  component="img"
                  src={item.imageUrl}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <LocalCafeRoundedIcon sx={{ fontSize: 18, color: '#C9A84C', opacity: 0.5 }} />
              )}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                {item.name}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                {item.variants.length} variant{item.variants.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        width: '16%',
        render: (item) => (
          <Chip
            label={item.categoryName || 'Uncategorized'}
            size="small"
            sx={{
              height: 24,
              borderRadius: 1.5,
              bgcolor: 'rgba(107,76,42,0.08)',
              color: '#6B4C2A',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        ),
      },
      {
        key: 'basePrice',
        label: 'Base Price',
        width: '12%',
        align: 'right',
        render: (item) => (
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
            ₱{Number(item.basePrice).toFixed(2)}
          </Typography>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '14%',
        align: 'center',
        render: (item) => {
          const statusConfig: Record<string, { bg: string; color: string }> = {
            Active: { bg: 'rgba(22,163,74,0.08)', color: '#166534' },
            Inactive: { bg: 'rgba(148,163,184,0.12)', color: '#64748B' },
            'Out of Stock': { bg: 'rgba(220,38,38,0.08)', color: '#991B1B' },
          };
          const config = statusConfig[item.status] || statusConfig['Inactive'];
          return (
            <Chip
              label={item.status}
              size="small"
              sx={{
                height: 24,
                borderRadius: 1.5,
                bgcolor: config.bg,
                color: config.color,
                fontSize: 11,
                fontWeight: 700,
              }}
            />
          );
        },
      },
      {
        key: 'availability',
        label: 'Branch Availability',
        width: '18%',
        align: 'center',
        render: (item) => getAvailabilityChip(item.availability, item.missingIngredients),
      },
    ],
    []
  );

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      {/* Info banner */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.2)',
        }}
      >
        <LocalCafeRoundedIcon sx={{ fontSize: 16, color: '#B08B5A' }} />
        <Typography sx={{ fontSize: 12, color: '#6B4C2A', fontWeight: 600 }}>
          This menu is managed by HQ. Items shown here are read-only. Availability is based on this branch&apos;s current inventory.
        </Typography>
      </Box>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.2, mb: 2.8, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', flex: 1 }}>
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search menu items..."
            sx={{ minWidth: 240, maxWidth: 380, flex: 1 }}
          />

          <FilterDropdown
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
            label="Sort"
            icon={<SortRoundedIcon sx={{ fontSize: 16 }} />}
            minWidth={175}
          />

          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
            label="Status"
            icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
            minWidth={145}
          />

          <FilterDropdown
            value={availabilityFilter}
            onChange={setAvailabilityFilter}
            options={AVAILABILITY_FILTER_OPTIONS}
            label="Availability"
            icon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
            minWidth={160}
          />
        </Box>
      </Box>

      {/* Data Table — READ-ONLY, no create/edit/delete buttons */}
      <DataTable
        data={filteredItems}
        columns={columns}
        keyExtractor={(item) => String(item.menuItemId)}
        defaultPageSize={10}
        pageSizes={[5, 10, 25]}
        emptyIcon={<LocalCafeRoundedIcon />}
        emptyTitle="No menu items found"
        emptyMessage={searchQuery ? "No menu items match your search criteria." : "The HQ menu catalog is currently empty."}
      />
    </Box>
  );
}
