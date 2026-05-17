using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.Services.Common;
using Kettan.Server.Enums;

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
        [FromQuery] int? actorId,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] int? branchId = null,
        CancellationToken ct = default)
    {
        // Clamp pageSize
        if (pageSize > 100) pageSize = 100;
        if (pageSize < 1) pageSize = 10;

        var userRole = _currentUserService.Role;
        var userBranchId = _currentUserService.BranchId;
        var isSuperAdmin = userRole == UserRole.SuperAdmin.ToString();
        var tenantId = _currentUserService.TenantId;

        // 1. Authorization
        var allowedRoles = new[] { 
            UserRole.SuperAdmin.ToString(), 
            UserRole.TenantAdmin.ToString(),
            UserRole.HqManager.ToString(),
            UserRole.BranchOwner.ToString(),
            UserRole.BranchManager.ToString() 
        };

        if (!allowedRoles.Contains(userRole))
        {
            return Forbid();
        }

        var query = _context.AuditLogs.AsNoTracking().AsQueryable();

        // Only show entity mutations (Created/Updated/Deleted), skip HTTP request noise
        var mutationActions = new[] { "Created", "Updated", "Deleted" };
        query = query.Where(a => mutationActions.Contains(a.Action));

        // 2. Tenant isolation
        if (!isSuperAdmin && tenantId.HasValue)
        {
            query = query.Where(a => a.TenantId == tenantId.Value);
        }

        // 3. Branch-level isolation and defaulting
        if (userBranchId.HasValue)
        {
            // Branch user: strictly their own branch
            query = query.Where(a => a.BranchId == userBranchId.Value || (a.User != null && a.User.BranchId == userBranchId.Value));
        }
        else if (!isSuperAdmin) 
        {
            // HQ user (TenantAdmin or HqManager):
            if (branchId.HasValue)
            {
                // Explicitly filtering for a branch (e.g. from branch profile view)
                query = query.Where(a => a.BranchId == branchId.Value || (a.User != null && a.User.BranchId == branchId.Value));
            }
            else 
            {
                // Sidebar default: HQ logs ONLY (where user has no branchId or is null/system)
                query = query.Where(a => a.BranchId == null && (a.User == null || a.User.BranchId == null));
            }
        }
        else if (branchId.HasValue)
        {
            // SuperAdmin with explicit branch filter
            query = query.Where(a => a.BranchId == branchId.Value || (a.User != null && a.User.BranchId == branchId.Value));
        }

        // Search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim();
            query = query.Where(a =>
                a.Action.Contains(q) ||
                a.EntityName.Contains(q) ||
                (a.EntityId != null && a.EntityId.Contains(q)));
        }

        // Action filter (Created / Updated / Deleted)
        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(a => a.Action == action);
        }

        if (actorId.HasValue)
        {
            query = query.Where(a => a.UserId == actorId.Value);
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
                ActorName = a.User != null
                    ? a.User.FirstName + " " + a.User.LastName
                    : "System",
                ActorRole = a.User != null ? a.User.Role.ToString() : "System",
                a.OccurredAt,
                a.OldValues,
                a.NewValues
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
