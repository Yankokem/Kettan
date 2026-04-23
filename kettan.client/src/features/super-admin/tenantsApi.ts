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
  const res = await fetch(`/api/admin/tenants?${params.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load tenants');
  return res.json();
}

export async function fetchTenantDetail(id: string): Promise<TenantDetail> {
  const res = await fetch(`/api/admin/tenants/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load tenant details');
  return res.json();
}

export async function toggleTenantStatus(id: string, activate: boolean): Promise<void> {
  const endpoint = activate ? 'activate' : 'deactivate';
  const res = await fetch(`/api/admin/tenants/${id}/${endpoint}`, { method: 'PUT', credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to ${endpoint} tenant`);
}
