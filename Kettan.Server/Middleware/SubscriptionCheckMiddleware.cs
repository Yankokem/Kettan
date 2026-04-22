using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Kettan.Server.Data;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Middleware;

public class SubscriptionCheckMiddleware
{
    private readonly RequestDelegate _next;

    public SubscriptionCheckMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext, ICurrentUserService currentUserService)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint != null)
        {
            var isAllowAnonymous = endpoint.Metadata.OfType<Microsoft.AspNetCore.Authorization.IAllowAnonymous>().Any();
            if (isAllowAnonymous)
            {
                await _next(context);
                return;
            }
        }

        // Always allow auth and tenant endpoints to pass through so users can log in, check their session, log out, and manage their subscription
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/tenants", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        if (!currentUserService.IsAuthenticated)
        {
            await _next(context);
            return;
        }

        if (currentUserService.Role == "SuperAdmin")
        {
            await _next(context);
            return;
        }

        var tenantId = currentUserService.TenantId;
        if (!tenantId.HasValue)
        {
            await _next(context);
            return;
        }

        var tenant = await dbContext.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.TenantId == tenantId.Value && !t.IsDeleted);

        if (tenant == null)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { message = "Tenant not found." });
            return;
        }

        if (tenant.SubscriptionStatus != "Active")
        {
            context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
            await context.Response.WriteAsJsonAsync(new { message = "Your subscription is not active. Please renew your plan." });
            return;
        }

        await _next(context);
    }
}
