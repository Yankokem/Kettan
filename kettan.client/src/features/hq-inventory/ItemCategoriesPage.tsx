import { useMemo, useState } from 'react';
import { Box, Chip, Grid, IconButton, Paper, Typography } from '@mui/material';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { ConfirmDialog } from '../../components/UI/ConfirmDialog';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { ViewToggle } from '../../components/UI/ViewToggle';
import { ItemCategoryCard } from './components/ItemCategoryCard';
import { createItemCategory, listItemCategories, softDeleteItemCategory, updateItemCategory } from './itemCategoryApi';
import type { InventoryCategory, ItemCategoryFormData } from './types';

type StatusFilter = 'all' | 'active' | 'inactive';
type SortFilter = 'order-asc' | 'order-desc' | 'name-asc' | 'name-desc';
type CategoryViewMode = 'cards' | 'table';

const INITIAL_FORM: ItemCategoryFormData = {
  name: '',
  description: '',
  displayOrder: 1,
  isActive: true,
};

export function ItemCategoriesPage() {
  const [form, setForm] = useState<ItemCategoryFormData>(INITIAL_FORM);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<InventoryCategory[]>(() => listItemCategories());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('order-asc');
  const [viewMode, setViewMode] = useState<CategoryViewMode>('cards');
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryCategory | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadCategories = (includeDeleted = showDeleted) => {
    setCategories(listItemCategories({ includeDeleted }));
  };

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = categories.filter((category) => {
      const matchesQuery =
        !query ||
        category.name.toLowerCase().includes(query) ||
        (category.description || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && category.isActive) ||
        (statusFilter === 'inactive' && !category.isActive);

      return matchesQuery && matchesStatus;
    });

    const sorted = [...filtered];
    sorted.sort((left, right) => {
      if (sortFilter === 'order-desc') {
        return right.displayOrder - left.displayOrder;
      }

      if (sortFilter === 'name-asc') {
        return left.name.localeCompare(right.name);
      }

      if (sortFilter === 'name-desc') {
        return right.name.localeCompare(left.name);
      }

      return left.displayOrder - right.displayOrder;
    });

    return sorted;
  }, [categories, search, sortFilter, statusFilter]);

  const resetForm = () => {
    setSelectedCategoryId(null);
    setForm(INITIAL_FORM);
    setErrorMessage(null);
  };

  const handleSelectCategory = (category: InventoryCategory) => {
    setSelectedCategoryId(category.id);
    setForm({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setErrorMessage(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setErrorMessage('Category name is required.');
      return;
    }

    if (form.name.trim().length > 100) {
      setErrorMessage('Category name must be 100 characters or less.');
      return;
    }

    if (form.description.trim().length > 500) {
      setErrorMessage('Description must be 500 characters or less.');
      return;
    }

    if (form.displayOrder < 0) {
      setErrorMessage('Display order must be zero or greater.');
      return;
    }

    setErrorMessage(null);

    if (!selectedCategoryId) {
      const created = createItemCategory(form);
      reloadCategories();
      handleSelectCategory(created);
      return;
    }

    const updated = updateItemCategory(selectedCategoryId, form);

    if (!updated) {
      setErrorMessage('Selected category no longer exists. Please refresh and try again.');
      reloadCategories();
      resetForm();
      return;
    }

    reloadCategories();
    handleSelectCategory(updated);
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    softDeleteItemCategory(deleteTarget.id);

    if (selectedCategoryId === deleteTarget.id) {
      resetForm();
    }

    setDeleteTarget(null);
    reloadCategories();
  };

  const tableColumns: ColumnDef<InventoryCategory>[] = [
    {
      key: 'name',
      label: 'Category',
      sortable: true,
      render: (category) => <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{category.name}</Typography>,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (category) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{category.description || '--'}</Typography>,
    },
    {
      key: 'displayOrder',
      label: 'Order',
      width: 100,
      align: 'center',
      sortable: true,
      render: (category) => <Typography sx={{ fontSize: 13 }}>{category.displayOrder}</Typography>,
    },
    {
      key: 'isActive',
      label: 'Status',
      width: 120,
      align: 'center',
      sortable: true,
      sortAccessor: (category) => (category.isActive ? 1 : 0),
      render: (category) => (
        <Chip
          size="small"
          label={category.isActive ? 'Active' : 'Inactive'}
          sx={{
            fontSize: 11.5,
            fontWeight: 700,
            bgcolor: category.isActive ? 'rgba(84,107,63,0.12)' : 'rgba(148, 163, 184, 0.16)',
            color: category.isActive ? '#546B3F' : '#475569',
            border: `1px solid ${category.isActive ? 'rgba(84,107,63,0.22)' : 'rgba(148, 163, 184, 0.28)'}`,
          }}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 90,
      align: 'right',
      render: (category) => (
        <IconButton
          size="small"
          aria-label={`Delete ${category.name}`}
          onClick={(event) => {
            event.stopPropagation();
            setDeleteTarget(category);
          }}
          sx={{
            width: 30,
            height: 30,
            color: '#B91C1C',
            border: '1px solid rgba(185, 28, 28, 0.25)',
            bgcolor: 'rgba(185, 28, 28, 0.04)',
            '&:hover': { bgcolor: 'rgba(185, 28, 28, 0.1)' },
          }}
        >
          <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/hq-inventory" />
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Item Category Management
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.3 }}>
            Add or edit inventory categories on the left. Click cards on the right to modify them.
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' } }}>
          <Box
            sx={{
              width: { xs: '100%', lg: '38%' },
              p: 3,
              borderRight: { xs: 'none', lg: '1px solid' },
              borderBottom: { xs: '1px solid', lg: 'none' },
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryRoundedIcon sx={{ fontSize: 20, color: '#6B4C2A' }} />
                <Typography sx={{ fontSize: 15.5, fontWeight: 700 }}>
                  {selectedCategory ? 'Edit Category' : 'Add Category'}
                </Typography>
              </Box>
              {selectedCategory ? (
                <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={resetForm}>
                  New
                </Button>
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              <FormTextField
                label="Category Name"
                placeholder="e.g. Dairy Alternatives"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                inputProps={{ maxLength: 100 }}
              />

              <FormTextField
                label="Description"
                placeholder="Describe what belongs in this category..."
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                multiline
                rows={3}
                inputProps={{ maxLength: 500 }}
              />

              <FormTextField
                label="Display Order"
                type="number"
                value={form.displayOrder}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setForm((prev) => ({ ...prev, displayOrder: Number.isNaN(nextValue) ? 0 : nextValue }));
                }}
                inputProps={{ min: 0 }}
              />

              <FormDropdown
                label="Status"
                value={form.isActive ? 'true' : 'false'}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: String(event.target.value) === 'true' }))}
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
              />
            </Box>

            {errorMessage ? (
              <Typography sx={{ fontSize: 12.5, color: 'error.main', mt: 1.4 }}>{errorMessage}</Typography>
            ) : null}

            <Box sx={{ mt: 2.7, display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
              <Button onClick={handleSave}>
                {selectedCategory ? 'Update Category' : 'Save Category'}
              </Button>
              <Button variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={resetForm}>
                Reset
              </Button>
            </Box>
          </Box>

          <Box sx={{ width: { xs: '100%', lg: '62%' }, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap', mb: 2.2 }}>
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search item categories..."
                sx={{ minWidth: 250, maxWidth: 340 }}
              />

              <FilterDropdown
                label="Sort"
                icon={<SortRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
                value={sortFilter}
                onChange={(value) => setSortFilter(value as SortFilter)}
                minWidth={150}
                options={[
                  { value: 'order-asc', label: 'Order Low-High' },
                  { value: 'order-desc', label: 'Order High-Low' },
                  { value: 'name-asc', label: 'Name A-Z' },
                  { value: 'name-desc', label: 'Name Z-A' },
                ]}
              />

              <FilterDropdown
                label="Status"
                icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                minWidth={150}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />

              <FilterDropdown
                label="Visibility"
                icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
                value={showDeleted ? 'include' : 'active'}
                onChange={(value) => {
                  const includeDeleted = value === 'include';
                  setShowDeleted(includeDeleted);
                  reloadCategories(includeDeleted);
                }}
                minWidth={150}
                options={[
                  { value: 'active', label: 'Active Only' },
                  { value: 'include', label: 'Include Deleted' },
                ]}
              />

              <ViewToggle
                value={viewMode}
                options={[
                  { value: 'cards', label: 'Cards', icon: <ViewModuleRoundedIcon fontSize="small" /> },
                  { value: 'table', label: 'Table', icon: <ViewListRoundedIcon fontSize="small" /> },
                ]}
                onChange={setViewMode}
              />
            </Box>

            {viewMode === 'cards' ? (
              <Box
                sx={{
                  maxHeight: { xs: 'none', lg: 'calc(100vh - 320px)' },
                  overflowY: { xs: 'visible', lg: 'auto' },
                  pr: { xs: 0, lg: 0.8 },
                }}
              >
                {visibleCategories.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
                      No categories found for your filters.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1.8}>
                    {visibleCategories.map((category) => (
                      <Grid key={category.id} size={{ xs: 12, md: 6 }}>
                        <ItemCategoryCard
                          category={category}
                          selected={selectedCategoryId === category.id}
                          onSelect={() => handleSelectCategory(category)}
                          onDelete={() => setDeleteTarget(category)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            ) : (
              <DataTable
                data={visibleCategories}
                columns={tableColumns}
                keyExtractor={(category) => category.id}
                emptyMessage="No categories found for your filters."
                defaultRowsPerPage={10}
                pageSizes={[10, 25, 50]}
                onRowClick={(category) => handleSelectCategory(category)}
              />
            )}
          </Box>
        </Box>
      </Paper>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete item category"
        message={`Delete ${deleteTarget?.name || 'this category'}? It will be soft-deleted and hidden from active lists.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
