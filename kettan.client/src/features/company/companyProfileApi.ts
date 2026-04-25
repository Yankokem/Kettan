import { api } from '../../utils/api';
import type { CompanyProfile, CompanyProfileFormData } from './types';

interface TenantDto {
  tenantId: number;
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  website?: string | null;
  subscriptionTier: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  supportEmail?: string | null;
  subscriptionStatus: string;
  subscriptionPeriodEnd?: string | null;
  isActive: boolean;
  logoUrl?: string | null;
  createdAt: string;
}

interface UpdateTenantDto {
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  website?: string | null;
  subscriptionTier: string;
  email?: string | null;
  supportEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}

interface BranchDto {
  branchId: number;
  isActive: boolean;
}

interface EmployeeDto {
  employeeId: number;
  isActive: boolean;
}

interface DevConnectionStatusDto {
  checkedAtUtc: string;
  environment: string;
  seedingEnabled: boolean;
  isApiReachable: boolean;
  isDatabaseReachable: boolean;
  isTenantReadSuccessful: boolean;
  currentUserTenantId?: number | null;
  currentUserRole?: string | null;
  tenantId?: number | null;
  tenantName?: string | null;
  dataSource?: string | null;
  databaseName?: string | null;
  error?: string | null;
}

export interface DevConnectionStatus {
  checkedAtUtc: string;
  environment: string;
  seedingEnabled: boolean;
  isApiReachable: boolean;
  isDatabaseReachable: boolean;
  isTenantReadSuccessful: boolean;
  currentUserTenantId?: number;
  currentUserRole?: string;
  tenantId?: number;
  tenantName?: string;
  dataSource?: string;
  databaseName?: string;
  error?: string;
}

export interface CompanyProfileResult {
  profile: CompanyProfile;
  subscriptionTier: string;
}

export interface CompanyUtilizationCounts {
  activeBranches: number;
  activeStaff: number;
}

const PLAN_LIMITS: Record<string, { branchLimit: number; staffLimit: number }> = {
  starter: { branchLimit: 3, staffLimit: 10 },
  growth: { branchLimit: 20, staffLimit: 50 },
  enterprise: { branchLimit: 100, staffLimit: 250 },
};

function normalizeTier(subscriptionTier?: string): string {
  const normalized = subscriptionTier?.trim().toLowerCase();
  if (!normalized) {
    return 'starter';
  }

  if (normalized in PLAN_LIMITS) {
    return normalized;
  }

  return 'starter';
}

function toPlanName(subscriptionTier: string): string {
  const normalized = normalizeTier(subscriptionTier);

  if (normalized === 'enterprise') {
    return 'Enterprise Plan';
  }

  if (normalized === 'growth') {
    return 'Growth Plan';
  }

  return 'Starter Plan';
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveHeadquartersCity(address?: string | null): string {
  if (!address) {
    return 'Not Set';
  }

  const segments = address
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length >= 2) {
    return segments[segments.length - 2];
  }

  return segments[0] ?? 'Not Set';
}

function toRenewalDate(tenant: TenantDto): string {
  if (tenant.subscriptionPeriodEnd && !Number.isNaN(new Date(tenant.subscriptionPeriodEnd).getTime())) {
    return new Date(tenant.subscriptionPeriodEnd).toISOString();
  }

  const createdAt = new Date(tenant.createdAt);
  if (!Number.isNaN(createdAt.getTime())) {
    createdAt.setMonth(createdAt.getMonth() + 1);
    return createdAt.toISOString();
  }

  return new Date().toISOString();
}

async function fetchActiveBranchesCount(): Promise<number> {
  try {
    const response = await api.get<BranchDto[]>('/api/branches');
    return response.data.filter((branch) => branch.isActive).length;
  } catch {
    return 0;
  }
}

async function fetchActiveStaffCount(): Promise<number> {
  try {
    const response = await api.get<EmployeeDto[]>('/api/employees');
    return response.data.filter((employee) => employee.isActive).length;
  } catch {
    return 0;
  }
}

