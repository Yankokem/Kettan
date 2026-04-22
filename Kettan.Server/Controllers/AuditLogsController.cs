using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AuditLogsController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? search,
        [FromQuery] string? action,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var isSuperAdmin = _currentUserService.Role == "SuperAdmin";
        var tenantId = _currentUserService.TenantId;

        // SuperAdmin sees everything, TenantAdmin sees only their tenant
        if (!isSuperAdmin && _currentUserService.Role != "TenantAdmin")
        {
            return Forbid();
        }

        var query = _context.AuditLogs.AsQueryable();

        if (!isSuperAdmin && tenantId.HasValue)
        {
            query = query.Where(a => a.TenantId == tenantId.Value);
        }

        // Search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(a =>
                a.Action.ToLower().Contains(q) ||
                a.EntityName.ToLower().Contains(q) ||
                (a.EntityId != null && a.EntityId.ToLower().Contains(q)));
        }

        // Action filter
        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(a => a.Action == action);
        }

        // Date range filter
        if (DateTime.TryParse(startDate, out var from))
        {
            query = query.Where(a => a.OccurredAt >= from);
        }

        if (DateTime.TryParse(endDate, out var to))
        {
            var toEnd = to.Date.AddDays(1); // include the full end day
            query = query.Where(a => a.OccurredAt < toEnd);
        }

        var totalCount = await query.CountAsync(ct);

        var logs = await query
            .OrderByDescending(a => a.OccurredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                Id = a.AuditLogId,
                a.Action,
                a.EntityName,
                a.EntityId,
                a.EventCategory,
                ActorName = a.User != null
                    ? a.User.FirstName + " " + a.User.LastName
                    : "System",
                ActorRole = a.User != null ? a.User.Role : "System",
                a.TenantId,
                TenantName = a.Tenant != null ? a.Tenant.Name : null,
                a.OccurredAt,
                a.IpAddress
            })
            .ToListAsync(ct);

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data = logs
        });
    }
}
