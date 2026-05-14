import { api } from '../../utils/api';

export interface SupplyRequestItem {
  requestItemId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityRequested: number;
  quantityApproved: number | null;
  unitCostSnapshot: number;
  isPicked: boolean;
  sendQuantity: number | null;
  isRejectedDuringPicking: boolean;
  pickingRejectionReason: string | null;
  isPacked: boolean;
  isBranchChecked: boolean;
  hqStock?: number;
  branchStock?: number;
}

export interface SupplyRequest {
  transactionCode: string;
  requestId: number;
  referenceNumber?: string | null;
  subject?: string | null;
  branchId: number;
  branchName: string;
  requestedByUserId: number;
  requestedByName: string;
  status: string;
  requestType: string;
  priority: string;
  dispatchWindow: string;
  dispatchDate: string | null;
  dispatchScheduleStatus: string;
  notes: string | null;
  totalRequestedValue: number;
  totalApprovedValue: number;
  totalFulfilledValue: number;
  createdAt: string;
  updatedAt: string;
  orderId?: number | null;
  orderStatus?: string | null;
  arrivedAt?: string | null;
  arrivedConfirmedByName?: string | null;
  completedAt?: string | null;
  completedByName?: string | null;
  items: SupplyRequestItem[];
}

export interface CreateSupplyRequestPayload {
  branchId?: number;
  referenceNumber?: string;
  subject?: string;
  requestType: string;
  priority: string;
  dispatchWindow: string;
  dispatchDate?: string;
  notes?: string;
  items: Array<{
    itemId: number;
    quantityRequested: number;
  }>;
}

export interface ConsumptionLog {
  consumptionLogId: number;
  branchId: number;
  method: string;
  shift: string | null;
  logDate: string;
  remarks: string | null;
  createdAt: string;
}

// ── RETURNS TYPES ──

export interface ReturnItemDto {
  returnItemId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityReturned: number;
  unitCostSnapshot: number;
  quantityInspected: number | null;
  reasonCode: string;
  disposition: string;
  restockBatchId: number | null;
  inspectionRemarks: string | null;
  notes?: string;
  photoUrls?: string;
}

export interface ReturnScheduleConflict {
  returnId: number;
  branchId: number;
  branchName: string;
  status: string;
  pickupScheduledAt: string;
}

export interface ReturnRecord {
  transactionCode: string;
  returnId: number;
  orderId: number;
  orderTransactionCode: string;
  subject: string | null;
  branchId: number;
  branchName: string;
  status: string;
  resolution: string;
  reason: string | null;
  rejectionReason: string | null;
  photoUrls: string | null;
  creditAmount: number | null;
  totalReturnedValue: number;
  totalLossValue: number;
  pickupScheduleStatus: string;
  loggedAt: string;
  submittedAt: string | null;
  acknowledgedAt: string | null;
  dispatchedAt: string | null;
  arrivedAt: string | null;
  inspectingAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  resolvedAt: string | null;
  pickupVehicleId: number | null;
  pickupVehiclePlateNumber: string | null;
  pickupScheduledAt: string | null;
  pickupLastUpdatedAt: string | null;
  hasVehicleScheduleConflict: boolean;
  vehicleScheduleConflicts: ReturnScheduleConflict[];
  items: ReturnItemDto[];
  submittedByName?: string | null;
}

// Legacy alias kept so existing usages don't break
export type ReturnItem = ReturnItemDto;

export interface ReturnEligibleOrderItem {
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityDelivered: number;
  branchStock: number;
}

export interface ReturnEligibleOrder {
  orderId: number;
  branchId: number;
  branchName: string;
  transactionCode: string;
  referenceNumber: string | null;
  deliveredAt: string;
  items: ReturnEligibleOrderItem[];
}

export interface ReturnMessage {
  messageId: number;
  returnId: number;
  senderUserId: number;
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string;
}

// ── RETURNS API ──

export async function fetchReturns(params?: { status?: string; resolution?: string }): Promise<ReturnRecord[]> {
  const response = await api.get<ReturnRecord[]>('/api/Returns', { params });
  const payload = response.data as unknown;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: ReturnRecord[] }).items;
  }
  return [];
}

export async function fetchReturnById(returnId: number): Promise<ReturnRecord> {
  const response = await api.get<ReturnRecord>(`/api/Returns/${returnId}`);
  return response.data;
}

