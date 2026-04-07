import { Link } from "react-router";
import { motion } from "motion/react";
import { CheckCircle2, Mail, ArrowRight, Coffee } from "lucide-react";

export function RegisterSuccessPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        fontFamily: '"DM Sans", "Inter", sans-serif',
        background: "linear-gradient(135deg, #FDFAF5 0%, #F5EDD8 50%, #EDE0C4 100%)",
      }}
    >
      <motion.div
        className="w-full max-w-lg text-center"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success Icon */}
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ backgroundColor: "rgba(84,107,63,0.12)", border: "2px solid rgba(84,107,63,0.2)" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <CheckCircle2 size={44} style={{ color: "#546B3F" }} />
        </motion.div>

        {/* Logo */}
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
          You're All Set! ☕
        </h1>
        <p style={{ fontSize: "1rem", color: "#5C4A37", lineHeight: 1.7, marginBottom: "32px" }}>
          Your Kettan account has been created successfully. Check your email for a confirmation and login link.
        </p>

        {/* Email notice */}
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
              Check your inbox
            </p>
            <p style={{ fontSize: "13px", color: "#5C4A37", lineHeight: 1.6 }}>
              We've sent a welcome email with your login details and a direct link to your new dashboard. It may take a minute to arrive.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div
          className="rounded-2xl p-5 mb-8 text-left"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(107,76,42,0.12)" }}
        >
          <p style={{ fontWeight: 700, color: "#2C1A0E", fontSize: "13px", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Next Steps
          </p>
          <div className="space-y-3">
            {[
              { step: "1", text: "Log in to your new Kettan dashboard" },
              { step: "2", text: "Add your branch locations" },
              { step: "3", text: "Invite your HQ staff and branch managers" },
              { step: "4", text: "Configure your inventory items and reorder thresholds" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#6B4C2A", color: "#FFFFFF", fontSize: "12px", fontWeight: 700 }}
                >
                  {step}
                </div>
                <span style={{ fontSize: "13px", color: "#5C4A37" }}>{text}</span>
              </div>
            ))}
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
      </motion.div>
    </div>
  );
}
