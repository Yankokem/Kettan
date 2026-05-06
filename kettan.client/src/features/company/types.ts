export interface CompanyProfile {
  name: string;
  legalName: string;
  organizationId: string;
  planName: string;
  logoUrl: string | null;
  headquartersCity: string;
  headquartersAddress: string;
  billingEmail: string;
  supportEmail: string;
  phoneContact: string;
  telephone: string;
  website: string;
  taxId: string;
  activeBranches: number;
  branchLimit: number;
  activeStaff: number;
  staffLimit: number;
  contractRenewalDate: string;
}

export interface CompanySubscriptionDetails {
  planCode: string;
  planName: string;
  branchLimit: number;
  userLimit: number;
  usersPerBranchLimit: number;
  status: string;
  billingCycle: 'Monthly' | 'Yearly';
  nextBillingDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  autoRenew: boolean;
  canceledAt: string | null;
  isReadOnly: boolean;
  latestInvoiceStatus: string | null;
  latestInvoiceDueAt: string | null;
  latestInvoiceAmountDue: number | null;
  latestPaymentStatus: string | null;
  latestPaidAt: string | null;
  paymentProvider: string;
  activeBranches: number;
  activeUsers: number;
}

export interface CompanyProfileFormData {
  name: string;
  legalName: string;
  logoUrl: string | null;
  headquartersCity: string;
  headquartersAddress: string;
  billingEmail: string;
  supportEmail: string;
  phoneContact: string;
  telephone: string;
  website: string;
  taxId: string;
  logoFile?: File | null;
}

export type CompanyProfileFormErrors = Partial<Record<keyof CompanyProfileFormData, string>>;

export function toCompanyProfileFormData(profile: CompanyProfile): CompanyProfileFormData {
  return {
    name: profile.name,
    legalName: profile.legalName,
    logoUrl: profile.logoUrl,
    headquartersCity: profile.headquartersCity,
    headquartersAddress: profile.headquartersAddress,
    billingEmail: profile.billingEmail,
    supportEmail: profile.supportEmail,
    phoneContact: profile.phoneContact,
    telephone: profile.telephone,
    website: profile.website,
    taxId: profile.taxId,
    logoFile: null,
  };
}
