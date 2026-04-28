import { api } from '../../utils/api';

export interface TenantRow {
  tenantId: number;
  name: string;
  email: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
  branchCount: number;
  userCount: number;
}

export interface TenantDetail {
  tenant: {
    tenantId: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    subscriptionTier: string;
    subscriptionStatus: string;
    isActive: boolean;
    createdAt: string;
  };
  branches: { branchId: number; name: string; city: string | null; isActive: boolean }[];
  userCount: number;
  subscription: {
    tenantSubscriptionId: number;
    status: string;
    billingCycle: string;
    startDate: string;
    periodStart: string | null;
    periodEnd: string | null;
    autoRenew: boolean;
    planName: string | null;
    planPrice: number;
  } | null;
  payments: { paymentId: number; amount: number; currency: string; paymentMethod: string | null; status: string; paidAt: string | null }[];
}

export async function fetchTenants(search?: string, status?: string): Promise<TenantRow[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  try {
    const res = await api.get(`/api/admin/tenants?${params.toString()}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to load tenants');
  }
}

export async function fetchTenantDetail(id: string): Promise<TenantDetail> {
  try {
    const res = await api.get(`/api/admin/tenants/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to load tenant details');
  }
}

export async function toggleTenantStatus(id: string, activate: boolean): Promise<void> {
  const endpoint = activate ? 'activate' : 'deactivate';
  try {
    await api.put(`/api/admin/tenants/${id}/${endpoint}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || `Failed to ${endpoint} tenant`);
  }
}
