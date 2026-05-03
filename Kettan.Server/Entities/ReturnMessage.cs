using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kettan.Server.Entities;

public class ReturnMessage : ITenantEntity
{
    [Key]
    public int MessageId { get; set; }

    public int TenantId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public Tenant? Tenant { get; set; }

    public int ReturnId { get; set; }

    [ForeignKey(nameof(ReturnId))]
    public Return? Return { get; set; }

    public int SenderUserId { get; set; }

    [ForeignKey(nameof(SenderUserId))]
    public User? SenderUser { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
