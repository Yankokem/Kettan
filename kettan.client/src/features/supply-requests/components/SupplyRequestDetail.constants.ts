import type { SupplyRequestDetailViewModel, SupplyRequestLifecycleStatus } from './SupplyRequestDetail.types';

export const SUPPLY_REQUEST_STATUS_COLORS: Record<SupplyRequestLifecycleStatus, { color: string; bg: string }> = {
  Draft: { color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
  AutoDrafted: { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  PendingApproval: { color: '#B45309', bg: 'rgba(180,83,9,0.12)' },
  Approved: { color: '#047857', bg: 'rgba(4,120,87,0.12)' },
  PartiallyApproved: { color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  Rejected: { color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
  Processing: { color: '#6B4C2A', bg: 'rgba(107,76,42,0.12)' },
  Picking: { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  Packed: { color: '#0891B2', bg: 'rgba(8,145,178,0.12)' },
  Dispatched: { color: '#546B3F', bg: 'rgba(84,107,63,0.12)' },
  InTransit: { color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  Delivered: { color: '#047857', bg: 'rgba(4,120,87,0.12)' },
  Returned: { color: '#9333EA', bg: 'rgba(147,51,234,0.12)' },
};

export function getSupplyRequestStatusLabel(status: SupplyRequestLifecycleStatus): string {
  const labels: Partial<Record<SupplyRequestLifecycleStatus, string>> = {
    AutoDrafted: 'Auto-Drafted',
    PendingApproval: 'Pending Approval',
    PartiallyApproved: 'Partially Approved',
    InTransit: 'In Transit',
  };

  return labels[status] || status;
}

const SAMPLE_DETAIL_BY_REQUEST_ID: Record<number, SupplyRequestDetailViewModel> = {
  8900: {
    requestNumber: 'SR-08900',
    status: 'Draft',
    branchName: 'Downtown Main',
    requestedByName: 'Maria Santos',
    requestedByRole: 'Branch Manager',
    submittedAtLabel: 'Apr 19, 2026 - 2:10 PM',
    priority: 'Normal',
    requestType: 'Manual Internal Request',
    dispatchWindow: 'Next Business Day',
    notes: 'Weekly restocking draft — confirm quantities before submitting.',
    linkedOrderId: undefined,
    items: [
      {
        id: '1',
        name: 'Arabica Coffee Beans (Medium Roast) - 5kg',
        sku: 'CF-ARB-MR-5KG',
        requestedQty: 6,
        approvedQty: null,
        hqStock: 120,
        availability: 'Available',
      },
      {
        id: '2',
        name: 'Whole Milk - 1L',
        sku: 'MLK-WHL-1L',
        requestedQty: 20,
        approvedQty: null,
        hqStock: 60,
        availability: 'Available',
      },
      {
        id: '3',
        name: 'Paper Cups (12oz) - Box of 500',
        sku: 'PKG-CUP-12-500',
        requestedQty: 3,
        approvedQty: null,
        hqStock: 45,
        availability: 'Available',
      },
    ],
    timeline: [
      {
        status: 'Draft',
        timestamp: '2026-04-19T06:10:00Z',
        actor: 'Maria Santos',
        remarks: 'Draft created for weekly replenishment cycle.',
      },
    ],
  },
  8894: {
    requestNumber: 'SR-08894',
    status: 'PendingApproval',
    branchName: 'Downtown Main',
    requestedByName: 'Maria Santos',
    requestedByRole: 'Branch Manager',
    submittedAtLabel: 'Apr 02, 2026 - 9:41 AM',
    priority: 'Normal',
    requestType: 'Manual Internal Request',
    dispatchWindow: 'Next Business Day',
    notes: 'Please prioritize milk and syrup lines for weekend operations.',
    linkedOrderId: undefined,
    items: [
      {
        id: '1',
        name: 'Arabica Coffee Beans (Medium Roast) - 5kg',
        sku: 'CF-ARB-MR-5KG',
        requestedQty: 4,
        approvedQty: null,
        hqStock: 120,
        availability: 'Available',
      },
      {
        id: '2',
        name: 'Almond Milk - 1L Carton',
        sku: 'MLK-ALM-1L',
        requestedQty: 24,
        approvedQty: null,
        hqStock: 10,
        availability: 'Low Stock',
      },
      {
        id: '3',
        name: 'Vanilla Syrup - 750ml Bottle',
        sku: 'SYR-VAN-750',
        requestedQty: 6,
        approvedQty: null,
        hqStock: 0,
        availability: 'Out of Stock',
      },
      {
        id: '4',
        name: 'Paper Cups (12oz) - Box of 500',
        sku: 'PKG-CUP-12-500',
        requestedQty: 2,
        approvedQty: null,
        hqStock: 45,
        availability: 'Available',
      },
    ],
    timeline: [
      {
        status: 'Draft',
        timestamp: '2026-04-02T01:10:00Z',
        actor: 'Maria Santos',
        remarks: 'Request drafted from branch inventory planning.',
      },
      {
        status: 'PendingApproval',
        timestamp: '2026-04-02T01:41:00Z',
        actor: 'Maria Santos',
        remarks: 'Submitted to HQ for review.',
      },
    ],
  },
  8891: {
    requestNumber: 'SR-08891',
    status: 'Approved',
    branchName: 'Riverside Branch',
    requestedByName: 'Alex Morgan',
    requestedByRole: 'Branch Owner',
    submittedAtLabel: 'Apr 17, 2026 - 5:12 PM',
    priority: 'High',
    requestType: 'Scheduled Replenishment',
    dispatchWindow: 'Today',
    notes: 'Weekend traffic expected. Focus on dairy and packaging lines.',
    linkedOrderId: 'ORD-8891',
    items: [
      {
        id: '1',
        name: 'Whole Milk - 1L',
        sku: 'MLK-WHL-1L',
        requestedQty: 30,
        approvedQty: 30,
        hqStock: 60,
        availability: 'Available',
      },
      {
        id: '2',
        name: 'Cup Lids (12oz)',
        sku: 'PKG-LID-12-500',
        requestedQty: 4,
        approvedQty: 4,
        hqStock: 12,
        availability: 'Available',
      },
      {
        id: '3',
        name: 'Sugar Sachet Box',
        sku: 'SUG-SCH-1K',
        requestedQty: 3,
        approvedQty: 3,
        hqStock: 9,
        availability: 'Available',
      },
    ],
    timeline: [
      {
        status: 'Draft',
        timestamp: '2026-04-16T08:30:00Z',
        actor: 'Alex Morgan',
        remarks: 'Request created for expected weekend demand.',
      },
      {
        status: 'PendingApproval',
        timestamp: '2026-04-16T09:00:00Z',
        actor: 'Alex Morgan',
        remarks: 'Submitted to HQ.',
      },
      {
        status: 'Approved',
        timestamp: '2026-04-17T09:12:00Z',
        actor: 'John Cruz (HQ Manager)',
        remarks: 'Approved in full.',
      },
    ],
  },
  8870: {
    requestNumber: 'SR-08870',
    status: 'Rejected',
    branchName: 'Northpoint Kiosk',
    requestedByName: 'Jamie Cruz',
    requestedByRole: 'Branch Manager',
    submittedAtLabel: 'Apr 10, 2026 - 11:20 AM',
    priority: 'Urgent',
    requestType: 'Emergency Replenishment',
    dispatchWindow: 'Today',
    notes: 'Please refile with corrected quantities and complete remarks.',
    linkedOrderId: undefined,
    items: [
      {
        id: '1',
        name: 'Chocolate Syrup - 750ml',
        sku: 'SYR-CHO-750',
        requestedQty: 12,
        approvedQty: 0,
        hqStock: 2,
        availability: 'Low Stock',
      },
      {
        id: '2',
        name: 'Whipped Cream Canister',
        sku: 'CRM-WHP-01',
        requestedQty: 8,
        approvedQty: 0,
        hqStock: 0,
        availability: 'Out of Stock',
      },
    ],
    timeline: [
      {
        status: 'Draft',
        timestamp: '2026-04-10T03:20:00Z',
        actor: 'Jamie Cruz',
        remarks: 'Emergency replenishment drafted.',
      },
      {
        status: 'PendingApproval',
        timestamp: '2026-04-10T04:00:00Z',
        actor: 'Jamie Cruz',
        remarks: 'Submitted to HQ.',
      },
      {
        status: 'Rejected',
        timestamp: '2026-04-10T05:48:00Z',
        actor: 'John Cruz (HQ Manager)',
        remarks: 'Rejected due to incomplete emergency rationale and duplicate quantities.',
      },
    ],
  },
};

export function getSampleSupplyRequestDetail(requestId?: string): SupplyRequestDetailViewModel {
  const parsedId = Number(requestId);

  if (Number.isFinite(parsedId) && SAMPLE_DETAIL_BY_REQUEST_ID[parsedId]) {
    return SAMPLE_DETAIL_BY_REQUEST_ID[parsedId];
  }

  return SAMPLE_DETAIL_BY_REQUEST_ID[8894];
}
