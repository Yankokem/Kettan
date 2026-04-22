import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StaticMotionDiv } from "./noMotion";
import { ArrowLeft, Loader2, Mail, RefreshCcw, ShieldCheck } from "lucide-react";
import { api } from "../../utils/api";
import { resolvePlan } from "./registerPlans";

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
              <path d="M16 5C12.5 5 7.5 9 7.5 15.5C7.5 20 10 23 14 24.5C14 24.5 13.5 21 15 18C16.5 15 19 13.5 22.5 13C22.5 13 21 16.5 19 19C17 21.5 16 24 16 24L16.5 26C18 25.5 24.5 21.5 24.5 15.5C24.5 9 19.5 5 16 5Z" fill="#C9A87D" />
              <path d="M14 24.5C11.5 24 9.5 21.5 8.5 19L15.5 14.5L14 24.5Z" fill="#93AF7E" fillOpacity="0.8" />
            </svg>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#F5F0E8", letterSpacing: "0.15em" }}>KETTAN</div>
              <div style={{ fontSize: "7px", color: "#8C6B43", letterSpacing: "0.08em", textTransform: "uppercase" }}>Cafe Chain Operations</div>
            </div>
          </Link>

          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#F5F0E8", lineHeight: 1.3, marginBottom: "16px" }}>
            Enter your 6-digit OTP
          </h2>
          <p style={{ fontSize: "14px", color: "#C9A87D", lineHeight: 1.7 }}>
            For security, we only complete registration after email verification.
          </p>
        </div>

        <div className="space-y-4">
          {["OTP expires in 10 minutes", "5 verification attempts per code", "60-second resend cooldown", "Maximum 3 resends"].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <ShieldCheck size={15} style={{ color: "#C9A84C", flexShrink: 0 }} />
              <span style={{ fontSize: "14px", color: "#C9A87D" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <StaticMotionDiv className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link to={`/market/register?plan=${encodeURIComponent(planId)}` as any} className="inline-flex items-center gap-1.5 mb-7 text-sm" style={{ color: "#8C6B43", fontWeight: 500 }}>
            <ArrowLeft size={14} />
            Back to email step
          </Link>

          <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#2C1A0E", marginBottom: "6px", letterSpacing: "-0.02em" }}>
            Verify your code
          </h1>
          <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "18px" }}>
            Code sent to <span style={{ fontWeight: 700 }}>{maskedEmail || "your email"}</span>
          </p>

          <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-6" style={{ backgroundColor: planInfo.bg, border: `1.5px solid ${planInfo.color}30` }}>
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
        </StaticMotionDiv>
      </div>
    </div>
  );
}
