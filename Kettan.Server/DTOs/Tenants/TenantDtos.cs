namespace Kettan.Server.DTOs.Tenants;

public class TenantDto
{
    public int TenantId { get; set; }
    public required string Name { get; set; }
    public string SubscriptionTier { get; set; } = "Starter";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateTenantDto
{
    public required string Name { get; set; }
    public string SubscriptionTier { get; set; } = "Starter";
}