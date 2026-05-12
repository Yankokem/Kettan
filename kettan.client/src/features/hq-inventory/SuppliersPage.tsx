import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Grid, IconButton, Typography, Card } from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import UnarchiveRoundedIcon from '@mui/icons-material/UnarchiveRounded';

import { PageHeader } from '../../components/UI/PageHeader';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { useToast } from '../../components/UI/ToastProvider';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { ViewToggle } from '../../components/UI/ViewToggle';
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { SupplierCard } from './components/SupplierCard';
import { 
  createSupplier, 
  listSuppliers, 
  deleteSupplier as archiveSupplier, 
  unarchiveSupplier,
  updateSupplier, 
  type Supplier, 
  type SupplierFormData 
} from './supplierApi';

type StatusFilter = 'all' | 'active' | 'inactive' | 'archived';
type SortFilter = 'name-asc' | 'name-desc' | 'recent';
type SupplierViewMode = 'cards' | 'table';

const INITIAL_FORM: SupplierFormData = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  isActive: true,
};

const VIEW_OPTIONS = [
  { value: 'cards' as const, label: '', icon: <ViewModuleRoundedIcon sx={{ fontSize: 16 }} /> },
  { value: 'table' as const, label: '', icon: <ViewListRoundedIcon sx={{ fontSize: 16 }} /> },
];

