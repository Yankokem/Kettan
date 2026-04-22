namespace Kettan.Server.Services.Common;

public interface ICurrentUserService
{
    int? UserId { get; }
    int? TenantId { get; }
    int? BranchId { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}