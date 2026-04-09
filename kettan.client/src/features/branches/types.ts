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
