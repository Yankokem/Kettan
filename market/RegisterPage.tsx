import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { StaticMotionDiv } from "./noMotion";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Building2,
  User,
  Mail,
  Lock,
} from "lucide-react";

const planLabels: Record<string, { label: string; color: string; bg: string; price: string }> = {
  starter: { label: "Starter Plan", color: "#6B4C2A", bg: "rgba(107,76,42,0.1)", price: "PHP 2,999/mo" },
  growth: { label: "Growth Plan", color: "#C9A84C", bg: "rgba(201,168,76,0.15)", price: "PHP 7,999/mo" },
  enterprise: { label: "Enterprise Plan", color: "#546B3F", bg: "rgba(84,107,63,0.12)", price: "PHP 14,999/mo" },
};

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "#E5E7EB" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: "", color: "#E5E7EB" },
    { score: 1, label: "Weak", color: "#EF4444" },
    { score: 2, label: "Fair", color: "#F59E0B" },
    { score: 3, label: "Good", color: "#3B82F6" },
    { score: 4, label: "Strong", color: "#16A34A" },
  ];
  return levels[score];
}

function InputField({
  label,
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  error,
  suffix,
}: {
  label: string;
  icon: React.ElementType;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "6px" }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon size={16} style={{ color: "#8C6B43" }} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl outline-none transition-all duration-200"
          style={{
            border: error ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.2)",
            backgroundColor: "#FDFAF5",
            fontSize: "14px",
            color: "#2C1A0E",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? "#EF4444" : "#6B4C2A";
            e.target.style.boxShadow = error ? "0 0 0 3px rgba(239,68,68,0.1)" : "0 0 0 3px rgba(107,76,42,0.08)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "#EF4444" : "rgba(107,76,42,0.2)";
            e.target.style.boxShadow = "none";
          }}
        />
        {suffix && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
      {error && <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") || "growth";
  const planInfo = planLabels[planId] || planLabels.growth;

  const [form, setForm] = useState({
    companyName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.companyName.trim() || form.companyName.length < 3)
      newErrors.companyName = "Company name must be at least 3 characters.";
    if (!form.fullName.trim())
      newErrors.fullName = "Full name is required.";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Please enter a valid email address.";
    if (!form.password || form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    if (!form.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms to continue.";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    // In production: POST /api/subscription/register -> redirect to PayMongo
    alert("Demo mode: In production, this would redirect to the PayMongo checkout page.");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        fontFamily: '"DM Sans", "Inter", sans-serif',
        background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 100%)",
      }}
    >
      {/* Left Panel - Brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{
          background: "linear-gradient(160deg, #2C1A0E 0%, #4A3418 50%, #3D5029 100%)",
        }}
      >
        <div>
          <Link to="/" className="flex items-center gap-2 mb-16">
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
            Start managing your coffee chain today
          </h2>
          <p style={{ fontSize: "14px", color: "#C9A87D", lineHeight: 1.7 }}>
            Join multi-branch coffee chains who've replaced their spreadsheets and group chats with Kettan's unified platform.
          </p>
        </div>

        <div className="space-y-4">
          {[
            "Multi-tenant data isolation",
            "Role-based access for 6 user types",
            "FIFO inventory with EOQ reorder algorithm",
            "Real-time order tracking",
            "14-day free trial",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 size={15} style={{ color: "#C9A84C", flexShrink: 0 }} />
              <span style={{ fontSize: "14px", color: "#C9A87D" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <StaticMotionDiv
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M16 5C12.5 5 7.5 9 7.5 15.5C7.5 20 10 23 14 24.5L15.5 14.5L22.5 13C19 13.5 16.5 15 15 18C13.5 21 14 24.5 14 24.5C16 25 24.5 21.5 24.5 15.5C24.5 9 19.5 5 16 5Z" fill="#6B4C2A" />
            </svg>
            <span style={{ fontWeight: 800, fontSize: "16px", color: "#2C1A0E", letterSpacing: "0.1em" }}>KETTAN</span>
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 mb-7 text-sm"
            style={{ color: "#8C6B43", fontWeight: 500 }}
          >
            <ArrowLeft size={14} />
            Back to Pricing
          </Link>

          <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#2C1A0E", marginBottom: "6px", letterSpacing: "-0.02em" }}>
            Create your account
          </h1>
          <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "24px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#6B4C2A", fontWeight: 600 }}>Sign in -></Link>
          </p>

          {/* Plan badge */}
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
            <InputField
              label="Company Name"
              icon={Building2}
              type="text"
              value={form.companyName}
              onChange={(v) => setForm({ ...form, companyName: v })}
              placeholder="e.g. Brewed & True Coffee Co."
              error={errors.companyName}
            />
            <InputField
              label="Your Full Name"
              icon={User}
              type="text"
              value={form.fullName}
              onChange={(v) => setForm({ ...form, fullName: v })}
              placeholder="e.g. Juan dela Cruz"
              error={errors.fullName}
            />
            <InputField
              label="Email Address"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="you@coffeeco.ph"
              error={errors.email}
            />

            {/* Password */}
            <div>
              <InputField
                label="Password"
                icon={Lock}
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                placeholder="Minimum 8 characters"
                error={errors.password}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {showPw ? <EyeOff size={16} style={{ color: "#8C6B43" }} /> : <Eye size={16} style={{ color: "#8C6B43" }} />}
                  </button>
                }
              />
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: strength.score >= s ? strength.color : "#E5E7EB" }}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p style={{ fontSize: "11px", color: strength.color, fontWeight: 600 }}>
                      {strength.label} password
                    </p>
                  )}
                </div>
              )}
            </div>

            <InputField
              label="Confirm Password"
              icon={Lock}
              type={showConfirmPw ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(v) => setForm({ ...form, confirmPassword: v })}
              placeholder="Repeat your password"
              error={errors.confirmPassword}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {showConfirmPw ? <EyeOff size={16} style={{ color: "#8C6B43" }} /> : <Eye size={16} style={{ color: "#8C6B43" }} />}
                </button>
              }
            />

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.agreeToTerms}
                    onChange={(e) => setForm({ ...form, agreeToTerms: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200 flex-shrink-0"
                    style={{
                      border: errors.agreeToTerms ? "2px solid #EF4444" : form.agreeToTerms ? "2px solid #6B4C2A" : "2px solid rgba(107,76,42,0.3)",
                      backgroundColor: form.agreeToTerms ? "#6B4C2A" : "transparent",
                    }}
                    onClick={() => setForm({ ...form, agreeToTerms: !form.agreeToTerms })}
                  >
                    {form.agreeToTerms && <CheckCircle2 size={12} style={{ color: "#FFFFFF" }} />}
                  </div>
                </div>
                <span style={{ fontSize: "13px", color: "#5C4A37", lineHeight: 1.6 }}>
                  I agree to Kettan's{" "}
                  <span style={{ color: "#6B4C2A", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>
                  {" "}and{" "}
                  <span style={{ color: "#6B4C2A", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{errors.agreeToTerms}</p>
              )}
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
                  Creating your account...
                </>
              ) : (
                "Create Account & Continue to Payment ->"
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#A39C93", marginTop: "16px" }}>
            Secured by PayMongo - Your data is encrypted
          </p>
        </StaticMotionDiv>
      </div>
    </div>
  );
}


