using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.Entities;
using Kettan.Server.DTOs.Branches;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BranchesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public BranchesController(ApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BranchDto>>> GetBranches()
    {
        // Handled automatically by the global query filter based on _currentUserService.TenantId
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
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(branches);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BranchDto>> GetBranch(int id)
    {
        var branch = await _context.Branches.FindAsync(id);
        if (branch == null) return NotFound();

        return Ok(new BranchDto
        {
            BranchId = branch.BranchId,
            TenantId = branch.TenantId,
            Name = branch.Name,
            Location = branch.Location,
            CustomThresholds = branch.CustomThresholds,
            IsActive = branch.IsActive,
            CreatedAt = branch.CreatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<BranchDto>> CreateBranch(CreateBranchDto dto)
    {
        if (!_currentUserService.TenantId.HasValue) 
            return Forbid();

        var branch = new Branch
        {
            TenantId = _currentUserService.TenantId.Value,
            Name = dto.Name,
            Location = dto.Location,
            CustomThresholds = dto.CustomThresholds,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Branches.Add(branch);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBranch), new { id = branch.BranchId }, new BranchDto
        {
            BranchId = branch.BranchId,
            TenantId = branch.TenantId,
            Name = branch.Name,
            Location = branch.Location,
            CustomThresholds = branch.CustomThresholds,
            IsActive = branch.IsActive,
            CreatedAt = branch.CreatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBranch(int id, UpdateBranchDto dto)
    {
        var branch = await _context.Branches.FindAsync(id);
        if (branch == null) return NotFound();

        branch.Name = dto.Name;
        branch.Location = dto.Location;
        branch.CustomThresholds = dto.CustomThresholds;
        branch.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBranch(int id)
    {
        var branch = await _context.Branches.FindAsync(id);
        if (branch == null) return NotFound();

        branch.IsActive = false; // Soft delete
        await _context.SaveChangesAsync();

        return NoContent();
    }
}