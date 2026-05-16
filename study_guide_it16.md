# Kettan Security Presentation — Study Guide

---

## Security Features

### 1. Multi-Factor Authentication (MFA) / OTP Verification

**What it is:** MFA requires users to prove their identity through two separate factors — something they know (password) and something they have (access to their email for a one-time code). This prevents unauthorized access even if a password is compromised.

**How Kettan implements it:**
- On login, the system checks for a `kettan_device_id` cookie to see if the browser is recognized.
- If the device is **unrecognized**, a 6-digit OTP is generated, hashed with BCrypt, and emailed via Gmail SMTP.
- The user enters the OTP on the login page to complete authentication.
- Once verified, the device is saved to the `UserDevices` table and a 30-day HttpOnly cookie is set so the user won't be asked again on that browser.

**Relevant files:**
- `Kettan.Server/Services/Auth/AuthService.cs` — OTP generation, device check, MFA token logic
- `Kettan.Server/Entities/UserDevice.cs` — trusted device entity
- `Kettan.Server/Controllers/AuthController.cs` — `verify-mfa` endpoint
- `Kettan.Server/Services/Email/SmtpEmailService.cs` — sends the OTP email
- `kettan.client/src/features/auth/LoginPage.tsx` — MFA OTP input UI

---

### 2. Password Hashing (BCrypt)

**What it is:** Passwords are never stored as plaintext. Instead, they are run through BCrypt, a one-way hashing algorithm with a built-in salt. Even if the database is compromised, attackers cannot reverse the hashes back into passwords.

**How Kettan implements it:**
- On user creation: `BCrypt.Net.BCrypt.HashPassword(password)` — stores the hash in the `PasswordHash` column.
- On login: `BCrypt.Net.BCrypt.Verify(inputPassword, storedHash)` — compares without ever decrypting.
- OTP codes are also BCrypt-hashed before storage.

**Relevant files:**
- `Kettan.Server/Services/Auth/AuthService.cs` — lines 43 (verify), 88-89 (OTP hash), line 248 (password reset hash)
- `Kettan.Server/Entities/User.cs` — `PasswordHash`, `OtpHash` fields

---

### 3. JWT Authentication with HttpOnly Cookies

**What it is:** JSON Web Tokens (JWT) are used for stateless authentication. The token is signed with HMAC-SHA256 and stored in an HttpOnly cookie, meaning JavaScript cannot access it — this prevents XSS attacks from stealing session tokens.

**How Kettan implements it:**
- After successful login, the server generates a JWT containing: UserId, Email, Role, TenantId, BranchId.
- The JWT is set as an HttpOnly, Secure, SameSite=Strict cookie (not in localStorage).
- Every subsequent API request automatically sends the cookie. The server validates issuer, audience, lifetime, and signing key.

**Relevant files:**
- `Kettan.Server/Program.cs` — lines 22-62 (JWT configuration)
- `Kettan.Server/Controllers/AuthController.cs` — lines 113-120 (cookie settings)
- `Kettan.Server/Services/Auth/AuthService.cs` — `GenerateJwtToken()` method

---

### 4. Role-Based Access Control (RBAC)

**What it is:** Different users have different permissions. RBAC restricts what actions and pages each user role can access. This follows the Principle of Least Privilege — users only get the access they need.

**How Kettan implements it:**
- 7 roles: SuperAdmin, TenantAdmin, HqManager, HqStaff, BranchOwner, BranchManager, StoreStaff.
- **Backend:** `[Authorize(Roles = "TenantAdmin,HqManager")]` attributes on every controller endpoint.
- **Frontend:** `canAccessModule()` function checks user role against a permission matrix. Sidebar only shows links the role has access to. Router guards redirect unauthorized users.

**Relevant files:**
- `Kettan.Server/Enums/UserRole.cs` — role definitions
- `Kettan.Server/Controllers/UsersController.cs` — example of `[Authorize(Roles)]`
- `kettan.client/src/utils/roleHelpers.ts` — `canAccessModule()`, `canPerformAction()` functions
- `kettan.client/src/app/router.tsx` — route guards with role checks

---

