import type { StockOutReason } from '../types';

export type InventoryTransactionKind = 'Stock-In' | 'Stock-Out' | 'Adjustment';
export type TransactionEntryMode = 'existing' | 'new';

export interface TransactionLineItem {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  unit: string;
  categoryName?: string;
  currentStock: number;
  quantity: number;
  unitCost?: number;
  batchNumber?: string;
  expiryDate?: string;
  reason?: StockOutReason;
  isNewItem: boolean;
  newCategoryId?: string;
  newUnit?: string;
}

export interface TransactionItemDraft {
  mode: TransactionEntryMode;
  searchQuery: string;
  selectedItemId: string;
  newItemName: string;
  newSku: string;
  newCategoryId: string;
  newUnit: string;
  quantity: string;
  unitCost: string;
  expiryDate: string;
  reason: StockOutReason;
}

export const TRANSACTION_TYPE_OPTIONS: { value: InventoryTransactionKind; label: string }[] = [
  { value: 'Stock-In', label: 'Stock-In (Receive)' },
  { value: 'Stock-Out', label: 'Stock-Out (Waste)' },
  { value: 'Adjustment', label: 'Adjustment (+/-)' },
];

export const STOCK_OUT_REASON_OPTIONS: { value: StockOutReason; label: string }[] = [
  { value: 'Wastage', label: 'Wastage' },
  { value: 'Spillage', label: 'Spillage' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Other', label: 'Other' },
];

export function createEmptyTransactionItemDraft(mode: TransactionEntryMode = 'existing'): TransactionItemDraft {
  return {
    mode,
    searchQuery: '',
    selectedItemId: '',
    newItemName: '',
    newSku: '',
    newCategoryId: '',
    newUnit: '',
    quantity: '',
    unitCost: '',
    expiryDate: '',
    reason: 'Wastage',
  };
}
