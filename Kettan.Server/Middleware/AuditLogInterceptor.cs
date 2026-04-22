using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Middleware;

/// <summary>
/// EF Core SaveChanges interceptor that automatically writes AuditLog entries
/// for every significant entity change across the platform.
/// </summary>
public class AuditLogInterceptor : SaveChangesInterceptor
{
    private readonly IServiceProvider _serviceProvider;

    // Entity types worth auditing. Skip noisy/internal tables.
    private static readonly HashSet<string> AuditableTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        nameof(Tenant),
        nameof(User),
        nameof(Branch),
        nameof(Order),
        nameof(SupplyRequest),
        nameof(Return),
        nameof(Item),
        nameof(Batch),
        nameof(InventoryTransaction),
        nameof(Shipment),
        nameof(TenantSubscription),
        nameof(SubscriptionPayment),
        nameof(Employee),
        nameof(Courier),
        nameof(Vehicle)
    };

    // Properties that are too noisy or sensitive to log value changes for
    private static readonly HashSet<string> ExcludedProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        "PasswordHash", "PasswordSalt", "OtpCode", "OtpExpiresAt",
        "CreatedAt", "DeletedAt", "IsDeleted"
    };

    public AuditLogInterceptor(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null) return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var context = eventData.Context;
        var auditEntries = new List<AuditLog>();

        // Resolve current user from request scope
        int? userId = null;
        int? tenantId = null;
        string? ipAddress = null;
        string? userAgent = null;

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var currentUser = scope.ServiceProvider.GetService<ICurrentUserService>();
            var httpContextAccessor = scope.ServiceProvider.GetService<IHttpContextAccessor>();

            if (currentUser is not null)
            {
                userId = currentUser.UserId;
                tenantId = currentUser.TenantId;
            }

            if (httpContextAccessor?.HttpContext is not null)
            {
                var httpContext = httpContextAccessor.HttpContext;
                ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
                userAgent = httpContext.Request.Headers.UserAgent.ToString();
                if (userAgent?.Length > 512) userAgent = userAgent[..512];
            }
        }
        catch
        {
            // Swallow — seeding or background tasks might not have a request scope
        }

        foreach (var entry in context.ChangeTracker.Entries())
        {
            var typeName = entry.Entity.GetType().Name;
            if (!AuditableTypes.Contains(typeName)) continue;
            if (entry.State is EntityState.Detached or EntityState.Unchanged) continue;

            string action;
            if (entry.State == EntityState.Added) action = "Created";
            else if (entry.State == EntityState.Modified) action = "Updated";
            else if (entry.State == EntityState.Deleted) action = "Deleted";
            else continue;

            // For Modified entities, capture which fields changed
            string? oldValues = null;
            string? newValues = null;

            if (entry.State == EntityState.Modified)
            {
                var changes = GetChangedProperties(entry);
                if (changes.Count == 0) continue; // Skip if only excluded properties changed

                oldValues = JsonSerializer.Serialize(changes.ToDictionary(c => c.Key, c => c.Value.Old));
                newValues = JsonSerializer.Serialize(changes.ToDictionary(c => c.Key, c => c.Value.New));
            }
            else if (entry.State == EntityState.Added)
            {
                // For new entities, log key identifying fields
                var keyFields = GetKeyFields(entry);
                if (keyFields.Count > 0)
                    newValues = JsonSerializer.Serialize(keyFields);
            }

            // Resolve entity PK
            var entityId = GetPrimaryKeyValue(entry);

            // Resolve tenant context from the entity itself if possible
            var entityTenantId = tenantId;
            if (entry.Entity is ITenantEntity tenantEntity)
            {
                entityTenantId = tenantEntity.TenantId;
            }
            else if (entry.Entity is Tenant t && entry.State == EntityState.Modified)
            {
                entityTenantId = t.TenantId;
            }

            auditEntries.Add(new AuditLog
            {
                TenantId = entityTenantId,
                UserId = userId,
                Action = action,
                EntityName = typeName,
                EntityId = entityId,
                EventCategory = "Application",
                OldValues = oldValues,
                NewValues = newValues,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                OccurredAt = DateTime.UtcNow
            });
        }

        if (auditEntries.Count > 0)
        {
            context.Set<AuditLog>().AddRange(auditEntries);
        }

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static Dictionary<string, (object? Old, object? New)> GetChangedProperties(EntityEntry entry)
    {
        var result = new Dictionary<string, (object? Old, object? New)>();

        foreach (var prop in entry.Properties)
        {
            if (ExcludedProperties.Contains(prop.Metadata.Name)) continue;
            if (!prop.IsModified) continue;
            if (Equals(prop.OriginalValue, prop.CurrentValue)) continue;

            result[prop.Metadata.Name] = (prop.OriginalValue, prop.CurrentValue);
        }

        return result;
    }

    private static Dictionary<string, object?> GetKeyFields(EntityEntry entry)
    {
        var result = new Dictionary<string, object?>();

        // Grab a few identifying fields for new records
        var interestingProps = new[] { "Name", "Email", "Status", "Action", "SubscriptionTier", "Role" };
        foreach (var propName in interestingProps)
        {
            var prop = entry.Properties.FirstOrDefault(p => p.Metadata.Name == propName);
            if (prop?.CurrentValue != null)
            {
                result[propName] = prop.CurrentValue;
            }
        }

        return result;
    }

    private static string? GetPrimaryKeyValue(EntityEntry entry)
    {
        var keyProperties = entry.Properties
            .Where(p => p.Metadata.IsPrimaryKey())
            .ToList();

        if (keyProperties.Count == 0) return null;
        if (keyProperties.Count == 1) return keyProperties[0].CurrentValue?.ToString();

        return string.Join(",", keyProperties.Select(p => p.CurrentValue?.ToString() ?? ""));
    }
}
