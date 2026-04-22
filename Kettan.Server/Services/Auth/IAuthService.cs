using Kettan.Server.DTOs.Auth;
using Kettan.Server.Entities;

namespace Kettan.Server.Services.Auth;

public interface IAuthService
{
    Task<string?> LoginAsync(LoginRequest request);
}