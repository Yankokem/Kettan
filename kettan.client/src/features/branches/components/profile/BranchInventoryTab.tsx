import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Pagination, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ArrowUpDown, Funnel, Layers3, LayoutGrid, Rows3, Truck } from 'lucide-react';
import { SearchInput } from '../../../../components/UI/SearchInput';
import { FilterDropdown } from '../../../../components/UI/FilterAndSort';
import { DataTable, type ColumnDef } from '../../../../components/UI/DataTable';
import type { BranchInventoryItem, BranchInventoryStatus } from '../../types';
import { formatDate } from '../../branchProfileData';
import { BranchInventoryCard } from './BranchInventoryCard';

interface BranchInventoryTabProps {
  items: BranchInventoryItem[];
}

const CARDS_PER_PAGE = 20;

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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [page, setPage] = useState(1);

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

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, statusFilter, categoryFilter, supplierFilter, viewMode]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / CARDS_PER_PAGE));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * CARDS_PER_PAGE;
    return filteredItems.slice(start, start + CARDS_PER_PAGE);
  }, [filteredItems, page]);

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

        <ToggleButtonGroup
          exclusive
          value={viewMode}
          onChange={(_event, value: 'cards' | 'table' | null) => {
            if (value) {
              setViewMode(value);
            }
          }}
          size="small"
          sx={{
            height: 40,
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              px: 1.4,
              borderColor: 'rgba(107, 76, 42, 0.3)',
              color: '#6B4C2A',
              '&.Mui-selected': {
                bgcolor: 'rgba(107, 76, 42, 0.12)',
                color: '#4A3424',
              },
            },
          }}
        >
          <ToggleButton value="cards">
            <LayoutGrid size={14} />
          </ToggleButton>
          <ToggleButton value="table">
            <Rows3 size={14} />
          </ToggleButton>
        </ToggleButtonGroup>
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

      {viewMode === 'cards' ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {pagedItems.map((item) => (
              <BranchInventoryCard key={item.id} item={item} />
            ))}
          </Box>

          {filteredItems.length > CARDS_PER_PAGE ? (
            <Box sx={{ mt: 2.2, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_event, value) => setPage(value)}
                shape="rounded"
                color="primary"
                sx={{ '& .MuiPaginationItem-root': { fontWeight: 600 } }}
              />
            </Box>
          ) : null}
        </>
      ) : (
        <DataTable
          data={filteredItems}
          columns={tableColumns}
          keyExtractor={(item) => item.id}
          defaultPageSize={20}
          pageSizes={[20, 40, 80]}
          emptyMessage="No inventory items match your filters."
        />
      )}

      {filteredItems.length === 0 && viewMode === 'cards' ? (
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
