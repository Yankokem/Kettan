import { api } from '../../utils/api';

// ── Existing DTOs ─────────────────────────────────────────────────────────────

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

export interface EoqResultDto {
  itemId: number;
  itemName: string;
  economicOrderQuantity: number;
  annualDemandUsed: number;
}

// ── New HQ DTOs ───────────────────────────────────────────────────────────────

export interface HqOverviewDto {
  totalFulfillmentCost: number;
  totalChainInventoryValue: number;
  totalWastageLoss: number;
  totalReturnLoss: number;
  topPerformerName: string;
  topPerformerScore: number;
  fulfillmentRate: number;
  totalOrders: number;
}

export interface CostTrendPointDto {
  year: number;
  month: number;
  label: string;
  fulfillmentCost: number;
  shippingCost: number;
}

export interface BranchSpendDto {
  branchId: number;
  branchName: string;
  totalSpend: number;
}

export interface BranchInventoryValuationDto {
  branchId: number;
  branchName: string;
  totalSkus: number;
  totalVolume: number;
  totalValuation: number;
}

export interface WastageRecordDto {
  transactionId: number;
  itemName: string;
  itemSku: string;
  quantityLost: number;
  unit: string;
  unitCost: number;
  totalLoss: number;
  reason: string;
  loggedByName: string;
  timestamp: string;
}

export interface EoqSuggestionDto {
  itemId: number;
  itemName: string;
  itemSku: string;
  unit: string;
  currentStock: number;
  annualDemand: number;
  eoq: number;
  unitCost: number;
  setupCost: number;
  holdingCost: number;
}

export interface ReturnsLossOverviewDto {
  totalReturns: number;
  replacedCount: number;
  creditedCount: number;
  rejectedCount: number;
  totalMoneyLost: number;
  averageReturnRate: number;
}

export interface ReturnLossRecordDto {
  returnId: number;
  orderId: number;
  branchName: string;
  resolution: string;
  reason: string;
  creditAmount: number;
  itemCount: number;
  loggedAt: string;
}

export interface TopMenuItemDto {
  menuItemId: number;
  menuItemName: string;
  totalSold: number;
  logCount: number;
}

export interface IngredientUsageDto {
  itemId: number;
  itemName: string;
  unit: string;
  totalConsumed: number;
}

export interface ShiftBreakdownDto {
  shift: string;
  logCount: number;
  totalVolume: number;
}

export interface ConsumptionAnalyticsDto {
  topMenuItems: TopMenuItemDto[];
  ingredientUsage: IngredientUsageDto[];
  shiftBreakdown: ShiftBreakdownDto[];
}

// ── New Branch DTOs ───────────────────────────────────────────────────────────

export interface BranchOverviewDto {
  inventoryValue: number;
  totalSkus: number;
  totalSupplySpendReceived: number;
  wastageLoss: number;
  performanceScore: number;
  rankInChain: number;
  totalBranchesInChain: number;
}

export interface BranchSupplyHistoryDto {
  requestId: number;
  referenceNumber: string;
  status: string;
  priority: string;
  fulfillmentCost: number;
  isFullyFulfilled: boolean;
  createdAt: string;
  deliveredAt: string | null;
}

export interface BranchPerformanceDetailDto {
  weightedScore: number;
  fulfillmentRate: number;
  returnRate: number;
  deliverySpeedHrs: number;
  stockAccuracy: number;
  rankInChain: number;
  totalBranches: number;
}

export interface TrendPointDto {
  label: string;
  value: number;
}

