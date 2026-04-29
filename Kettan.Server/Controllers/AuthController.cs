using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Auth;
using Kettan.Server.Services.Common;
using Kettan.Server.Services.Auth;

namespace Kettan.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AuthController(
        IAuthService authService,
        ApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _authService = authService;
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpPost("login")]
    [EnableRateLimiting("LoginRateLimit")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);

            if (response == null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            // Return JWT in HttpOnly Cookie for security against XSS
            Response.Cookies.Append("jwt", response.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Set to true to enforce HTTPS
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(1440)
            });

            // Return full login response with user information
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("jwt");
        return Ok(new { message = "Logged out successfully" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            return Unauthorized(new { message = "Not authenticated." });
        }

        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(
                u => u.UserId == _currentUserService.UserId.Value && u.IsActive,
                cancellationToken);

        if (user == null)
        {
            return Unauthorized(new { message = "User session is invalid." });
        }

        var fullName = string.Join(
            " ",
            new[] { user.FirstName, user.LastName }.Where(s => !string.IsNullOrWhiteSpace(s)));

        var tenant = user.Tenant;
        var isProfileComplete = tenant != null
            && !string.IsNullOrWhiteSpace(tenant.Name)
            && !string.IsNullOrWhiteSpace(tenant.Email)
            && !string.IsNullOrWhiteSpace(tenant.Phone)
            && !string.IsNullOrWhiteSpace(tenant.Address);

        return Ok(new
        {
            user = new
            {
                id = user.UserId,
                email = user.Email,
                name = fullName,
                role = user.Role.ToString(),
                tenantId = user.TenantId,
                branchId = user.BranchId,
                imageUrl = user.ImageUrl,
            },
            tenant = tenant == null
                ? null
                : new
                {
                    id = tenant.TenantId,
                    name = tenant.Name,
                    subscriptionTier = tenant.SubscriptionTier.ToString(),
                    subscriptionStatus = tenant.SubscriptionStatus.ToString(),
                    isActive = tenant.IsActive,
                    profileComplete = isProfileComplete,
                    logoUrl = tenant.LogoUrl,
                },
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            return Unauthorized(new { message = "Not authenticated." });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == _currentUserService.UserId.Value && u.IsActive);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        // Split name into first and last name if provided
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var parts = request.Name.Split(' ', 2);
            user.FirstName = parts[0];
            user.LastName = parts.Length > 1 ? parts[1] : string.Empty;
        }

        user.ImageUrl = request.ImageUrl;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile updated successfully" });
    }
}
