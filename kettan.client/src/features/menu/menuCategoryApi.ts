import { api } from '../../utils/api';
/**
 * Menu Category API — live backend adapter.
 * Replaces the previous localStorage mock with calls to /api/menu-categories.
 */

export interface MenuCategory {
  categoryId: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

export interface MenuCategoryFormData {
  name: string;
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

export async function unarchiveMenuCategory(categoryId: number): Promise<void> {
  return request<void>(`/api/menu-categories/${categoryId}/unarchive`, { method: 'POST' });
}
