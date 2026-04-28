import { api } from '../../utils/api';
/**
 * Menu Items API — live backend adapter.
 * Connects to /api/menu-items for listing, detail, and CRUD operations.
 */

export interface MenuIngredientDto {
  menuItemIngredientId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityPerUnit: number;
  unitOfMeasure: string;
}

export interface MenuVariantIngredientDto {
  variantIngredientId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  quantity: number;
}

export interface VariantDto {
  variantId: number;
  name: string;
  pricingMode: string;
  price: number;
  displayOrder: number;
  isActive: boolean;
  ingredients: MenuVariantIngredientDto[];
}

export interface MenuTagDto {
  tagId: number;
  name: string;
  color: string;
}

export interface MenuItemDto {
  menuItemId: number;
  tenantId: number;
  name: string;
  categoryId?: number | null;
  categoryName: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  ingredients: MenuIngredientDto[];
  variants: VariantDto[];
  tags: MenuTagDto[];
}

export interface CreateMenuItemDto {
  name: string;
  categoryId: number;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  status: string;
  ingredients: { itemId: number; quantityPerUnit: number; unitOfMeasure: string }[];
  variants: {
    name: string;
    pricingMode: string;
    price: number;
    displayOrder: number;
    isActive: boolean;
    ingredients: { itemId: number; quantity: number }[];
  }[];
  tagIds: number[];
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

export async function fetchMenuItems(): Promise<MenuItemDto[]> {
  return request<MenuItemDto[]>('/api/menu-items');
}

export async function fetchMenuItem(id: number): Promise<MenuItemDto> {
  return request<MenuItemDto>(`/api/menu-items/${id}`);
}

export async function createMenuItem(dto: CreateMenuItemDto): Promise<MenuItemDto> {
  return request<MenuItemDto>('/api/menu-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export async function updateMenuItem(id: number, dto: CreateMenuItemDto): Promise<void> {
  return request<void>(`/api/menu-items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export async function deleteMenuItem(id: number): Promise<void> {
  return request<void>(`/api/menu-items/${id}`, { method: 'DELETE' });
}
