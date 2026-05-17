using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Middleware;

/// <summary>
/// EF Core SaveChanges interceptor that automatically writes AuditLog entries
/// for Created, Updated, and Deleted entity changes.
/// </summary>
public class AuditLogInterceptor : SaveChangesInterceptor
{
    private readonly IServiceProvider _serviceProvider;

    // Entity types to exclude from automatic DB record auditing.
    private static readonly HashSet<string> ExcludedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        nameof(AuditLog),
        "IdentityUserToken<int>",
        "IdentityUserLogin<int>",
        "IdentityUserClaim<int>",
        "IdentityRoleClaim<int>",
        "IdentityUserRole<int>",
        "IdentityRole<int>"
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

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var currentUser = scope.ServiceProvider.GetService<ICurrentUserService>();

            if (currentUser is not null)
            {
                userId = currentUser.UserId;
                tenantId = currentUser.TenantId;
            }
        }
        catch
        {
            // Swallow — seeding or background tasks might not have a request scope
        }

        userId = await NormalizePersistedUserIdAsync(context, userId, cancellationToken);

        foreach (var entry in context.ChangeTracker.Entries())
        {
            var typeName = entry.Entity.GetType().Name;
            if (ExcludedTypes.Contains(typeName)) continue;
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
            var entityTenantId = (int?)null; // Default to null for safety (especially during registration)

            if (entry.Entity is ITenantEntity tenantEntity)
            {
                entityTenantId = tenantEntity.TenantId;
            }
            else if (entry.Entity is Tenant t)
            {
                // For Tenant entity itself, the TenantId is its own ID
                entityTenantId = t.TenantId > 0 ? t.TenantId : null;
            }
            else if (entry.Entity is User u)
            {
                // For User, use its TenantId property
                entityTenantId = u.TenantId;
            }

            // Ignore temporary/unresolved keys (e.g. EF temporary negative IDs during Added state)
            // so AuditLog FK does not reference non-existent tenants.
            entityTenantId = NormalizePersistedId(entityTenantId);

            // Fallback to session tenantId ONLY if we haven't found one and it's NOT a new Tenant/User
            // This prevents stale cookies from causing FK conflicts during registration
            if (!entityTenantId.HasValue && entry.State != EntityState.Added)
            {
                entityTenantId = NormalizePersistedId(tenantId);
            }

            auditEntries.Add(new AuditLog
            {
                TenantId = entityTenantId,
                UserId = entry.State == EntityState.Added && typeName == "User" ? null : userId,
                Action = action,
                EntityName = typeName,
                EntityId = entityId,
                OldValues = oldValues,
                NewValues = newValues,
                OccurredAt = DateTime.UtcNow
            });

        }

        if (auditEntries.Count > 0)
        {
            context.Set<AuditLog>().AddRange(auditEntries);
        }

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static int? NormalizePersistedId(int? id)
    {
        return id.HasValue && id.Value > 0 ? id.Value : null;
    }

    private static async Task<int?> NormalizePersistedUserIdAsync(
        DbContext context,
        int? currentUserId,
        CancellationToken cancellationToken)
    {
        if (!currentUserId.HasValue || currentUserId.Value <= 0)
        {
            return null;
        }

        var exists = await context.Set<User>()
            .IgnoreQueryFilters()
            .AnyAsync(u => u.UserId == currentUserId.Value, cancellationToken);

        return exists ? currentUserId : null;
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
