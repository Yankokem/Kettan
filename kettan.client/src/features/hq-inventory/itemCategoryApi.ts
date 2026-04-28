import { api } from '../../utils/api';
/**
 * Inventory Category API — live backend adapter.
 * Replaces the previous localStorage mock with calls to /api/inventory-categories.
 */

export interface InventoryCategory {
  categoryId: number;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface ItemCategoryFormData {
  name: string;
  description: string;
  displayOrder: number;
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

export async function listItemCategories(): Promise<InventoryCategory[]> {
  return request<InventoryCategory[]>('/api/inventory-categories');
}

export async function createItemCategory(input: ItemCategoryFormData): Promise<InventoryCategory> {
  return request<InventoryCategory>('/api/inventory-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateItemCategory(categoryId: number, input: ItemCategoryFormData): Promise<InventoryCategory> {
  return request<InventoryCategory>(`/api/inventory-categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteItemCategory(categoryId: number): Promise<void> {
  return request<void>(`/api/inventory-categories/${categoryId}`, { method: 'DELETE' });
}
