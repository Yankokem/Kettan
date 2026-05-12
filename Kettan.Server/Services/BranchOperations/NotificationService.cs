using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Notifications;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;
using Kettan.Server.Enums;

namespace Kettan.Server.Services.BranchOperations;

/**
 * NotificationService — Decommissioned.
 * All notification creation and retrieval has been disabled as per user request.
 * Interface is maintained as a No-Op to prevent breaking existing workflow dependencies.
 */
public class NotificationService : INotificationService
{
    public NotificationService(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        // Dependencies maintained for constructor injection compatibility
    }

    public Task CreateForUsersAsync(
        IEnumerable<int> userIds,
        string title,
        string message,
        string type,
        string? referenceType = null,
        int? referenceId = null)
    {
        // NO-OP: Notifications are disabled
        return Task.CompletedTask;
    }

    public Task CreateForRolesAsync(
        IEnumerable<string> roles,
        string title,
        string message,
        string type,
        int? branchId = null,
        string? referenceType = null,
        int? referenceId = null)
    {
        // NO-OP: Notifications are disabled
        return Task.CompletedTask;
    }

    public Task<List<NotificationDto>> GetCurrentUserNotificationsAsync(bool unreadOnly = false, int take = 30)
    {
        // Return empty list as notifications are disabled
        return Task.FromResult(new List<NotificationDto>());
    }

    public Task<bool> MarkAsReadAsync(int notificationId)
    {
        return Task.FromResult(false);
    }
}
