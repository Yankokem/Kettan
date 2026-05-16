using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Tenants;

public class TenantDto
{
    public int TenantId { get; set; }
    public required string Name { get; set; }
    public string? LegalName { get; set; }
    public string? TaxId { get; set; }
    public string? Website { get; set; }
    public string SubscriptionTier { get; set; } = "Starter";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Telephone { get; set; }
    public string? Address { get; set; }
    public string? SupportEmail { get; set; }
    public string SubscriptionStatus { get; set; } = "Active";
    public DateTime? SubscriptionPeriodEnd { get; set; }
    public bool IsActive { get; set; }
    public string? LogoUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateTenantDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public required string Name { get; set; }

    public string? LegalName { get; set; }

    [StringLength(32)]
    public string? TaxId { get; set; }

    [Url]
    [StringLength(255)]
    public string? Website { get; set; }

    public string SubscriptionTier { get; set; } = "Starter";

    [EmailAddress]
    [StringLength(254)]
    public string? Email { get; set; }

    [EmailAddress]
    [StringLength(254)]
    public string? SupportEmail { get; set; }

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid phone number format.")]
    public string? Phone { get; set; }

    [RegularExpression(@"^[+]?[-()\d\s]{7,20}$", ErrorMessage = "Invalid phone number format.")]
    public string? Telephone { get; set; }

    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
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
