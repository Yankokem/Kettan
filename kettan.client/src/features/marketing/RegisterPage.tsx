import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { StaticMotionDiv } from "./noMotion";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { api } from "../../utils/api";
import { MarketingAuthInput } from "./components/MarketingAuthInput";
import { resolvePlan } from "./registerPlans";

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
      className="min-h-screen flex"
      style={{
        fontFamily: '"DM Sans", "Inter", sans-serif',
        background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 100%)",
      }}
    >
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{
          background: "linear-gradient(160deg, #2C1A0E 0%, #4A3418 50%, #3D5029 100%)",
        }}
      >
        <div>
          <Link to="/market" className="flex items-center gap-2 mb-16">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" fill="rgba(201,168,125,0.1)" />
              <path
                d="M16 5C12.5 5 7.5 9 7.5 15.5C7.5 20 10 23 14 24.5C14 24.5 13.5 21 15 18C16.5 15 19 13.5 22.5 13C22.5 13 21 16.5 19 19C17 21.5 16 24 16 24L16.5 26C18 25.5 24.5 21.5 24.5 15.5C24.5 9 19.5 5 16 5Z"
                fill="#C9A87D"
              />
              <path d="M14 24.5C11.5 24 9.5 21.5 8.5 19L15.5 14.5L14 24.5Z" fill="#93AF7E" fillOpacity="0.8" />
            </svg>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#F5F0E8", letterSpacing: "0.15em" }}>KETTAN</div>
              <div style={{ fontSize: "7px", color: "#8C6B43", letterSpacing: "0.08em", textTransform: "uppercase" }}>Cafe Chain Operations</div>
            </div>
          </Link>

          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#F5F0E8", lineHeight: 1.3, marginBottom: "16px" }}>
            Verify your email to start registration
          </h2>
          <p style={{ fontSize: "14px", color: "#C9A87D", lineHeight: 1.7 }}>
            We will send a 6-digit OTP code to your email. After verification, you can complete your company onboarding details.
          </p>
        </div>

        <div className="space-y-4">
          {[
            "Email-based OTP verification",
            "5 verification attempts per code",
            "Resend available every 60 seconds",
            "Registration completes after verification",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 size={15} style={{ color: "#C9A84C", flexShrink: 0 }} />
              <span style={{ fontSize: "14px", color: "#C9A87D" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <StaticMotionDiv
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M16 5C12.5 5 7.5 9 7.5 15.5C7.5 20 10 23 14 24.5L15.5 14.5L22.5 13C19 13.5 16.5 15 15 18C13.5 21 14 24.5 14 24.5C16 25 24.5 21.5 24.5 15.5C24.5 9 19.5 5 16 5Z" fill="#6B4C2A" />
            </svg>
            <span style={{ fontWeight: 800, fontSize: "16px", color: "#2C1A0E", letterSpacing: "0.1em" }}>KETTAN</span>
          </div>

          <Link
            to="/market/pricing"
            className="inline-flex items-center gap-1.5 mb-7 text-sm"
            style={{ color: "#8C6B43", fontWeight: 500 }}
          >
            <ArrowLeft size={14} />
            Back to Pricing
          </Link>

          <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#2C1A0E", marginBottom: "6px", letterSpacing: "-0.02em" }}>
            Verify your email
          </h1>
          <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "24px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#6B4C2A", fontWeight: 600 }}>Sign in -&gt;</Link>
          </p>

          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl mb-6"
            style={{ backgroundColor: planInfo.bg, border: `1.5px solid ${planInfo.color}30` }}
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
                  <span style={{ color: "#6B4C2A", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>
                  {" "}and{" "}
                  <span style={{ color: "#6B4C2A", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>
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
    </div>
  );
}
