# MFA for Unfamiliar PCs & Role-Based Forgot Password

This plan outlines the architecture for introducing Multi-Factor Authentication (MFA) via One-Time Password (OTP) for users logging in from new or unrecognized devices. It also covers the requested role-based logic where these security measures are strictly applied to Tenant Admins (who possess real emails), while non-admin accounts fall back to alternative behaviors.

## User Review Required

> [!IMPORTANT]
> Because non-admin roles (e.g., HQ Staff, Branch Manager, Store Staff) are created by the Tenant Admin and do not possess real email addresses, they cannot receive an OTP or password reset links. 
> - For **MFA**: Non-admin roles will bypass the OTP requirement when logging in from an unfamiliar PC and will just log in immediately.
> - For **Forgot Password**: Non-admin roles will be blocked from using the self-service reset and will be instructed to contact their account provider (the Tenant Admin).

## Open Questions

> [!WARNING]
> 1. **MFA for Non-Admins**: Are you comfortable completely bypassing MFA for non-admin accounts when they log in from a new PC? The alternative would be sending their OTP to the Tenant Admin's email, which could be noisy. Bypassing is the cleanest approach if they lack real emails.
> 2. **Email Service**: Do we already have an established email-sending service (e.g., SMTP, SendGrid) in the `Kettan.Server` project, or will I need to create a mock/placeholder email service for this implementation?
> 3. **Device Token Expiry**: The system will use a persistent cookie to remember devices. Is a 30-day expiry for this "remembered device" cookie acceptable?

## Proposed Changes

---

### Database & Entities

We need to track recognized devices and OTPs.

#### [NEW] `Kettan.Server/Entities/UserDevice.cs`
- Tracks trusted devices for users.
- Properties: `Id`, `UserId`, `DeviceToken` (Guid), `UserAgent`, `IpAddress`, `CreatedAt`, `LastUsedAt`.

#### [MODIFY] `Kettan.Server/Entities/User.cs`
- Add optional properties for OTP: `string? OtpHash`, `DateTime? OtpExpiry`.
- Alternatively, we can use an in-memory cache (Redis/MemoryCache) if available, but database columns are straightforward for OTP tracking.

#### [MODIFY] `Kettan.Server/Data/ApplicationDbContext.cs`
- Add `DbSet<UserDevice> UserDevices`.
- Configure relationships between `User` and `UserDevice`.

---

### Backend Auth Logic

#### [MODIFY] `Kettan.Server/Services/Auth/IAuthService.cs` & `AuthService.cs`
- **LoginAsync**: 
  - Instead of immediately returning the JWT token, check the incoming `kettan_device_id` cookie.
  - If the device is unrecognized AND the user role is `TenantAdmin` (or `SuperAdmin`), generate a 6-digit OTP, save its hash, dispatch the email, and return a specific response (e.g., `RequiresMfa = true`, returning an ephemeral `MfaToken` instead of a full JWT).
  - If the user is a non-admin, log them in normally and just register the new device.
- **VerifyMfaAsync [NEW]**: Validate the OTP using the `MfaToken`. Upon success, clear the OTP, generate the `DeviceToken` cookie, and return the standard `LoginResponse` (JWT).
- **ForgotPasswordAsync [NEW]**: Accepts an email. Finds the user. If role is not `TenantAdmin`/`SuperAdmin`, throws an exception with "Please contact your account provider to reset your password." Otherwise, generates a reset token and sends an email.

#### [MODIFY] `Kettan.Server/Controllers/AuthController.cs`
- Update `Login` endpoint to handle the `RequiresMfa` result.
- Add `[HttpPost("verify-mfa")]` endpoint. Upon success, append the `kettan_device_id` cookie (HttpOnly, Secure) alongside the standard JWT.
- Add `[HttpPost("forgot-password")]` endpoint.

---

### Frontend Components

#### [MODIFY] `kettan.client/src/features/auth/LoginPage.tsx`
- Update the login form state to handle the MFA challenge.
- If the server responds with `RequiresMfa`, transition the UI to an OTP input screen.
- Call the `/api/auth/verify-mfa` endpoint upon OTP submission.

#### [NEW] `kettan.client/src/features/auth/ForgotPasswordPage.tsx`
- Create a simple UI where the user enters their email.
- If the backend returns the "contact your provider" error, display it prominently.
- Add a "Forgot Password?" link to the `LoginPage.tsx` that routes to this page.

#### [MODIFY] `kettan.client/src/app/router.tsx`
- Add the route for the `/forgot-password` page.

## Verification Plan

### Automated Tests
- Ensure `dotnet build` succeeds on `Kettan.Server`.
- Ensure `npm run build` succeeds on `kettan.client`.

### Manual Verification
1. **Tenant Admin Login Flow**: Log in as a Tenant Admin on an incognito window (no device cookie). Verify that an OTP is required. Enter the OTP, verify successful login, and ensure the `kettan_device_id` cookie is set.
2. **Subsequent Login**: Log out and log back in on the same browser. Verify that OTP is bypassed because the device is recognized.
3. **Non-Admin Login**: Log in as a Branch Manager or HQ Staff. Verify that no OTP is prompted and login proceeds normally.
4. **Forgot Password (Tenant Admin)**: Request a password reset as a Tenant Admin and verify the success response.
5. **Forgot Password (Non-Admin)**: Request a password reset as a Store Staff and verify that the UI correctly displays the "contact your account provider" message.
