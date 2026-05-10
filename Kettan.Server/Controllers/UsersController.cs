using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Users;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Enums;
using Kettan.Server.Services.Subscription;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISubscriptionLimitService _subscriptionLimitService;

    public UsersController(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ISubscriptionLimitService subscriptionLimitService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _subscriptionLimitService = subscriptionLimitService;
    }

    [HttpGet]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff,BranchManager,BranchOwner")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers([FromQuery] int? branchId = null)
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;
        var usersQuery = _context.Users.AsQueryable();

        if (branchId.HasValue && !await _context.Branches.AnyAsync(b => b.BranchId == branchId.Value && b.TenantId == tenantId))
        {
            return NotFound(new { message = "Branch was not found." });
        }

        usersQuery = usersQuery.Where(u => u.TenantId == tenantId);

        var userRole = _currentUserService.Role;
        if (userRole == "BranchManager" || userRole == "BranchOwner" || userRole == "StoreStaff")
        {
            if (!_currentUserService.BranchId.HasValue) return Forbid();
            usersQuery = usersQuery.Where(u => u.BranchId == _currentUserService.BranchId.Value);
        }
        else if (branchId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.BranchId == branchId.Value);
        }

        var users = await usersQuery
            .Include(u => u.Branch)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto
            {
                UserId = u.UserId,
                TenantId = u.TenantId,
                BranchId = u.BranchId,
                BranchName = u.Branch != null ? u.Branch.Name : null,
                Email = u.Email,
                Role = u.Role.ToString(),
                FirstName = u.FirstName,
                LastName = u.LastName,
                Birthday = u.Birthday,
                ContactNo = u.ContactNo,
                IsActive = u.IsActive,
                Status = u.Status,
                CreatedAt = u.CreatedAt,
                ImageUrl = u.ImageUrl
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "TenantAdmin,HqManager,HqStaff")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;
        var user = await _context.Users.Include(u => u.Branch).FirstOrDefaultAsync(u => u.UserId == id && u.TenantId == tenantId);
        if (user == null) return NotFound();

        return Ok(new UserDto
        {
            UserId = user.UserId,
            TenantId = user.TenantId,
            BranchId = user.BranchId,
            BranchName = user.Branch?.Name,
            Email = user.Email,
            Role = user.Role.ToString(),
            FirstName = user.FirstName,
            LastName = user.LastName,
            Birthday = user.Birthday,
            ContactNo = user.ContactNo,
            IsActive = user.IsActive,
            Status = user.Status,
            CreatedAt = user.CreatedAt,
            ImageUrl = user.ImageUrl
        });
    }

    [HttpPost]
    [Authorize(Roles = "TenantAdmin,HqManager")]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto dto, CancellationToken cancellationToken)
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;

        // First check if email already exists
        var existingUser = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == dto.Email, cancellationToken);

        if (existingUser != null)
        {
            return BadRequest(new { message = "Email is already in use by another account." });
        }

        var isActiveStatus = dto.Status == EmployeeStatus.Active;
        if (isActiveStatus)
        {
            try
            {
                await _subscriptionLimitService.EnsureCanAssignActiveUserAsync(
                    _currentUserService.TenantId.Value,
                    dto.BranchId,
                    excludeUserId: null,
                    cancellationToken);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        if (!await EnsureBranchBelongsToTenantAsync(dto.BranchId, tenantId, cancellationToken))
        {
            return BadRequest(new { message = "Branch is invalid for this tenant." });
        }

        var parsedRole = Enum.TryParse<UserRole>(dto.Role, true, out var role) ? role : UserRole.HqStaff;

        var user = new User
        {
            TenantId = tenantId,
            BranchId = dto.BranchId,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = parsedRole,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Birthday = dto.Birthday,
            ContactNo = dto.ContactNo,
            ImageUrl = dto.ImageUrl,
            IsActive = isActiveStatus,
            Status = dto.Status,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAction(user);
    }

    private CreatedAtActionResult CreatedAction(User user)
    {
        return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, new UserDto
        {
            UserId = user.UserId,
            TenantId = user.TenantId,
            BranchId = user.BranchId,
            BranchName = user.Branch?.Name,
            Email = user.Email,
            Role = user.Role.ToString(),
            FirstName = user.FirstName,
            LastName = user.LastName,
            Birthday = user.Birthday,
            ContactNo = user.ContactNo,
            ImageUrl = user.ImageUrl,
            IsActive = user.IsActive,
            Status = user.Status,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "TenantAdmin,HqManager")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserDto dto, CancellationToken cancellationToken)
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id && u.TenantId == tenantId, cancellationToken);
        if (user == null) return NotFound();

        if (!await EnsureBranchBelongsToTenantAsync(dto.BranchId, tenantId, cancellationToken))
        {
            return BadRequest(new { message = "Branch is invalid for this tenant." });
        }

        var nextIsActive = dto.IsActive && dto.Status == EmployeeStatus.Active;
        if (nextIsActive && user.TenantId.HasValue)
        {
            try
            {
                await _subscriptionLimitService.EnsureCanAssignActiveUserAsync(
                    user.TenantId.Value,
                    dto.BranchId,
                    user.UserId,
                    cancellationToken);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Birthday = dto.Birthday;
        user.ContactNo = dto.ContactNo;
        user.Role = Enum.TryParse<UserRole>(dto.Role, true, out var role) ? role : user.Role;
        user.BranchId = dto.BranchId;
        user.IsActive = nextIsActive;
        user.Status = dto.Status;
        
        // Only update ImageUrl if a new one is provided. Or if explicitly nulling? Usually it's if not null. 
        // For project scope, allow it to be updated to whatever is sent, except in partial updates.
        // If frontend doesn't send it, maybe it shouldn't overwrite. But UpdateUserDto is full update.
        if (dto.ImageUrl != null)
        {
            user.ImageUrl = dto.ImageUrl;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "TenantAdmin,HqManager")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id && u.TenantId == tenantId);
        if (user == null) return NotFound();

        user.IsActive = false; // Soft delete
        user.Status = EmployeeStatus.Archived;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "TenantAdmin,HqManager")]
    public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] EmployeeStatus status, CancellationToken cancellationToken)
    {
        if (!_currentUserService.TenantId.HasValue)
        {
            return Forbid();
        }

        var tenantId = _currentUserService.TenantId.Value;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id && u.TenantId == tenantId, cancellationToken);
        if (user == null) return NotFound();

        var nextIsActive = status == EmployeeStatus.Active;
        if (nextIsActive && user.TenantId.HasValue)
        {
            try
            {
                await _subscriptionLimitService.EnsureCanAssignActiveUserAsync(
                    user.TenantId.Value,
                    user.BranchId,
                    user.UserId,
                    cancellationToken);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        user.Status = status;
        user.IsActive = nextIsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<bool> EnsureBranchBelongsToTenantAsync(int? branchId, int tenantId, CancellationToken cancellationToken)
    {
        if (!branchId.HasValue)
        {
            return true;
        }

        return await _context.Branches.AnyAsync(
            b => b.BranchId == branchId.Value && b.TenantId == tenantId && b.IsActive,
            cancellationToken);
    }
}
