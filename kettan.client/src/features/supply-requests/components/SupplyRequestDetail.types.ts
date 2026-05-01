export type SupplyRequestLifecycleStatus =
  | 'Draft'
  | 'AutoDrafted'
  | 'PendingApproval'
  | 'Approved'
  | 'PartiallyApproved'
  | 'Rejected'
  | 'Processing'
  | 'Picking'
  | 'Packing'
  | 'Packed'
  | 'Dispatched'
  | 'InTransit'
  | 'Delivered'
  | 'Arrived'
  | 'Completed'
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
  
  // Workflow fields
  isPicked?: boolean;
  sendQuantity?: number | null;
  isRejectedDuringPicking?: boolean;
  pickingRejectionReason?: string | null;
  isPacked?: boolean;
  isBranchChecked?: boolean;
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

  // Arrival / Completion tracking
  arrivedAt?: string | null;
  arrivedConfirmedByName?: string | null;
  completedAt?: string | null;
  completedByName?: string | null;
}
