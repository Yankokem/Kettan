export type MenuItemStatus = 'Active' | 'Inactive' | 'Out of Stock';

export interface RecipeIngredient {
  id: string;
  itemId: string;
  itemName: string;
  qtyPerUnit: number;
  uom: string;
}

export interface MenuVariant {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  status: MenuItemStatus;
  image?: string;
  variants: MenuVariant[];
  createdAt: string;
}

export interface MenuItemFormData {
  name: string;
  category: string;
  sellingPrice: number;
  status: MenuItemStatus;
  image?: string;
  variants: MenuVariant[];
}

export interface InventoryItemOption {
  id: string;
  name: string;
  sku: string;
  uom: string;
  category: string;
}
