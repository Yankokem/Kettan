export type BranchStatus = 'active' | 'setup';

export interface Branch {
  id: number;
  name: string;
  location: string;
  manager: string;
  staff: number;
  status: BranchStatus;
  imageUrl?: string;
}

export interface BranchFormData {
  name: string;
  location: string;
  managerId: string;
  status: BranchStatus;
  picture?: string;
  notes?: string;
}
