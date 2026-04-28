import { api } from '../../utils/api';
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
  email?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export interface CreateEmployeeDto {
  branchId?: number | null;
  firstName: string;
  lastName: string;
  position: string;
  contactNumber?: string | null;
  email?: string | null;
  dateHired?: string | null;
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

export async function createUser(dto: any): Promise<any> {
  return request<any>('/api/users', {
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