function toCompanyProfile(tenant: TenantDto, activeBranches: number, activeStaff: number): CompanyProfile {
  const normalizedTier = normalizeTier(tenant.subscriptionTier);
  const limits = PLAN_LIMITS[normalizedTier];
  const billingEmail = tenant.email?.trim() ?? '';
  const supportEmail = tenant.supportEmail?.trim() ?? billingEmail;
  const headquartersAddress = tenant.address?.trim() || 'Not Set';

  return {
    name: tenant.name,
    legalName: tenant.legalName?.trim() ?? tenant.name,
    organizationId: `TEN-${String(tenant.tenantId).padStart(5, '0')}`,
    planName: toPlanName(tenant.subscriptionTier),
    headquartersCity: resolveHeadquartersCity(tenant.address),
    headquartersAddress,
    billingEmail,
    supportEmail,
    phoneContact: tenant.phone?.trim() ?? '',
    website: tenant.website?.trim() ?? '',
    taxId: tenant.taxId?.trim() ?? 'N/A',
    activeBranches,
    branchLimit: limits.branchLimit,
    activeStaff,
    staffLimit: limits.staffLimit,
    contractRenewalDate: toRenewalDate(tenant),
    logoUrl: tenant.logoUrl,
  };
}

export async function fetchCompanyProfile(): Promise<CompanyProfileResult> {
  const core = await fetchCompanyProfileCore();
  const counts = await fetchCompanyUtilizationCounts();

  return {
    subscriptionTier: core.subscriptionTier,
    profile: {
      ...core.profile,
      activeBranches: counts.activeBranches,
      activeStaff: counts.activeStaff,
    },
  };
}

export async function fetchCompanyProfileCore(): Promise<CompanyProfileResult> {
  const tenantResponse = await api.get<TenantDto>('/api/tenants/me');
  const tenant = tenantResponse.data;

  return {
    profile: toCompanyProfile(tenant, 0, 0),
    subscriptionTier: tenant.subscriptionTier,
  };
}

export async function fetchCompanyUtilizationCounts(): Promise<CompanyUtilizationCounts> {
  const [activeBranches, activeStaff] = await Promise.all([
    fetchActiveBranchesCount(),
    fetchActiveStaffCount(),
  ]);

  return {
    activeBranches,
    activeStaff,
  };
}

export async function updateCompanyProfile(
  formData: CompanyProfileFormData,
  subscriptionTier: string
): Promise<void> {
  const payload: UpdateTenantDto = {
    name: formData.name.trim(),
    legalName: toNullable(formData.legalName),
    taxId: toNullable(formData.taxId),
    website: toNullable(formData.website),
    subscriptionTier: subscriptionTier.trim() || 'Starter',
    email: toNullable(formData.billingEmail),
    supportEmail: toNullable(formData.supportEmail),
    phone: toNullable(formData.phoneContact),
    address: toNullable(formData.headquartersAddress),
    logoUrl: toNullable(formData.logoUrl || ''),
  };

  await api.put('/api/tenants/me', payload);
}

export async function fetchDevConnectionStatus(): Promise<DevConnectionStatus> {
  const response = await api.get<DevConnectionStatusDto>('/api/tenants/dev-connection-status');
  const row = response.data;

  return {
    checkedAtUtc: row.checkedAtUtc,
    environment: row.environment,
    seedingEnabled: row.seedingEnabled,
    isApiReachable: row.isApiReachable,
    isDatabaseReachable: row.isDatabaseReachable,
    isTenantReadSuccessful: row.isTenantReadSuccessful,
    currentUserTenantId: row.currentUserTenantId ?? undefined,
    currentUserRole: row.currentUserRole ?? undefined,
    tenantId: row.tenantId ?? undefined,
    tenantName: row.tenantName ?? undefined,
    dataSource: row.dataSource ?? undefined,
    databaseName: row.databaseName ?? undefined,
    error: row.error ?? undefined,
  };
}
