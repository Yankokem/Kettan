import { useMemo, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { ArrowUpDown, Funnel, Layers3, PackageCheck, Store, Truck } from 'lucide-react';
import { SearchInput } from '../../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../../components/UI/FilterAndSort';
import type { BranchInventoryItem, BranchInventoryStatus } from '../../types';
import { formatDate } from '../../branchProfileData';

interface BranchInventoryTabProps {
  items: BranchInventoryItem[];
}

const SORT_OPTIONS = [
  { value: 'risk-desc', label: 'Highest Risk First' },
  { value: 'stock-asc', label: 'Stock: Low to High' },
  { value: 'stock-desc', label: 'Stock: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'restocked-desc', label: 'Recently Restocked' },
];

const STATUS_OPTIONS = [
  { value: 'in-stock', label: 'In Stock' },
  { value: 'low-stock', label: 'Low Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
];

const STATUS_LABEL_MAP: Record<BranchInventoryStatus, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

export function BranchInventoryTab({ items }: BranchInventoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('risk-desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.category)))
        .sort((left, right) => left.localeCompare(right))
        .map((category) => ({ value: category, label: category })),
    [items]
  );

  const supplierOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.supplier)))
        .sort((left, right) => left.localeCompare(right))
        .map((supplier) => ({ value: supplier, label: supplier })),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const nextItems = items.filter((item) => {
      const matchesQuery =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesSupplier = !supplierFilter || item.supplier === supplierFilter;

      return matchesQuery && matchesStatus && matchesCategory && matchesSupplier;
    });

    const riskScore = (item: BranchInventoryItem) => item.stockCount - item.reorderPoint;

    nextItems.sort((left, right) => {
      switch (sortBy) {
        case 'stock-asc':
          return left.stockCount - right.stockCount;
        case 'stock-desc':
          return right.stockCount - left.stockCount;
        case 'name-asc':
          return left.name.localeCompare(right.name);
        case 'name-desc':
          return right.name.localeCompare(left.name);
        case 'restocked-desc':
          return new Date(right.lastRestocked).getTime() - new Date(left.lastRestocked).getTime();
        case 'risk-desc':
        default:
          return riskScore(left) - riskScore(right);
      }
    });

    return nextItems;
  }, [categoryFilter, items, searchQuery, sortBy, statusFilter, supplierFilter]);

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary', mb: 0.8 }}>Inventory</Typography>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.8 }}>
        Track stock levels, suppliers, and reorder risk across branch-managed SKUs.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 1.6 }}>
        <SearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by item, SKU, category, or supplier..."
          sx={{ flex: 1, minWidth: 260 }}
        />

        <FilterDropdown
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
          label="Sort"
          icon={<ArrowUpDown size={14} />}
          minWidth={200}
        />

        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          label="Status"
          icon={<Funnel size={14} />}
          minWidth={168}
        />

        <FilterDropdown
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
          label="Category"
          icon={<Layers3 size={14} />}
          minWidth={170}
        />

        <FilterDropdown
          value={supplierFilter}
          onChange={setSupplierFilter}
          options={supplierOptions}
          label="Supplier"
          icon={<Truck size={14} />}
          minWidth={170}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.2 }}>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
          Showing {filteredItems.length} of {items.length} items
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {statusFilter ? (
            <Chip label={`Status: ${STATUS_LABEL_MAP[statusFilter as BranchInventoryStatus]}`} size="small" sx={{ height: 24 }} />
          ) : null}
          {categoryFilter ? <Chip label={`Category: ${categoryFilter}`} size="small" sx={{ height: 24 }} /> : null}
          {supplierFilter ? <Chip label={`Supplier: ${supplierFilter}`} size="small" sx={{ height: 24 }} /> : null}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filteredItems.map((item) => {
          const isLowStock = item.status === 'low-stock';
          const isOutOfStock = item.status === 'out-of-stock';

          const coveragePercent =
            item.reorderPoint > 0
              ? Math.max(0, Math.min(100, Math.round((item.stockCount / item.reorderPoint) * 100)))
              : 100;

          return (
            <Paper
              key={item.id}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: isOutOfStock
                  ? 'rgba(185,28,28,0.28)'
                  : isLowStock
                    ? 'rgba(180,83,9,0.28)'
                    : 'divider',
                bgcolor: isOutOfStock
                  ? 'rgba(254,242,242,0.58)'
                  : isLowStock
                    ? 'rgba(255,251,235,0.58)'
                    : 'background.paper',
                borderRadius: 3,
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ minWidth: 260 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: 'text.primary' }}>{item.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.7, flexWrap: 'wrap' }}>
                    <Chip label={item.sku} size="small" sx={{ height: 22, fontFamily: 'monospace', bgcolor: 'rgba(148,163,184,0.16)', fontWeight: 700, fontSize: 10.5 }} />
                    <Chip label={item.category} size="small" sx={{ height: 22, bgcolor: 'rgba(107,76,42,0.1)', color: '#6B4C2A', fontWeight: 700, fontSize: 10.5 }} />
                    <Chip label={item.supplier} size="small" sx={{ height: 22, bgcolor: 'rgba(59,130,246,0.1)', color: '#1E40AF', fontWeight: 700, fontSize: 10.5 }} />
                  </Box>
                  <Typography sx={{ mt: 0.9, fontSize: 11.5, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                    <Store size={12} />
                    Last restocked {formatDate(item.lastRestocked)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', ml: 'auto' }}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{item.stockCount}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>
                      units in stock ({item.unit})
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.3 }}>
                      Reorder point: {item.reorderPoint}
                    </Typography>
                  </Box>

                  <Chip
                    icon={<PackageCheck size={13} />}
                    label={STATUS_LABEL_MAP[item.status]}
                    size="small"
                    sx={{
                      height: 24,
                      borderRadius: 1.5,
                      bgcolor: isOutOfStock ? '#FEE2E2' : isLowStock ? '#FEF3C7' : '#DCFCE7',
                      color: isOutOfStock ? '#991B1B' : isLowStock ? '#92400E' : '#166534',
                      border: '1px solid',
                      borderColor: isOutOfStock ? '#FECACA' : isLowStock ? '#FCD34D' : '#86EFAC',
                      fontWeight: 800,
                      fontSize: 10.5,
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 6,
                    borderRadius: 999,
                    bgcolor: 'rgba(148,163,184,0.22)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${coveragePercent}%`,
                      height: '100%',
                      bgcolor: isOutOfStock ? '#DC2626' : isLowStock ? '#D97706' : '#16A34A',
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {filteredItems.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            py: 7,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.secondary' }}>No inventory items match your filters.</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.6 }}>
            Try clearing one or more filters to widen the result set.
          </Typography>
        </Paper>
      ) : null}
    </Box>
  );
}
