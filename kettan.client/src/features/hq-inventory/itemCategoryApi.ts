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
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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