export interface BranchTrendDto {
  branchName: string;
  points: TrendPointDto[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

async function get<T>(url: string): Promise<T> {
  const res = await api.get<T>(url);
  return res.data;
}

// ── Existing API functions ────────────────────────────────────────────────────

export async function fetchInventorySummary(branchId?: number): Promise<InventorySummaryDto> {
  return get<InventorySummaryDto>(`/api/reports/inventory-summary${branchId ? `?branchId=${branchId}` : ''}`);
}

export async function fetchOrderFulfillment(
  startDate: string, endDate: string
): Promise<OrderFulfillmentMetricsDto> {
  return get<OrderFulfillmentMetricsDto>(
    `/api/reports/order-fulfillment${qs({ startDate, endDate })}`
  );
}

export async function fetchBranchScorecard(
  startDate: string, endDate: string
): Promise<BranchScorecardDto[]> {
  return get<BranchScorecardDto[]>(
    `/api/reports/branch-scorecard${qs({ startDate, endDate })}`
  );
}

export async function fetchConsumptionTrends(
  startDate: string, endDate: string
): Promise<ConsumptionTrendDto[]> {
  return get<ConsumptionTrendDto[]>(
    `/api/reports/consumption-trends${qs({ startDate, endDate })}`
  );
}

// ── New HQ API functions ──────────────────────────────────────────────────────

export async function fetchHqOverview(
  startDate: string, endDate: string
): Promise<HqOverviewDto> {
  return get<HqOverviewDto>(`/api/reports/hq/overview${qs({ startDate, endDate })}`);
}

export async function fetchCostTrend(
  startDate: string, endDate: string
): Promise<CostTrendPointDto[]> {
  return get<CostTrendPointDto[]>(`/api/reports/hq/cost-trend${qs({ startDate, endDate })}`);
}

export async function fetchBranchSpend(
  startDate: string, endDate: string
): Promise<BranchSpendDto[]> {
  return get<BranchSpendDto[]>(`/api/reports/hq/branch-spend${qs({ startDate, endDate })}`);
}

export async function fetchBranchValuations(): Promise<BranchInventoryValuationDto[]> {
  return get<BranchInventoryValuationDto[]>('/api/reports/hq/branch-valuations');
}

export async function fetchWastageRecords(
  startDate: string, endDate: string, branchId?: number
): Promise<WastageRecordDto[]> {
  return get<WastageRecordDto[]>(
    `/api/reports/hq/wastage${qs({ startDate, endDate, branchId })}`
  );
}

export async function fetchEoqSuggestions(): Promise<EoqSuggestionDto[]> {
  return get<EoqSuggestionDto[]>('/api/reports/hq/eoq-suggestions');
}

export async function fetchReturnsLossOverview(
  startDate: string, endDate: string
): Promise<ReturnsLossOverviewDto> {
  return get<ReturnsLossOverviewDto>(
    `/api/reports/hq/returns-overview${qs({ startDate, endDate })}`
  );
}

export async function fetchReturnLossRecords(
  startDate: string, endDate: string
): Promise<ReturnLossRecordDto[]> {
  return get<ReturnLossRecordDto[]>(
    `/api/reports/hq/returns-records${qs({ startDate, endDate })}`
  );
}

export async function fetchConsumptionAnalytics(
  startDate: string, endDate: string, branchId?: number
): Promise<ConsumptionAnalyticsDto> {
  return get<ConsumptionAnalyticsDto>(
    `/api/reports/hq/consumption-analytics${qs({ startDate, endDate, branchId })}`
  );
}

// ── New Branch API functions ──────────────────────────────────────────────────

export async function fetchBranchOverview(
  startDate: string, endDate: string
): Promise<BranchOverviewDto> {
  return get<BranchOverviewDto>(`/api/reports/branch/overview${qs({ startDate, endDate })}`);
}

export async function fetchBranchInventorySummary(): Promise<InventorySummaryDto> {
  return get<InventorySummaryDto>('/api/reports/branch/inventory-summary');
}

export async function fetchBranchWastage(
  startDate: string, endDate: string
): Promise<WastageRecordDto[]> {
  return get<WastageRecordDto[]>(
    `/api/reports/branch/wastage${qs({ startDate, endDate })}`
  );
}

export async function fetchBranchSupplyHistory(
  startDate: string, endDate: string
): Promise<BranchSupplyHistoryDto[]> {
  return get<BranchSupplyHistoryDto[]>(
    `/api/reports/branch/supply-history${qs({ startDate, endDate })}`
  );
}

export async function fetchBranchPerformanceDetail(
  startDate: string, endDate: string
): Promise<BranchPerformanceDetailDto> {
  return get<BranchPerformanceDetailDto>(
    `/api/reports/branch/performance${qs({ startDate, endDate })}`
  );
}

export async function fetchBranchEoqSuggestions(): Promise<EoqSuggestionDto[]> {
  return get<EoqSuggestionDto[]>('/api/reports/branch/eoq-suggestions');
}

export async function fetchBranchConsumptionAnalytics(
  startDate: string, endDate: string
): Promise<ConsumptionAnalyticsDto> {
  return get<ConsumptionAnalyticsDto>(
    `/api/reports/branch/consumption-analytics${qs({ startDate, endDate })}`
  );
}

export async function fetchBranchSalesTrend(
  startDate: string, endDate: string
): Promise<TrendPointDto[]> {
  return get<TrendPointDto[]>(`/api/reports/branch/sales-trend${qs({ startDate, endDate })}`);
}

export async function fetchHqSupplyTrend(
  startDate: string, endDate: string
): Promise<BranchTrendDto[]> {
  return get<BranchTrendDto[]>(`/api/reports/hq/supply-trend${qs({ startDate, endDate })}`);
}