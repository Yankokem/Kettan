import { MOCK_COURIERS, MOCK_VEHICLES } from './mockData';
import type { Courier, Vehicle, VehicleFormData } from './types';

const STORAGE_KEY = 'kettan.inventory.vehicles.v1';

const SEED_VEHICLES: Vehicle[] = MOCK_VEHICLES.map((vehicle) => ({ ...vehicle }));
const SEED_COURIERS: Courier[] = MOCK_COURIERS.map((courier) => ({ ...courier }));

function hasWindow() {
  return typeof window !== 'undefined';
}

function readStore(): Vehicle[] {
  if (!hasWindow()) {
    return [...SEED_VEHICLES];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VEHICLES));
    return [...SEED_VEHICLES];
  }

  try {
    const parsed = JSON.parse(raw) as Vehicle[];
    return Array.isArray(parsed) ? parsed : [...SEED_VEHICLES];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VEHICLES));
    return [...SEED_VEHICLES];
  }
}

function writeStore(rows: Vehicle[]) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function sortRows(rows: Vehicle[]) {
  return [...rows].sort((a, b) => {
    return a.plateNumber.localeCompare(b.plateNumber);
  });
}

function makeId() {
  return `vh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function courierLookup() {
  return new Map(SEED_COURIERS.map((courier) => [courier.id, courier]));
}

export function listCouriers(options?: { includeInactive?: boolean }): Courier[] {
  const includeInactive = options?.includeInactive ?? false;
  return SEED_COURIERS.filter((courier) => !courier.isDeleted && (includeInactive || courier.isActive));
}

export function listVehicles(options?: { includeDeleted?: boolean }): Vehicle[] {
  const includeDeleted = options?.includeDeleted ?? false;
  const couriers = courierLookup();
  const rows = readStore();
  const visibleRows = includeDeleted ? rows : rows.filter((row) => !row.isDeleted);

  return sortRows(visibleRows).map((vehicle) => ({
    ...vehicle,
    courier: couriers.get(vehicle.courierId),
  }));
}

export function createVehicle(input: VehicleFormData): Vehicle {
  const rows = readStore();
  const couriers = courierLookup();

  const created: Vehicle = {
    id: makeId(),
    courierId: input.courierId,
    courier: couriers.get(input.courierId),
    plateNumber: input.plateNumber.trim().toUpperCase(),
    vehicleType: input.vehicleType.trim(),
    description: input.description.trim() || undefined,
    isActive: input.isActive,
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };

  const nextRows = sortRows([...rows, created]);
  writeStore(nextRows);
  return created;
}

export function updateVehicle(vehicleId: string, input: VehicleFormData): Vehicle | null {
  const rows = readStore();
  const index = rows.findIndex((row) => row.id === vehicleId);

  if (index < 0) {
    return null;
  }

  const couriers = courierLookup();

  const updated: Vehicle = {
    ...rows[index],
    courierId: input.courierId,
    courier: couriers.get(input.courierId),
    plateNumber: input.plateNumber.trim().toUpperCase(),
    vehicleType: input.vehicleType.trim(),
    description: input.description.trim() || undefined,
    isActive: input.isActive,
  };

  const nextRows = [...rows];
  nextRows[index] = updated;
  writeStore(sortRows(nextRows));
  return updated;
}

export function softDeleteVehicle(vehicleId: string): Vehicle | null {
  const rows = readStore();
  const index = rows.findIndex((row) => row.id === vehicleId);

  if (index < 0) {
    return null;
  }

  const deleted: Vehicle = {
    ...rows[index],
    isDeleted: true,
    deletedAt: new Date().toISOString(),
  };

  const nextRows = [...rows];
  nextRows[index] = deleted;
  writeStore(nextRows);
  return deleted;
}
