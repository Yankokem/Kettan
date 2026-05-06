using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Kettan.Server.Data;
using Kettan.Server.Services.Common;
using Kettan.Server.Enums;

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

        // Always allow auth and subscription endpoints to pass through so users can log in and manage billing state.
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/subscription", StringComparison.OrdinalIgnoreCase))
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
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { message = "Tenant session is invalid. Please log in again." });
            return;
        }

        var isWritableSubscription =
            tenant.SubscriptionStatus == SubscriptionStatus.Active
            || tenant.SubscriptionStatus == SubscriptionStatus.PendingPayment
            || tenant.SubscriptionStatus == SubscriptionStatus.Trialing;

        if (!isWritableSubscription)
        {
            var method = context.Request.Method;
            var isSafeMethod = HttpMethods.IsGet(method)
                               || HttpMethods.IsHead(method)
                               || HttpMethods.IsOptions(method);

            if (!isSafeMethod)
            {
                context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Your subscription is in read-only mode. Transactions are disabled until your subscription is reactivated."
                });
                return;
            }
        }

        await _next(context);
    }
}
