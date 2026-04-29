import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { StaticMotionDiv } from "../marketing/noMotion";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2, Coffee } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../utils/api";
import { MarketingNavbar } from "../../components/Marketing/MarketingNavbar";

interface AuthMeResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    imageUrl?: string | null;
  };
  tenant?: {
    id: number;
    name: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    isActive: boolean;
    profileComplete: boolean;
    logoUrl?: string | null;
  } | null;
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Please enter a valid email address.";
    if (!password || password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      const loginRes = await api.post("/api/auth/login", { email, password });
      
      // Store the token immediately so the next requests can use it if the cookie wasn't set
      const token = loginRes.data?.token;
      if (token) {
        useAuthStore.setState({ token });
      }

      const meResponse = await api.get<AuthMeResponse>("/api/auth/me");
      const me = meResponse.data;

      login(
        {
          id: String(me.user.id),
          email: me.user.email,
          name: me.user.name,
          role: me.user.role,
          imageUrl: me.user.imageUrl,
          tenant: me.tenant
            ? {
                id: String(me.tenant.id),
                name: me.tenant.name,
                subscriptionTier: me.tenant.subscriptionTier,
                subscriptionStatus: me.tenant.subscriptionStatus,
                isActive: me.tenant.isActive,
                profileComplete: me.tenant.profileComplete,
                logoUrl: me.tenant.logoUrl,
              }
            : null,
        },
        token || null
      );

      const isTenantAdmin = me.user.role === 'TenantAdmin';
      const isProfileComplete = me.tenant?.profileComplete ?? true;
      navigate({ to: isTenantAdmin && !isProfileComplete ? '/company-profile' : '/' });
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? "Unable to sign in. Please verify your credentials and try again.";
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: '"DM Sans", "Inter", sans-serif' }}>
      <MarketingNavbar />
      <div
        className="flex flex-1"
        style={{
          background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 100%)",
        }}
      >
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[70%] flex-shrink-0 p-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #2C1A0E 0%, #6B4C2A 60%, #C9A87D 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #C9A84C, transparent)" }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #93AF7E, transparent)" }}
        />

        <div className="relative z-10">
          <Link to="/market" className="flex items-center gap-2 mb-14">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" fill="rgba(201,168,125,0.1)" />
              <path d="M16 5C12.5 5 7.5 9 7.5 15.5C7.5 20 10 23 14 24.5L15.5 14.5L22.5 13C19 13.5 16.5 15 15 18C13.5 21 14 24.5 14 24.5C16 25 24.5 21.5 24.5 15.5C24.5 9 19.5 5 16 5Z" fill="#C9A87D" />
              <path d="M14 24.5C11.5 24 9.5 21.5 8.5 19L15.5 14.5L14 24.5Z" fill="#93AF7E" fillOpacity="0.8" />
            </svg>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#F5F0E8", letterSpacing: "0.15em" }}>KETTAN</div>
              <div style={{ fontSize: "7px", color: "#8C6B43", letterSpacing: "0.08em", textTransform: "uppercase" }}>Cafe Chain Operations</div>
            </div>
          </Link>

          <h2
            style={{
              fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
              fontWeight: 800,
              color: "#F5F0E8",
              lineHeight: 1.35,
              marginBottom: "14px",
            }}
          >
            Welcome back to your coffee chain platform
          </h2>
          <p style={{ fontSize: "14px", color: "#C9A87D", lineHeight: 1.7 }}>
            Your supply orders, inventory, and branch operations are waiting for you.
          </p>
        </div>

        {/* Bottom stats */}
        <div
          className="relative z-10 grid grid-cols-2 gap-4"
          style={{
            padding: "20px",
            borderRadius: "16px",
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(201,168,125,0.15)",
          }}
        >
          {[
            { value: "50+", label: "Branches" },
            { value: "10K+", label: "Orders" },
            { value: "18", label: "Modules" },
            { value: "99.9%", label: "Uptime" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#F5F0E8" }}>{value}</div>
              <div style={{ fontSize: "11px", color: "#8C6B43", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-[30%] flex items-center justify-center p-6 lg:p-12">
        <StaticMotionDiv
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Coffee size={22} style={{ color: "#6B4C2A" }} />
            <span style={{ fontWeight: 800, fontSize: "16px", color: "#2C1A0E", letterSpacing: "0.1em" }}>KETTAN</span>
          </div>

          <Link
            to="/market"
            className="inline-flex items-center gap-1.5 mb-7 text-sm"
            style={{ color: "#8C6B43", fontWeight: 500 }}
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>

          <h1
            style={{
              fontSize: "1.7rem",
              fontWeight: 800,
              color: "#2C1A0E",
              marginBottom: "6px",
              letterSpacing: "-0.02em",
            }}
          >
            Sign in to Kettan
          </h1>
          <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "28px" }}>
            Don't have an account?{" "}
            <Link to="/market/pricing" style={{ color: "#6B4C2A", fontWeight: 600 }}>
              Sign up -&gt;
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div
                className="rounded-lg px-3 py-2"
                style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <p style={{ fontSize: "12px", color: "#B91C1C", fontWeight: 600 }}>{submitError}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "6px" }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail size={16} style={{ color: "#8C6B43" }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@coffeeco.ph"
                  maxLength={256}
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none"
                  style={{
                    border: errors.email ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.2)",
                    backgroundColor: "#FDFAF5",
                    fontSize: "14px",
                    color: "#2C1A0E",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6B4C2A";
                    e.target.style.boxShadow = "0 0 0 3px rgba(107,76,42,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email ? "#EF4444" : "rgba(107,76,42,0.2)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              {errors.email && <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E" }}>Password</label>
                <button
                  type="button"
                  style={{ fontSize: "12px", color: "#6B4C2A", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock size={16} style={{ color: "#8C6B43" }} />
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  maxLength={64}
                  className="w-full pl-10 pr-12 py-3 rounded-xl outline-none"
                  style={{
                    border: errors.password ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.2)",
                    backgroundColor: "#FDFAF5",
                    fontSize: "14px",
                    color: "#2C1A0E",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6B4C2A";
                    e.target.style.boxShadow = "0 0 0 3px rgba(107,76,42,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password ? "#EF4444" : "rgba(107,76,42,0.2)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {showPw ? <EyeOff size={16} style={{ color: "#8C6B43" }} /> : <Eye size={16} style={{ color: "#8C6B43" }} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{errors.password}</p>}
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
                  Signing in...
                </>
              ) : (
                "Sign In to Dashboard ->"
              )}
            </button>
          </form>
        </StaticMotionDiv>
      </div>
    </div>
  );
}