### 5. Multi-Tenant Data Isolation

**What it is:** Multi-tenancy means multiple organizations (tenants) share the same application and database, but their data is completely isolated. Tenant A cannot see Tenant B's data. Similarly, Branch A cannot see Branch B's data within the same tenant.

**How Kettan implements it:**
- Every entity that belongs to a tenant implements `ITenantEntity` with a `TenantId` column.
- EF Core **global query filters** automatically append `WHERE TenantId = @currentTenantId` to every database query. This happens at the database layer — no developer can accidentally forget it.
- The `CurrentTenantId` is extracted from the authenticated user's JWT claims via `ICurrentUserService`.
- Branch-scoped data (inventory, consumption, supply requests) is additionally filtered by `BranchId`.

**Relevant files:**
- `Kettan.Server/Data/ApplicationDbContext.cs` — lines 186-224 (all `HasQueryFilter` definitions)
- `Kettan.Server/Services/Common/CurrentUserService.cs` — extracts TenantId/BranchId from JWT
- `Kettan.Server/Entities/ITenantEntity.cs` — interface all tenant-scoped entities implement

---

### 6. Input Validation and Sanitization

**What it is:** All user inputs are checked for correctness before being processed. This prevents invalid data from entering the system and protects against injection attacks (SQL injection, XSS).

**How Kettan implements it:**
- **Backend DTOs:** Data annotations like `[Required]`, `[EmailAddress]`, `[StringLength(256)]`, `[MaxLength]` on all request DTOs. ASP.NET's `[ApiController]` attribute automatically returns 400 Bad Request for invalid models.
- **Entity Framework parameterized queries:** All database queries use LINQ, which generates parameterized SQL — this prevents SQL injection by design.
- **Frontend:** Validation functions in form components check email format, password length, OTP format before submission.

**Relevant files:**
- `Kettan.Server/DTOs/Auth/LoginRequest.cs` — `[Required]`, `[EmailAddress]`, `[StringLength]`
- `Kettan.Server/DTOs/Auth/ResetPasswordRequest.cs` — password + OTP validation
- `kettan.client/src/features/auth/LoginPage.tsx` — `validate()` function

---

### 7. Rate Limiting

**What it is:** Rate limiting restricts how many requests a user/IP can make within a time window. This prevents brute-force attacks (trying thousands of passwords) and API abuse.

**How Kettan implements it:**
- `LoginRateLimit` policy: 5 login attempts per minute per IP address. After that, HTTP 429 is returned.
- `OtpRequestRateLimit` policy: 5 OTP requests per 5 minutes per IP address.
- Uses ASP.NET Core's built-in `AddRateLimiter()` with fixed-window partitioning by IP.

**Relevant files:**
- `Kettan.Server/Program.cs` — lines 84-106 (rate limiter policies)
- `Kettan.Server/Controllers/AuthController.cs` — `[EnableRateLimiting("LoginRateLimit")]` on login endpoint

---

### 8. Session Inactivity Timeout

**What it is:** If a user leaves their computer unattended, the system automatically logs them out after a period of inactivity. This prevents unauthorized access from an unlocked workstation.

**How Kettan implements it:**
- A `useIdleTimer` React hook monitors mouse, keyboard, touch, and scroll events.
- If no activity is detected for **30 minutes**, the `SessionTimeout` component triggers: calls `POST /api/auth/logout` to invalidate the server session, clears frontend auth state, and redirects to `/login?reason=timeout`.
- The login page shows "You were logged out due to inactivity" when redirected.

**Relevant files:**
- `kettan.client/src/hooks/useIdleTimer.ts` — idle detection hook
- `kettan.client/src/components/Auth/SessionTimeout.tsx` — logout + redirect logic
- `kettan.client/src/components/Layout/AppLayout.tsx` — line 30 (mounts `<SessionTimeout />`)

---

### 9. Audit Logging

**What it is:** Every significant action in the system is recorded in a tamper-evident log. This provides accountability, traceability, and evidence for security investigations.

