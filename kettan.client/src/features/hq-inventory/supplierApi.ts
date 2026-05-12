import { api } from '../../utils/api';

export interface Supplier {
  supplierId: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

export interface SupplierFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
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

export async function listSuppliers(includeInactive = false): Promise<Supplier[]> {
  const params = new URLSearchParams();
  if (includeInactive) params.set('includeInactive', 'true');
  const qs = params.toString();
  return request<Supplier[]>(`/api/suppliers${qs ? `?${qs}` : ''}`);
}

export async function createSupplier(input: SupplierFormData): Promise<Supplier> {
  return request<Supplier>('/api/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateSupplier(supplierId: number, input: SupplierFormData): Promise<Supplier> {
  return request<Supplier>(`/api/suppliers/${supplierId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteSupplier(supplierId: number): Promise<void> {
  return request<void>(`/api/suppliers/${supplierId}`, { method: 'DELETE' });
}

export async function unarchiveSupplier(supplierId: number): Promise<void> {
  return request<void>(`/api/suppliers/${supplierId}/unarchive`, { method: 'POST' });
}
