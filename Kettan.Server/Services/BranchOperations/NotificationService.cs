using Microsoft.EntityFrameworkCore;
using Kettan.Server.Data;
using Kettan.Server.DTOs.Notifications;
using Kettan.Server.Entities;
using Kettan.Server.Services.Common;

namespace Kettan.Server.Services.BranchOperations;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public NotificationService(ApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task CreateForUsersAsync(
        IEnumerable<int> userIds,
        string title,
        string message,
        string type,
        string? referenceType = null,
        int? referenceId = null)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            throw new InvalidOperationException("Tenant context is required.");
        }

        var distinctUserIds = userIds.Distinct().ToList();
        if (distinctUserIds.Count == 0)
        {
            return;
        }

        var existingUsers = await _context.Users
            .Where(u => u.TenantId == _currentUser.TenantId.Value && distinctUserIds.Contains(u.UserId) && u.IsActive)
            .Select(u => u.UserId)
            .ToListAsync();

        if (existingUsers.Count == 0)
        {
            return;
        }

        var notifications = existingUsers.Select(userId => new Notification
        {
            TenantId = _currentUser.TenantId.Value,
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();
    }

    public async Task CreateForRolesAsync(
        IEnumerable<string> roles,
        string title,
        string message,
        string type,
        int? branchId = null,
        string? referenceType = null,
        int? referenceId = null)
    {
        if (!_currentUser.TenantId.HasValue)
        {
            throw new InvalidOperationException("Tenant context is required.");
        }

        var normalizedRoles = roles
            .Select(r => r.Trim())
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalizedRoles.Count == 0)
        {
            return;
        }

        var recipientsQuery = _context.Users
            .Where(u => u.TenantId == _currentUser.TenantId.Value && u.IsActive)
            .Where(u => normalizedRoles.Contains(u.Role));

        if (branchId.HasValue)
        {
            recipientsQuery = recipientsQuery.Where(u => u.BranchId == branchId.Value || u.BranchId == null);
        }

        var recipientIds = await recipientsQuery
            .Select(u => u.UserId)
            .ToListAsync();

        await CreateForUsersAsync(recipientIds, title, message, type, referenceType, referenceId);
    }

    public async Task<List<NotificationDto>> GetCurrentUserNotificationsAsync(bool unreadOnly = false, int take = 30)
    {
        if (!_currentUser.UserId.HasValue)
        {
            return [];
        }

        var query = _context.Notifications
            .Where(n => n.UserId == _currentUser.UserId.Value)
            .OrderByDescending(n => n.CreatedAt)
            .AsQueryable();

        if (unreadOnly)
        {
            query = query.Where(n => !n.IsRead);
        }

        return await query
            .Take(Math.Clamp(take, 1, 100))
            .Select(n => new NotificationDto
            {
                NotificationId = n.NotificationId,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                ReferenceType = n.ReferenceType,
                ReferenceId = n.ReferenceId,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<bool> MarkAsReadAsync(int notificationId)
    {
        if (!_currentUser.UserId.HasValue)
        {
            return false;
        }

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == _currentUser.UserId.Value);

        if (notification == null)
        {
            return false;
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }

        return true;
    }
}
