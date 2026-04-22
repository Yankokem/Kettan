using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Users;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
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
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var usersQuery = _context.Users.AsQueryable();

        // Filter users by Current Tenant if applicable
        if (_currentUserService.TenantId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.TenantId == _currentUserService.TenantId.Value);
        }

        var users = await usersQuery
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto
            {
                UserId = u.UserId,
                TenantId = u.TenantId,
                BranchId = u.BranchId,
                Email = u.Email,
                Role = u.Role,
                FirstName = u.FirstName,
                LastName = u.LastName,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        // Enforce tenant isolation on User fetching
        if (_currentUserService.TenantId.HasValue && user.TenantId != _currentUserService.TenantId.Value)
            return Forbid();

        return Ok(new UserDto
        {
            UserId = user.UserId,
            TenantId = user.TenantId,
            BranchId = user.BranchId,
            Email = user.Email,
            Role = user.Role,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto dto)
    {
        // Note: Password hashing should normally happen here. 
        // For project scope, utilizing a simple hash implementation or directly saving (not recommended for prod).
        // Using BCrypt.Net-Next (Assuming logic is handled inside AuthService or directly here)

        var user = new User
        {
            TenantId = _currentUserService.TenantId,
            BranchId = dto.BranchId,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password), // Needs BCrypt.Net package, or basic string for now
            Role = dto.Role,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
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
            Email = user.Email,
            Role = user.Role,
            FirstName = user.FirstName,
            LastName = user.LastName,
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
        user.Role = dto.Role;
        user.BranchId = dto.BranchId;
        user.IsActive = dto.IsActive;

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