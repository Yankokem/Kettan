namespace Kettan.Server.DTOs.Tenants;

public class TenantDto
{
    public int TenantId { get; set; }
    public required string Name { get; set; }
    public string SubscriptionTier { get; set; } = "Starter";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string SubscriptionStatus { get; set; } = "Active";
    public DateTime? SubscriptionPeriodEnd { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateTenantDto
{
    public required string Name { get; set; }
    public string SubscriptionTier { get; set; } = "Starter";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}

public class DevConnectionStatusDto
{
    public DateTime CheckedAtUtc { get; set; }
    public string Environment { get; set; } = string.Empty;
    public bool SeedingEnabled { get; set; }
    public bool IsApiReachable { get; set; }
    public bool IsDatabaseReachable { get; set; }
    public bool IsTenantReadSuccessful { get; set; }
    public int? CurrentUserTenantId { get; set; }
    public string? CurrentUserRole { get; set; }
    public int? TenantId { get; set; }
    public string? TenantName { get; set; }
    public string? DataSource { get; set; }
    public string? DatabaseName { get; set; }
    public string? Error { get; set; }
}