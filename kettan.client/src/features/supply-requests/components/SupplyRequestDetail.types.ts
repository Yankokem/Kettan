export type SupplyRequestLifecycleStatus =
  | 'Draft'
  | 'AutoDrafted'
  | 'PendingApproval'
  | 'Approved'
  | 'PartiallyApproved'
  | 'Rejected'
  | 'Processing'
  | 'Picking'
  | 'Packed'
  | 'Dispatched'
  | 'InTransit'
  | 'Delivered'
  | 'Returned';

export type SupplyRequestAvailability = 'Available' | 'Low Stock' | 'Out of Stock';

export interface SupplyRequestDetailItem {
  id: string;
  name: string;
  sku: string;
  requestedQty: number;
  approvedQty: number | null;
  hqStock: number;
  availability: SupplyRequestAvailability;
}

export interface SupplyRequestTimelineEntry {
  status: SupplyRequestLifecycleStatus;
  timestamp: string;
  actor: string;
  remarks?: string;
}

export interface SupplyRequestDetailViewModel {
  requestNumber: string;
  status: SupplyRequestLifecycleStatus;
  branchName: string;
  requestedByName: string;
  requestedByRole: string;
  submittedAtLabel: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  requestType: string;
  dispatchWindow: string;
  notes: string;
  linkedOrderId?: string;
  items: SupplyRequestDetailItem[];
  timeline: SupplyRequestTimelineEntry[];
}
