import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StaticMotionDiv } from "./noMotion";
import { ArrowLeft, Loader2, Mail, RefreshCcw } from "lucide-react";
import { api } from "../../utils/api";
import { resolvePlan } from "./registerPlans";
import logo from "../../assets/logo.png";

interface RequestOtpResponse {
  email: string;
  expiresAtUtc: string;
  cooldownSeconds: number;
  remainingResends: number;
}

interface VerifyOtpResponse {
  email: string;
  verificationToken: string;
  sessionExpiresAtUtc: string;
}

export function RegisterOtpPage() {
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const email = search.get("email") ?? "";
  const { planId, planInfo } = resolvePlan(search.get("plan"));

  const [otpCode, setOtpCode] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [remainingResends, setRemainingResends] = useState(3);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCooldownSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldownSeconds]);

  const maskedEmail = useMemo(() => {
    if (!email.includes("@")) {
      return email;
    }

    const [local, domain] = email.split("@");
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${"*".repeat(Math.max(0, local.length - visible.length))}@${domain}`;
  }, [email]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      setSubmitError("Missing email context. Please restart registration.");
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setSubmitError("Please enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const response = await api.post<VerifyOtpResponse>("/api/subscription/verify-otp", {
        email,
        otpCode,
      });

      const onboardingUrl = `/market/register/onboarding?email=${encodeURIComponent(response.data.email)}&plan=${encodeURIComponent(planId)}&token=${encodeURIComponent(response.data.verificationToken)}`;
      window.location.assign(onboardingUrl);
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? "Unable to verify code. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldownSeconds > 0 || remainingResends <= 0) {
      return;
    }

    setResending(true);
    setSubmitError(null);
    setResendMessage(null);

    try {
      const response = await api.post<RequestOtpResponse>("/api/subscription/resend-otp", { email });
      setCooldownSeconds(response.data.cooldownSeconds);
      setRemainingResends(response.data.remainingResends);
      setOtpCode("");
      setResendMessage("A new code was sent to your email.");
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? "Unable to resend code right now.";
      setSubmitError(errorMessage);
    } finally {
      setResending(false);
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
        <StaticMotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Logo */}
          <div className="flex items-center mb-8 justify-center">
            <img src={logo} alt="Kettan" width="160" />
          </div>

          <Link to={`/market/register?plan=${encodeURIComponent(planId)}` as any} className="inline-flex items-center gap-1.5 mb-7 text-sm" style={{ color: "#8C6B43", fontWeight: 500 }}>
            <ArrowLeft size={14} />
            Back to email step
          </Link>

          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#2C1A0E", marginBottom: "6px", letterSpacing: "-0.02em", textAlign: "center" }}>
            Verify your code
          </h1>
          <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "18px", textAlign: "center" }}>
            Code sent to <span style={{ fontWeight: 700 }}>{maskedEmail || "your email"}</span>
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

          <form onSubmit={handleVerify} className="space-y-4">
            {submitError ? (
              <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p style={{ fontSize: "12px", color: "#B91C1C", fontWeight: 600 }}>{submitError}</p>
              </div>
            ) : null}

            {resendMessage ? (
              <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(84,107,63,0.12)", border: "1px solid rgba(84,107,63,0.25)" }}>
                <p style={{ fontSize: "12px", color: "#3F5831", fontWeight: 600 }}>{resendMessage}</p>
              </div>
            ) : null}

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "6px" }}>
                6-digit verification code
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail size={16} style={{ color: "#8C6B43" }} />
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none tracking-[0.3em]"
                  style={{
                    border: submitError ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.2)",
                    backgroundColor: "#FDFAF5",
                    fontSize: "16px",
                    color: "#2C1A0E",
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(107,76,42,0.06)",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6B4C2A";
                    e.target.style.boxShadow = "0 0 0 3px rgba(107,76,42,0.08), 0 4px 12px rgba(107,76,42,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = submitError ? "#EF4444" : "rgba(107,76,42,0.2)";
                    e.target.style.boxShadow = "0 2px 8px rgba(107,76,42,0.06)";
                  }}
                />
              </div>
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
                  Verifying code...
                </>
              ) : (
                "Verify code and continue"
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldownSeconds > 0 || remainingResends <= 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                border: "1px solid rgba(107,76,42,0.25)",
                color: cooldownSeconds > 0 || remainingResends <= 0 ? "#A39C93" : "#6B4C2A",
                background: "#FFFFFF",
                cursor: resending || cooldownSeconds > 0 || remainingResends <= 0 ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(107,76,42,0.06)",
              }}
            >
              <RefreshCcw size={14} className={resending ? "animate-spin" : ""} />
              {cooldownSeconds > 0
                ? `Resend in ${cooldownSeconds}s`
                : remainingResends <= 0
                  ? "No resends left"
                  : "Resend code"}
            </button>

            <p style={{ fontSize: "12px", color: "#8C6B43", margin: 0 }}>
              Remaining resends: <span style={{ fontWeight: 700 }}>{remainingResends}</span>
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#A39C93", marginTop: "16px" }}>
            The OTP expires in 10 minutes for your account security.
          </p>
        </StaticMotionDiv>
      </div>
    </div>
  );
}