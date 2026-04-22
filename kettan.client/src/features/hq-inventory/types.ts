// Units of measure
export interface Unit {
  id: string;
  name: string;      // "Gram", "Kilogram", "Liter", "Milliliter", "Piece"
  symbol: string;    // "g", "kg", "L", "ml", "pc"
}

// Inventory categories for organizing raw materials
export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface ItemCategoryFormData {
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Courier {
  id: string;
  name: string;
  contactNumber?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  courierId: string;
  courier?: Courier;
  plateNumber: string;
  vehicleType: string;
  description?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface VehicleFormData {
  courierId: string;
  plateNumber: string;
  vehicleType: string;
  description: string;
  isActive: boolean;
}

// Legacy type alias for backwards compatibility
export type InventoryCategoryType = 'beans' | 'syrup' | 'milk' | 'packaging' | 'equipment';

// Legacy inventory item (for branch pages using old format)
export interface LegacyInventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategoryType;
  stockCount: number;
  reorderPoint: number;
  unit: 'kg' | 'L' | 'pcs' | 'units';
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  supplier: string;
  lastRestocked: string;
}

// Inventory item (catalog entry)
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  unitId: string;
  unit?: Unit;
  categoryId: string;
  category?: InventoryCategory;
  defaultThreshold: number;
  unitCost: number;
  previousUnitCost?: number;
  totalStock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Batch for FIFO tracking
export interface Batch {
  id: string;
  itemId: string;
  item?: InventoryItem;
  batchNumber: string;
  expiryDate: string;
  currentQuantity: number;
  createdAt: string;
}

// Transaction types
export type TransactionType = 'Restock' | 'Consumption' | 'Sales_Auto' | 'Adjustment' | 'Transfer';

// Inventory transaction (audit trail)
export interface InventoryTransaction {
  id: string;
  batchId: string;
  batch?: Batch;
  itemId: string;
  item?: InventoryItem;
  userId: string;
  userName?: string;
  quantityChange: number;
  transactionType: TransactionType;
  referenceType?: 'Order' | 'Adjustment' | 'StockIn';
  referenceId?: string;
  remarks?: string;
  timestamp: string;
}

// Stock-In form data
export interface StockInFormData {
  itemId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  unitCost: number;
  supplierId?: string;
  remarks?: string;
}

// Stock-In item (for multi-item stock-in)
export interface StockInItem extends StockInFormData {
  id: string;
  itemName?: string;
  itemSku?: string;
  unitSymbol?: string;
  unit?: Unit;
  previousUnitCost?: number;
}

// Stock-Out reasons
export type StockOutReason = 'Wastage' | 'Spillage' | 'Expired' | 'Damaged' | 'Transfer' | 'Other';

// Stock-Out form data
export interface StockOutFormData {
  itemId: string;
  batchId?: string;
  quantity: number;
  reason: StockOutReason;
  remarks?: string;
}

// Adjustment form data
export interface AdjustmentFormData {
  batchId: string;
  newQuantity: number;
  reason: string;
  remarks?: string;
}
