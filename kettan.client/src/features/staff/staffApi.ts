/**
 * Staff (Employees) API — live backend adapter.
 * Connects to /api/employees for all CRUD operations.
 */

export interface EmployeeDto {
  employeeId: number;
  tenantId: number;
  branchId?: number | null;
  branchName?: string | null;
  firstName: string;
  lastName: string;
  position: string;
  contactNumber?: string | null;
  dateHired?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateEmployeeDto {
  branchId?: number | null;
  firstName: string;
  lastName: string;
  position: string;
  contactNumber?: string | null;
  dateHired?: string | null;
  isActive: boolean;
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

export async function fetchEmployees(branchId?: number): Promise<EmployeeDto[]> {
  const params = branchId ? `?branchId=${branchId}` : '';
  return request<EmployeeDto[]>(`/api/employees${params}`);
}

export async function fetchEmployee(employeeId: number): Promise<EmployeeDto> {
  return request<EmployeeDto>(`/api/employees/${employeeId}`);
}

export async function createEmployee(dto: CreateEmployeeDto): Promise<EmployeeDto> {
  return request<EmployeeDto>('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export async function updateEmployee(employeeId: number, dto: CreateEmployeeDto): Promise<void> {
  return request<void>(`/api/employees/${employeeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export async function deleteEmployee(employeeId: number): Promise<void> {
  return request<void>(`/api/employees/${employeeId}`, { method: 'DELETE' });
}
