import { useMemo, useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import { BackButton } from '../../components/UI/BackButton';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { ConfirmDialog } from '../../components/UI/ConfirmDialog';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { MenuCategoryCard } from './components/MenuCategoryCard';
import { createMenuCategory, listMenuCategories, softDeleteMenuCategory, updateMenuCategory } from './menuCategoryApi';
import type { MenuCategory, MenuCategoryFormData } from './types';

type StatusFilter = 'all' | 'active' | 'inactive';
type SortFilter = 'order-asc' | 'order-desc' | 'name-asc' | 'name-desc';

const INITIAL_FORM: MenuCategoryFormData = {
  name: '',
  displayOrder: 1,
  isActive: true,
};

export function MenuCategoriesPage() {
  const [form, setForm] = useState<MenuCategoryFormData>(INITIAL_FORM);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>(() => listMenuCategories());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('order-asc');
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuCategory | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadCategories = (includeDeleted = showDeleted) => {
    setCategories(listMenuCategories({ includeDeleted }));
  };

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = categories.filter((category) => {
      const matchesQuery = !query || category.name.toLowerCase().includes(query);
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

  const handleSelectCategory = (category: MenuCategory) => {
    setSelectedCategoryId(category.id);
    setForm({
      name: category.name,
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

    if (form.displayOrder < 0) {
      setErrorMessage('Display order must be zero or greater.');
      return;
    }

    setErrorMessage(null);

    if (!selectedCategoryId) {
      const created = createMenuCategory(form);
      reloadCategories();
      handleSelectCategory(created);
      return;
    }

    const updated = updateMenuCategory(selectedCategoryId, form);

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

    softDeleteMenuCategory(deleteTarget.id);

    if (selectedCategoryId === deleteTarget.id) {
      resetForm();
    }

    setDeleteTarget(null);
    reloadCategories();
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton to="/menu" />
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Menu Category Management
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.3 }}>
            Left panel is for add/edit. Click a category card on the right to edit it.
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
                placeholder="e.g. Non-Coffee"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                inputProps={{ maxLength: 100 }}
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
                placeholder="Search menu categories..."
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
            </Box>

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
                      <MenuCategoryCard
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
          </Box>
        </Box>
      </Paper>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete menu category"
        message={`Delete ${deleteTarget?.name || 'this category'}? It will be soft-deleted and hidden from active lists.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
