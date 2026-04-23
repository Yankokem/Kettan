/**
 * Vehicles & Couriers API — live backend adapter.
 * Replaces the previous localStorage mock with calls to /api/vehicles and /api/couriers.
 */

export interface Courier {
  courierId: number;
  name: string;
  contactNumber?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Vehicle {
  vehicleId: number;
  courierId: number;
  courierName: string;
  plateNumber: string;
  vehicleType: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface VehicleFormData {
  courierId: number;
  plateNumber: string;
  vehicleType: string;
  description: string;
  isActive: boolean;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function listCouriers(includeInactive = false): Promise<Courier[]> {
  const params = includeInactive ? '?includeInactive=true' : '';
  return request<Courier[]>(`/api/couriers${params}`);
}

export async function listVehicles(courierId?: number, includeInactive = false): Promise<Vehicle[]> {
  const params = new URLSearchParams();
  if (courierId) params.set('courierId', courierId.toString());
  if (includeInactive) params.set('includeInactive', 'true');
  const qs = params.toString();
  return request<Vehicle[]>(`/api/vehicles${qs ? `?${qs}` : ''}`);
}

export async function createVehicle(input: VehicleFormData): Promise<Vehicle> {
  return request<Vehicle>('/api/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateVehicle(vehicleId: number, input: VehicleFormData): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${vehicleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteVehicle(vehicleId: number): Promise<void> {
  return request<void>(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
}
