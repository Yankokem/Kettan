using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.DTOs.Subscription;

public class RegisterRequest
{
    [Required]
    [MaxLength(100)]
    public required string VerificationToken { get; set; }

    [Required]
    [MaxLength(255)]
    public required string CompanyName { get; set; }

    [Required]
    [MaxLength(255)]
    public required string FullName { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public required string Email { get; set; }

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

    [Required]
    [MaxLength(500)]
    public required string HeadquartersAddress { get; set; }
}
