import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { StaticMotionDiv } from "../marketing/noMotion";
import { Mail, ArrowLeft, Loader2, ShieldCheck, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { api } from "../../utils/api";
import { MarketingNavbar } from "../../components/Marketing/MarketingNavbar";

type Step = "email" | "otp" | "new-password";

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first OTP input when step changes to OTP
  useEffect(() => {
    if (step === "otp" && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  // Step 1: Submit email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await api.post("/api/auth/forgot-password", { email });
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // OTP helpers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    const nextEmpty = newDigits.findIndex(d => !d);
    otpRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();
  };

  // Step 2: Verify OTP → proceed to password
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError(null);
    setStep("new-password");
  };

  // Step 3: Set new password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const otpCode = otpDigits.join("");
      const res = await api.post("/api/auth/reset-password", {
        email,
        otpCode,
        newPassword,
      });
      if (res.status === 200) {
        setSuccess(true);
      }
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? "Invalid or expired verification code. Please start over.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    border: hasError ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.15)",
    backgroundColor: "#FDFAF5",
    fontSize: "14px",
    color: "#2C1A0E",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 3px rgba(107,76,42,0.05)",
  });

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#6B4C2A";
    e.target.style.boxShadow = "0 0 0 3px rgba(107,76,42,0.08), 0 1px 3px rgba(107,76,42,0.05)";
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(107,76,42,0.15)";
    e.target.style.boxShadow = "0 1px 3px rgba(107,76,42,0.05)";
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: '"DM Sans", "Inter", sans-serif' }}>
        <MarketingNavbar />
        <div
          className="flex flex-1 items-center justify-center"
          style={{ background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 100%)" }}
        >
          <StaticMotionDiv
            className="w-full max-w-md p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
              >
                <CheckCircle2 size={32} style={{ color: "#16A34A" }} />
              </div>
              <h1
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  color: "#2C1A0E",
                  marginBottom: "12px",
                  letterSpacing: "-0.02em",
                }}
              >
                Password Reset Successful
              </h1>
              <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "32px", lineHeight: 1.6 }}>
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white transition-all duration-200"
                style={{
                  backgroundColor: "#6B4C2A",
                  fontWeight: 700,
                  fontSize: "15px",
                  boxShadow: "0 4px 20px rgba(107,76,42,0.25)",
                  textDecoration: "none",
                }}
              >
                Sign In to Dashboard →
              </Link>
            </div>
          </StaticMotionDiv>
        </div>
      </div>
    );
  }

  const stepIcons = {
    email: <Mail size={24} style={{ color: "#6B4C2A" }} />,
    otp: <ShieldCheck size={24} style={{ color: "#6B4C2A" }} />,
    "new-password": <KeyRound size={24} style={{ color: "#6B4C2A" }} />,
  };

  const stepTitles = {
    email: "Reset your password",
    otp: "Enter verification code",
    "new-password": "Create new password",
  };

  const stepDescriptions = {
    email: "Enter the email address associated with your account and we'll send you a verification code.",
    otp: <>We've sent a 6-digit verification code to <strong style={{ color: "#2C1A0E" }}>{email}</strong>. Please enter it below.</>,
    "new-password": "Enter your new password. Make sure it's at least 8 characters long.",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: '"DM Sans", "Inter", sans-serif' }}>
      <MarketingNavbar />
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 100%)" }}
      >
        <StaticMotionDiv
          className="w-full max-w-md p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 mb-8 text-sm"
            style={{ color: "#8C6B43", fontWeight: 500 }}
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {(["email", "otp", "new-password"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor:
                      step === s ? "#6B4C2A"
                      : (["email", "otp", "new-password"].indexOf(step) > i) ? "#16A34A"
                      : "rgba(107,76,42,0.1)",
                    color:
                      step === s || (["email", "otp", "new-password"].indexOf(step) > i) ? "#fff"
                      : "#8C6B43",
                    transition: "all 0.3s ease",
                  }}
                >
                  {["email", "otp", "new-password"].indexOf(step) > i ? "✓" : i + 1}
                </div>
                {i < 2 && (
                  <div
                    style={{
                      width: "40px",
                      height: "2px",
                      backgroundColor:
                        ["email", "otp", "new-password"].indexOf(step) > i ? "#16A34A" : "rgba(107,76,42,0.15)",
                      transition: "all 0.3s ease",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(107,76,42,0.1)" }}
              >
                {stepIcons[step]}
              </div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#2C1A0E",
                  letterSpacing: "-0.02em",
                }}
              >
                {stepTitles[step]}
              </h1>
            </div>
            <p style={{ fontSize: "14px", color: "#5C4A37", lineHeight: 1.6 }}>
              {stepDescriptions[step]}
            </p>
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 mb-5"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p style={{ fontSize: "13px", color: "#B91C1C", fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "8px" }}>
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail size={16} style={{ color: "#8C6B43" }} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@coffeeco.ph"
                    maxLength={256}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl outline-none"
                    style={inputStyle(false)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white transition-all duration-200"
                style={{
                  backgroundColor: loading ? "#8C6B43" : "#6B4C2A",
                  fontWeight: 700,
                  fontSize: "15px",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(107,76,42,0.25)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Verification Code →"
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "12px" }}>
                  Verification Code
                </label>
                <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center rounded-xl outline-none text-xl font-bold"
                      style={{
                        border: "1.5px solid rgba(107,76,42,0.15)",
                        backgroundColor: "#FDFAF5",
                        color: "#2C1A0E",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        boxShadow: "0 1px 3px rgba(107,76,42,0.05)",
                      }}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white transition-all duration-200"
                style={{
                  backgroundColor: loading ? "#8C6B43" : "#6B4C2A",
                  fontWeight: 700,
                  fontSize: "15px",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(107,76,42,0.25)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Verify Code →
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    fontSize: "13px",
                    color: "#6B4C2A",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "new-password" && (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "8px" }}>
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <KeyRound size={16} style={{ color: "#8C6B43" }} />
                  </div>
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    maxLength={64}
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl outline-none"
                    style={inputStyle(false)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {showPw ? <EyeOff size={16} style={{ color: "#8C6B43" }} /> : <Eye size={16} style={{ color: "#8C6B43" }} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "8px" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <KeyRound size={16} style={{ color: "#8C6B43" }} />
                  </div>
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    maxLength={64}
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl outline-none"
                    style={inputStyle(false)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {showConfirmPw ? <EyeOff size={16} style={{ color: "#8C6B43" }} /> : <Eye size={16} style={{ color: "#8C6B43" }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white transition-all duration-200 mt-2"
                style={{
                  backgroundColor: loading ? "#8C6B43" : "#6B4C2A",
                  fontWeight: 700,
                  fontSize: "15px",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(107,76,42,0.25)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password →"
                )}
              </button>
            </form>
          )}
        </StaticMotionDiv>
      </div>
    </div>
  );
}
