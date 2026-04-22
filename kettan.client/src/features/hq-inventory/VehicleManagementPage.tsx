import { useMemo, useState } from 'react';
import { Box, Chip, Grid, IconButton, Paper, Typography } from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
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
import { FormTextField } from '../../components/Form/FormTextField';
import { FormDropdown } from '../../components/Form/FormDropdown';
import { FilterDropdown } from '../../components/UI/FilterAndSort';
import { DataTable, type ColumnDef } from '../../components/UI/DataTable';
import { ViewToggle } from '../../components/UI/ViewToggle';
import { VehicleCard } from './components/VehicleCard';
import { createVehicle, listCouriers, listVehicles, softDeleteVehicle, updateVehicle } from './vehicleApi';
import type { Courier, Vehicle, VehicleFormData } from './types';

type StatusFilter = 'all' | 'active' | 'inactive';
type SortFilter = 'plate-asc' | 'plate-desc' | 'type-asc' | 'type-desc';
type VehicleViewMode = 'cards' | 'table';

const INITIAL_FORM: VehicleFormData = {
  courierId: '',
  plateNumber: '',
  vehicleType: '',
  description: '',
  isActive: true,
};

const VIEW_OPTIONS = [
  { value: 'cards' as const, label: 'Cards', icon: <ViewModuleRoundedIcon fontSize="small" /> },
  { value: 'table' as const, label: 'Table', icon: <ViewListRoundedIcon fontSize="small" /> },
];

