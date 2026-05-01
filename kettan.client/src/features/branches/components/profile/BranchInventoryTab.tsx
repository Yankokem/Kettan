import { useMemo, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { SearchInput } from '../../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../../components/UI/FilterAndSort';
import { DataTable, type ColumnDef } from '../../../../components/UI/DataTable';
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

  const tableColumns = useMemo<ColumnDef<BranchInventoryItem>[]>(
    () => [
      {
        key: 'item',
        label: 'Item',
        width: '28%',
        render: (item) => (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{item.name}</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>{item.sku}</Typography>
          </Box>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        width: '14%',
        render: (item) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{item.category}</Typography>,
      },
      {
        key: 'supplier',
        label: 'Supplier',
        width: '16%',
        render: (item) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{item.supplier}</Typography>,
      },
      {
        key: 'stock',
        label: 'Stock',
        width: '14%',
        align: 'right',
        render: (item) => (
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
            {item.stockCount} {item.unit}
          </Typography>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '14%',
        align: 'center',
        render: (item) => (
          <Chip
            label={STATUS_LABEL_MAP[item.status]}
            size="small"
            sx={{
              height: 22,
              borderRadius: 1.5,
              bgcolor: item.status === 'out-of-stock' ? '#FEE2E2' : item.status === 'low-stock' ? '#FEF3C7' : '#DCFCE7',
              color: item.status === 'out-of-stock' ? '#991B1B' : item.status === 'low-stock' ? '#92400E' : '#166534',
              fontWeight: 700,
              fontSize: 10.5,
            }}
          />
        ),
      },
      {
        key: 'restocked',
        label: 'Last Restocked',
        width: '14%',
        render: (item) => (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{formatDate(item.lastRestocked)}</Typography>
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
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
          icon={<SortRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={200}
        />

        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          label="Status"
          icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={168}
        />

        <FilterDropdown
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
          label="Category"
          icon={<CategoryRoundedIcon sx={{ fontSize: 16 }} />}
          minWidth={170}
        />

        <FilterDropdown
          value={supplierFilter}
          onChange={setSupplierFilter}
          options={supplierOptions}
          label="Supplier"
          icon={<LocalShippingRoundedIcon sx={{ fontSize: 16 }} />}
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

      <DataTable
        data={filteredItems}
        columns={tableColumns}
        keyExtractor={(item) => item.id}
        defaultPageSize={20}
        pageSizes={[20, 40, 80]}
        emptyIcon={<Inventory2RoundedIcon />}
        emptyTitle="No inventory items found"
        emptyMessage={
          searchQuery || statusFilter || categoryFilter || supplierFilter
            ? "No items match your current filters. Try adjusting your search."
            : "This branch inventory is currently empty."
        }
      />
    </Box>
  );
}
