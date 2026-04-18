import { api } from '../../utils/api';

export interface SupplyRequestItem {
  requestItemId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  quantityRequested: number;
  quantityApproved: number | null;
}

export interface SupplyRequest {
  requestId: number;
  branchId: number;
  branchName: string;
  requestedByUserId: number;
  requestedByName: string;
  status: string;
  requestType: string;
  priority: string;
  dispatchWindow: string;
  dispatchDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: SupplyRequestItem[];
}

export interface CreateSupplyRequestPayload {
  branchId?: number;
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

export interface ReturnItem {
  itemId: number;
  itemName: string;
  quantityReturned: number;
  reason: string;
}

export interface ReturnRecord {
  returnId: number;
  orderId: number;
  branchId: number;
  branchName: string;
  reason: string;
  resolution: string;
  photoUrls: string | null;
  creditAmount: number | null;
  loggedAt: string;
  resolvedAt: string | null;
  items: ReturnItem[];
}

export interface BranchOrder {
  orderId: number;
  requestId: number;
  branchId: number;
  branchName: string;
  status: string;
  pushedToFulfillmentAt: string;
}

export async function fetchSupplyRequests(status?: string): Promise<SupplyRequest[]> {
  const response = await api.get<SupplyRequest[]>('/api/SupplyRequests', {
    params: status ? { status } : undefined,
  });
  
  const payload = response.data as unknown;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: SupplyRequest[] }).items;
  }
  return [];
}

export async function createSupplyRequest(payload: CreateSupplyRequestPayload): Promise<SupplyRequest> {
  const response = await api.post<SupplyRequest>('/api/SupplyRequests', payload);
  return response.data;
}

export async function submitSupplyRequest(requestId: number, notes?: string): Promise<void> {
  await api.post(`/api/SupplyRequests/${requestId}/submit`, { notes });
}

export async function fetchConsumptionLogs(params?: {
  from?: string;
  to?: string;
  method?: string;
}): Promise<ConsumptionLog[]> {
  const response = await api.get<ConsumptionLog[]>('/api/Consumption', { params });
  
  const payload = response.data as unknown;
  if (Array.isArray(payload)) {
    return payload;
  }
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

export async function fetchReturns(resolution?: string): Promise<ReturnRecord[]> {
  const response = await api.get<ReturnRecord[]>('/api/Returns', {
    params: resolution ? { resolution } : undefined,
  });

  const payload = response.data as unknown;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: ReturnRecord[] }).items;
  }

  return [];
}

export async function fetchReturnById(returnId: number): Promise<ReturnRecord> {
  const response = await api.get<ReturnRecord>(`/api/Returns/${returnId}`);
  return response.data;
}

export async function createReturn(payload: {
  orderId: number;
  reason: string;
  photoUrls?: string;
  items: Array<{ itemId: number; quantityReturned: number; reason: string }>;
}): Promise<ReturnRecord> {
  const response = await api.post<ReturnRecord>('/api/Returns', payload);
  return response.data;
}

export async function resolveReturn(
  returnId: number,
  payload: { resolution: string; creditAmount?: number; remarks?: string },
): Promise<void> {
  await api.post(`/api/Returns/${returnId}/resolve`, payload);
}

export async function fetchBranchOrders(status?: string): Promise<BranchOrder[]> {
  const response = await api.get<BranchOrder[]>('/api/BranchOrders', {
    params: status ? { status } : undefined,
  });
  
  const payload = response.data as unknown;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: BranchOrder[] }).items;
  }
  return [];
}

export async function confirmDelivery(orderId: number, payload: {
  receivedInFull: boolean;
  remarks?: string;
  lines: Array<{ itemId: number; quantityReceived: number }>;
}): Promise<void> {
  await api.post(`/api/BranchOrders/${orderId}/confirm-delivery`, payload);
}
