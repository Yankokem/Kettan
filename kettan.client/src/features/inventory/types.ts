export type InventoryCategory = 'beans' | 'syrup' | 'milk' | 'packaging' | 'equipment';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  stockCount: number;
  reorderPoint: number;
  unit: 'kg' | 'L' | 'pcs' | 'units';
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  supplier: string;
  lastRestocked: string;
}
