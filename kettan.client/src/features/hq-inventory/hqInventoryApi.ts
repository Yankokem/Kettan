import { api } from '../../utils/api';
import type {
  Batch,
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
  TransactionType,
  Unit,
} from './types';

interface ItemDto {
  itemId: number;
  sku: string;
  name: string;
  unitId: number;
  unitName: string;
  unitSymbol: string;
  inventoryCategoryId: number | null;
  inventoryCategoryName: string | null;
  itemCategoryId: number | null;
  itemCategoryName: string | null;
  defaultThreshold: number;
  unitCost: number;
  previousUnitCost: number | null;
  totalStock: number;
  isLowStock: boolean;
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
  userId: number;
  userName: string;
  quantityChange: number;
  transactionType: string;
  referenceType: string | null;
  referenceId: number | null;
  remarks: string | null;
  timestamp: string;
}

interface UnitDto {
  unitId: number;
  name: string;
  symbol: string;
  createdAt: string;
}

interface ItemCategoryDto {
  itemCategoryId: number;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface CreateOrUpdateItemPayload {
  sku: string;
  name: string;
  unitId: number;
  inventoryCategoryId: number | null;
  itemCategoryId: number | null;
  defaultThreshold: number;
  unitCost: number;
  sellingPrice: number | null;
  isBundle: boolean;
  imageUrl: string | null;
}

interface CreateItemInput {
  sku: string;
  name: string;
  unitId: string;
  itemCategoryId?: string;
  defaultThreshold: number;
  unitCost: number;
  sellingPrice?: number;
}

interface UpdateItemInput extends CreateItemInput {
  inventoryCategoryId?: string;
}

interface StockInInput {
  quantity: number;
  batchNumber: string;
  expiryDate?: string;
  unitCost?: number;
  remarks?: string;
}

interface StockOutInput {
  quantity: number;
  reason: string;
  remarks?: string;
}

const SAFE_FUTURE_EXPIRY_DAYS = 30;

function toCategory(row: ItemCategoryDto): InventoryCategory {
  return {
    id: String(row.itemCategoryId),
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

  return {
    id: String(row.itemId),
    sku: row.sku,
    name: row.name,
    unitId: String(row.unitId),
    unit: {
      id: String(row.unitId),
      name: row.unitName,
      symbol: row.unitSymbol,
    },
    categoryId: row.itemCategoryId != null ? String(row.itemCategoryId) : '',
    category:
      row.itemCategoryId != null
        ? {
            id: String(row.itemCategoryId),
            name: row.itemCategoryName ?? 'Uncategorized',
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
    itemId: item?.id ?? '',
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
  const rawCategoryId = input.itemCategoryId?.trim();
  const rawInventoryCategoryId =
    'inventoryCategoryId' in input ? input.inventoryCategoryId?.trim() : undefined;

  return {
    sku: input.sku.trim(),
    name: input.name.trim(),
    unitId: Number(input.unitId),
    inventoryCategoryId: rawInventoryCategoryId ? Number(rawInventoryCategoryId) : null,
    itemCategoryId: rawCategoryId ? Number(rawCategoryId) : null,
    defaultThreshold: Number(input.defaultThreshold || 0),
    unitCost: Number(input.unitCost || 0),
    sellingPrice:
      input.sellingPrice != null && Number.isFinite(Number(input.sellingPrice))
        ? Number(input.sellingPrice)
        : null,
    isBundle: false,
    imageUrl: null,
  };
}

export async function fetchUnits(): Promise<Unit[]> {
  const response = await api.get<UnitDto[]>('/api/units');
  return response.data.map((row) => ({
    id: String(row.unitId),
    name: row.name,
    symbol: row.symbol,
  }));
}

export async function fetchItemCategories(): Promise<InventoryCategory[]> {
  const response = await api.get<ItemCategoryDto[]>('/api/item-categories');
  return response.data.map(toCategory);
}

export async function fetchInventoryItems(search?: string): Promise<InventoryItem[]> {
  const response = await api.get<ItemDto[]>('/api/items', {
    params: search ? { search } : undefined,
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
