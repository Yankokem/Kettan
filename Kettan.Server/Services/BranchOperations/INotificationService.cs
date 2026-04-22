using Kettan.Server.DTOs.Notifications;

namespace Kettan.Server.Services.BranchOperations;

public interface INotificationService
{
    Task CreateForUsersAsync(IEnumerable<int> userIds, string title, string message, string type, string? referenceType = null, int? referenceId = null);
    Task CreateForRolesAsync(IEnumerable<string> roles, string title, string message, string type, int? branchId = null, string? referenceType = null, int? referenceId = null);
    Task<List<NotificationDto>> GetCurrentUserNotificationsAsync(bool unreadOnly = false, int take = 30);
    Task<bool> MarkAsReadAsync(int notificationId);
}
