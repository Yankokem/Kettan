import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StaticMotionDiv } from "./noMotion";
import { ArrowLeft, Building2, Loader2, Lock, MapPinHouse, Phone, User } from "lucide-react";
import axios from "axios";
import { api } from "../../utils/api";
import { MarketingAuthInput } from "./components/MarketingAuthInput";
import { resolvePlan } from "./registerPlans";

interface RegisterResponse {
  tenantId: number;
  registrationCompleted: boolean;
  message: string;
  checkoutUrl?: string;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) {
    return { score: 0, label: "", color: "#E5E7EB" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const levels = [
    { score: 0, label: "", color: "#E5E7EB" },
    { score: 1, label: "Weak", color: "#EF4444" },
    { score: 2, label: "Fair", color: "#F59E0B" },
    { score: 3, label: "Good", color: "#3B82F6" },
    { score: 4, label: "Strong", color: "#16A34A" },
  ];

  return levels[score];
}

export function RegisterOnboardingPage() {
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const email = search.get("email") ?? "";
  const verificationToken = search.get("token") ?? "";
  const { planId, planInfo } = resolvePlan(search.get("plan"));

  const [form, setForm] = useState({
    companyName: "",
    fullName: "",
    phoneContact: "",
    headquartersAddress: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Missing or invalid verified email. Restart the flow.";
    }

    if (!verificationToken) {
      nextErrors.verificationToken = "Verification session missing. Verify OTP again.";
    }

    if (!form.companyName.trim() || form.companyName.trim().length < 3) {
      nextErrors.companyName = "Company name must be at least 3 characters.";
    }

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.phoneContact.trim()) {
      nextErrors.phoneContact = "Phone contact is required.";
    } else if (!/^\+?[0-9\s\-()]+$/.test(form.phoneContact)) {
      nextErrors.phoneContact = "Invalid phone number format.";
    } else if (form.phoneContact.replace(/\D/g, "").length < 7) {
      nextErrors.phoneContact = "Phone number must contain at least 7 digits.";
    }

    if (!form.headquartersAddress.trim()) {
      nextErrors.headquartersAddress = "Headquarters address is required.";
    }

    if (passwordStrength.score < 4) {
      nextErrors.password = "Password must be at least 8 characters and include uppercase, number, and special character.";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      const response = await api.post<RegisterResponse>("/api/subscription/register", {
        verificationToken,
        companyName: form.companyName.trim(),
        fullName: form.fullName.trim(),
        email: email.trim(),
        password: form.password,
        planCode: planId.toUpperCase(),
        phoneContact: form.phoneContact.trim(),
        headquartersAddress: form.headquartersAddress.trim(),
      });

      if (response.data.checkoutUrl) {
        window.location.assign(response.data.checkoutUrl);
      } else {
        const successUrl = `/market/register/success?email=${encodeURIComponent(email)}&tenantId=${response.data.tenantId}`;
        window.location.assign(successUrl);
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? ((error.response?.data as { message?: string; detail?: string; title?: string } | undefined)?.message
            ?? (error.response?.data as { message?: string; detail?: string; title?: string } | undefined)?.detail
            ?? (error.response?.data as { message?: string; detail?: string; title?: string } | undefined)?.title
            ?? error.message)
        : (error instanceof Error ? error.message : "Unable to complete registration right now. Please try again.");
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
      <StaticMotionDiv className="w-full max-w-md px-6 py-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Link
          to={`/market/register/otp?email=${encodeURIComponent(email)}&plan=${encodeURIComponent(planId)}` as any}
          className="inline-flex items-center gap-1.5 mb-7 text-sm"
          style={{ color: "#8C6B43", fontWeight: 500 }}
        >
          <ArrowLeft size={14} />
          Back to OTP step
        </Link>

        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#2C1A0E", marginBottom: "6px", letterSpacing: "-0.02em" }}>
          Complete registration
        </h1>
        <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "18px" }}>
          Verified email: <span style={{ fontWeight: 700 }}>{email || "-"}</span>
        </p>

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
              <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p style={{ fontSize: "12px", color: "#B91C1C", fontWeight: 600 }}>{submitError}</p>
              </div>
            ) : null}

            {errors.email ? <p style={{ fontSize: "12px", color: "#EF4444" }}>{errors.email}</p> : null}
            {errors.verificationToken ? <p style={{ fontSize: "12px", color: "#EF4444" }}>{errors.verificationToken}</p> : null}

            <MarketingAuthInput label="Company Name" icon={Building2} value={form.companyName} onChange={(value) => setForm({ ...form, companyName: value })} placeholder="e.g. Brewed & True Coffee Co." error={errors.companyName} maxLength={100} />
            <MarketingAuthInput label="Full Name" icon={User} value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} placeholder="e.g. Juan dela Cruz" error={errors.fullName} maxLength={255} />
            <MarketingAuthInput label="Phone Contact" icon={Phone} value={form.phoneContact} onChange={(value) => setForm({ ...form, phoneContact: value })} placeholder="e.g. +63 2 8123 4567" error={errors.phoneContact} maxLength={50} />

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "6px" }}>
                Headquarters Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-4 pointer-events-none">
                  <MapPinHouse size={16} style={{ color: "#8C6B43" }} />
                </div>
                <textarea
                  value={form.headquartersAddress}
                  onChange={(event) => setForm({ ...form, headquartersAddress: event.target.value })}
                  placeholder="Full company address"
                  maxLength={500}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all duration-200"
                  style={{
                    border: errors.headquartersAddress ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.2)",
                    backgroundColor: "#FDFAF5",
                    fontSize: "14px",
                    color: "#2C1A0E",
                    resize: "vertical",
                    boxShadow: "0 2px 8px rgba(107,76,42,0.06)",
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = "0 0 0 3px rgba(107,76,42,0.08), 0 4px 12px rgba(107,76,42,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = "0 2px 8px rgba(107,76,42,0.06)";
                  }}
                />
              </div>
              {errors.headquartersAddress ? <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{errors.headquartersAddress}</p> : null}
            </div>

            <MarketingAuthInput label="Password" icon={Lock} type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} placeholder="Minimum 8 characters" autoComplete="new-password" error={errors.password} maxLength={100} />

            {form.password ? (
              <div className="-mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ backgroundColor: passwordStrength.score >= step ? passwordStrength.color : "#E5E7EB" }} />
                  ))}
                </div>
                {passwordStrength.label ? (
                  <p style={{ fontSize: "11px", color: passwordStrength.color, fontWeight: 600 }}>
                    {passwordStrength.label} password
                  </p>
                ) : null}
              </div>
            ) : null}

            <MarketingAuthInput label="Confirm Password" icon={Lock} type="password" value={form.confirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} placeholder="Repeat your password" autoComplete="new-password" error={errors.confirmPassword} maxLength={100} />

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
                  Completing registration...
                </>
              ) : (
                "Complete registration"
              )}
            </button>
          </form>
      </StaticMotionDiv>
    </div>
  );
}