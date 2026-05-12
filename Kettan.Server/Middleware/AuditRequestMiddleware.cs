using System.Diagnostics;
using System.Text.Json;
using Kettan.Server.Entities;
using Kettan.Server.Data;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Middleware;

public class AuditRequestMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditRequestMiddleware> _logger;

    public AuditRequestMiddleware(RequestDelegate next, ILogger<AuditRequestMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
    {
        var stopwatch = Stopwatch.StartNew();
        var correlationId = Guid.NewGuid().ToString();
        context.TraceIdentifier = correlationId;

        // Ensure we bypass completely for non-API routes if needed
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        Exception? exception = null;
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            exception = ex;
            throw;
        }
        finally
        {
            stopwatch.Stop();
            await TryLogRequestAsync(context, serviceProvider, stopwatch.ElapsedMilliseconds, exception, correlationId);
        }
    }

    private async Task TryLogRequestAsync(HttpContext context, IServiceProvider serviceProvider, long latencyMs, Exception? exception, string correlationId)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var currentUser = scope.ServiceProvider.GetService<ICurrentUserService>();

            var statusCode = exception != null ? 500 : context.Response.StatusCode;

            var route = context.Request.Path.Value ?? "";
            var method = context.Request.Method;
            
            // Optimization: Skip logging successful GET requests to reduce noise and DB load
            if (method == "GET" && statusCode >= 200 && statusCode < 300)
            {
                return;
            }

            var log = new AuditLog
            {
                Action = "HttpRequest",
                ActionCode = $"HTTP_{method}",
                EntityName = "Request",
                EventCategory = "Request",
                Outcome = exception != null || statusCode >= 400 ? "Failure" : "Success",
                Severity = exception != null ? "High" : (statusCode >= 400 ? "Medium" : "Info"),
                Source = "Middleware",
                HttpMethod = method,
                Route = route,
                StatusCode = statusCode,
                CorrelationId = correlationId,
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = context.Request.Headers.UserAgent.ToString().Substring(0, Math.Min(context.Request.Headers.UserAgent.ToString().Length, 512)),
                UserId = currentUser?.UserId,
                TenantId = currentUser?.TenantId,
                BranchId = currentUser?.BranchId,
                MetadataJson = JsonSerializer.Serialize(new { LatencyMs = latencyMs, Query = context.Request.QueryString.Value })
            };

            if (exception != null)
            {
                log.ErrorCode = "Exception";
                log.ErrorMessage = exception.Message;
            }

            dbContext.Set<AuditLog>().Add(log);
            await dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write request audit log");
        }
    }
}