export async function fetchEligibleOrders(): Promise<ReturnEligibleOrder[]> {
  const response = await api.get<ReturnEligibleOrder[]>('/api/Returns/eligible-orders');
  return response.data;
}

export async function fetchEligibleOrderDetail(orderId: number): Promise<ReturnEligibleOrder> {
  const response = await api.get<ReturnEligibleOrder>(`/api/Returns/eligible-orders/${orderId}`);
  return response.data;
}

export async function createReturnDraft(payload: {
  orderId: number;
  subject?: string;
  resolution: string;
  reason?: string;
  photoUrls?: string;
  items: Array<{ itemId: number; quantityReturned: number; reasonCode: string; notes?: string; photoUrls?: string }>;
}): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>('/api/Returns/drafts', payload);
  return response.data;
}

export async function updateReturnDraft(
  returnId: number,
  payload: {
    subject?: string;
    resolution: string;
    reason?: string;
    photoUrls?: string;
    items: Array<{ itemId: number; quantityReturned: number; reasonCode: string; notes?: string; photoUrls?: string }>;
  },
): Promise<ReturnRecord> {
  const response = await api.put<ReturnRecord>(`/api/Returns/${returnId}/draft`, payload);
  return response.data;
}

export async function submitReturn(returnId: number, note?: string): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>(`/api/Returns/${returnId}/submit`, { note });
  return response.data;
}

export async function acknowledgeReturn(
  returnId: number,
  payload: {
    resolution?: string;
    vehicleId: number;
    pickupScheduledAt: string;
    allowConflicts?: boolean;
    note?: string;
  },
): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>(`/api/Returns/${returnId}/acknowledge`, {
    allowConflicts: true,
    ...payload,
  });
  return response.data;
}

export async function rejectReturn(returnId: number, reason: string): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>(`/api/Returns/${returnId}/reject`, { reason });
  return response.data;
}

export async function rescheduleReturnPickup(
  returnId: number,
  payload: {
    vehicleId: number;
    pickupScheduledAt: string;
    note: string;
    allowConflicts?: boolean;
  },
): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>(`/api/Returns/${returnId}/reschedule`, {
    allowConflicts: true,
    ...payload,
  });
  return response.data;
}

export async function confirmReturnDispatch(returnId: number, remarks?: string): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>(`/api/Returns/${returnId}/dispatch`, { remarks });
  return response.data;
}

export async function confirmReturnArrival(returnId: number, remarks?: string): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>(`/api/Returns/${returnId}/arrive`, { remarks });
  return response.data;
}

export async function startReturnInspection(returnId: number, remarks?: string): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>(`/api/Returns/${returnId}/inspect/start`, { remarks });
  return response.data;
}

export async function saveReturnInspection(
  returnId: number,
  items: Array<{
    returnItemId: number;
    disposition: string;
    quantityInspected?: number;
    restockBatchId?: number;
    inspectionRemarks?: string;
  }>,
): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>(`/api/Returns/${returnId}/inspect`, { items });
  return response.data;
}

export async function completeReturn(returnId: number, remarks?: string): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>(`/api/Returns/${returnId}/complete`, { remarks });
  return response.data;
}

export async function fetchReturnMessages(returnId: number): Promise<ReturnMessage[]> {
  const response = await api.get<ReturnMessage[]>(`/api/Returns/${returnId}/messages`);
  return response.data;
}

export async function sendReturnMessage(returnId: number, content: string): Promise<ReturnMessage> {
  const response = await api.post<ReturnMessage>(`/api/Returns/${returnId}/messages`, { content });
  return response.data;
}

// ── BRANCH ORDERS ──

export interface BranchOrder {
  transactionCode: string;
  orderId: number;
  requestId: number;
  subject?: string | null;
  branchId: number;
  branchName: string;
  status: string;
  dispatchScheduleStatus: string;
  pushedToFulfillmentAt: string;
  itemsCount: number;
  totalRequestedValue: number;
  totalApprovedValue: number;
  totalFulfilledValue: number;
  fulfillmentCost: number;
  isHqInitiated: boolean;
  dispatchReason: string | null;
}

