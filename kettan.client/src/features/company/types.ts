export interface CompanyProfile {
  name: string;
  legalName: string;
  organizationId: string;
  planName: string;
  headquartersCity: string;
  headquartersAddress: string;
  billingEmail: string;
  supportEmail: string;
  phoneContact: string;
  website: string;
  taxId: string;
  activeBranches: number;
  branchLimit: number;
  activeStaff: number;
  staffLimit: number;
  contractRenewalDate: string;
}

export interface CompanyProfileFormData {
  name: string;
  legalName: string;
  headquartersCity: string;
  headquartersAddress: string;
  billingEmail: string;
  supportEmail: string;
  phoneContact: string;
  website: string;
  taxId: string;
}

export type CompanyProfileFormErrors = Partial<Record<keyof CompanyProfileFormData, string>>;

export function toCompanyProfileFormData(profile: CompanyProfile): CompanyProfileFormData {
  return {
    name: profile.name,
    legalName: profile.legalName,
    headquartersCity: profile.headquartersCity,
    headquartersAddress: profile.headquartersAddress,
    billingEmail: profile.billingEmail,
    supportEmail: profile.supportEmail,
    phoneContact: profile.phoneContact,
    website: profile.website,
    taxId: profile.taxId,
  };
}
