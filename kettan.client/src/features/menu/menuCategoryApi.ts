/**
 * Menu Category API — live backend adapter.
 * Replaces the previous localStorage mock with calls to /api/menu-categories.
 */

export interface MenuCategory {
  categoryId: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface MenuCategoryFormData {
  name: string;
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

export async function listMenuCategories(): Promise<MenuCategory[]> {
  return request<MenuCategory[]>('/api/menu-categories');
}

export async function createMenuCategory(input: MenuCategoryFormData): Promise<MenuCategory> {
  return request<MenuCategory>('/api/menu-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateMenuCategory(categoryId: number, input: MenuCategoryFormData): Promise<MenuCategory> {
  return request<MenuCategory>(`/api/menu-categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteMenuCategory(categoryId: number): Promise<void> {
  return request<void>(`/api/menu-categories/${categoryId}`, { method: 'DELETE' });
}