export interface OrderRequestItem {
  requestItemId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityRequested: number;
  quantityApproved: number | null;
  unitCost: number;
  isPicked: boolean;
  sendQuantity: number | null;
  isRejectedDuringPicking: boolean;
  pickingRejectionReason: string | null;
  isPacked: boolean;
  isBranchChecked: boolean;
  hqStock?: number;
  branchStock?: number;
}

export interface OrderAllocation {
  allocationId: number;
  batchId: number;
  batchNumber: string;
  itemId: number;
  itemName: string;
  quantityPicked: number;
  remainingBatchQuantity: number;
}

export interface OrderDetail extends BranchOrder {
  requestStatus: string;
  requestedByUserId: number;
  requestedByName: string;
  notes: string | null;
  trackingNumber: string | null;
  vehicleId: number | null;
  dispatchDate: string | null;
  estimatedArrival: string | null;
  arrivedAt: string | null;
  arrivedConfirmedByName: string | null;
  completedAt: string | null;
  completedByName: string | null;
  isHqInitiated: boolean;
  dispatchReason: string | null;
  requestedItems: OrderRequestItem[];
  allocations: OrderAllocation[];
}

export interface CreateOrderPayload {
  branchId: number;
  subject?: string;
  requestType?: string;
  priority?: string;
  dispatchWindow?: string;
  dispatchDate?: string;
  notes?: string;
  items: Array<{
    itemId: number;
    quantityRequested: number;
  }>;
}


function normalizeSupplyRequestStatus(status: string): string {
  if (status === 'Auto_Drafted') return 'AutoDrafted';
  return status;
}

function normalizeOrderStatus(status: string): string {
  if (status === 'DeliveredWithVariance') return 'Delivered';
  return status;
}

function normalizeBranchOrder(row: BranchOrder): BranchOrder {
  return {
    ...row,
    status: normalizeOrderStatus(row.status),
  };
}

export async function fetchSupplyRequests(status?: string): Promise<SupplyRequest[]> {
  const response = await api.get<SupplyRequest[]>('/api/SupplyRequests', {
    params: status ? { status } : undefined,
  });
  const payload = response.data as unknown;
  if (Array.isArray(payload)) {
    return payload.map((row) => ({
      ...row,
      status: normalizeSupplyRequestStatus(row.status),
      orderStatus: row.orderStatus ? normalizeOrderStatus(row.orderStatus) : null,
    }));
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: SupplyRequest[] }).items.map((row) => ({
      ...row,
      status: normalizeSupplyRequestStatus(row.status),
      orderStatus: row.orderStatus ? normalizeOrderStatus(row.orderStatus) : null,
    }));
  }
  return [];
}

export async function fetchSupplyRequestById(requestId: number): Promise<SupplyRequest> {
  const response = await api.get<SupplyRequest>(`/api/SupplyRequests/${requestId}`);
  return {
    ...response.data,
    status: normalizeSupplyRequestStatus(response.data.status),
    orderStatus: response.data.orderStatus ? normalizeOrderStatus(response.data.orderStatus) : null,
  };
}

export async function createSupplyRequest(payload: CreateSupplyRequestPayload): Promise<SupplyRequest> {
  const response = await api.post<SupplyRequest>('/api/SupplyRequests', payload);
  return response.data;
}

export async function fetchLatestOngoingSupplyRequest(): Promise<SupplyRequest | null> {
  try {
    const response = await api.get<SupplyRequest>('/api/SupplyRequests/latest-ongoing');
    return {
      ...response.data,
      status: normalizeSupplyRequestStatus(response.data.status),
      orderStatus: response.data.orderStatus ? normalizeOrderStatus(response.data.orderStatus) : null,
    };
  } catch (err) {
    return null;
  }
}

export async function submitSupplyRequest(requestId: number, notes?: string): Promise<void> {
  await api.post(`/api/SupplyRequests/${requestId}/submit`, { notes });
}

export async function updateSupplyRequest(
  requestId: number,
  payload: Omit<CreateSupplyRequestPayload, 'branchId'>,
): Promise<SupplyRequest> {
  const response = await api.put<SupplyRequest>(`/api/SupplyRequests/${requestId}`, payload);
  return response.data;
}

export async function fetchConsumptionLogs(params?: {
  from?: string;
  to?: string;
  method?: string;
}): Promise<ConsumptionLog[]> {
  const response = await api.get<ConsumptionLog[]>('/api/Consumption', { params });
  const payload = response.data as unknown;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: ConsumptionLog[] }).items;
  }
  return [];
}

