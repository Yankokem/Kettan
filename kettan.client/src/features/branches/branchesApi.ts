import { api } from '../../utils/api';
/**
 * Branches API — live backend adapter.
 * Connects to /api/branches for all CRUD operations.
 */

export interface BranchDto {
  branchId: number;
  tenantId: number;
  name: string;
  location?: string | null;
  customThresholds?: string | null;
  isActive: boolean;
  imageUrl?: string | null;
  createdAt: string;
  address?: string;
  city?: string;
  contactNumber?: string;
  openTime?: string;
  closeTime?: string;
  ownerUserId?: number | string;
  managerName?: string;
  staffCount?: number;
  totalItems?: number;
  lowStockItems?: number;
}

export interface CreateBranchDto {
  name: string;
  location?: string | null;
  customThresholds?: string | null;
  imageUrl?: string | null;
}

export interface UpdateBranchDto {
  name: string;
  location?: string | null;
  customThresholds?: string | null;
  isActive: boolean;
  imageUrl?: string | null;
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

export async function fetchBranches(): Promise<BranchDto[]> {
  return request<BranchDto[]>('/api/branches');
}

export async function fetchBranch(branchId: number): Promise<BranchDto> {
  return request<BranchDto>(`/api/branches/${branchId}`);
}

export async function createBranch(dto: CreateBranchDto): Promise<BranchDto> {
  return request<BranchDto>('/api/branches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export async function updateBranch(branchId: number, dto: UpdateBranchDto): Promise<void> {
  return request<void>(`/api/branches/${branchId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export async function deleteBranch(branchId: number): Promise<void> {
  return request<void>(`/api/branches/${branchId}`, { method: 'DELETE' });
}

export async function fetchBranchStaff(branchId: number) {
  return request<any[]>(`/api/users?branchId=${branchId}`);
}

export async function fetchBranchActivity(branchId: number) {
  const data = await request<{ data: any[] }>(`/api/audit-logs?branchId=${branchId}&pageSize=100`);
  return data.data;
}

export async function fetchBranchOrders(branchId: number) {
  return request<any[]>(`/api/BranchOrders?branchId=${branchId}`);
}

export async function fetchBranchInventory(branchId: number) {
  return request<any[]>(`/api/items?branchId=${branchId}`);
}

export async function fetchBranchTransactions(branchId: number) {
  return request<any[]>(`/api/consumption?branchId=${branchId}`);
}
