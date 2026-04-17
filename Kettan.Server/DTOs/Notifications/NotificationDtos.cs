namespace Kettan.Server.DTOs.Notifications;

public class NotificationDto
{
    public int NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
