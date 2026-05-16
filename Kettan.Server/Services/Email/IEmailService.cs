namespace Kettan.Server.Services.Email;

public interface IEmailService
{
    Task SendRegistrationOtpEmailAsync(
        string email,
        string otpCode,
        int expiryMinutes,
        CancellationToken cancellationToken = default);

    Task SendWelcomeEmailAsync(
        string email,
        string tenantName,
        string loginUrl,
        CancellationToken cancellationToken = default);

    Task SendLowStockAlertAsync(
        string email,
        IEnumerable<string> items,
        CancellationToken cancellationToken = default);

    Task SendOrderStatusUpdateAsync(
        string email,
        int orderId,
        string status,
        CancellationToken cancellationToken = default);

    Task SendPasswordResetAsync(
        string email,
        string resetToken,
        CancellationToken cancellationToken = default);

    Task SendInvoicePaidEmailAsync(
        string email,
        string tenantName,
        decimal amount,
        string invoiceNumber,
        CancellationToken cancellationToken = default);

    Task SendMfaOtpEmailAsync(
        string email,
        string otpCode,
        int expiryMinutes,
        CancellationToken cancellationToken = default);
}
