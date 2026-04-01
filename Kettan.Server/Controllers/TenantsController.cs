using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Tenants;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public TenantsController(ApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<TenantDto>> GetCurrentTenant()
    {
        if (!_currentUserService.TenantId.HasValue) return Forbid();

        var tenant = await _context.Tenants.FindAsync(_currentUserService.TenantId.Value);
        if (tenant == null) return NotFound();

        return Ok(new TenantDto
        {
            TenantId = tenant.TenantId,
            Name = tenant.Name,
            SubscriptionTier = tenant.SubscriptionTier,
            IsActive = tenant.IsActive,
            CreatedAt = tenant.CreatedAt
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateCurrentTenant(UpdateTenantDto dto)
    {
        if (!_currentUserService.TenantId.HasValue) return Forbid();

        var tenant = await _context.Tenants.FindAsync(_currentUserService.TenantId.Value);
        if (tenant == null) return NotFound();

        tenant.Name = dto.Name;
        tenant.SubscriptionTier = dto.SubscriptionTier;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}