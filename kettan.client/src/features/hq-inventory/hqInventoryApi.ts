import { api } from '../../utils/api';
import type {
  Batch,
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
  TransactionType,
} from './types';

interface ItemDto {
  itemId: number;
  sku: string;
  name: string;
  unit: string;
  inventoryCategoryId: number | null;
  inventoryCategoryName: string | null;
  itemCategoryId: number | null;
  itemCategoryName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  defaultThreshold: number;
  unitCost: number;
  previousUnitCost: number | null;
  totalStock: number;
  isLowStock: boolean;
  isBranchThreshold?: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ItemDetailDto extends ItemDto {
  batches: BatchDto[];
}

interface BatchDto {
  batchId: number;
  itemId: number;
  batchNumber: string;
  expiryDate: string;
  currentQuantity: number;
  createdAt: string;
}

interface TransactionDto {
  transactionId: number;
  batchId: number;
  batchNumber: string;
  itemId: number;
  itemName: string;
  itemSku: string;
  userId: number;
  userName: string;
  quantityChange: number;
  transactionType: string;
  referenceType: string | null;
  referenceId: number | null;
  remarks: string | null;
  timestamp: string;
}


interface InventoryCategoryDto {
  categoryId: number;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface CreateOrUpdateItemPayload {
  sku: string;
  name: string;
  unit: string;
  inventoryCategoryId: number | null;
  itemCategoryId: number | null;
  supplierId: number | null;
  defaultThreshold: number;
  unitCost: number;
  sellingPrice: number | null;
  isBundle: boolean;
  imageUrl: string | null;
}

interface CreateItemInput {
  sku: string;
  name: string;
  unit: string;
  inventoryCategoryId?: string;
  itemCategoryId?: string;
  supplierId?: string;
  defaultThreshold: number;
  unitCost: number;
  sellingPrice?: number;
  imageUrl?: string | null;
}

interface UpdateItemInput extends CreateItemInput { }

interface StockInInput {
  quantity: number;
  batchNumber: string;
  expiryDate?: string;
  unitCost?: number;
  supplierId?: number;
  defaultThreshold?: number;
  remarks?: string;
}

interface StockOutInput {
  quantity: number;
  reason: string;
  remarks?: string;
}

const SAFE_FUTURE_EXPIRY_DAYS = 30;

function toCategory(row: InventoryCategoryDto): InventoryCategory {
  return {
    id: String(row.categoryId),
    name: row.name,
    description: row.description ?? undefined,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
    isDeleted: false,
    deletedAt: null,
    createdAt: row.createdAt,
  };
}

function resolveTransactionType(rawType: string): TransactionType {
  const normalized = rawType.trim().toLowerCase();

  if (normalized === 'restock' || normalized === 'stockin' || normalized === 'stock_in') {
    return 'Restock';
  }

  if (
    normalized === 'consumption' ||
    normalized === 'stockout' ||
    normalized === 'stock_out' ||
    normalized === 'stock-out'
  ) {
    return 'Consumption';
  }

  if (normalized === 'sales_auto' || normalized === 'sale' || normalized === 'sales') {
    return 'Sales_Auto';
  }

  if (normalized === 'transfer') {
    return 'Transfer';
  }

  return 'Adjustment';
}

function toItemStatus(totalStock: number, defaultThreshold: number): InventoryItem['status'] {
  if (totalStock <= 0) {
    return 'Out of Stock';
  }

  if (totalStock <= defaultThreshold) {
    return 'Low Stock';
  }

  return 'In Stock';
}

function toItem(row: ItemDto): InventoryItem {
  const totalStock = Number(row.totalStock || 0);
  const defaultThreshold = Number(row.defaultThreshold || 0);

  const categoryId = row.inventoryCategoryId ?? row.itemCategoryId;
  const categoryName = row.inventoryCategoryName ?? row.itemCategoryName;

  return {
    id: String(row.itemId),
    sku: row.sku,
    name: row.name,
    unit: row.unit,
    categoryId: categoryId != null ? String(categoryId) : '',
    supplierIds: row.supplierId != null ? [String(row.supplierId)] : undefined,
    supplierName: row.supplierName ?? undefined,
    category:
      categoryId != null
        ? {
          id: String(categoryId),
          name: categoryName ?? 'Uncategorized',
          displayOrder: 0,
          isActive: true,
          isDeleted: false,
          deletedAt: null,
          createdAt: row.createdAt,
        }
        : undefined,
    defaultThreshold,
    unitCost: Number(row.unitCost || 0),
    previousUnitCost: row.previousUnitCost != null ? Number(row.previousUnitCost) : undefined,
    totalStock,
    status: toItemStatus(totalStock, defaultThreshold),
    isBranchThreshold: row.isBranchThreshold,
    imageUrl: row.imageUrl,
    isDeleted: false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toBatch(row: BatchDto): Batch {
  return {
    id: String(row.batchId),
    itemId: String(row.itemId),
    batchNumber: row.batchNumber,
    expiryDate: row.expiryDate,
    currentQuantity: Number(row.currentQuantity || 0),
    createdAt: row.createdAt,
  };
}

function toReferenceType(
  value: string | null
): InventoryTransaction['referenceType'] | undefined {
  if (!value) {
    return undefined;
  }

  if (value === 'Order' || value === 'Adjustment' || value === 'StockIn') {
    return value;
  }

  return undefined;
}

function toTransaction(
  row: TransactionDto,
  item?: InventoryItem,
  batchById?: Map<string, Batch>
): InventoryTransaction {
  const batchId = String(row.batchId);
  const batch = batchById?.get(batchId);

  return {
    id: String(row.transactionId),
    batchId,
    batch:
      batch ??
      (row.batchNumber
        ? {
          id: batchId,
          itemId: item?.id ?? '',
          batchNumber: row.batchNumber,
          expiryDate: '',
          currentQuantity: 0,
          createdAt: row.timestamp,
        }
        : undefined),
    itemId: String(row.itemId),
    itemName: row.itemName,
    itemSku: row.itemSku,
    item,
    userId: String(row.userId),
    userName: row.userName,
    quantityChange: Number(row.quantityChange || 0),
    transactionType: resolveTransactionType(row.transactionType),
    referenceType: toReferenceType(row.referenceType),
    referenceId: row.referenceId != null ? String(row.referenceId) : undefined,
    remarks: row.remarks ?? undefined,
    timestamp: row.timestamp,
  };
}

function toDateOrFallback(expiryDate?: string): string {
  if (expiryDate && !Number.isNaN(new Date(expiryDate).getTime())) {
    return new Date(expiryDate).toISOString();
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + SAFE_FUTURE_EXPIRY_DAYS);
  return fallback.toISOString();
}

function toItemPayload(input: CreateItemInput | UpdateItemInput): CreateOrUpdateItemPayload {
  const rawItemCategoryId = input.itemCategoryId?.trim();
  const rawInventoryCategoryId = input.inventoryCategoryId?.trim();
  const rawSupplierId = input.supplierId?.trim();

  return {
    sku: input.sku.trim(),
    name: input.name.trim(),
    unit: input.unit,
    inventoryCategoryId: rawInventoryCategoryId ? Number(rawInventoryCategoryId) : null,
    itemCategoryId: rawItemCategoryId ? Number(rawItemCategoryId) : null,
    supplierId: rawSupplierId ? Number(rawSupplierId) : null,
    defaultThreshold: Number(input.defaultThreshold || 0),
    unitCost: Number(input.unitCost || 0),
    sellingPrice:
      input.sellingPrice != null && Number.isFinite(Number(input.sellingPrice))
        ? Number(input.sellingPrice)
        : null,
    isBundle: false,
    imageUrl: input.imageUrl ?? null,
  };
}


export async function fetchItemCategories(): Promise<InventoryCategory[]> {
  const response = await api.get<InventoryCategoryDto[]>('/api/inventory-categories');
  return response.data.map(toCategory);
}


export async function fetchInventoryItems(
  search?: string,
  options?: { branchId?: number; hqOnly?: boolean }
): Promise<InventoryItem[]> {
  const params: Record<string, string | number | boolean> = {};
  if (search) params.search = search;
  if (options?.branchId) params.branchId = options.branchId;
  if (options?.hqOnly) params.hqOnly = true;

  const response = await api.get<ItemDto[]>('/api/items', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });

  return response.data.map(toItem);
}

export async function fetchInventoryItemDetail(itemId: string): Promise<{
  item: InventoryItem;
  batches: Batch[];
}> {
  const response = await api.get<ItemDetailDto>(`/api/items/${itemId}`);
  const row = response.data;

  return {
    item: toItem(row),
    batches: row.batches.map(toBatch),
  };
}

export async function fetchInventoryItemTransactions(
  itemId: string,
  context?: { item?: InventoryItem; batches?: Batch[] }
): Promise<InventoryTransaction[]> {
  const response = await api.get<TransactionDto[]>(`/api/items/${itemId}/transactions`);
  const batchById = new Map((context?.batches ?? []).map((batch) => [batch.id, batch]));

  return response.data.map((row) => toTransaction(row, context?.item, batchById));
}

export async function fetchGlobalTransactions(options?: { branchId?: number }): Promise<InventoryTransaction[]> {
  const params: Record<string, number> = {};
  if (options?.branchId) params.branchId = options.branchId;

  const response = await api.get<TransactionDto[]>('/api/items/transactions', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });

  return response.data.map((row) => toTransaction(row));
}

export async function fetchTransactionGroup(groupId: string): Promise<InventoryTransaction[]> {
  const response = await api.get<TransactionDto[]>(`/api/items/transactions/group/${groupId}`);
  return response.data.map((row) => toTransaction(row));
}

export async function updateInventoryItem(itemId: string, input: UpdateItemInput): Promise<void> {
  await api.put(`/api/items/${itemId}`, toItemPayload(input));
}

export async function createInventoryItem(input: CreateItemInput): Promise<InventoryItem> {
  const response = await api.post<ItemDetailDto>('/api/items', toItemPayload(input));
  return toItem(response.data);
}

export async function stockInInventoryItem(itemId: string, input: StockInInput): Promise<Batch> {
  const response = await api.post<BatchDto>(`/api/items/${itemId}/stock-in`, {
    quantity: Number(input.quantity),
    batchNumber: input.batchNumber,
    expiryDate: toDateOrFallback(input.expiryDate),
    unitCost: input.unitCost,
    supplierId: input.supplierId,
    defaultThreshold: input.defaultThreshold,
    remarks: input.remarks,
  });

  return toBatch(response.data);
}

export async function stockOutInventoryItem(itemId: string, input: StockOutInput): Promise<void> {
  await api.post(`/api/items/${itemId}/stock-out`, {
    quantity: Number(input.quantity),
    reason: input.reason,
    remarks: input.remarks,
  });
}

export function generateBatchNumber(itemSku?: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const seq = Math.floor(Math.random() * 900) + 100;
  const prefix = itemSku ? itemSku.split('-')[0] : 'BN';
  return `${prefix}-${year}-${seq}`;
}

export async function setBranchThreshold(itemId: string, threshold: number): Promise<void> {
  await api.post('/api/items/branch/threshold', {
    itemId: Number(itemId),
    threshold
  });
}

export async function setGlobalThreshold(itemId: string, threshold: number): Promise<void> {
  await api.post('/api/items/global/threshold', {
    itemId: Number(itemId),
    threshold
  });
}