**How Kettan implements it:**
- **Two audit systems:**
  1. `AuditLogInterceptor` — EF Core SaveChanges interceptor. Automatically logs every entity Create/Update/Delete with old and new values, user ID, tenant ID, IP address, and timestamp.
  2. `AuditRequestMiddleware` — HTTP middleware. Logs every non-GET API request with method, route, status code, latency, correlation ID, IP, and user agent.
- Auth events (login, logout, MFA) are manually logged in `AuthController` with specific action codes like `AUTH_LOGIN_FAIL`, `AUTH_MFA_SUCCESS`.
- Sensitive fields (PasswordHash, OtpCode) are excluded from value logging.

**Relevant files:**
- `Kettan.Server/Entities/AuditLog.cs` — audit log entity (all tracked fields)
- `Kettan.Server/Middleware/AuditLogInterceptor.cs` — auto-logs entity changes
- `Kettan.Server/Middleware/AuditRequestMiddleware.cs` — auto-logs HTTP requests
- `Kettan.Server/Controllers/AuthController.cs` — manual auth event logging

---

### 10. Secure Credential Storage

**What it is:** API keys, passwords, and secrets should never be hardcoded in source code or committed to version control. They are stored securely and loaded at runtime.

**How Kettan implements it:**
- Sensitive values (SMTP credentials, PayMongo API keys, Cloudinary URL, DB connection strings) are replaced with `"REPLACED_BY_SECRET_MANAGER"` in committed config files.
- Actual values are stored in **.NET User Secrets** (local dev) or environment variables (production).
- The `UserSecretsId` in `.csproj` links the project to an encrypted local secrets store.

**Relevant files:**
- `Kettan.Server/appsettings.json` — shows `REPLACED_BY_SECRET_MANAGER` placeholders
- `Kettan.Server/Kettan.Server.csproj` — line 10 (UserSecretsId)

---

### 11. Forgot Password Self-Service

**What it is:** Users can securely reset their own password without admin intervention, using email-based OTP verification to prove identity.

**How Kettan implements it:**
- 3-step sequential flow on `/forgot-password`:
  1. Enter email → server sends OTP (always returns success to prevent email enumeration).
  2. Enter 6-digit OTP.
  3. Enter new password → server validates OTP + sets BCrypt-hashed new password.

**Relevant files:**
- `Kettan.Server/Controllers/AuthController.cs` — `forgot-password`, `reset-password` endpoints
- `Kettan.Server/Services/Auth/AuthService.cs` — `ForgotPasswordAsync()`, `ResetPasswordAsync()`
- `kettan.client/src/features/auth/ForgotPasswordPage.tsx` — 3-step UI

---

### 12. Subscription Enforcement Middleware

**What it is:** Ensures tenants with expired or suspended subscriptions cannot perform write operations. This protects business logic and prevents unauthorized use of the platform.

**How Kettan implements it:**
- `SubscriptionCheckMiddleware` runs on every request after authentication.
- If the tenant's subscription is not Active/Trialing/PendingPayment, all POST/PUT/DELETE requests return HTTP 402.
- GET requests still work (read-only mode) so users can still view their data and reactivate.

**Relevant files:**
- `Kettan.Server/Middleware/SubscriptionCheckMiddleware.cs` — full middleware logic

---
---

## Possible Questions & Answers

### Authentication & MFA

**Q: Why did you use JWT instead of session-based authentication?**
A: JWT is stateless — the server doesn't need to store session data in memory or a database. The token contains all the user info (role, tenant, branch) and is validated by signature. This scales better for a multi-tenant SaaS application.

**Q: Why is the JWT stored in an HttpOnly cookie instead of localStorage?**
A: HttpOnly cookies cannot be accessed by JavaScript, which prevents XSS attacks from stealing the token. localStorage is vulnerable — any injected script could read it.

**Q: What happens if someone steals the device cookie?**
A: The `kettan_device_id` cookie only skips the OTP step — the attacker would still need the email and password to log in. The cookie alone does not grant access.

**Q: Why BCrypt and not SHA-256 for password hashing?**
A: SHA-256 is fast, which is bad for passwords — attackers can try billions of hashes per second. BCrypt is intentionally slow and includes a built-in salt, making brute-force attacks computationally expensive.

---

### Multi-Tenancy

