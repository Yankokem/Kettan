using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kettan.Server.DTOs.Analytics;
using Kettan.Server.Services.Analytics;
using Kettan.Server.Services.Export;
using Kettan.Server.Data;
using Kettan.Server.Services.Common;
using Microsoft.EntityFrameworkCore;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "TenantAdmin,HqManager,HqStaff,BranchOwner,BranchManager")]
public class ReportsController : ControllerBase
{
    private readonly IAnalyticsService _service;
    private readonly ApplicationDbContext _context;
    private readonly ICsvExportService _csvExportService;
    private readonly IPdfExportService _pdfExportService;
    private readonly ICurrentUserService _currentUser;

    public ReportsController(
        IAnalyticsService service,
        ApplicationDbContext context,
        ICsvExportService csvExportService,
        IPdfExportService pdfExportService,
        ICurrentUserService currentUser)
    {
        _service = service;
        _context = context;
        _csvExportService = csvExportService;
        _pdfExportService = pdfExportService;
        _currentUser = currentUser;
    }

    // ── Existing endpoints (HQ-only) ─────────────────────────────────────────

    [HttpGet("inventory-summary")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<InventorySummaryDto>> GetInventorySummary(
        [FromQuery] int? branchId = null)
    {
        try
        {
            var result = await _service.GetInventorySummaryAsync(branchId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("order-fulfillment")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<OrderFulfillmentMetricsDto>> GetFulfillmentMetrics(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            var result = await _service.GetFulfillmentMetricsAsync(startDate, endDate);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("consumption-trends")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<ConsumptionTrendDto>>> GetConsumptionTrends(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var result = await _service.GetConsumptionTrendsAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch-scorecard")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff,BranchOwner,BranchManager")]
    public async Task<ActionResult<List<BranchScorecardDto>>> GetBranchScorecard(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var result = await _service.CalculateBranchScoresAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("eoq/{itemId}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<EoqResultDto>> GetEoq(int itemId)
    {
        try
        {
            var result = await _service.CalculateEOQAsync(itemId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // ── New HQ endpoints ─────────────────────────────────────────────────────

    [HttpGet("hq/overview")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<HqOverviewDto>> GetHqOverview(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            var result = await _service.GetHqOverviewAsync(startDate, endDate);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("hq/cost-trend")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<CostTrendPointDto>>> GetCostTrend(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var result = await _service.GetCostTrendAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("hq/branch-spend")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<BranchSpendDto>>> GetBranchSpend(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var result = await _service.GetBranchSpendAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("hq/branch-valuations")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<BranchInventoryValuationDto>>> GetBranchValuations()
    {
        var result = await _service.GetAllBranchInventoryValuationsAsync();
        return Ok(result);
    }

    [HttpGet("hq/wastage")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<WastageRecordDto>>> GetWastage(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] int? branchId = null)
    {
        var result = await _service.GetWastageRecordsAsync(startDate, endDate, branchId);
        return Ok(result);
    }

    [HttpGet("hq/eoq-suggestions")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<EoqSuggestionDto>>> GetEoqSuggestions()
    {
        var result = await _service.GetEoqSuggestionsAsync();
        return Ok(result);
    }

    [HttpGet("hq/returns-overview")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ReturnsLossOverviewDto>> GetReturnsOverview(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var result = await _service.GetReturnsLossOverviewAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("hq/returns-records")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<ReturnLossRecordDto>>> GetReturnRecords(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var result = await _service.GetReturnLossRecordsAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("hq/consumption-analytics")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ConsumptionAnalyticsDto>> GetConsumptionAnalytics(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] int? branchId = null)
    {
        var result = await _service.GetConsumptionAnalyticsAsync(startDate, endDate, branchId);
        return Ok(result);
    }

    // ── New Branch endpoints ──────────────────────────────────────────────────

    [HttpGet("branch/overview")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<BranchOverviewDto>> GetBranchOverview(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue)
            return BadRequest(new { message = "Branch context required." });

        try
        {
            var result = await _service.GetBranchOverviewAsync(branchId.Value, startDate, endDate);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("branch/inventory-summary")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<InventorySummaryDto>> GetBranchInventorySummary()
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue)
            return BadRequest(new { message = "Branch context required." });

        var result = await _service.GetInventorySummaryAsync(branchId.Value);
        return Ok(result);
    }

    [HttpGet("branch/wastage")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<List<WastageRecordDto>>> GetBranchWastage(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue)
            return BadRequest(new { message = "Branch context required." });

        var result = await _service.GetBranchWastageAsync(branchId.Value, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch/supply-history")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<List<BranchSupplyHistoryDto>>> GetBranchSupplyHistory(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue)
            return BadRequest(new { message = "Branch context required." });

        var result = await _service.GetBranchSupplyHistoryAsync(branchId.Value, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch/performance")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<BranchPerformanceDetailDto>> GetBranchPerformance(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue)
            return BadRequest(new { message = "Branch context required." });

        var result = await _service.GetBranchPerformanceDetailAsync(branchId.Value, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch/consumption-analytics")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<ConsumptionAnalyticsDto>> GetBranchConsumptionAnalytics(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue)
            return BadRequest(new { message = "Branch context required." });

        var result = await _service.GetConsumptionAnalyticsAsync(startDate, endDate, branchId.Value);
        return Ok(result);
    }

    [HttpGet("branch/eoq-suggestions")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<List<EoqSuggestionDto>>> GetBranchEoqSuggestions()
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue)
            return BadRequest(new { message = "Branch context required." });

        var result = await _service.GetEoqSuggestionsAsync(branchId.Value);
        return Ok(result);
    }

    [HttpGet("branch/sales-trend")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<List<TrendPointDto>>> GetBranchSalesTrend(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue)
            return BadRequest(new { message = "Branch context required." });

        var result = await _service.GetBranchSalesTrendAsync(branchId.Value, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("hq/supply-trend")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<BranchTrendDto>>> GetHqSupplyTrend([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var trend = await _service.GetHqSupplyTrendAsync(startDate, endDate);
        return Ok(trend);
    }

    [HttpGet("hq/low-stock")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<LowStockAlertDto>>> GetHqLowStock()
    {
        var alerts = await _service.GetLowStockAlertsAsync();
        return Ok(alerts);
    }

    [HttpGet("branch/low-stock")]
    [Authorize(Roles = "BranchOwner,BranchManager,BranchStaff")]
    public async Task<ActionResult<List<LowStockAlertDto>>> GetBranchLowStock()
    {
        var branchId = int.Parse(User.FindFirst("BranchId")?.Value ?? "0");
        if (branchId == 0) return Forbid();
        
        var alerts = await _service.GetLowStockAlertsAsync(branchId);
        return Ok(alerts);
    }

    // ── Export endpoints ─────────────────────────────────────────────────────

    [HttpGet("inventory/export")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> ExportInventory([FromQuery] string format = "csv")
    {
        var items = await _context.Items
            .Include(i => i.InventoryCategory)
            .Include(i => i.ItemCategory)
            .Select(i => new
            {
                i.ItemId,
                i.SKU,
                i.Name,
                i.Unit,
                InventoryCategory = i.InventoryCategory != null ? i.InventoryCategory.Name : "",
                ItemCategory = i.ItemCategory != null ? i.ItemCategory.Name : "",
                i.DefaultThreshold,
                i.UnitCost,
                i.SellingPrice
            })
            .ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Inventory Report", items);
            return File(pdfBytes, "application/pdf", "inventory_report.pdf");
        }
        else
        {
            var csvBytes = _csvExportService.ExportToCsv(items);
            return File(csvBytes, "text/csv", "inventory_report.csv");
        }
    }

    [HttpGet("orders/export")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> ExportOrders([FromQuery] string format = "csv")
    {
        var orders = await _context.Orders
            .Include(o => o.SupplyRequest)
                .ThenInclude(sr => sr != null ? sr.Branch : null)
            .Select(o => new
            {
                o.OrderId,
                o.RequestId,
                BranchName = o.SupplyRequest != null && o.SupplyRequest.Branch != null
                    ? o.SupplyRequest.Branch.Name : "",
                o.Status,
                o.PushedToFulfillmentAt
            })
            .OrderByDescending(o => o.PushedToFulfillmentAt)
            .ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Orders Report", orders);
            return File(pdfBytes, "application/pdf", "orders_report.pdf");
        }
        else
        {
            var csvBytes = _csvExportService.ExportToCsv(orders);
            return File(csvBytes, "text/csv", "orders_report.csv");
        }
    }

    [HttpGet("returns/export")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<IActionResult> ExportReturns([FromQuery] string format = "csv")
    {
        var returns = await _context.Returns
            .Include(r => r.Branch)
            .Select(r => new
            {
                r.ReturnId,
                r.OrderId,
                BranchName = r.Branch != null ? r.Branch.Name : "",
                r.Resolution,
                r.Reason,
                r.CreditAmount,
                r.LoggedAt
            })
            .OrderByDescending(r => r.LoggedAt)
            .ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Returns Report", returns);
            return File(pdfBytes, "application/pdf", "returns_report.pdf");
        }
        else
        {
            var csvBytes = _csvExportService.ExportToCsv(returns);
            return File(csvBytes, "text/csv", "returns_report.csv");
        }
    }
}