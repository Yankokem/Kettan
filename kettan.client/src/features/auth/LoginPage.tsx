import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { StaticMotionDiv } from "../marketing/noMotion";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../utils/api";
import logo from "../../assets/logo.png";
import { MarketingNavbar } from "../../components/Marketing/MarketingNavbar";

interface AuthMeResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    branchId?: number | null;
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
          branchId: me.user.branchId,
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
        className="hidden lg:flex flex-col items-center justify-center w-[70%] flex-shrink-0 p-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(170deg, #6B4C2A 0%, #4D3823 100%)",
        }}
      >
        {/* Subtle decorative elements */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #F5EDD8, transparent)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #E8DCC4, transparent)" }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-12 p-8 rounded-3xl bg-[#F5EDD8] shadow-xl border border-white/10">
            <img 
              src={logo} 
              alt="Kettan" 
              width="280" 
              height="280"
            />
          </div>

          <h2
            style={{
              fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
              fontWeight: 800,
              color: "#F5EDD8",
              lineHeight: 1.3,
              marginBottom: "20px",
              maxWidth: "600px",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back to your coffee chain command center
          </h2>
          <p style={{ 
            fontSize: "16px", 
            color: "#F5EDD8", 
            lineHeight: 1.7,
            maxWidth: "500px",
            opacity: 0.85,
          }}>
            Streamline your multi-branch operations with real-time inventory tracking and supply chain management.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-[30%] flex items-center justify-center p-6 lg:p-12">
        <StaticMotionDiv
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center mb-8">
            <img src={logo} alt="Kettan" width="120" />
          </div>

          <Link
            to="/market"
            className="inline-flex items-center gap-1.5 mb-8 text-sm"
            style={{ color: "#8C6B43", fontWeight: 500 }}
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>

          <div className="mb-8">
            <h1
              style={{
                fontSize: "1.8rem",
                fontWeight: 800,
                color: "#2C1A0E",
                marginBottom: "8px",
                letterSpacing: "-0.02em",
              }}
            >
              Sign in to Kettan
            </h1>
            <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "6px" }}>
              Access your coffee chain management dashboard
            </p>
            <p style={{ fontSize: "13px", color: "#8C6B43" }}>
              Don't have an account?{" "}
              <Link to="/market/pricing" style={{ color: "#6B4C2A", fontWeight: 600 }}>
                Sign up →
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {submitError && (
              <div
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <p style={{ fontSize: "13px", color: "#B91C1C", fontWeight: 600 }}>{submitError}</p>
              </div>
            )}

            {/* Email */}
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
                  style={{
                    border: errors.email ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.15)",
                    backgroundColor: "#FDFAF5",
                    fontSize: "14px",
                    color: "#2C1A0E",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: "0 1px 3px rgba(107,76,42,0.05)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6B4C2A";
                    e.target.style.boxShadow = "0 0 0 3px rgba(107,76,42,0.08), 0 1px 3px rgba(107,76,42,0.05)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email ? "#EF4444" : "rgba(107,76,42,0.15)";
                    e.target.style.boxShadow = "0 1px 3px rgba(107,76,42,0.05)";
                  }}
                />
              </div>
              {errors.email && <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "6px" }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2C1A0E" }}>Password</label>
                <button
                  type="button"
                  style={{ fontSize: "12px", color: "#6B4C2A", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock size={16} style={{ color: "#8C6B43" }} />
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  maxLength={64}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl outline-none"
                  style={{
                    border: errors.password ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.15)",
                    backgroundColor: "#FDFAF5",
                    fontSize: "14px",
                    color: "#2C1A0E",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: "0 1px 3px rgba(107,76,42,0.05)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6B4C2A";
                    e.target.style.boxShadow = "0 0 0 3px rgba(107,76,42,0.08), 0 1px 3px rgba(107,76,42,0.05)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password ? "#EF4444" : "rgba(107,76,42,0.15)";
                    e.target.style.boxShadow = "0 1px 3px rgba(107,76,42,0.05)";
                  }}
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
              {errors.password && <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "6px" }}>{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white transition-all duration-200 mt-6"
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
                  Signing in...
                </>
              ) : (
                "Sign In to Dashboard →"
              )}
            </button>
          </form>
        </StaticMotionDiv>
      </div>
      </div>
    </div>
  );
}