using System.Security.Claims;

namespace Kettan.Server.Services.Common;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? UserId
    {
        get
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }
    }

    public int? TenantId
    {
        get
        {
            var tenantClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId")?.Value;
            if (string.IsNullOrEmpty(tenantClaim)) return null;
            return int.TryParse(tenantClaim, out var tenantId) ? tenantId : null;
        }
    }

    public int? BranchId
    {
        get
        {
            var branchClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("BranchId")?.Value;
            if (string.IsNullOrEmpty(branchClaim)) return null;
            return int.TryParse(branchClaim, out var branchId) ? branchId : null;
        }
    }

    public string? Role => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}