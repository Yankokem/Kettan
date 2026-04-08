import type {
  Unit,
  InventoryCategory,
  InventoryItem,
  Batch,
  InventoryTransaction,
} from './types';

// Mock Units
export const MOCK_UNITS: Unit[] = [
  { id: 'u1', name: 'Gram', symbol: 'g' },
  { id: 'u2', name: 'Kilogram', symbol: 'kg' },
  { id: 'u3', name: 'Milliliter', symbol: 'ml' },
  { id: 'u4', name: 'Liter', symbol: 'L' },
  { id: 'u5', name: 'Piece', symbol: 'pc' },
  { id: 'u6', name: 'Unit', symbol: 'units' },
];

// Mock Inventory Categories
export const MOCK_CATEGORIES: InventoryCategory[] = [
  { id: 'cat1', name: 'Beans', description: 'Coffee beans and grounds', displayOrder: 1, isActive: true },
  { id: 'cat2', name: 'Syrup', description: 'Flavored syrups', displayOrder: 2, isActive: true },
  { id: 'cat3', name: 'Milk', description: 'Milk and dairy alternatives', displayOrder: 3, isActive: true },
  { id: 'cat4', name: 'Packaging', description: 'Cups, lids, straws, bags', displayOrder: 4, isActive: true },
  { id: 'cat5', name: 'Equipment', description: 'Equipment and supplies', displayOrder: 5, isActive: true },
];

// Helper to get unit/category by id
const getUnit = (id: string) => MOCK_UNITS.find(u => u.id === id);
const getCategory = (id: string) => MOCK_CATEGORIES.find(c => c.id === id);

// Mock Inventory Items
export const MOCK_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: '1',
    sku: 'BN-ESA-01',
    name: 'Espresso Blend A',
    unitId: 'u2',
    unit: getUnit('u2'),
    categoryId: 'cat1',
    category: getCategory('cat1'),
    defaultThreshold: 20,
    unitCost: 850,
    previousUnitCost: 800,
    totalStock: 15,
    status: 'Low Stock',
    isDeleted: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-28T14:30:00Z',
  },
  {
    id: '2',
    sku: 'SY-VAN-02',
    name: 'Vanilla Syrup (1L)',
    unitId: 'u4',
    unit: getUnit('u4'),
    categoryId: 'cat2',
    category: getCategory('cat2'),
    defaultThreshold: 15,
    unitCost: 320,
    previousUnitCost: 320,
    totalStock: 45,
    status: 'In Stock',
    isDeleted: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
  },
  {
    id: '3',
    sku: 'PK-CP-12',
    name: 'Takeaway Cups (12oz)',
    unitId: 'u5',
    unit: getUnit('u5'),
    categoryId: 'cat4',
    category: getCategory('cat4'),
    defaultThreshold: 1000,
    unitCost: 5.5,
    previousUnitCost: 5,
    totalStock: 800,
    status: 'Low Stock',
    isDeleted: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-10T09:00:00Z',
  },
  {
    id: '4',
    sku: 'MK-OAT-01',
    name: 'Oat Milk (1L)',
    unitId: 'u4',
    unit: getUnit('u4'),
    categoryId: 'cat3',
    category: getCategory('cat3'),
    defaultThreshold: 30,
    unitCost: 145,
    previousUnitCost: 140,
    totalStock: 60,
    status: 'In Stock',
    isDeleted: false,
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-04-01T11:00:00Z',
  },
  {
    id: '5',
    sku: 'EQ-FLT-2',
    name: 'Grouphead Filters',
    unitId: 'u6',
    unit: getUnit('u6'),
    categoryId: 'cat5',
    category: getCategory('cat5'),
    defaultThreshold: 5,
    unitCost: 250,
    previousUnitCost: 250,
    totalStock: 20,
    status: 'In Stock',
    isDeleted: false,
    createdAt: '2025-11-01T08:00:00Z',
    updatedAt: '2025-12-10T16:00:00Z',
  },
];

