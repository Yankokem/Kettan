using System.ComponentModel.DataAnnotations;

namespace Kettan.Server.Entities;

public class RegistrationOtp
{
    [Key]
    public int OtpId { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public required string Email { get; set; }

    [Required]
    [MaxLength(255)]
    public required string OtpHash { get; set; }

    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CooldownUntilUtc { get; set; }

    public int AttemptCount { get; set; }
    public int ResendCount { get; set; }

    public bool IsUsed { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