export function VehicleManagementPage() {
  const [form, setForm] = useState<VehicleFormData>(INITIAL_FORM);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => listVehicles());
  const [couriers] = useState<Courier[]>(() => listCouriers({ includeInactive: true }));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('plate-asc');
  const [showDeleted, setShowDeleted] = useState(false);
  const [viewMode, setViewMode] = useState<VehicleViewMode>('cards');
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadVehicles = (includeDeleted = showDeleted) => {
    setVehicles(listVehicles({ includeDeleted }));
  };

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId],
  );

  const visibleVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = vehicles.filter((vehicle) => {
      const matchesQuery =
        !query ||
        vehicle.plateNumber.toLowerCase().includes(query) ||
        vehicle.vehicleType.toLowerCase().includes(query) ||
        (vehicle.description || '').toLowerCase().includes(query) ||
        (vehicle.courier?.name || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && vehicle.isActive) ||
        (statusFilter === 'inactive' && !vehicle.isActive);

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

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    setForm({
      courierId: vehicle.courierId,
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType,
      description: vehicle.description || '',
      isActive: vehicle.isActive,
    });
    setErrorMessage(null);
  };

  const handleSave = () => {
    const normalizedPlate = form.plateNumber.trim().toUpperCase();

    if (!form.courierId) {
      setErrorMessage('Courier is required.');
      return;
    }

    if (!normalizedPlate) {
      setErrorMessage('Plate number is required.');
      return;
    }

    if (normalizedPlate.length > 50) {
      setErrorMessage('Plate number must be 50 characters or less.');
      return;
    }

    if (!/^[A-Z0-9-]{2,50}$/.test(normalizedPlate)) {
      setErrorMessage('Plate number can only contain letters, numbers, and hyphen.');
      return;
    }

    if (!form.vehicleType.trim()) {
      setErrorMessage('Vehicle type is required.');
      return;
    }

    if (form.vehicleType.trim().length > 50) {
      setErrorMessage('Vehicle type must be 50 characters or less.');
      return;
    }

    if (form.description.trim().length > 255) {
      setErrorMessage('Description must be 255 characters or less.');
      return;
    }

    const duplicate = vehicles.find((vehicle) => {
      if (vehicle.id === selectedVehicleId) {
        return false;
      }

      return vehicle.plateNumber.toUpperCase() === normalizedPlate;
    });

    if (duplicate) {
      setErrorMessage('Plate number already exists.');
      return;
    }

    setErrorMessage(null);

    if (!selectedVehicleId) {
      const created = createVehicle({ ...form, plateNumber: normalizedPlate });
      reloadVehicles();
      handleSelectVehicle(created);
      return;
    }

    const updated = updateVehicle(selectedVehicleId, { ...form, plateNumber: normalizedPlate });

    if (!updated) {
      setErrorMessage('Selected vehicle no longer exists. Please refresh and try again.');
      reloadVehicles();
      resetForm();
      return;
    }

    reloadVehicles();
    handleSelectVehicle(updated);
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    softDeleteVehicle(deleteTarget.id);

    if (selectedVehicleId === deleteTarget.id) {
      resetForm();
    }

    setDeleteTarget(null);
    reloadVehicles();
  };

  const tableColumns: ColumnDef<Vehicle>[] = [
    {
      key: 'plateNumber',
      label: 'Plate Number',
      sortable: true,
      render: (vehicle) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A', fontFamily: 'monospace' }}>
          {vehicle.plateNumber}
        </Typography>
      ),
    },
    {
      key: 'courier',
      label: 'Courier',
      sortable: true,
      sortAccessor: (vehicle) => vehicle.courier?.name || '',
      render: (vehicle) => <Typography sx={{ fontSize: 13 }}>{vehicle.courier?.name || '--'}</Typography>,
    },
    {
      key: 'vehicleType',
      label: 'Vehicle Type',
      width: 140,
      sortable: true,
      render: (vehicle) => <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{vehicle.vehicleType}</Typography>,
    },
    {
      key: 'isActive',
      label: 'Status',
      width: 120,
      align: 'center',
      sortable: true,
      sortAccessor: (vehicle) => (vehicle.isActive ? 1 : 0),
      render: (vehicle) => (
        <Chip
          label={vehicle.isActive ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            fontSize: 11.5,
            fontWeight: 700,
            bgcolor: vehicle.isActive ? 'rgba(84,107,63,0.12)' : 'rgba(148, 163, 184, 0.16)',
            color: vehicle.isActive ? '#546B3F' : '#475569',
            border: `1px solid ${vehicle.isActive ? 'rgba(84,107,63,0.22)' : 'rgba(148, 163, 184, 0.28)'}`,
          }}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: 130,
      sortable: true,
      sortAccessor: (vehicle) => new Date(vehicle.createdAt).getTime(),
      render: (vehicle) => (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {new Date(vehicle.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 90,
      align: 'right',
      render: (vehicle) => (
        <IconButton
          size="small"
          aria-label={`Delete ${vehicle.plateNumber}`}
          onClick={(event) => {
            event.stopPropagation();
            setDeleteTarget(vehicle);
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
            Vehicle Management
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.3 }}>
            Maintain delivery vehicles by assigning couriers and updating status.
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
              <FormDropdown
                label="Courier"
                value={form.courierId}
                onChange={(event) => setForm((prev) => ({ ...prev, courierId: String(event.target.value) }))}
                options={[
                  { value: '', label: 'Select courier' },
                  ...couriers
                    .filter((courier) => !courier.isDeleted)
                    .map((courier) => ({ value: courier.id, label: `${courier.name}${courier.isActive ? '' : ' (Inactive)'}` })),
                ]}
              />

              <FormTextField
                label="Plate Number"
                placeholder="e.g. NGA-4512"
                value={form.plateNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, plateNumber: event.target.value.toUpperCase() }))}
                inputProps={{ maxLength: 50 }}
              />

              <FormTextField
                label="Vehicle Type"
                placeholder="e.g. Van"
                value={form.vehicleType}
                onChange={(event) => setForm((prev) => ({ ...prev, vehicleType: event.target.value }))}
                inputProps={{ maxLength: 50 }}
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
              <Button onClick={handleSave}>{selectedVehicle ? 'Update Vehicle' : 'Save Vehicle'}</Button>
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
                placeholder="Search plate, courier, type..."
                sx={{ minWidth: 250, maxWidth: 340 }}
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

              <FilterDropdown
                label="Visibility"
                icon={<TuneRoundedIcon sx={{ fontSize: 16, color: '#6B4C2A' }} />}
                value={showDeleted ? 'include' : 'active'}
                onChange={(value) => {
                  const includeDeleted = value === 'include';
                  setShowDeleted(includeDeleted);
                  reloadVehicles(includeDeleted);
                }}
                minWidth={150}
                options={[
                  { value: 'active', label: 'Active Only' },
                  { value: 'include', label: 'Include Deleted' },
                ]}
              />

              <ViewToggle value={viewMode} options={VIEW_OPTIONS} onChange={(value) => setViewMode(value as VehicleViewMode)} />
            </Box>

            <Box
              sx={{
                maxHeight: { xs: 'none', lg: 'calc(100vh - 320px)' },
                overflowY: { xs: 'visible', lg: 'auto' },
                pr: { xs: 0, lg: 0.8 },
              }}
            >
              {viewMode === 'cards' ? (
                visibleVehicles.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
                      No vehicles found for your filters.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1.8}>
                    {visibleVehicles.map((vehicle) => (
                      <Grid key={vehicle.id} size={{ xs: 12, md: 6 }}>
                        <VehicleCard
                          vehicle={vehicle}
                          selected={selectedVehicleId === vehicle.id}
                          onSelect={() => handleSelectVehicle(vehicle)}
                          onDelete={() => setDeleteTarget(vehicle)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )
              ) : (
                <DataTable
                  data={visibleVehicles}
                  columns={tableColumns}
                  keyExtractor={(vehicle) => vehicle.id}
                  emptyMessage="No vehicles found for your filters."
                  defaultRowsPerPage={10}
                  pageSizes={[10, 25, 50]}
                  onRowClick={(vehicle) => handleSelectVehicle(vehicle)}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete vehicle"
        message={`Delete ${deleteTarget?.plateNumber || 'this vehicle'}? It will be soft-deleted and hidden from active lists.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
