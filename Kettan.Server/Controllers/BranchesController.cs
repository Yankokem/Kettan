using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.Entities;
using Kettan.Server.DTOs.Branches;
using Kettan.Server.Services.Common;
using Kettan.Server.Enums;
using Kettan.Server.Services.Subscription;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BranchesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISubscriptionLimitService _subscriptionLimitService;

    public BranchesController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ISubscriptionLimitService subscriptionLimitService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _subscriptionLimitService = subscriptionLimitService;
    }

    [HttpGet]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff,BranchOwner,BranchManager")]
    public async Task<ActionResult<IEnumerable<BranchDto>>> GetBranches()
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;

        var branches = await _context.Branches
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BranchDto
            {
                BranchId = b.BranchId,
                TenantId = b.TenantId,
                Name = b.Name,
                Location = b.Location,
                CustomThresholds = b.CustomThresholds,
                IsActive = b.IsActive,
                ImageUrl = b.ImageUrl,
                CreatedAt = b.CreatedAt,
                Address = b.Address,
                City = b.City,
                ContactNumber = b.ContactNumber,
                OpenTime = b.OpenTime.HasValue ? b.OpenTime.Value.ToString("HH:mm") : null,
                CloseTime = b.CloseTime.HasValue ? b.CloseTime.Value.ToString("HH:mm") : null,
                OwnerUserId = b.OwnerUserId,
                ManagerName = b.ManagerUser != null 
                    ? b.ManagerUser.FirstName + " " + b.ManagerUser.LastName 
                    : (b.OwnerUser != null 
                        ? b.OwnerUser.FirstName + " " + b.OwnerUser.LastName + " (Owner)" 
                        : (_context.Users
                            .Where(u => u.TenantId == tenantId && u.BranchId == b.BranchId && u.Role == UserRole.BranchOwner)
                            .Select(u => u.FirstName + " " + u.LastName + " (Owner)")
                            .FirstOrDefault() ?? "Unassigned")),
                StaffCount = _context.Users.Count(u => u.TenantId == tenantId && u.BranchId == b.BranchId && !u.IsDeleted && u.Role != UserRole.BranchOwner),
                TotalItems = _context.Batches.Where(batch => batch.BranchId == b.BranchId).Select(batch => batch.ItemId).Distinct().Count(),
                LowStockItems = _context.Batches
                    .Where(batch => batch.BranchId == b.BranchId)
                    .GroupBy(batch => batch.ItemId)
                    .Select(g => new { ItemId = g.Key, TotalQty = g.Sum(x => x.CurrentQuantity) })
                    .Count(x => x.TotalQty < _context.Items.Where(i => i.ItemId == x.ItemId).Select(i => i.DefaultThreshold).FirstOrDefault())
            })
            .ToListAsync();

        return Ok(branches);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff,BranchOwner,BranchManager")]
    public async Task<ActionResult<BranchDto>> GetBranch(int id)
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;
        var branch = await _context.Branches.FirstOrDefaultAsync(b => b.BranchId == id && b.TenantId == tenantId);
        if (branch == null) return NotFound();

        return Ok(new BranchDto
        {
            BranchId = branch.BranchId,
            TenantId = branch.TenantId,
            Name = branch.Name,
            Location = branch.Location,
            Address = branch.Address,
            City = branch.City,
            ContactNumber = branch.ContactNumber,
            OpenTime = branch.OpenTime.HasValue ? branch.OpenTime.Value.ToString("HH:mm") : null,
            CloseTime = branch.CloseTime.HasValue ? branch.CloseTime.Value.ToString("HH:mm") : null,
            OwnerUserId = branch.OwnerUserId,
            CustomThresholds = branch.CustomThresholds,
            IsActive = branch.IsActive,
            ImageUrl = branch.ImageUrl,
            CreatedAt = branch.CreatedAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "TenantAdmin,HqManager")]
    public async Task<ActionResult<BranchDto>> CreateBranch(CreateBranchDto dto, CancellationToken cancellationToken)
    {
        if (!_currentUserService.TenantId.HasValue) 
            return Forbid();

        var tenantId = _currentUserService.TenantId.Value;

        try
        {
            await _subscriptionLimitService.EnsureCanCreateBranchAsync(tenantId, cancellationToken);

            var branch = new Branch
            {
                TenantId = tenantId,
                Name = dto.Name,
                Location = dto.Location,
                Address = dto.Address,
                City = dto.City,
                ContactNumber = dto.ContactNumber,
                OpenTime = dto.OpenTime != null ? TimeOnly.Parse(dto.OpenTime) : null,
                CloseTime = dto.CloseTime != null ? TimeOnly.Parse(dto.CloseTime) : null,
                OwnerUserId = dto.OwnerUserId,
                ManagerUserId = dto.ManagerUserId,
                CustomThresholds = dto.CustomThresholds,
                ImageUrl = dto.ImageUrl,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Branches.Add(branch);
            await _context.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetBranch), new { id = branch.BranchId }, new BranchDto
            {
                BranchId = branch.BranchId,
                TenantId = branch.TenantId,
                Name = branch.Name,
                Location = branch.Location,
                CustomThresholds = branch.CustomThresholds,
                IsActive = branch.IsActive,
                ImageUrl = branch.ImageUrl,
                CreatedAt = branch.CreatedAt
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "TenantAdmin,HqManager")]
    public async Task<IActionResult> UpdateBranch(int id, UpdateBranchDto dto, CancellationToken cancellationToken)
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;
        var branch = await _context.Branches.FirstOrDefaultAsync(b => b.BranchId == id && b.TenantId == tenantId, cancellationToken);
        if (branch == null) return NotFound();

        if (dto.IsActive && !branch.IsActive)
        {
            try
            {
                await _subscriptionLimitService.EnsureCanCreateBranchAsync(branch.TenantId, cancellationToken);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        branch.Name = dto.Name;
        branch.Location = dto.Location;
        branch.Address = dto.Address;
        branch.City = dto.City;
        branch.ContactNumber = dto.ContactNumber;
        branch.OpenTime = dto.OpenTime != null ? TimeOnly.Parse(dto.OpenTime) : null;
        branch.CloseTime = dto.CloseTime != null ? TimeOnly.Parse(dto.CloseTime) : null;
        branch.OwnerUserId = dto.OwnerUserId;
        branch.ManagerUserId = dto.ManagerUserId;
        branch.CustomThresholds = dto.CustomThresholds;
        branch.ImageUrl = dto.ImageUrl;
        branch.IsActive = dto.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "TenantAdmin,HqManager")]
    public async Task<IActionResult> DeleteBranch(int id)
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;
        var branch = await _context.Branches.FirstOrDefaultAsync(b => b.BranchId == id && b.TenantId == tenantId);
        if (branch == null) return NotFound();

        branch.IsActive = false; // Soft delete
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