**Q: How do you make sure Tenant A can't see Tenant B's data?**
A: EF Core global query filters. Every query to a tenant-scoped table automatically gets `WHERE TenantId = @currentTenantId` appended. The developer doesn't need to write this manually — it's enforced at the database context level. You'd have to explicitly call `IgnoreQueryFilters()` to bypass it.

**Q: What about branch isolation within the same tenant?**
A: Branch-specific data (like inventory, consumption logs) is additionally filtered by `BranchId`. The user's BranchId comes from their JWT claims. Branch managers can only see data for their assigned branch.

**Q: What if a user doesn't have a TenantId yet (like during registration)?**
A: Login and registration endpoints are excluded from tenant filtering. The code uses `IgnoreQueryFilters()` during authentication since the user isn't scoped to a tenant at that point.

---

### Input Validation

**Q: How do you prevent SQL injection?**
A: Entity Framework uses parameterized queries by default. We never write raw SQL with string concatenation. All database queries go through LINQ, which generates safe parameterized SQL statements.

**Q: What happens if someone sends invalid data to the API?**
A: The `[ApiController]` attribute on controllers automatically validates the request model against the DTO annotations. If any `[Required]`, `[EmailAddress]`, or `[StringLength]` constraint fails, ASP.NET returns 400 Bad Request before our code even runs.

---

### Rate Limiting & Session

**Q: Why 5 attempts per minute for login?**
A: It's a balance between security and usability. 5 per minute stops brute-force attacks but doesn't annoy legitimate users who mistype their password once or twice.

**Q: What if the user is active but their JWT expires?**
A: JWT expiry is set to 1440 minutes (24 hours). Separately, the frontend idle timer logs them out after 30 minutes of no interaction. If the JWT itself expires, the server returns 401 and the frontend redirects to login.

**Q: Does the idle timer track server-side or client-side inactivity?**
A: Client-side. The `useIdleTimer` hook tracks mouse, keyboard, touch, and scroll events in the browser. If none of these happen for 30 minutes, it triggers logout. Server-side, the JWT expiry provides a hard limit.

---

### Audit Logging

**Q: What if someone tries to tamper with audit logs?**
A: Audit logs are write-only from the application's perspective. There's no API endpoint to delete or modify them. Only direct database access could tamper with them.

**Q: Why do you log IP addresses and user agents?**
A: For forensic investigation. If there's a security incident, we can trace which IP and browser were used, correlate events using the correlation ID, and identify the timeline of actions.

**Q: Do you log sensitive data like passwords?**
A: No. The `AuditLogInterceptor` explicitly excludes `PasswordHash`, `OtpCode`, and `OtpExpiresAt` from value change logging.

---

### Encryption & Secrets

**Q: Is data encrypted at rest in the database?**
A: Passwords and OTPs are hashed (BCrypt) so they're unreadable even in the database. SQL Server supports Transparent Data Encryption (TDE) at the database level for full at-rest encryption, but that's configured at the infrastructure level, not application code.

**Q: Why use .NET User Secrets instead of just environment variables?**
A: User Secrets are scoped to the project (via UserSecretsId) and stored in an encrypted location on the developer's machine (`%APPDATA%/Microsoft/UserSecrets/`). Environment variables work too but are less organized and shared across all apps on the machine.

**Q: What if someone clones the repo? Can they see the passwords?**
A: No. All sensitive values in the committed config files show `REPLACED_BY_SECRET_MANAGER`. The real values are in .NET User Secrets which are stored outside the project directory and never committed to git.

---

### General Architecture

**Q: What framework/language did you use and why?**
A: Backend is ASP.NET Core (.NET 10) with C# — it has built-in security features (JWT auth, rate limiting, model validation, HTTPS enforcement). Frontend is React with TypeScript — TypeScript catches type errors at compile time, reducing bugs. Database is SQL Server with Entity Framework Core for ORM.

**Q: Why is this a multi-tenant system?**
A: Kettan is a SaaS platform for coffee chains. Each coffee chain is a tenant. Multi-tenancy allows multiple businesses to use the same application while keeping their data completely separate, reducing infrastructure costs.
