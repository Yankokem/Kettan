using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Users;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Enums;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UsersController(ApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers([FromQuery] int? branchId = null)
    {
        var usersQuery = _context.Users.AsQueryable();

        // Filter users by Current Tenant if applicable
        if (_currentUserService.TenantId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.TenantId == _currentUserService.TenantId.Value);
        }

        if (branchId.HasValue)
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
                CreatedAt = u.CreatedAt,
                ImageUrl = u.ImageUrl
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        var user = await _context.Users.Include(u => u.Branch).FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) return NotFound();

        // Enforce tenant isolation on User fetching
        if (_currentUserService.TenantId.HasValue && user.TenantId != _currentUserService.TenantId.Value)
            return Forbid();

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
            CreatedAt = user.CreatedAt,
            ImageUrl = user.ImageUrl
        });
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto dto)
    {
        // First check if email already exists
        var existingUser = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Email is already in use by another account." });
        }

        // Note: Password hashing should normally happen here. 
        // For project scope, utilizing a simple hash implementation or directly saving (not recommended for prod).
        // Using BCrypt.Net-Next (Assuming logic is handled inside AuthService or directly here)

        var user = new User
        {
            TenantId = _currentUserService.TenantId,
            BranchId = dto.BranchId,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password), // Needs BCrypt.Net package, or basic string for now
            Role = Enum.TryParse<UserRole>(dto.Role, true, out var role) ? role : UserRole.HqStaff,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Birthday = dto.Birthday,
            ContactNo = dto.ContactNo,
            ImageUrl = dto.ImageUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

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
            CreatedAt = user.CreatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (_currentUserService.TenantId.HasValue && user.TenantId != _currentUserService.TenantId.Value)
            return Forbid();

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Birthday = dto.Birthday;
        user.ContactNo = dto.ContactNo;
        user.Role = Enum.TryParse<UserRole>(dto.Role, true, out var role) ? role : user.Role;
        user.BranchId = dto.BranchId;
        user.IsActive = dto.IsActive;
        
        // Only update ImageUrl if a new one is provided. Or if explicitly nulling? Usually it's if not null. 
        // For project scope, allow it to be updated to whatever is sent, except in partial updates.
        // If frontend doesn't send it, maybe it shouldn't overwrite. But UpdateUserDto is full update.
        if (dto.ImageUrl != null)
        {
            user.ImageUrl = dto.ImageUrl;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (_currentUserService.TenantId.HasValue && user.TenantId != _currentUserService.TenantId.Value)
            return Forbid();

        user.IsActive = false; // Soft delete
        await _context.SaveChangesAsync();

        return NoContent();
    }
}