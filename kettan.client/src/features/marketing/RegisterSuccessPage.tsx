import { Link } from "@tanstack/react-router";
import { StaticMotionDiv } from "./noMotion";
import { CheckCircle2, ArrowRight, Coffee, Mail } from "lucide-react";

export function RegisterSuccessPage() {
  const email = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("email");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        fontFamily: '"DM Sans", "Inter", sans-serif',
        background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 50%, #EDE0C4 100%)",
      }}
    >
      <StaticMotionDiv
        className="w-full max-w-lg text-center"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StaticMotionDiv
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ backgroundColor: "rgba(84,107,63,0.12)", border: "2px solid rgba(84,107,63,0.2)" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <CheckCircle2 size={44} style={{ color: "#546B3F" }} />
        </StaticMotionDiv>

        <div className="flex items-center justify-center gap-2 mb-6">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M16 5C12.5 5 7.5 9 7.5 15.5C7.5 20 10 23 14 24.5L15.5 14.5L22.5 13C19 13.5 16.5 15 15 18C13.5 21 14 24.5 14 24.5C16 25 24.5 21.5 24.5 15.5C24.5 9 19.5 5 16 5Z" fill="#6B4C2A" />
            <path d="M14 24.5C11.5 24 9.5 21.5 8.5 19L15.5 14.5L14 24.5Z" fill="#546B3F" fillOpacity="0.8" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: "13px", color: "#2C1A0E", letterSpacing: "0.15em" }}>KETTAN</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 800,
            color: "#2C1A0E",
            letterSpacing: "-0.02em",
            marginBottom: "14px",
          }}
        >
          Registration Complete
        </h1>
        <p style={{ fontSize: "1rem", color: "#5C4A37", lineHeight: 1.7, marginBottom: "20px" }}>
          Your account has been created successfully. You can now sign in and start using your dashboard.
        </p>

        <div
          className="rounded-xl px-4 py-3 mb-6"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(107,76,42,0.12)" }}
        >
          <p style={{ fontSize: "12px", color: "#166534", fontWeight: 700 }}>
            Email verified and account activated.
          </p>
        </div>

        <div
          className="rounded-2xl p-5 mb-8 flex items-start gap-4 text-left"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(107,76,42,0.12)",
            boxShadow: "0 4px 20px rgba(107,76,42,0.06)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(107,76,42,0.08)" }}
          >
            <Mail size={18} style={{ color: "#6B4C2A" }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "#2C1A0E", fontSize: "14px", marginBottom: "4px" }}>
              Welcome email sent
            </p>
            <p style={{ fontSize: "13px", color: "#5C4A37", lineHeight: 1.6 }}>
              {email ? `A welcome email was sent to ${email}.` : "A welcome email was sent to your registered address."} Use your credentials to log in.
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl text-white transition-all duration-200"
          style={{
            backgroundColor: "#6B4C2A",
            fontWeight: 700,
            fontSize: "15px",
            boxShadow: "0 4px 16px rgba(107,76,42,0.3)",
          }}
        >
          <Coffee size={18} />
          Login to Your Dashboard
          <ArrowRight size={16} />
        </Link>

        <p style={{ fontSize: "12px", color: "#A39C93", marginTop: "16px" }}>
          Need help?{" "}
          <a href="mailto:support@kettan.io" style={{ color: "#6B4C2A", fontWeight: 600 }}>
            Contact support
          </a>
        </p>
      </StaticMotionDiv>
    </div>
  );
}