export async function logDirectConsumption(payload: {
  logDate: string;
  shift: string;
  remarks?: string;
  items: Array<{ itemId: number; quantity: number; reason: string }>;
}): Promise<ConsumptionLog> {
  const response = await api.post<ConsumptionLog>('/api/Consumption/direct', payload);
  return response.data;
}

export async function logSalesConsumption(payload: {
  logDate: string;
  shift: string;
  remarks?: string;
  sales: Array<{ menuItemId: number; quantitySold: number }>;
}): Promise<ConsumptionLog> {
  const response = await api.post<ConsumptionLog>('/api/Consumption/sales', payload);
  return response.data;
}

export async function fetchBranchOrders(status?: string): Promise<BranchOrder[]> {
  const response = await api.get<BranchOrder[]>('/api/BranchOrders', {
    params: status ? { status } : undefined,
  });
  const payload = response.data as unknown;
  if (Array.isArray(payload)) {
    return payload.map((row) => ({ ...row, status: normalizeOrderStatus(row.status) }));
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: BranchOrder[] }).items.map((row) => ({
      ...row,
      status: normalizeOrderStatus(row.status),
    }));
  }
  return [];
}

export async function fetchOrders(status?: string): Promise<BranchOrder[]> {
  const response = await api.get<BranchOrder[]>('/api/Orders', {
    params: status ? { status } : undefined,
  });
  const payload = response.data as unknown;
  if (Array.isArray(payload)) {
    return payload.map((row) => ({ ...row, status: normalizeOrderStatus(row.status) }));
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: BranchOrder[] }).items.map((row) => ({
      ...row,
      status: normalizeOrderStatus(row.status),
    }));
  }
  return [];
}

