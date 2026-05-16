namespace Kettan.Server.Services.Email;

public class ConsoleEmailService : IEmailService
{
    public Task SendRegistrationOtpEmailAsync(
        string email,
        string otpCode,
        int expiryMinutes,
        CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"[EMAIL][OTP] To: {email} | Code: {otpCode} | ExpiresIn: {expiryMinutes}m");
        return Task.CompletedTask;
    }

    public Task SendWelcomeEmailAsync(
        string email,
        string tenantName,
        string loginUrl,
        CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"[EMAIL][WELCOME] To: {email} | Tenant: {tenantName} | Login: {loginUrl}");
        return Task.CompletedTask;
    }

    public Task SendLowStockAlertAsync(
        string email,
        IEnumerable<string> items,
        CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"[EMAIL][LOW_STOCK] To: {email} | Items: {string.Join(", ", items)}");
        return Task.CompletedTask;
    }

    public Task SendOrderStatusUpdateAsync(
        string email,
        int orderId,
        string status,
        CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"[EMAIL][ORDER_UPDATE] To: {email} | Order: {orderId} | Status: {status}");
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(
        string email,
        string resetToken,
        CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"[EMAIL][PASSWORD_RESET] To: {email} | Token: {resetToken}");
        return Task.CompletedTask;
    }

    public Task SendInvoicePaidEmailAsync(
        string email,
        string tenantName,
        decimal amount,
        string invoiceNumber,
        CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"[EMAIL][INVOICE_PAID] To: {email} | Tenant: {tenantName} | Amount: {amount} | Invoice: {invoiceNumber}");
        return Task.CompletedTask;
    }

    public Task SendMfaOtpEmailAsync(
        string email,
        string otpCode,
        int expiryMinutes,
        CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"[EMAIL][MFA_OTP] To: {email} | Code: {otpCode} | ExpiresIn: {expiryMinutes}m");
        return Task.CompletedTask;
    }
}

