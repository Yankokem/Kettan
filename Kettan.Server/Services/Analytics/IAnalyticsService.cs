using Kettan.Server.DTOs.Analytics;

namespace Kettan.Server.Services.Analytics;

public interface IAnalyticsService
{
    // ── Existing ─────────────────────────────────────────────────────────────
    Task<EoqResultDto> CalculateEOQAsync(int itemId);
    Task<List<BranchScorecardDto>> CalculateBranchScoresAsync(DateTime startDate, DateTime endDate);
    Task<InventorySummaryDto> GetInventorySummaryAsync(int? branchId = null);
    Task<OrderFulfillmentMetricsDto> GetFulfillmentMetricsAsync(DateTime startDate, DateTime endDate);
    Task<List<ConsumptionTrendDto>> GetConsumptionTrendsAsync(DateTime startDate, DateTime endDate);

    // ── HQ Reports ───────────────────────────────────────────────────────────
    Task<HqOverviewDto> GetHqOverviewAsync(DateTime startDate, DateTime endDate);
    Task<List<CostTrendPointDto>> GetCostTrendAsync(DateTime startDate, DateTime endDate);
    Task<List<BranchSpendDto>> GetBranchSpendAsync(DateTime startDate, DateTime endDate);
    Task<List<BranchInventoryValuationDto>> GetAllBranchInventoryValuationsAsync();
    Task<List<WastageRecordDto>> GetWastageRecordsAsync(DateTime startDate, DateTime endDate, int? branchId = null);
    Task<List<EoqSuggestionDto>> GetEoqSuggestionsAsync();
    Task<ReturnsLossOverviewDto> GetReturnsLossOverviewAsync(DateTime startDate, DateTime endDate);
    Task<List<ReturnLossRecordDto>> GetReturnLossRecordsAsync(DateTime startDate, DateTime endDate);
    Task<ConsumptionAnalyticsDto> GetConsumptionAnalyticsAsync(DateTime startDate, DateTime endDate, int? branchId = null);

    // ── Branch Reports ────────────────────────────────────────────────────────
    Task<BranchOverviewDto> GetBranchOverviewAsync(int branchId, DateTime startDate, DateTime endDate);
    Task<List<WastageRecordDto>> GetBranchWastageAsync(int branchId, DateTime startDate, DateTime endDate);
    Task<List<BranchSupplyHistoryDto>> GetBranchSupplyHistoryAsync(int branchId, DateTime startDate, DateTime endDate);
    Task<BranchPerformanceDetailDto> GetBranchPerformanceDetailAsync(int branchId, DateTime startDate, DateTime endDate);
}