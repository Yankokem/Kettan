import { Link } from "@tanstack/react-router";
import { StaticMotionDiv } from "./noMotion";
import { CheckCircle2, ArrowRight, Coffee, Mail } from "lucide-react";
import logo from "../../assets/logo.png";

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

        <div className="flex items-center justify-center mb-6">
          <img src={logo} alt="Kettan" width="140" />
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
