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

    // ── Data Endpoints ──────────────────────────────────────────────────────

    [HttpGet("inventory-summary")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<InventorySummaryDto>> GetInventorySummary([FromQuery] int? branchId = null)
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
    public async Task<ActionResult<OrderFulfillmentMetricsDto>> GetFulfillmentMetrics([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
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
    public async Task<ActionResult<List<ConsumptionTrendDto>>> GetConsumptionTrends([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var result = await _service.GetConsumptionTrendsAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch-scorecard")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff,BranchOwner,BranchManager")]
    public async Task<ActionResult<List<BranchScorecardDto>>> GetBranchScorecard([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var result = await _service.CalculateBranchScoresAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("hq/overview")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<HqOverviewDto>> GetHqOverview([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
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
    public async Task<ActionResult<List<CostTrendPointDto>>> GetCostTrend([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var result = await _service.GetCostTrendAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("hq/branch-spend")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<BranchSpendDto>>> GetBranchSpend([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
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
    public async Task<ActionResult<List<WastageRecordDto>>> GetWastage([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int? branchId = null)
    {
        var result = await _service.GetWastageRecordsAsync(startDate, endDate, branchId);
        return Ok(result);
    }

    [HttpGet("hq/returns-overview")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<ReturnsLossOverviewDto>> GetReturnsOverview([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var result = await _service.GetReturnsLossOverviewAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("hq/returns-records")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<List<ReturnLossRecordDto>>> GetReturnRecords([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var result = await _service.GetReturnLossRecordsAsync(startDate, endDate);
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

    // ── Branch endpoints ──────────────────────────────────────────────────

    [HttpGet("branch/overview")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<BranchOverviewDto>> GetBranchOverview([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue) return BadRequest(new { message = "Branch context required." });
        var result = await _service.GetBranchOverviewAsync(branchId.Value, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch/inventory-summary")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<InventorySummaryDto>> GetBranchInventorySummary()
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue) return BadRequest(new { message = "Branch context required." });
        var result = await _service.GetInventorySummaryAsync(branchId.Value);
        return Ok(result);
    }

    [HttpGet("branch/wastage")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<List<WastageRecordDto>>> GetBranchWastage([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue) return BadRequest(new { message = "Branch context required." });
        var result = await _service.GetBranchWastageAsync(branchId.Value, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch/supply-history")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<List<BranchSupplyHistoryDto>>> GetBranchSupplyHistory([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue) return BadRequest(new { message = "Branch context required." });
        var result = await _service.GetBranchSupplyHistoryAsync(branchId.Value, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch/performance")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<BranchPerformanceDetailDto>> GetBranchPerformance([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue) return BadRequest(new { message = "Branch context required." });
        var result = await _service.GetBranchPerformanceDetailAsync(branchId.Value, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch/sales-trend")]
    [Authorize(Roles = "BranchOwner,BranchManager")]
    public async Task<ActionResult<List<TrendPointDto>>> GetBranchSalesTrend([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue) return BadRequest(new { message = "Branch context required." });
        var result = await _service.GetBranchSalesTrendAsync(branchId.Value, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("branch/low-stock")]
    [Authorize(Roles = "BranchOwner,BranchManager,BranchStaff")]
    public async Task<ActionResult<List<LowStockAlertDto>>> GetBranchLowStock()
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue) return BadRequest(new { message = "Branch context required." });
        var alerts = await _service.GetLowStockAlertsAsync(branchId.Value);
        return Ok(alerts);
    }

    // ── Export endpoints ─────────────────────────────────────────────────────

    [HttpGet("inventory/export")]
    public async Task<IActionResult> ExportInventory([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string format = "csv")
    {
        var data = await _service.GetAllBranchInventoryValuationsAsync();
        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Inventory Valuation Report", data);
            return File(pdfBytes, "application/pdf", "inventory_valuation.pdf");
        }
        var csvBytes = _csvExportService.ExportToCsv(data);
        return File(csvBytes, "text/csv", "inventory_valuation.csv");
    }

    [HttpGet("orders/export")]
    public async Task<IActionResult> ExportOrders([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string format = "csv")
    {
        var tenantId = _currentUser.TenantId;
        var branchId = _currentUser.BranchId;

        var query = _context.Orders
            .Include(o => o.SupplyRequest).ThenInclude(sr => sr != null ? sr.Branch : null)
            .Include(o => o.Allocations).ThenInclude(a => a.Batch).ThenInclude(b => b.Item)
            .Where(o => o.TenantId == tenantId && o.PushedToFulfillmentAt >= startDate && o.PushedToFulfillmentAt <= endDate);

        if (branchId.HasValue)
            query = query.Where(o => o.SupplyRequest != null && o.SupplyRequest.BranchId == branchId.Value);

        var orders = await query
            .OrderByDescending(o => o.PushedToFulfillmentAt)
            .Select(o => new
            {
                o.OrderId,
                Date = o.PushedToFulfillmentAt,
                Branch = o.SupplyRequest != null && o.SupplyRequest.Branch != null ? o.SupplyRequest.Branch.Name : "HQ",
                o.Status,
                TotalValue = o.Allocations.Sum(a => a.QuantityPicked * (a.Batch != null ? a.Batch.Item.UnitCost : 0))
            })
            .ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Sales & Orders Report", orders);
            return File(pdfBytes, "application/pdf", "orders_report.pdf");
        }
        var csvBytes = _csvExportService.ExportToCsv(orders);
        return File(csvBytes, "text/csv", "orders_report.csv");
    }

    [HttpGet("returns/export")]
    public async Task<IActionResult> ExportReturns([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string format = "csv")
    {
        var data = await _service.GetReturnLossRecordsAsync(startDate, endDate);
        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Returns & Losses Report", data);
            return File(pdfBytes, "application/pdf", "returns_report.pdf");
        }
        var csvBytes = _csvExportService.ExportToCsv(data);
        return File(csvBytes, "text/csv", "returns_report.csv");
    }

    [HttpGet("staff/export")]
    public async Task<IActionResult> ExportStaff([FromQuery] string format = "csv")
    {
        var tenantId = _currentUser.TenantId;
        var branchId = _currentUser.BranchId;
        var query = _context.Employees.Include(e => e.Branch).Where(e => e.TenantId == tenantId && !e.IsDeleted);
        if (branchId.HasValue) query = query.Where(e => e.BranchId == branchId.Value);

        var staff = await query.Select(e => new
        {
            FullName = e.FirstName + " " + e.LastName,
            Role = e.Position,
            Branch = e.Branch != null ? e.Branch.Name : "HQ",
            e.Status,
            JoinedAt = e.DateHired
        }).ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Staff Report", staff);
            return File(pdfBytes, "application/pdf", "staff_report.pdf");
        }
        var csvBytes = _csvExportService.ExportToCsv(staff);
        return File(csvBytes, "text/csv", "staff_report.csv");
    }

    [HttpGet("audit-logs/export")]
    public async Task<IActionResult> ExportAuditLogs([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string format = "csv")
    {
        var tenantId = _currentUser.TenantId;
        var logs = await _context.AuditLogs.Include(l => l.User)
            .Where(l => l.TenantId == tenantId && l.OccurredAt >= startDate && l.OccurredAt <= endDate)
            .OrderByDescending(l => l.OccurredAt)
            .Select(l => new { Timestamp = l.OccurredAt, User = l.User != null ? l.User.FullName : "System", l.Action, EntityType = l.EntityName, l.OldValues, l.NewValues })
            .ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("System Audit Logs", logs);
            return File(pdfBytes, "application/pdf", "audit_logs.pdf");
        }
        var csvBytes = _csvExportService.ExportToCsv(logs);
        return File(csvBytes, "text/csv", "audit_logs.csv");
    }

    [HttpGet("consumption/export")]
    public async Task<IActionResult> ExportConsumption([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string format = "csv")
    {
        var branchId = _currentUser.BranchId;
        if (!branchId.HasValue) return BadRequest(new { message = "Branch context required." });
        var logs = await _context.ConsumptionLogItems.Include(i => i.ConsumptionLog).Include(i => i.Item)
            .Where(i => i.ConsumptionLog != null && i.ConsumptionLog.BranchId == branchId.Value && i.ConsumptionLog.LogDate >= startDate && i.ConsumptionLog.LogDate <= endDate)
            .Select(i => new { Date = i.ConsumptionLog!.LogDate, Item = i.Item != null ? i.Item.Name : "Unknown", i.Quantity, Unit = i.Item != null ? i.Item.Unit : "", i.ConsumptionLog.Method, i.ConsumptionLog.Remarks })
            .ToListAsync();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf("Branch Consumption Report", logs);
            return File(pdfBytes, "application/pdf", "consumption_report.pdf");
        }
        var csvBytes = _csvExportService.ExportToCsv(logs);
        return File(csvBytes, "text/csv", "consumption_report.csv");
    }

    [HttpGet("transactions/{referenceId:int}/export")]
    public async Task<IActionResult> ExportTransactionGroup(int referenceId, [FromQuery] string format = "pdf")
    {
        var tenantId = _currentUser.TenantId;

        var transactions = await _context.InventoryTransactions
            .Include(t => t.Batch).ThenInclude(b => b!.Item)
            .Include(t => t.User)
            .Where(t => t.TenantId == tenantId && t.ReferenceId == referenceId)
            .OrderByDescending(t => t.Timestamp)
            .ToListAsync();

        if (transactions.Count == 0) return NotFound();

        var data = transactions.Select(t => new
        {
            t.Timestamp,
            Item = t.Batch?.Item?.Name ?? "Unknown",
            SKU = t.Batch?.Item?.SKU ?? "Unknown",
            Batch = t.Batch?.BatchNumber ?? "N/A",
            Quantity = t.QuantityChange,
            Type = t.TransactionType.ToString(),
            User = t.User != null ? $"{t.User.FirstName} {t.User.LastName}".Trim() : "System",
            t.Remarks
        }).ToList();

        if (format.ToLower() == "pdf")
        {
            var pdfBytes = _pdfExportService.ExportToPdf($"Transaction Report - Ref {referenceId}", data);
            return File(pdfBytes, "application/pdf", $"transaction_{referenceId}.pdf");
        }

        var csvBytes = _csvExportService.ExportToCsv(data);
        return File(csvBytes, "text/csv", $"transaction_{referenceId}.csv");
    }
}