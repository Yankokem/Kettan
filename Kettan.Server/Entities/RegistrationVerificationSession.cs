using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.Entities;

public class RegistrationVerificationSession
{
    [Key]
    public int SessionId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string VerificationToken { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(50)]
    public required string Email { get; set; }

    public DateTime ExpiresAtUtc { get; set; }

    public bool IsUsed { get; set; }
    public DateTime? UsedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
