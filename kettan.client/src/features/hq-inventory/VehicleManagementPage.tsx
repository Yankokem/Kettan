import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Grid, IconButton, Typography, Card } from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';

import { PageHeader } from '../../components/UI/PageHeader';
import { Button } from '../../components/UI/Button';
import { SearchInput } from '../../components/UI/SearchInput';
import { ConfirmDialog } from '../../components/UI/ConfirmDialog';
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { ViewToggle } from '../../components/UI/ViewToggle';
import { DataStateWrapper } from '../../components/UI/DataStateWrapper';
import { VehicleCard } from './components/VehicleCard';
import { createVehicle, listVehicles, deleteVehicle, updateVehicle, type Vehicle, type VehicleFormData } from './vehicleApi';

type StatusFilter = 'all' | 'active' | 'inactive';
type SortFilter = 'plate-asc' | 'plate-desc' | 'type-asc' | 'type-desc';
type VehicleViewMode = 'cards' | 'table';

const INITIAL_FORM: VehicleFormData = {
  plateNumber: '',
  vehicleType: '',
  description: '',
  isActive: true,
};

const VEHICLE_TYPE_OPTIONS = [
  { value: 'Motorcycle', label: 'Motorcycle' },
  { value: 'Van', label: 'Van' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Car', label: 'Car' },
];

const VIEW_OPTIONS = [
  { value: 'cards' as const, label: '', icon: <ViewModuleRoundedIcon sx={{ fontSize: 16 }} /> },
  { value: 'table' as const, label: '', icon: <ViewListRoundedIcon sx={{ fontSize: 16 }} /> },
];

export function VehicleManagementPage() {
  const [form, setForm] = useState<VehicleFormData>(INITIAL_FORM);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('plate-asc');
  const [viewMode, setViewMode] = useState<VehicleViewMode>('cards');
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const vData = await listVehicles();
      setVehicles(vData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.vehicleId === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId],
  );

  const visibleVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = vehicles.filter((v) => {
      const matchesQuery =
        !query ||
        v.plateNumber.toLowerCase().includes(query) ||
        v.vehicleType.toLowerCase().includes(query) ||
        (v.description || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && v.isActive) ||
        (statusFilter === 'inactive' && !v.isActive);

      return matchesQuery && matchesStatus;
    });

    const sorted = [...filtered];
    sorted.sort((left, right) => {
      if (sortFilter === 'plate-desc') {
        return right.plateNumber.localeCompare(left.plateNumber);
      }
      if (sortFilter === 'type-asc') {
        return left.vehicleType.localeCompare(right.vehicleType);
      }
      if (sortFilter === 'type-desc') {
        return right.vehicleType.localeCompare(left.vehicleType);
      }
      return left.plateNumber.localeCompare(right.plateNumber);
    });

    return sorted;
  }, [vehicles, search, sortFilter, statusFilter]);

  const resetForm = () => {
    setSelectedVehicleId(null);
    setForm(INITIAL_FORM);
    setErrorMessage(null);
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setSelectedVehicleId(v.vehicleId);
    setForm({
      plateNumber: v.plateNumber,
      vehicleType: v.vehicleType,
      description: v.description || '',
      isActive: v.isActive,
    });
    setErrorMessage(null);
  };

  const handleSave = async () => {
    const normalizedPlate = form.plateNumber.trim().toUpperCase();

    if (!normalizedPlate) {
      setErrorMessage('Plate number is required.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      if (!selectedVehicleId) {
        await createVehicle({ ...form, plateNumber: normalizedPlate });
      } else {
        await updateVehicle(selectedVehicleId, { ...form, plateNumber: normalizedPlate });
      }
      await fetchData();
      resetForm();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save vehicle');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      await deleteVehicle(deleteTarget.vehicleId);
      if (selectedVehicleId === deleteTarget.vehicleId) {
        resetForm();
      }
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete vehicle');
      setLoading(false);
    }
  };

  const tableColumns: ColumnDef<Vehicle>[] = [
    {
      key: 'plateNumber',
      label: 'Plate Number',
      sortable: true,
      render: (v) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {v.plateNumber}
        </Typography>
      ),
    },
    {
      key: 'vehicleType',
      label: 'Vehicle Type',
      width: 140,
      sortable: true,
      render: (v) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{v.vehicleType}</Typography>,
    },
    {
      key: 'isActive',
      label: 'Status',
      width: 120,
      align: 'center',
      sortable: true,
      sortAccessor: (v) => (v.isActive ? 1 : 0),
      render: (v) => (
        <Chip
          label={v.isActive ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            fontSize: 11.5,
            fontWeight: 700,
            bgcolor: v.isActive ? 'rgba(84,107,63,0.12)' : 'rgba(148, 163, 184, 0.16)',
            color: v.isActive ? '#546B3F' : '#475569',
            border: `1px solid ${v.isActive ? 'rgba(84,107,63,0.22)' : 'rgba(148, 163, 184, 0.28)'}`,
          }}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 90,
      align: 'right',
      render: (v) => (
        <IconButton
          size="small"
          aria-label={`Delete ${v.plateNumber}`}
          onClick={(event) => {
            event.stopPropagation();
            setDeleteTarget(v);
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
    <Box sx={{ pb: 3 }}>
      <PageHeader 
        title="Vehicle Management" 
        description="Maintain delivery vehicles and update fleet status."
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
                <LocalShippingRoundedIcon sx={{ fontSize: 20, color: '#6B4C2A' }} />
                <Typography sx={{ fontSize: 15.5, fontWeight: 700 }}>
                  {selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                </Typography>
              </Box>
              {selectedVehicle ? (
                <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={resetForm}>
                  New
                </Button>
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              <FormTextField
                label="Plate Number"
                placeholder="e.g. NGA-4512"
                value={form.plateNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, plateNumber: event.target.value.toUpperCase() }))}
                inputProps={{ maxLength: 50 }}
              />

              <FormDropdown
                label="Vehicle Type"
                value={form.vehicleType}
                onChange={(event) => setForm((prev) => ({ ...prev, vehicleType: String(event.target.value) }))}
                options={VEHICLE_TYPE_OPTIONS}
              />

              <FormTextField
                label="Description"
                placeholder="Optional notes"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                multiline
                rows={3}
                inputProps={{ maxLength: 255 }}
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
              <Button onClick={handleSave} loading={loading}>{selectedVehicle ? 'Update Vehicle' : 'Save Vehicle'}</Button>
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
                  placeholder="Search plate, type..."
                  sx={{ maxWidth: 420, flex: 1 }}
                />

                <FilterDropdown
                  label="Sort"
                  icon={<SortRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
                  value={sortFilter}
                  onChange={(value) => setSortFilter(value as SortFilter)}
                  minWidth={160}
                  options={[
                    { value: 'plate-asc', label: 'Plate A-Z' },
                    { value: 'plate-desc', label: 'Plate Z-A' },
                    { value: 'type-asc', label: 'Type A-Z' },
                    { value: 'type-desc', label: 'Type Z-A' },
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
              </Box>

              <ViewToggle value={viewMode} options={VIEW_OPTIONS} onChange={(value) => setViewMode(value as VehicleViewMode)} />
            </Box>

            <DataStateWrapper
              loading={loading && vehicles.length === 0}
              error={error}
              isEmpty={visibleVehicles.length === 0}
              emptyTitle="No vehicles found"
              emptyMessage={search ? "We couldn't find any vehicles matching your search." : "There are currently no vehicles registered in the fleet."}
              emptyIcon={<LocalShippingRoundedIcon />}
            >
              {viewMode === 'cards' ? (
                <Box
                  sx={{
                    maxHeight: { xs: 'none', lg: 'calc(100vh - 320px)' },
                    overflowY: { xs: 'visible', lg: 'auto' },
                    pr: { xs: 0, lg: 0.8 },
                    pt: 1, // Prevent clipping on hover
                  }}
                >
                  <Grid container spacing={1.8} sx={{ overflow: 'visible' }}>
                    {visibleVehicles.map((v) => (
                      <Grid key={v.vehicleId} size={{ xs: 12, md: 6 }}>
                        <VehicleCard
                          vehicle={v}
                          selected={selectedVehicleId === v.vehicleId}
                          onSelect={() => handleSelectVehicle(v)}
                          onDelete={() => setDeleteTarget(v)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <DataTable
                  data={visibleVehicles}
                  columns={tableColumns}
                  keyExtractor={(v) => v.vehicleId.toString()}
                  emptyMessage="No vehicles found for your filters."
                  defaultRowsPerPage={10}
                  pageSizes={[10, 25, 50]}
                  onRowClick={(v) => handleSelectVehicle(v)}
                />
              )}
            </DataStateWrapper>
          </Card>
        </Box>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete vehicle"
        message={`Delete ${deleteTarget?.plateNumber || 'this vehicle'}? This action is permanent.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}

