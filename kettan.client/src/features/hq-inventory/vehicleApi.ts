import { api } from '../../utils/api';
/**
 * Vehicles API — live backend adapter.
 * Replaces the previous localStorage mock with calls to /api/vehicles.
 */

export interface Vehicle {
  vehicleId: number;
  plateNumber: string;
  vehicleType: string;
  description?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

export interface VehicleFormData {
  plateNumber: string;
  vehicleType: string;
  description: string;
  isActive: boolean;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await api({
      url,
      method: options?.method || 'GET',
      data: options?.body ? JSON.parse(options.body as string) : undefined,
      headers: options?.headers as any,
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || `Request failed: ${error.message}`);
  }
}

export async function listVehicles(includeInactive = false): Promise<Vehicle[]> {
  const params = new URLSearchParams();
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

export async function unarchiveVehicle(vehicleId: number): Promise<void> {
  return request<void>(`/api/vehicles/${vehicleId}/unarchive`, { method: 'POST' });
}

