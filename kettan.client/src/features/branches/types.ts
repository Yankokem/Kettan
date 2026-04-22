export type BranchStatus = 'active' | 'setup';

export interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  openTime: string;
  closeTime: string;
  ownerUserId?: string;
  owner?: string;
  managerUserId: string;
  manager: string;
  staff: number;
  status: BranchStatus;
  lowStockItems: number;
  totalItems: number;
  notes?: string;
  imageUrl?: string;
}

export interface BranchFormData {
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  openTime: string;
  closeTime: string;
  ownerUserId: string;
  managerUserId: string;
  status: BranchStatus;
  picture?: string;
  notes?: string;
}

export interface BranchUserOption {
  value: string;
  label: string;
}

export interface BranchEmployee {
  id: number;
  branchId: number | null;
  firstName: string;
  lastName: string;
  position: string;
  contactNumber: string;
  dateHired: string;
  isActive: boolean;
}

export type BranchProfileTabKey = 'details' | 'staff' | 'activity' | 'transactions' | 'inventory';

export interface BranchActivityLog {
  id: string;
  branchId: number;
  event: string;
  actor: string;
  happenedAt: string;
  category: 'staff' | 'inventory' | 'operations' | 'orders';
  outcome: 'successful' | 'pending' | 'flagged';
}

export interface BranchTransactionRow {
  id: string;
  branchId: number;
  reference: string;
  type: 'Stock-In' | 'Stock-Out' | 'Transfer' | 'Adjustment';
  lineItems: number;
  netChange: number;
  postedBy: string;
  timestamp: string;
}

export type BranchInventoryStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface BranchInventoryItem {
  id: string;
  branchId: number;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  unit: string;
  stockCount: number;
  reorderPoint: number;
  status: BranchInventoryStatus;
  lastRestocked: string;
}
