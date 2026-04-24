export interface InventorySummaryDto {
  totalSkus: number;
  totalVolume: number;
  totalValuation: number;
}

export interface OrderFulfillmentMetricsDto {
  totalOrders: number;
  deliveredOrders: number;
  fulfillmentRate: number;
  totalFulfillmentCost: number;
}

export interface BranchScorecardDto {
  branchId: number;
  branchName: string;
  scorePercentage: number;
  salesVolume: number;
  returnsCount: number;
  supplyRequestsCount: number;
}

export interface ConsumptionTrendDto {
  branchId: number;
  branchName: string;
  totalConsumptionVolume: number;
  logCount: number;
}

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchInventorySummary(branchId?: number): Promise<InventorySummaryDto> {
  const qs = branchId ? `?branchId=${branchId}` : '';
  return request<InventorySummaryDto>(`/api/reports/inventory-summary${qs}`);
}

export async function fetchOrderFulfillment(startDate: string, endDate: string): Promise<OrderFulfillmentMetricsDto> {
  return request<OrderFulfillmentMetricsDto>(`/api/reports/order-fulfillment?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
}

export async function fetchBranchScorecard(startDate: string, endDate: string): Promise<BranchScorecardDto[]> {
  return request<BranchScorecardDto[]>(`/api/reports/branch-scorecard?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
}

export async function fetchConsumptionTrends(startDate: string, endDate: string): Promise<ConsumptionTrendDto[]> {
  return request<ConsumptionTrendDto[]>(`/api/reports/consumption-trends?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
}
