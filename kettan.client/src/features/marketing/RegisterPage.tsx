import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { StaticMotionDiv } from "./noMotion";
import { ArrowLeft, CheckCircle2, Loader2, Mail, X } from "lucide-react";
import { api } from "../../utils/api";
import { MarketingAuthInput } from "./components/MarketingAuthInput";
import { resolvePlan } from "./registerPlans";
import logo from "../../assets/logo.png";

interface RequestOtpResponse {
  email: string;
  expiresAtUtc: string;
  cooldownSeconds: number;
  remainingResends: number;
}

export function RegisterPage() {
  const { planId, planInfo } = resolvePlan(
    new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("plan")
  );

  const [email, setEmail] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms to continue.";
    }

    return newErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      await api.post<RequestOtpResponse>("/api/subscription/request-otp", {
        email: email.trim(),
      });

      const otpUrl = `/market/register/otp?email=${encodeURIComponent(email.trim())}&plan=${encodeURIComponent(planId)}`;
      window.location.assign(otpUrl);
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? "Unable to send verification code right now. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        fontFamily: '"DM Sans", "Inter", sans-serif',
        background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 50%, #EDE0C4 100%)",
      }}
    >
      <div className="w-full max-w-md px-6 py-12">
        <StaticMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="flex items-center mb-8 justify-center">
            <img src={logo} alt="Kettan" width="160" />
          </div>

          <Link
            to="/market/pricing"
            className="inline-flex items-center gap-1.5 mb-7 text-sm"
            style={{ color: "#8C6B43", fontWeight: 500 }}
          >
            <ArrowLeft size={14} />
            Back to Pricing
          </Link>

          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#2C1A0E", marginBottom: "6px", letterSpacing: "-0.02em", textAlign: "center" }}>
            Verify your email
          </h1>
          <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "24px", textAlign: "center" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#6B4C2A", fontWeight: 600 }}>Sign in -&gt;</Link>
          </p>

          {/* Plan info badge with floating design */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl mb-6"
            style={{
              backgroundColor: planInfo.bg,
              border: `1.5px solid ${planInfo.color}30`,
              boxShadow: "0 2px 12px rgba(107,76,42,0.08)",
            }}
          >
            <div>
              <p style={{ fontSize: "11px", color: planInfo.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Selected Plan
              </p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: planInfo.color }}>{planInfo.label}</p>
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: planInfo.color }}>{planInfo.price}</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError ? (
              <div
                className="rounded-lg px-3 py-2"
                style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <p style={{ fontSize: "12px", color: "#B91C1C", fontWeight: 600 }}>{submitError}</p>
              </div>
            ) : null}

            <MarketingAuthInput
              label="Work Email Address"
              icon={Mail}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@coffeeco.ph"
              autoComplete="email"
              error={errors.email}
              maxLength={256}
            />

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(event) => setAgreeToTerms(event.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200 flex-shrink-0"
                    style={{
                      border: errors.agreeToTerms ? "2px solid #EF4444" : agreeToTerms ? "2px solid #6B4C2A" : "2px solid rgba(107,76,42,0.3)",
                      backgroundColor: agreeToTerms ? "#6B4C2A" : "transparent",
                    }}
                    onClick={() => setAgreeToTerms((current) => !current)}
                  >
                    {agreeToTerms ? <CheckCircle2 size={12} style={{ color: "#FFFFFF" }} /> : null}
                  </div>
                </div>
                <span style={{ fontSize: "13px", color: "#5C4A37", lineHeight: 1.6 }}>
                  I agree to Kettan's{" "}
                  <span onClick={(e) => { e.preventDefault(); setShowPolicyModal(true); }} style={{ color: "#6B4C2A", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>
                  {" "}and{" "}
                  <span onClick={(e) => { e.preventDefault(); setShowPolicyModal(true); }} style={{ color: "#6B4C2A", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>
                </span>
              </label>
              {errors.agreeToTerms ? (
                <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{errors.agreeToTerms}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white transition-all duration-200 mt-2"
              style={{
                backgroundColor: loading ? "#8C6B43" : "#6B4C2A",
                fontWeight: 700,
                fontSize: "15px",
                boxShadow: loading ? "none" : "0 4px 16px rgba(107,76,42,0.3)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending verification code...
                </>
              ) : (
                "Send 6-digit verification code"
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#A39C93", marginTop: "16px" }}>
            The OTP expires in 10 minutes for your account security.
          </p>
        </StaticMotionDiv>
      </div>

      {/* Security Policy Modal */}
      {showPolicyModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(139,115,85,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#3D3122", margin: 0 }}>Security Compliance & Terms</h2>
              <button 
                onClick={() => setShowPolicyModal(false)}
                style={{ padding: "8px", background: "none", border: "none", cursor: "pointer", color: "#8B7355" }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div style={{ padding: "24px", overflowY: "auto", color: "#5C4A37", fontSize: "14px", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#3D3122", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password Policy</h3>
                <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Users must create a password with a minimum of 8 characters.</li>
                  <li>Passwords are hashed using BCrypt before storage in the database.</li>
                  <li>Plaintext passwords are never stored or logged by the system.</li>
                  <li>Password reset requires email OTP verification.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#3D3122", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Login Attempt Policy</h3>
                <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Users are rate limited to five (5) login attempts per minute per IP address.</li>
                  <li>After exceeding the limit, the system returns HTTP 429 and blocks further attempts for the remainder of the 1-minute window.</li>
                  <li>All failed login attempts are logged in the AuditLogs table with the user's IP address, user agent, and timestamp.</li>
                  <li>Multi-Factor Authentication (OTP via email) is required when logging in from an unrecognized device.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#3D3122", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Data Handling Policy</h3>
                <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Personal information (passwords, OTP codes) is hashed before storage using BCrypt.</li>
                  <li>Data is encrypted during transmission via HTTPS/TLS.</li>
                  <li>JWT tokens are stored in HttpOnly, Secure, SameSite=Strict cookies to prevent XSS and CSRF attacks.</li>
                  <li>Only authorized users within the same tenant can access tenant-specific records.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#3D3122", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Access Control Policy</h3>
                <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Only TenantAdmin users can access system configuration pages.</li>
                  <li>Branch-level users are restricted to branch-specific features.</li>
                  <li>All API endpoints require JWT authentication.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#3D3122", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Logging and Monitoring Policy</h3>
                <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>All entity changes (Create, Update, Delete) are automatically recorded.</li>
                  <li>Sensitive fields (PasswordHash, OtpCode) are excluded from audit log tracking.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#3D3122", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Compliance Declaration</h3>
                <p style={{ margin: 0, fontStyle: "italic" }}>
                  By submitting this form and checking the box, you confirm that you have read and agreed to the security policies properly implemented in the Kettan system.
                </p>
              </div>

            </div>

            {/* Footer Action */}
            <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(139,115,85,0.15)", backgroundColor: "#FAFAFA", borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => {
                  setAgreeToTerms(true);
                  if (errors.agreeToTerms) {
                    const newErrors = { ...errors };
                    delete newErrors.agreeToTerms;
                    setErrors(newErrors);
                  }
                  setShowPolicyModal(false);
                }}
                style={{ backgroundColor: "#6B4C2A", color: "white", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(107,76,42,0.25)" }}
              >
                I Agree & Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}