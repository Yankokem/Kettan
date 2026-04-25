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
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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
  return request<any[]>(`/api/employees?branchId=${branchId}`);
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
