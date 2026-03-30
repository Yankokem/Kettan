using System.Security.Claims;

namespace Kettan.Server.Services.Common
{
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
                var idClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
                if (idClaim != null && int.TryParse(idClaim.Value, out int userId))
                {
                    return userId;
                }
                return null;
            }
        }

        public int? BranchId
        {
            get
            {
                // Custom claim type for BranchId
                var branchClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("BranchId");
                if (branchClaim != null && int.TryParse(branchClaim.Value, out int branchId))
                {
                    return branchId;
                }
                return null;
            }
        }

        public string? Role
        {
            get
            {
                return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;
            }
        }
    }
}
