# MFA for Unfamiliar PCs & Forgot Password

This plan outlines the architecture for introducing Multi-Factor Authentication (MFA) via One-Time Password (OTP) for all users logging in from new or unrecognized devices. Real email addresses will be enforced for all accounts upon creation, allowing every user (Admins, HQ Staff, Branch Managers, etc.) to securely receive OTPs and utilize the self-service Forgot Password flow.

## Proposed Changes

---

### Database & Entities

We need to track recognized devices and OTPs.

#### [NEW] `Kettan.Server/Entities/UserDevice.cs`
- Tracks trusted devices for users.
- Properties: `Id`, `UserId`, `DeviceToken` (Guid), `UserAgent`, `IpAddress`, `CreatedAt`, `LastUsedAt`.

#### [MODIFY] `Kettan.Server/Entities/User.cs`
- Add optional properties for OTP: `string? OtpHash`, `DateTime? OtpExpiry`.
- Ensure `Email` is enforced as a required/validated field for new accounts.

#### [MODIFY] `Kettan.Server/Data/ApplicationDbContext.cs`
- Add `DbSet<UserDevice> UserDevices`.
- Configure relationships between `User` and `UserDevice`.

---

### Backend Auth & User Management Logic

#### [MODIFY] `Kettan.Server/Services/Auth/IAuthService.cs` & `AuthService.cs`
- **LoginAsync**: 
  - Check the incoming `kettan_device_id` cookie.
  - If the device is unrecognized, generate a 6-digit OTP, save its hash, dispatch the email to the user's real email using SMTP, and return a specific response (e.g., `RequiresMfa = true`, returning an ephemeral `MfaToken` instead of a full JWT).
- **VerifyMfaAsync [NEW]**: Validate the OTP using the `MfaToken`. Upon success, clear the OTP, generate the `DeviceToken` cookie (30-day expiry), and return the standard `LoginResponse` (JWT).
- **ForgotPasswordAsync [NEW]**: Accepts an email. Finds the user, generates a 6-digit OTP (reset token), saves it to the user record, and sends it via email.
- **ResetPasswordAsync [NEW]**: Accepts email, OTP, and new password. Validates the OTP and updates the password.

#### [MODIFY] `Kettan.Server/Controllers/AuthController.cs`
- Update `Login` endpoint to handle the `RequiresMfa` result.
- Add `[HttpPost("verify-mfa")]` endpoint.
- Add `[HttpPost("forgot-password")]` endpoint (sends OTP).
- Add `[HttpPost("reset-password")]` endpoint (verifies OTP and sets new password).

#### [MODIFY] `Kettan.Server/Controllers/StaffController.cs` (or equivalent User Management controller)
- Update account creation and editing endpoints to strictly validate the email address format.

---

### Frontend Components

#### [MODIFY] `kettan.client/src/features/auth/LoginPage.tsx`
- Update the login form state to handle the MFA challenge.
- If the server responds with `RequiresMfa`, transition the UI to an OTP input screen.
- Call the `/api/auth/verify-mfa` endpoint upon OTP submission.

#### [NEW] `kettan.client/src/features/auth/ForgotPasswordPage.tsx`
- Create a single file to handle the entire sequential Forgot Password flow.
- **Step 1:** User enters their email address. Call `/forgot-password` to send the OTP.
- **Step 2:** User enters the OTP received in their email.
- **Step 3:** User enters their new password. Call `/reset-password` with email, OTP, and new password.
- Add a "Forgot Password?" link to the `LoginPage.tsx` that routes to this page.

#### [MODIFY] `kettan.client/src/features/staff/components/AddStaffModal.tsx` (or equivalent)
- Enforce standard email validation on the email input field to prevent fake/invalid emails from being submitted.

#### [MODIFY] `kettan.client/src/app/router.tsx`
- Add the route for the `/forgot-password` page.

## Verification Plan

### Automated Tests
- Ensure `dotnet build` succeeds on `Kettan.Server`.
- Ensure `npm run build` succeeds on `kettan.client`.

### Manual Verification
1. **Account Creation**: Attempt to create a staff member with an invalid email. Verify that it is rejected. Create one with a real email and verify success.
2. **MFA Login Flow**: Log in as any user on an incognito window (no device cookie). Verify that an OTP is required and sent to their email. Enter the OTP, verify successful login, and ensure the `kettan_device_id` cookie is set.
3. **Subsequent Login**: Log out and log back in on the same browser. Verify that OTP is bypassed because the device is recognized.
4. **Forgot Password**: Request a password reset for any user role. Verify the sequential flow (Email -> OTP -> New Password) works correctly within the single `ForgotPasswordPage.tsx` component.