// Mock Batches
export const MOCK_BATCHES: Batch[] = [
  // Espresso Blend A batches
  { id: 'b1', itemId: '1', batchNumber: 'BN-2026-001', expiryDate: '2026-11-20', currentQuantity: 5, createdAt: '2026-02-15T08:00:00Z' },
  { id: 'b2', itemId: '1', batchNumber: 'BN-2026-015', expiryDate: '2026-12-15', currentQuantity: 8, createdAt: '2026-03-10T10:00:00Z' },
  { id: 'b3', itemId: '1', batchNumber: 'BN-2026-028', expiryDate: '2027-01-10', currentQuantity: 2, createdAt: '2026-03-28T14:30:00Z' },
  // Vanilla Syrup batches
  { id: 'b4', itemId: '2', batchNumber: 'SY-2026-003', expiryDate: '2027-03-15', currentQuantity: 25, createdAt: '2026-01-20T09:00:00Z' },
  { id: 'b5', itemId: '2', batchNumber: 'SY-2026-012', expiryDate: '2027-06-01', currentQuantity: 20, createdAt: '2026-03-15T10:00:00Z' },
  // Takeaway Cups batches
  { id: 'b6', itemId: '3', batchNumber: 'PK-2026-008', expiryDate: '2028-03-01', currentQuantity: 500, createdAt: '2026-02-01T08:00:00Z' },
  { id: 'b7', itemId: '3', batchNumber: 'PK-2026-019', expiryDate: '2028-06-01', currentQuantity: 300, createdAt: '2026-03-10T09:00:00Z' },
  // Oat Milk batches
  { id: 'b8', itemId: '4', batchNumber: 'MK-2026-022', expiryDate: '2026-04-20', currentQuantity: 25, createdAt: '2026-03-20T11:00:00Z' },
  { id: 'b9', itemId: '4', batchNumber: 'MK-2026-031', expiryDate: '2026-05-05', currentQuantity: 35, createdAt: '2026-04-01T11:00:00Z' },
  // Grouphead Filters batches
  { id: 'b10', itemId: '5', batchNumber: 'EQ-2025-045', expiryDate: '2030-12-31', currentQuantity: 20, createdAt: '2025-12-10T16:00:00Z' },
];

// Mock Transactions
export const MOCK_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 't1',
    batchId: 'b9',
    itemId: '4',
    userId: 'user1',
    userName: 'Maria Santos',
    quantityChange: 35,
    transactionType: 'Restock',
    referenceType: 'StockIn',
    referenceId: 'SI-2026-041',
    remarks: 'Weekly delivery from Oatly Pacific',
    timestamp: '2026-04-01T11:00:00Z',
  },
  {
    id: 't2',
    batchId: 'b8',
    itemId: '4',
    userId: 'system',
    userName: 'Auto',
    quantityChange: -0.2,
    transactionType: 'Sales_Auto',
    referenceType: 'Order',
    referenceId: '#1234',
    remarks: undefined,
    timestamp: '2026-04-07T14:30:00Z',
  },
  {
    id: 't3',
    batchId: 'b8',
    itemId: '4',
    userId: 'user2',
    userName: 'Juan Dela Cruz',
    quantityChange: -5,
    transactionType: 'Consumption',
    remarks: 'Spilled during morning prep',
    timestamp: '2026-04-08T09:30:00Z',
  },
  {
    id: 't4',
    batchId: 'b3',
    itemId: '1',
    userId: 'user1',
    userName: 'Maria Santos',
    quantityChange: 10,
    transactionType: 'Restock',
    referenceType: 'StockIn',
    referenceId: 'SI-2026-038',
    remarks: 'Emergency restock from Origin Roasters',
    timestamp: '2026-03-28T14:30:00Z',
  },
  {
    id: 't5',
    batchId: 'b1',
    itemId: '1',
    userId: 'system',
    userName: 'Auto',
    quantityChange: -0.018,
    transactionType: 'Sales_Auto',
    referenceType: 'Order',
    referenceId: '#1235',
    remarks: undefined,
    timestamp: '2026-04-08T10:15:00Z',
  },
  {
    id: 't6',
    batchId: 'b6',
    itemId: '3',
    userId: 'user2',
    userName: 'Juan Dela Cruz',
    quantityChange: -50,
    transactionType: 'Consumption',
    remarks: 'Damaged during unboxing',
    timestamp: '2026-04-05T16:00:00Z',
  },
  {
    id: 't7',
    batchId: 'b4',
    itemId: '2',
    userId: 'system',
    userName: 'Auto',
    quantityChange: -0.03,
    transactionType: 'Sales_Auto',
    referenceType: 'Order',
    referenceId: '#1230',
    remarks: undefined,
    timestamp: '2026-04-06T11:20:00Z',
  },
  {
    id: 't8',
    batchId: 'b10',
    itemId: '5',
    userId: 'user1',
    userName: 'Maria Santos',
    quantityChange: -2,
    transactionType: 'Transfer',
    referenceType: 'Order',
    referenceId: 'TR-001',
    remarks: 'Transferred to Branch #2',
    timestamp: '2026-04-02T09:00:00Z',
  },
];

// Helper functions
export function getBatchesForItem(itemId: string): Batch[] {
  return MOCK_BATCHES
    .filter(b => b.itemId === itemId)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // FIFO by expiry
}

export function getTransactionsForItem(itemId: string): InventoryTransaction[] {
  return MOCK_TRANSACTIONS
    .filter(t => t.itemId === itemId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Most recent first
}

export function generateBatchNumber(itemSku: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const seq = Math.floor(Math.random() * 900) + 100;
  const prefix = itemSku.split('-')[0] || 'BN';
  return `${prefix}-${year}-${seq}`;
}
