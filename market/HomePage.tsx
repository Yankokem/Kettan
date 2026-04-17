import { Link } from "react-router";
import { StaticMotionDiv } from "./noMotion";
import {
  Package,
  ClipboardList,
  Coffee,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Building2,
  Zap,
  ShieldCheck,
  Globe,
  ChevronRight,
} from "lucide-react";
import exampleImage from "figma:asset/9aa84b79148621e7e3769a59e1c872270628300e.png";

const COFFEE_IMG = "https://images.unsplash.com/photo-1751956066306-c5684cbcf385?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzaG9wJTIwbW9kZXJuJTIwaW50ZXJpb3IlMjBjYWZlfGVufDF8fHx8MTc3NTU2NDYwMnww&ixlib=rb-4.1.0&q=80&w=1080";
const OWNER_IMG = "https://images.unsplash.com/photo-1726661025464-818c9abd6da9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzaG9wJTIwb3duZXIlMjBidXNpbmVzcyUyMG1hbmFnZW1lbnR8ZW58MXx8fHwxNzc1NTY0NjExfDA&ixlib=rb-4.1.0&q=80&w=1080";

export function HomePage() {
  return (
    <div style={{ fontFamily: '"DM Sans", "Inter", sans-serif' }}>
      {/* HERO */}
      <section
        className="relative overflow-hidden pt-12 pb-0 md:pt-20"
        style={{
          background: "linear-gradient(160deg, #FDFAF5 0%, #F5EDD8 50%, #EDE0C4 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #546B3F 0%, transparent 70%)", transform: "translate(-30%, 30%)" }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Text */}
            <StaticMotionDiv
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-6">
                <span
                  className="px-4 py-1.5 rounded-full text-sm"
                  style={{
                    backgroundColor: "rgba(107,76,42,0.1)",
                    color: "#6B4C2A",
                    fontWeight: 600,
                    border: "1px solid rgba(107,76,42,0.2)",
                  }}
                >
                   Built for Coffee Chains
                </span>
              </div>

              <h1
                className="mb-6"
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                  fontWeight: 800,
                  color: "#2C1A0E",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                }}
              >
                Run Your Entire{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #6B4C2A, #C9A84C)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Coffee Chain
                </span>{" "}
                From One Platform
              </h1>

              <p
                className="mb-8 max-w-xl mx-auto lg:mx-0"
                style={{ fontSize: "1.1rem", color: "#5C4A37", lineHeight: 1.7 }}
              >
                Kettan manages supply orders, inventory, consumption logging, and branch operations  so you can focus on brewing great coffee.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white transition-all duration-200"
                  style={{
                    backgroundColor: "#6B4C2A",
                    fontWeight: 600,
                    fontSize: "15px",
                    boxShadow: "0 4px 16px rgba(107,76,42,0.35)",
                  }}
                >
                  Get Started Free
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl transition-all duration-200 border"
                  style={{
                    color: "#6B4C2A",
                    borderColor: "rgba(107,76,42,0.3)",
                    fontWeight: 600,
                    fontSize: "15px",
                    backgroundColor: "rgba(107,76,42,0.05)",
                  }}
                >
                  See All Features
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                {["No credit card required", "14-day free trial", "Cancel anytime"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5" style={{ fontSize: "13px", color: "#8C6B43" }}>
                    <CheckCircle2 size={14} style={{ color: "#546B3F" }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </StaticMotionDiv>

            {/* Dashboard Screenshot */}
            <StaticMotionDiv
              className="flex-1 w-full max-w-2xl"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  boxShadow: "0 30px 80px rgba(107,76,42,0.25), 0 10px 30px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(107,76,42,0.15)",
                }}
              >
                {/* Browser chrome */}
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{ backgroundColor: "#2C1A0E" }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#EF4444" }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22C55E" }} />
                  <div
                    className="flex-1 mx-4 h-6 rounded-md flex items-center px-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
                  >
                    app.kettan.io/hq-inventory
                  </div>
                </div>
                <img
                  src={exampleImage}
                  alt="Kettan Dashboard - HQ Inventory & Stock"
                  className="w-full block"
                  style={{ display: "block" }}
                />
              </div>
            </StaticMotionDiv>
          </div>
        </div>

        {/* Wave */}
        <div className="mt-16">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 60V30C240 0 480 60 720 40C960 20 1200 60 1440 30V60H0Z" fill="#FDFAF5" />
          </svg>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ backgroundColor: "#FDFAF5" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <div
            className="rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(107,76,42,0.1)",
              boxShadow: "0 4px 24px rgba(107,76,42,0.07)",
              divideColor: "rgba(107,76,42,0.08)",
            }}
          >
            {[
              { value: "50+", label: "Branches Managed", icon: Building2 },
              { value: "10,000+", label: "Orders Fulfilled", icon: ClipboardList },
              { value: "99.9%", label: "Uptime SLA", icon: Zap },
              { value: "18", label: "Integrated Modules", icon: Globe },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center justify-center py-8 px-6 text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: "rgba(107,76,42,0.08)" }}
                >
                  <Icon size={18} style={{ color: "#6B4C2A" }} />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em" }}>
                  {value}
                </div>
                <div style={{ fontSize: "13px", color: "#8C6B43", marginTop: "2px", fontWeight: 500 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM STATEMENT */}
      <section className="py-20" style={{ backgroundColor: "#FDFAF5" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <StaticMotionDiv
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
              style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#DC2626", fontWeight: 600 }}
            >
              The Problem
            </span>
            <h2
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em" }}
            >
              Spreadsheets and Group Chats<br />Aren't Cutting It
            </h2>
            <p className="mt-4 max-w-2xl mx-auto" style={{ fontSize: "1rem", color: "#5C4A37", lineHeight: 1.7 }}>
              Most multi-branch coffee chains today rely on group chats, spreadsheets, and phone calls to coordinate supply requests. This approach is error-prone, hard to track, and nearly impossible to audit.
            </p>
          </StaticMotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without Kettan */}
            <StaticMotionDiv
              className="rounded-2xl p-8"
              style={{
                backgroundColor: "#FFF5F5",
                border: "1px solid rgba(220,38,38,0.15)",
              }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(220,38,38,0.1)" }}
                >
                  <XCircle size={20} style={{ color: "#DC2626" }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "#7F1D1D", fontSize: "1.1rem" }}>Without Kettan</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Supply requests sent via Viber/WhatsApp group chats",
                  "Inventory tracked in messy, error-prone spreadsheets",
                  "Branch managers manually follow up on every order",
                  "No visibility into which branches are underperforming",
                  "Expired stock goes undetected until it's too late",
                  "No audit trail  accountability is impossible",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <XCircle size={15} style={{ color: "#EF4444", flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ fontSize: "14px", color: "#7F1D1D", lineHeight: 1.6 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </StaticMotionDiv>

            {/* With Kettan */}
            <StaticMotionDiv
              className="rounded-2xl p-8"
              style={{
                backgroundColor: "#F0FBF4",
                border: "1px solid rgba(84,107,63,0.2)",
              }}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(84,107,63,0.12)" }}
                >
                  <CheckCircle2 size={20} style={{ color: "#546B3F" }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "#1A3A1A", fontSize: "1.1rem" }}>With Kettan</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Structured supply requests with one-click approval routing",
                  "Real-time inventory with batch-level FIFO tracking",
                  "Auto-alerts before stock runs out  orders drafted automatically",
                  "Weighted branch performance scoring shows who needs attention",
                  "FIFO enforcement means expired stock is never dispatched",
                  "Full audit logs with role-based accountability",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={15} style={{ color: "#546B3F", flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ fontSize: "14px", color: "#1A3A1A", lineHeight: 1.6 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </StaticMotionDiv>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(180deg, #F5EDD8 0%, #EDE0C4 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <StaticMotionDiv
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
              style={{ backgroundColor: "rgba(107,76,42,0.12)", color: "#6B4C2A", fontWeight: 600 }}
            >
              Core Capabilities
            </span>
            <h2
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em" }}
            >
              Everything Your Coffee Chain Needs
            </h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ fontSize: "1rem", color: "#5C4A37", lineHeight: 1.7 }}>
              18 integrated modules covering every aspect of your coffee chain operations.
            </p>
          </StaticMotionDiv>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Package,
                color: "#6B4C2A",
                bg: "rgba(107,76,42,0.08)",
                title: "Smart Inventory",
                desc: "Track stock across HQ and every branch with batch-level FIFO precision and EOQ-powered reorder suggestions.",
              },
              {
                icon: ClipboardList,
                color: "#546B3F",
                bg: "rgba(84,107,63,0.1)",
                title: "Order Fulfillment",
                desc: "From supply request to doorstep delivery  every step tracked, approved, and audited automatically.",
              },
              {
                icon: Coffee,
                color: "#C9A84C",
                bg: "rgba(201,168,76,0.12)",
                title: "Consumption Logging",
                desc: "Log sales, deduct ingredients automatically via recipe mapping. No separate POS system required.",
              },
              {
                icon: BarChart3,
                color: "#3B82F6",
                bg: "rgba(59,130,246,0.1)",
                title: "Branch Analytics",
                desc: "See which branches perform best with Weighted Branch Performance Scoring across key metrics.",
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <StaticMotionDiv
                key={title}
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(107,76,42,0.1)",
                  boxShadow: "0 4px 20px rgba(107,76,42,0.06)",
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(107,76,42,0.12)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: bg }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "#2C1A0E", marginBottom: "10px", fontSize: "1rem" }}>
                  {title}
                </h3>
                <p style={{ fontSize: "14px", color: "#5C4A37", lineHeight: 1.65 }}>{desc}</p>
              </StaticMotionDiv>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200"
              style={{ color: "#6B4C2A", borderColor: "rgba(107,76,42,0.3)", fontWeight: 600, fontSize: "14px", backgroundColor: "rgba(255,255,255,0.8)" }}
            >
              View All 18 Modules
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-20" style={{ backgroundColor: "#FDFAF5" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <StaticMotionDiv
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
              style={{ backgroundColor: "rgba(84,107,63,0.1)", color: "#546B3F", fontWeight: 600 }}
            >
              Built For Your Team
            </span>
            <h2
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em" }}
            >
              Every Role Has a Purpose-Built Workspace
            </h2>
          </StaticMotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Coffee Chain Owners",
                subtitle: "Full visibility, zero daily involvement required",
                desc: "Get chain-wide performance dashboards, financial reports, and branch rankings  without needing to micromanage every order.",
                features: ["Chain-wide analytics", "Revenue & cost reports", "Branch performance scores"],
                color: "#6B4C2A",
                bg: "linear-gradient(135deg, #FDF8F0 0%, #F5E8D0 100%)",
              },
              {
                icon: Package,
                title: "HQ Operations Teams",
                subtitle: "Precision fulfillment at every step",
                desc: "Manage HQ inventory, approve orders with one click, guide staff through FIFO-compliant picking and packing, and dispatch via EasyPost.",
                features: ["Order approval workflows", "FIFO batch picking", "EasyPost shipping integration"],
                color: "#546B3F",
                bg: "linear-gradient(135deg, #F0FBF4 0%, #E0F0E8 100%)",
              },
              {
                icon: Users,
                title: "Branch Managers",
                subtitle: "Keep your branch running without the chaos",
                desc: "Log daily consumption, submit supply requests, track deliveries in real-time, and manage your branch staff  all from one screen.",
                features: ["Consumption logging", "Supply request tracking", "Delivery confirmation"],
                color: "#3B82F6",
                bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
              },
            ].map(({ icon: Icon, title, subtitle, desc, features, color, bg }) => (
              <StaticMotionDiv
                key={title}
                className="rounded-2xl p-7"
                style={{
                  background: bg,
                  border: `1px solid ${color}22`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "#2C1A0E", fontSize: "1.05rem", marginBottom: "4px" }}>
                  {title}
                </h3>
                <p style={{ fontSize: "13px", color, fontWeight: 600, marginBottom: "12px" }}>{subtitle}</p>
                <p style={{ fontSize: "14px", color: "#5C4A37", lineHeight: 1.65, marginBottom: "16px" }}>{desc}</p>
                <ul className="space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 size={13} style={{ color, flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: "#5C4A37" }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </StaticMotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO STRIP */}
      <section className="py-16 overflow-hidden" style={{ backgroundColor: "#F5EDD8" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
                style={{ backgroundColor: "rgba(107,76,42,0.12)", color: "#6B4C2A", fontWeight: 600 }}
              >
                Trusted Operations
              </span>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em", marginBottom: "16px" }}>
                Built for the Real World of Coffee Operations
              </h2>
              <p style={{ fontSize: "15px", color: "#5C4A37", lineHeight: 1.7, marginBottom: "24px" }}>
                From a single flagship store expanding to its second branch, to a chain with 30+ locations  Kettan scales with your business.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Multi-tenant isolation", desc: "Your data is always private and secure." },
                  { label: "Role-based access", desc: "6 roles, each with the right permissions." },
                  { label: "EOQ Algorithm", desc: "Optimal reorder quantities to cut inventory costs." },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <ShieldCheck size={16} style={{ color: "#546B3F", marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 600, color: "#2C1A0E", fontSize: "14px" }}>{label}</span>
                      <span style={{ color: "#8C6B43", fontSize: "14px" }}>  {desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden" style={{ height: "220px" }}>
                <img src={COFFEE_IMG} alt="Coffee shop" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden mt-8" style={{ height: "220px" }}>
                <img src={OWNER_IMG} alt="Coffee chain owner" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(135deg, #2C1A0E 0%, #4A3418 50%, #3D5029 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <StaticMotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-6"
              style={{ backgroundColor: "rgba(201,168,76,0.2)", color: "#C9A84C", fontWeight: 600 }}
            >
               Start Today
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                fontWeight: 800,
                color: "#F5F0E8",
                letterSpacing: "-0.02em",
                marginBottom: "16px",
              }}
            >
              Ready to Streamline Your Coffee Chain?
            </h2>
            <p style={{ fontSize: "1.05rem", color: "#C9A87D", lineHeight: 1.7, marginBottom: "36px", maxWidth: "500px", margin: "0 auto 36px" }}>
              Join coffee chain operators who've replaced their spreadsheets with Kettan's unified platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: "#C9A84C",
                  color: "#2C1A0E",
                  fontWeight: 700,
                  fontSize: "15px",
                  boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
                }}
              >
                Get Started  It's Free to Try
                <ArrowRight size={16} />
              </Link>
              <a
                href="mailto:sales@kettan.io"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border transition-all duration-200"
                style={{
                  borderColor: "rgba(201,168,125,0.4)",
                  color: "#C9A87D",
                  fontWeight: 600,
                  fontSize: "15px",
                }}
              >
                Talk to Sales 
              </a>
            </div>
          </StaticMotionDiv>
        </div>
      </section>
    </div>
  );
}

