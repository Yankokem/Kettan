import { api } from '../../utils/api';
import type { CompanyProfile, CompanyProfileFormData, CompanySubscriptionDetails } from './types';

interface TenantDto {
  tenantId: number;
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  website?: string | null;
  subscriptionTier: string;
  email?: string | null;
  phone?: string | null;
  telephone?: string | null;
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
  telephone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}

interface SubscriptionCurrentDto {
  tenantId: number;
  planCode: string;
  planName: string;
  branchLimit?: number | null;
  userLimit?: number | null;
  usersPerBranchLimit: number;
  activeBranches: number;
  activeUsers: number;
  status: string;
  billingCycle: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  nextBillingDate?: string | null;
  autoRenew: boolean;
  canceledAt?: string | null;
  isReadOnly: boolean;
  latestInvoiceStatus?: string | null;
  latestInvoiceDueAt?: string | null;
  latestInvoiceAmountDue?: number | null;
  latestPaymentStatus?: string | null;
  latestPaidAt?: string | null;
  paymentProvider?: string | null;
}

interface CancelSubscriptionResponse {
  message: string;
  subscription: SubscriptionCurrentDto;
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
  subscription: CompanySubscriptionDetails;
}

export interface CompanyUtilizationCounts {
  activeBranches: number;
  activeStaff: number;
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

function toIsoOrNull(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function toSubscriptionDetails(dto: SubscriptionCurrentDto): CompanySubscriptionDetails {
  const billingCycle = dto.billingCycle?.toLowerCase() === 'yearly' ? 'Yearly' : 'Monthly';

  return {
    planCode: dto.planCode,
    planName: dto.planName,
    branchLimit: dto.branchLimit ?? 0,
    userLimit: dto.userLimit ?? 0,
    usersPerBranchLimit: dto.usersPerBranchLimit || 5,
    status: dto.status,
    billingCycle,
    nextBillingDate: toIsoOrNull(dto.nextBillingDate),
    periodStart: toIsoOrNull(dto.periodStart),
    periodEnd: toIsoOrNull(dto.periodEnd),
    autoRenew: dto.autoRenew,
    canceledAt: toIsoOrNull(dto.canceledAt),
    isReadOnly: dto.isReadOnly,
    latestInvoiceStatus: dto.latestInvoiceStatus ?? null,
    latestInvoiceDueAt: toIsoOrNull(dto.latestInvoiceDueAt),
    latestInvoiceAmountDue: dto.latestInvoiceAmountDue ?? null,
    latestPaymentStatus: dto.latestPaymentStatus ?? null,
    latestPaidAt: toIsoOrNull(dto.latestPaidAt),
    paymentProvider: dto.paymentProvider ?? 'PayMongo',
    activeBranches: dto.activeBranches,
    activeUsers: dto.activeUsers,
  };
}

function toRenewalDate(tenant: TenantDto, subscription: CompanySubscriptionDetails): string {
  if (subscription.nextBillingDate) {
    return subscription.nextBillingDate;
  }

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

function toCompanyProfile(tenant: TenantDto, subscription: CompanySubscriptionDetails): CompanyProfile {
  const billingEmail = tenant.email?.trim() ?? '';
  const supportEmail = tenant.supportEmail?.trim() ?? billingEmail;
  const headquartersAddress = tenant.address?.trim() || 'Not Set';

  return {
    name: tenant.name,
    legalName: tenant.legalName?.trim() ?? tenant.name,
    organizationId: `TEN-${String(tenant.tenantId).padStart(5, '0')}`,
    planName: `${subscription.planName} Plan`,
    headquartersCity: resolveHeadquartersCity(tenant.address),
    headquartersAddress,
    billingEmail,
    supportEmail,
    phoneContact: tenant.phone?.trim() ?? '',
    telephone: tenant.telephone?.trim() ?? '',
    website: tenant.website?.trim() ?? '',
    taxId: tenant.taxId?.trim() ?? 'N/A',
    activeBranches: subscription.activeBranches,
    branchLimit: subscription.branchLimit,
    activeStaff: subscription.activeUsers,
    staffLimit: subscription.userLimit,
    contractRenewalDate: toRenewalDate(tenant, subscription),
    logoUrl: tenant.logoUrl ?? null,
  };
}

export async function fetchCurrentSubscription(): Promise<CompanySubscriptionDetails> {
  const response = await api.get<SubscriptionCurrentDto>('/api/subscription/current');
  return toSubscriptionDetails(response.data);
}

export async function fetchCompanyProfile(): Promise<CompanyProfileResult> {
  const [tenantResponse, subscription] = await Promise.all([
    api.get<TenantDto>('/api/tenants/me'),
    fetchCurrentSubscription(),
  ]);

  const tenant = tenantResponse.data;
  return {
    subscriptionTier: tenant.subscriptionTier,
    subscription,
    profile: toCompanyProfile(tenant, subscription),
  };
}

export async function fetchCompanyProfileCore(): Promise<CompanyProfileResult> {
  return fetchCompanyProfile();
}

export async function fetchCompanyUtilizationCounts(): Promise<CompanyUtilizationCounts> {
  const subscription = await fetchCurrentSubscription();
  return {
    activeBranches: subscription.activeBranches,
    activeStaff: subscription.activeUsers,
  };
}



export async function cancelSubscription(): Promise<CompanySubscriptionDetails> {
  const response = await api.post<CancelSubscriptionResponse>('/api/subscription/cancel');
  return toSubscriptionDetails(response.data.subscription);
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
    telephone: toNullable(formData.telephone ?? ''),
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