export async function fetchOrderById(orderId: number): Promise<OrderDetail> {
  const response = await api.get<OrderDetail>(`/api/Orders/${orderId}`);
  return { ...response.data, status: normalizeOrderStatus(response.data.status) };
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderDetail> {
  const response = await api.post<OrderDetail>('/api/Orders', payload);
  return { ...response.data, status: normalizeOrderStatus(response.data.status) };
}


export async function pickOrder(orderId: number, remarks?: string): Promise<void> {
  await api.put(`/api/Orders/${orderId}/pick`, { remarks });
}

export async function packOrder(orderId: number, remarks?: string): Promise<void> {
  await api.put(`/api/Orders/${orderId}/pack`, { remarks });
}

export async function dispatchOrder(
  orderId: number,
  payload: { vehicleId?: number; trackingNumber?: string; estimatedArrival?: string; remarks?: string },
): Promise<void> {
  await api.put(`/api/Orders/${orderId}/dispatch`, payload);
}

export async function approveSupplyRequest(
  requestId: number,
  payload: { notes?: string; items: Array<{ requestItemId: number; quantityApproved: number }> },
): Promise<SupplyRequest> {
  const response = await api.put<SupplyRequest>(`/api/SupplyRequests/${requestId}/approve`, payload);
  return { ...response.data, status: normalizeSupplyRequestStatus(response.data.status) };
}

export async function rejectSupplyRequest(
  requestId: number,
  payload: { reason?: string; notes?: string },
): Promise<SupplyRequest> {
  const response = await api.put<SupplyRequest>(`/api/SupplyRequests/${requestId}/reject`, payload);
  return { ...response.data, status: normalizeSupplyRequestStatus(response.data.status) };
}

export async function cancelSupplyRequest(
  requestId: number,
  payload: { reason?: string; notes?: string },
): Promise<SupplyRequest> {
  const response = await api.post<SupplyRequest>(`/api/SupplyRequests/${requestId}/cancel`, payload);
  return { ...response.data, status: normalizeSupplyRequestStatus(response.data.status) };
}

export async function confirmDelivery(
  orderId: number,
  payload: {
    receivedInFull: boolean;
    remarks?: string;
    lines: Array<{ itemId: number; quantityReceived: number }>;
  },
): Promise<void> {
  await api.post(`/api/BranchOrders/${orderId}/confirm-delivery`, payload);
}

// ── SR WORKFLOW APIs ──

export interface PickingSuggestion {
  requestItemId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  approvedQty: number;
  hqStock: number;
  branchCurrentStock: number;
  branchThreshold: number;
  suggestedSendQty: number;
}

export interface PickingItemPayload {
  requestItemId: number;
  isPicked: boolean;
  sendQuantity: number | null;
  isRejected: boolean;
  rejectionReason: string | null;
}

export interface PackingItemPayload {
  requestItemId: number;
  isPacked: boolean;
}

export interface BranchCheckItemPayload {
  requestItemId: number;
  isChecked: boolean;
}

export async function getPickingSuggestions(orderId: number): Promise<PickingSuggestion[]> {
  const response = await api.get<PickingSuggestion[]>(`/api/Orders/${orderId}/picking-suggestions`);
  return response.data;
}

export async function submitPicking(orderId: number, items: PickingItemPayload[]): Promise<OrderDetail> {
  const response = await api.put<OrderDetail>(`/api/Orders/${orderId}/workflow/pick`, { items });
  return { ...response.data, status: normalizeOrderStatus(response.data.status) };
}

export async function submitPacking(orderId: number, items: PackingItemPayload[]): Promise<OrderDetail> {
  const response = await api.put<OrderDetail>(`/api/Orders/${orderId}/workflow/pack`, { items });
  return { ...response.data, status: normalizeOrderStatus(response.data.status) };
}

export async function submitDispatch(
  orderId: number,
  payload: { vehicleId: number; trackingNumber: string; estimatedArrival: string },
): Promise<OrderDetail> {
  const response = await api.put<OrderDetail>(`/api/Orders/${orderId}/workflow/dispatch`, payload);
  return { ...response.data, status: normalizeOrderStatus(response.data.status) };
}

export async function confirmArrival(orderId: number): Promise<OrderDetail> {
  const response = await api.post<OrderDetail>(`/api/Orders/${orderId}/workflow/arrive`, {});
  return { ...response.data, status: normalizeOrderStatus(response.data.status) };
}

export async function completeTransaction(orderId: number, items: BranchCheckItemPayload[]): Promise<OrderDetail> {
  const response = await api.post<OrderDetail>(`/api/Orders/${orderId}/workflow/complete`, { items });
  return { ...response.data, status: normalizeOrderStatus(response.data.status) };
}

export async function cancelOrder(orderId: number, payload: { reason?: string }): Promise<OrderDetail> {
  const response = await api.post<OrderDetail>(`/api/Orders/${orderId}/workflow/cancel`, payload);
  return { ...response.data, status: normalizeOrderStatus(response.data.status) };
}

// ── ORDER MESSAGING APIs ──

export interface OrderMessage {
  messageId: number;
  orderId: number;
  senderUserId: number;
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string;
}

export async function fetchOrderMessages(orderId: number): Promise<OrderMessage[]> {
  const response = await api.get<OrderMessage[]>(`/api/Orders/${orderId}/messages`);
  return response.data;
}

export async function sendOrderMessage(orderId: number, payload: { content: string }): Promise<OrderMessage> {
  const response = await api.post<OrderMessage>(`/api/Orders/${orderId}/messages`, payload);
  return response.data;
}

// ── HQ DISPATCH APIs ──

export async function fetchHqDispatches(status?: string): Promise<BranchOrder[]> {
  const response = await api.get<BranchOrder[]>('/api/Orders/hq-dispatches', {
    params: status ? { status } : undefined,
  });
  const payload = response.data as unknown;
  if (Array.isArray(payload)) {
    return payload.map((row) => ({ ...row, status: normalizeOrderStatus(row.status) }));
  }
  return [];
}

export async function fetchIncomingShipments(status?: string): Promise<BranchOrder[]> {
  const response = await api.get<BranchOrder[]>('/api/Orders/incoming-shipments', {
    params: status ? { status } : undefined,
  });
  const payload = response.data as unknown;
  if (Array.isArray(payload)) {
    return payload.map((row) => ({ ...row, status: normalizeOrderStatus(row.status) }));
  }
  return [];
}

// ── NOTIFICATION APIs ──

export interface NotificationItem {
  notificationId: number;
  title: string;
  message: string;
  type: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}

export async function fetchNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  const response = await api.get<NotificationItem[]>('/api/Notifications', {
    params: { unreadOnly, take: 30 },
  });
  return response.data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/api/Notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/api/Notifications/read-all');
}