export function SuppliersPage() {
  const [form, setForm] = useState<SupplierFormData>(INITIAL_FORM);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('name-asc');
  const [viewMode, setViewMode] = useState<SupplierViewMode>('cards');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      const sData = await listSuppliers(true);
      setSuppliers(sData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const reloadSuppliers = async () => {
    try {
      const sData = await listSuppliers(true);
      setSuppliers(sData);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.supplierId === selectedSupplierId) ?? null,
    [suppliers, selectedSupplierId],
  );

  const visibleSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = suppliers.filter((supplier) => {
      const matchesQuery =
        !query ||
        supplier.name.toLowerCase().includes(query) ||
        (supplier.contactPerson || '').toLowerCase().includes(query) ||
        (supplier.email || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' 
          ? !supplier.isDeleted
          : statusFilter === 'archived'
            ? supplier.isDeleted
            : !supplier.isDeleted && (
                (statusFilter === 'active' && supplier.isActive) ||
                (statusFilter === 'inactive' && !supplier.isActive)
              );

      return matchesQuery && matchesStatus;
    });

    const sorted = [...filtered];
    sorted.sort((left, right) => {
      if (sortFilter === 'name-desc') {
        return right.name.localeCompare(left.name);
      }
      if (sortFilter === 'recent') {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
      return left.name.localeCompare(right.name);
    });

    return sorted;
  }, [suppliers, search, sortFilter, statusFilter]);

  const resetForm = () => {
    setSelectedSupplierId(null);
    setForm(INITIAL_FORM);
    setErrorMessage(null);
  };

  const handleSelectSupplier = (s: Supplier) => {
    setSelectedSupplierId(s.supplierId);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      isActive: s.isActive,
    });
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrorMessage('Supplier name is required.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      if (!selectedSupplierId) {
        await createSupplier(form);
      } else {
        await updateSupplier(selectedSupplierId, form);
      }
      await fetchData();
      resetForm();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save supplier');
      setLoading(false);
    }
  };

  const handleArchive = async (supplier: Supplier) => {
    setLoading(true);
    try {
      await archiveSupplier(supplier.supplierId);
      if (selectedSupplierId === supplier.supplierId) {
        resetForm();
      }
      showToast(`${supplier.name} archived successfully.`);
      await reloadSuppliers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to archive supplier', 'error');
      setLoading(false);
    }
  };

  const handleUnarchive = async (supplier: Supplier) => {
    setLoading(true);
    try {
      await unarchiveSupplier(supplier.supplierId);
      showToast(`${supplier.name} restored successfully.`);
      await reloadSuppliers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to restore supplier', 'error');
      setLoading(false);
    }
  };

  const tableColumns: ColumnDef<Supplier>[] = [
    {
      key: 'name',
      label: 'Supplier Name',
      sortable: true,
      render: (s) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          {s.name}
        </Typography>
      ),
    },
    {
      key: 'contactPerson',
      label: 'Contact Person',
      render: (s) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{s.contactPerson || '-'}</Typography>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (s) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{s.email || '-'}</Typography>,
    },
    {
      key: 'isActive',
      label: 'Status',
      width: 120,
      align: 'center',
      sortable: true,
      render: (s) => (
        <Chip
          label={s.isActive ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            fontSize: 11.5,
            fontWeight: 700,
            bgcolor: s.isActive ? 'rgba(84,107,63,0.12)' : 'rgba(148, 163, 184, 0.16)',
            color: s.isActive ? '#546B3F' : '#475569',
            border: `1px solid ${s.isActive ? 'rgba(84,107,63,0.22)' : 'rgba(148, 163, 184, 0.28)'}`,
          }}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 90,
      align: 'right',
      render: (supplier) => (
        <IconButton
          size="small"
          aria-label={supplier.isDeleted ? `Restore ${supplier.name}` : `Archive ${supplier.name}`}
          onClick={(event) => {
            event.stopPropagation();
            if (supplier.isDeleted) {
              handleUnarchive(supplier);
            } else {
              handleArchive(supplier);
            }
          }}
          sx={{
            width: 30,
            height: 30,
            color: supplier.isDeleted ? '#059669' : '#D97706',
            border: '1px solid',
            borderColor: supplier.isDeleted ? 'rgba(5, 150, 105, 0.25)' : 'rgba(217, 119, 6, 0.25)',
            bgcolor: supplier.isDeleted ? 'rgba(5, 150, 105, 0.04)' : 'rgba(217, 119, 6, 0.04)',
            '&:hover': { bgcolor: supplier.isDeleted ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)' },
          }}
        >
          {supplier.isDeleted ? (
            <UnarchiveRoundedIcon sx={{ fontSize: 16 }} />
          ) : (
            <ArchiveRoundedIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 3 }}>
      <PageHeader 
        title="Supplier Management" 
        description="Maintain inventory sources and contact information."
        backTo="/hq-inventory"
      />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
        <Card
          elevation={0}
          sx={{
            width: { xs: '100%', lg: 380 },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            p: 3,
          }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessRoundedIcon sx={{ fontSize: 20, color: '#6B4C2A' }} />
                <Typography sx={{ fontSize: 15.5, fontWeight: 700 }}>
                  {selectedSupplier ? 'Edit Supplier' : 'Add Supplier'}
                </Typography>
              </Box>
              {selectedSupplier ? (
                <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={resetForm}>
                  New
                </Button>
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              <FormTextField
                label="Supplier Name"
                placeholder="e.g. Coffee Beans Inc."
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                inputProps={{ maxLength: 30 }}
              />

              <FormTextField
                label="Contact Person"
                placeholder="e.g. John Doe"
                value={form.contactPerson}
                onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))}
                inputProps={{ maxLength: 30 }}
              />

              <FormTextField
                label="Email"
                placeholder="e.g. john@supplier.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                inputProps={{ maxLength: 30 }}
              />

              <FormTextField
                label="Phone"
                placeholder="e.g. 0917-123-4567"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                inputProps={{ maxLength: 20 }}
              />

              <FormTextField
                label="Address"
                placeholder="e.g. Makati City"
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                inputProps={{ maxLength: 50 }}
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
              <Button onClick={handleSave} loading={loading}>{selectedSupplier ? 'Update Supplier' : 'Save Supplier'}</Button>
              <Button variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={resetForm} disabled={loading}>
                Reset
              </Button>
            </Box>
          </Card>

          <Card
            elevation={0}
            sx={{
              flex: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '14px',
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.2, mb: 2.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flex: 1 }}>
                <SearchInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, contact, email..."
                  sx={{ maxWidth: 420, flex: 1 }}
                />

                <FilterDropdown
                  label="Sort"
                  icon={<SortRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
                  value={sortFilter}
                  onChange={(value) => setSortFilter(value as SortFilter)}
                  minWidth={160}
                  options={[
                    { value: 'name-asc', label: 'Name A-Z' },
                    { value: 'name-desc', label: 'Name Z-A' },
                    { value: 'recent', label: 'Recently Added' },
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
                    { value: 'archived', label: 'Archived' },
                  ]}
                />
              </Box>

              <ViewToggle value={viewMode} options={VIEW_OPTIONS} onChange={(value) => setViewMode(value as SupplierViewMode)} />
            </Box>

            <DataStateWrapper
              loading={loading && suppliers.length === 0}
              error={error}
              isEmpty={visibleSuppliers.length === 0}
              emptyTitle="No suppliers found"
              emptyMessage={search ? "We couldn't find any suppliers matching your search." : "There are currently no suppliers registered."}
              emptyIcon={<BusinessRoundedIcon />}
            >
              {viewMode === 'cards' ? (
                <Box
                  sx={{
                    maxHeight: { xs: 'none', lg: 'calc(100vh - 320px)' },
                    overflowY: { xs: 'visible', lg: 'auto' },
                    pr: { xs: 0, lg: 0.8 },
                    pt: 1,
                  }}
                >
                  <Grid container spacing={1.8} sx={{ overflow: 'visible' }}>
                    {visibleSuppliers.map((supplier) => (
                      <Grid key={supplier.supplierId} size={{ xs: 12, md: 6 }}>
                        <SupplierCard
                          supplier={supplier}
                          selected={selectedSupplierId === supplier.supplierId}
                          onSelect={() => handleSelectSupplier(supplier)}
                          onArchive={() => handleArchive(supplier)}
                          onUnarchive={() => handleUnarchive(supplier)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <DataTable
                  data={visibleSuppliers}
                  columns={tableColumns}
                  keyExtractor={(s) => s.supplierId.toString()}
                  emptyMessage="No suppliers found for your filters."
                  defaultRowsPerPage={10}
                  pageSizes={[10, 25, 50]}
                  onRowClick={(s) => handleSelectSupplier(s)}
                />
              )}
            </DataStateWrapper>
          </Card>
        </Box>
      </Box>
    );
}
