using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Subscription;

public class RegisterRequest
{
    [Required]
    [MaxLength(100)]
    public required string VerificationToken { get; set; }

    [Required]
    [MaxLength(120)]
    public required string CompanyName { get; set; }

    [Required]
    [MaxLength(180)]
    public required string LegalName { get; set; }

    [Required]
    [MaxLength(255)]
    public required string FullName { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(254)]
    public required string Email { get; set; }

    [EmailAddress]
    [MaxLength(254)]
    public string? BillingEmail { get; set; }

    [EmailAddress]
    [MaxLength(254)]
    public string? SupportEmail { get; set; }

    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public required string Password { get; set; }

    [Required]
    [MaxLength(50)]
    public required string PlanCode { get; set; }

    [Required]
    [MaxLength(50)]
    [RegularExpression(@"^\+?[0-9\s\-\(\)]+$", ErrorMessage = "Invalid phone number format.")]
    public required string PhoneContact { get; set; }

    [MaxLength(20)]
    [RegularExpression(@"^\+?[0-9\s\-\(\)]+$", ErrorMessage = "Invalid telephone number format.")]
    public string? Telephone { get; set; }

    [Required]
    [MaxLength(32)]
    public required string TaxId { get; set; }

    [MaxLength(255)]
    public string? Website { get; set; }

    [Required]
    [MaxLength(500)]
    public required string HeadquartersAddress { get; set; }
}
