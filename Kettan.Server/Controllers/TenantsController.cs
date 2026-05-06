using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Tenants;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Enums;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IWebHostEnvironment _environment;

    public TenantsController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        IWebHostEnvironment environment)
    {
        _context = context;
        _currentUserService = currentUserService;
        _environment = environment;
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
            LegalName = tenant.LegalName,
            TaxId = tenant.TaxId,
            Website = tenant.Website,
            SubscriptionTier = tenant.SubscriptionTier.ToString(),
            Email = tenant.Email,
            Phone = tenant.Phone,
            Telephone = tenant.Telephone,
            Address = tenant.Address,
            SupportEmail = tenant.SupportEmail,
            SubscriptionStatus = tenant.SubscriptionStatus.ToString(),
            SubscriptionPeriodEnd = tenant.SubscriptionPeriodEnd,
            IsActive = tenant.IsActive,
            LogoUrl = tenant.LogoUrl,
            CreatedAt = tenant.CreatedAt
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateCurrentTenant(UpdateTenantDto dto)
    {
        if (!_currentUserService.TenantId.HasValue) return Forbid();

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Tenant name is required." });
        }

        var tenant = await _context.Tenants.FindAsync(_currentUserService.TenantId.Value);
        if (tenant == null) return NotFound();

        tenant.Name = dto.Name.Trim();
        tenant.LegalName = NormalizeNullable(dto.LegalName);
        tenant.TaxId = NormalizeNullable(dto.TaxId);
        tenant.Website = NormalizeNullable(dto.Website);
        tenant.SubscriptionTier = string.IsNullOrWhiteSpace(dto.SubscriptionTier)
            ? tenant.SubscriptionTier
            : Enum.TryParse<SubscriptionTier>(dto.SubscriptionTier.Trim(), true, out var tier) ? tier : tenant.SubscriptionTier;
        tenant.Email = NormalizeNullable(dto.Email);
        tenant.SupportEmail = NormalizeNullable(dto.SupportEmail);
        tenant.Phone = NormalizeNullable(dto.Phone);
        tenant.Telephone = NormalizeNullable(dto.Telephone);
        tenant.Address = NormalizeNullable(dto.Address);
        tenant.LogoUrl = NormalizeNullable(dto.LogoUrl);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("dev-connection-status")]
    [Authorize(Roles = "SuperAdmin,TenantAdmin,HqManager,HqStaff,BranchManager,BranchOwner")]
    public async Task<ActionResult<DevConnectionStatusDto>> GetDevelopmentConnectionStatus()
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        var checkedAt = DateTime.UtcNow;
        var currentTenantId = _currentUserService.TenantId;
        var dbConnection = _context.Database.GetDbConnection();

        bool canConnect;
        try
        {
            canConnect = await _context.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            return Ok(new DevConnectionStatusDto
            {
                CheckedAtUtc = checkedAt,
                Environment = _environment.EnvironmentName,
                SeedingEnabled = _environment.IsDevelopment(),
                IsApiReachable = true,
                IsDatabaseReachable = false,
                IsTenantReadSuccessful = false,
                CurrentUserTenantId = currentTenantId,
                CurrentUserRole = _currentUserService.Role,
                DataSource = NormalizeNullable(dbConnection.DataSource),
                DatabaseName = NormalizeNullable(dbConnection.Database),
                Error = ex.Message
            });
        }

        string? tenantReadError = null;
        Tenant? tenant = null;
        if (!currentTenantId.HasValue)
        {
            tenantReadError = "Authenticated user has no tenant context.";
        }
        else
        {
            try
            {
                tenant = await _context.Tenants
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.TenantId == currentTenantId.Value);

                if (tenant == null)
                {
                    tenantReadError = "Tenant was not found in the current database.";
                }
            }
            catch (Exception ex)
            {
                tenantReadError = ex.Message;
            }
        }

        return Ok(new DevConnectionStatusDto
        {
            CheckedAtUtc = checkedAt,
            Environment = _environment.EnvironmentName,
            SeedingEnabled = _environment.IsDevelopment(),
            IsApiReachable = true,
            IsDatabaseReachable = canConnect,
            IsTenantReadSuccessful = tenant != null,
            CurrentUserTenantId = currentTenantId,
            CurrentUserRole = _currentUserService.Role,
            TenantId = tenant?.TenantId,
            TenantName = tenant?.Name,
            DataSource = NormalizeNullable(dbConnection.DataSource),
            DatabaseName = NormalizeNullable(dbConnection.Database),
            Error = tenantReadError
        });
    }

    private static string? NormalizeNullable(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}
