import { Link } from "react-router";
import { StaticMotionDiv } from "./noMotion";
import {
  ClipboardList,
  Package,
  Truck,
  MapPin,
  RotateCcw,
  BarChart3,
  Coffee,
  Users,
  Building2,
  UserCog,
  DollarSign,
  Bell,
  Settings,
  Shield,
  HeadphonesIcon,
  BookOpen,
  CreditCard,
  Network,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Calculator,
  TrendingUp,
  Lock,
} from "lucide-react";

const INVENTORY_IMG = "https://images.unsplash.com/photo-1774946103680-3d34a461a581?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzdXBwbHklMjBjaGFpbiUyMGludmVudG9yeSUyMHdhcmVob3VzZXxlbnwxfHx8fDE3NzU1NjQ2MDV8MA&ixlib=rb-4.1.0&q=80&w=1080";

const coreModules = [
  {
    icon: ClipboardList,
    title: "Order Processing",
    color: "#6B4C2A",
    bg: "rgba(107,76,42,0.08)",
    badge: "Core OFMS",
    badgeColor: "#6B4C2A",
    badgeBg: "rgba(107,76,42,0.1)",
    desc: "Receive and validate supply requests from branches. Features item selection, quantity management, urgency flagging, and intelligent approval routing - auto-approve small orders, require HQ Manager sign-off for large ones.",
    highlights: ["Auto-approval under threshold", "Multi-item request support", "Urgency flagging", "Partial fulfillment support"],
  },
  {
    icon: Package,
    title: "Picking & Packing",
    color: "#546B3F",
    bg: "rgba(84,107,63,0.1)",
    badge: "Core OFMS",
    badgeColor: "#546B3F",
    badgeBg: "rgba(84,107,63,0.1)",
    desc: "Guide HQ warehouse staff through retrieving and preparing approved order items. FIFO deduction is enforced automatically by batch, ensuring oldest stock ships first. Partial fulfillment notifies branches instantly.",
    highlights: ["FIFO-enforced batch picking", "Guided packing workflow", "Partial fulfillment handling", "Batch ID tracking"],
  },
  {
    icon: Truck,
    title: "Shipping & Delivery",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.1)",
    badge: "Core OFMS",
    badgeColor: "#3B82F6",
    badgeBg: "rgba(59,130,246,0.1)",
    desc: "Manage dispatch logistics via EasyPost API. Assign couriers, generate tracking numbers, calculate delivery distance via Google Maps, and record estimated arrival times.",
    highlights: ["EasyPost API integration", "Courier assignment", "Google Maps distance calc", "ETD recording"],
  },
  {
    icon: MapPin,
    title: "Order Tracking",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.1)",
    badge: "Core OFMS",
    badgeColor: "#8B5CF6",
    badgeBg: "rgba(139,92,246,0.1)",
    desc: "Provide real-time delivery status visibility for both HQ and branch users - from dispatch through delivery confirmation. Clear, actionable status updates at every step. No confusing map interfaces.",
    highlights: ["Real-time status updates", "HQ + branch visibility", "Delivery confirmation", "Status timeline view"],
  },
  {
    icon: RotateCcw,
    title: "Returns Management",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.1)",
    badge: "Core OFMS",
    badgeColor: "#EF4444",
    badgeBg: "rgba(239,68,68,0.1)",
    desc: "Handle branch-initiated returns for damaged or incorrect goods. Branches file a return with photos and reason; HQ reviews and issues a replacement shipment or credit memo.",
    highlights: ["Branch return filing", "HQ review workflow", "Replacement dispatch", "Credit memo generation"],
  },
];

const additionalModules = [
  { icon: Package, title: "Inventory Management", desc: "Batch-level stock tracking with FIFO deduction and EOQ reorder suggestions.", color: "#6B4C2A" },
  { icon: Coffee, title: "Consumption Logging", desc: "3 logging methods: direct entry, recipe-based auto-deduction, and physical stock count.", color: "#C9A84C" },
  { icon: UserCog, title: "User & Role Management", desc: "6-tier RBAC: Super Admin, Tenant Admin, HQ Manager, HQ Staff, Branch Owner, Branch Manager.", color: "#546B3F" },
  { icon: Building2, title: "Tenant & Branch Management", desc: "Onboard chains, register branches, configure profiles, and manage subscriptions.", color: "#3B82F6" },
  { icon: Users, title: "HR & Staff Management", desc: "Employee records, role assignments, scheduling, and department groupings.", color: "#8B5CF6" },
  { icon: DollarSign, title: "Finance & Reports", desc: "Cost aggregation, delivery expenses, invoices, and visual branch performance dashboards.", color: "#16A34A" },
  { icon: Bell, title: "Notifications & Alerts", desc: "In-app + email alerts for low stock, order updates, delivery confirmations, and returns.", color: "#F59E0B" },
  { icon: Settings, title: "Settings & Configuration", desc: "Configure reorder thresholds, approval rules, branch hours, and notification preferences.", color: "#6B7280" },
  { icon: HeadphonesIcon, title: "Support & Helpdesk", desc: "In-platform support tickets with status tracking for all tenants.", color: "#EC4899" },
  { icon: BookOpen, title: "Audit Logs & Monitoring", desc: "Full audit trail of significant user actions across the platform.", color: "#0EA5E9" },
  { icon: CreditCard, title: "Subscription & Billing", desc: "PayMongo-powered billing with tier management and invoice delivery via SendGrid.", color: "#F97316" },
  { icon: Network, title: "Supplier Portal", desc: "External-facing module for registered suppliers to receive and confirm purchase orders.", color: "#14B8A6" },
];

export function FeaturesPage() {
  return (
    <div style={{ fontFamily: '"DM Sans", "Inter", sans-serif' }}>
      {/* HEADER */}
      <section
        className="pt-16 pb-16"
        style={{ background: "linear-gradient(160deg, #FDFAF5 0%, #F5EDD8 60%, #EDE0C4 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <StaticMotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-5"
              style={{ backgroundColor: "rgba(107,76,42,0.1)", color: "#6B4C2A", fontWeight: 600 }}
            >
              Platform Features
            </span>
            <h1
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                fontWeight: 800,
                color: "#2C1A0E",
                letterSpacing: "-0.02em",
                marginBottom: "16px",
              }}
            >
              Everything You Need to Run a Coffee Chain
            </h1>
            <p style={{ fontSize: "1.05rem", color: "#5C4A37", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" }}>
              18 integrated modules. One unified platform. Purpose-built for multi-branch coffee chain operations.
            </p>
          </StaticMotionDiv>
        </div>
      </section>

      {/* CORE OFMS MODULES */}
      <section className="py-20" style={{ backgroundColor: "#FDFAF5" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
              style={{ backgroundColor: "rgba(107,76,42,0.08)", color: "#6B4C2A", fontWeight: 600 }}
            >
              OFMS Core - 5 Modules
            </span>
            <h2
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em" }}
            >
              The 5 Order Fulfillment Modules
            </h2>
            <p className="mt-3 max-w-xl mx-auto" style={{ fontSize: "14px", color: "#5C4A37", lineHeight: 1.7 }}>
              Based on the Order Fulfillment Management System (OFMS) framework - covering the complete supply fulfillment cycle.
            </p>
          </div>

          <div className="space-y-6">
            {coreModules.map(({ icon: Icon, title, color, bg, badge, badgeColor, badgeBg, desc, highlights }, i) => (
              <StaticMotionDiv
                key={title}
                className="rounded-2xl p-7 flex flex-col md:flex-row gap-6"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(107,76,42,0.1)",
                  boxShadow: "0 4px 20px rgba(107,76,42,0.05)",
                }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon size={26} style={{ color }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 style={{ fontWeight: 700, color: "#2C1A0E", fontSize: "1.05rem" }}>{title}</h3>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: badgeBg, color: badgeColor, fontWeight: 600 }}
                    >
                      {badge}
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#5C4A37", lineHeight: 1.7, marginBottom: "14px" }}>{desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((h) => (
                      <span
                        key={h}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                        style={{ backgroundColor: `${color}10`, color, fontWeight: 500 }}
                      >
                        <CheckCircle2 size={10} />
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </StaticMotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ADDITIONAL MODULES GRID */}
      <section
        className="py-20"
        style={{ background: "linear-gradient(180deg, #F5EDD8 0%, #EDE0C4 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
              style={{ backgroundColor: "rgba(84,107,63,0.1)", color: "#546B3F", fontWeight: 600 }}
            >
              Additional Modules - 13 More
            </span>
            <h2
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em" }}
            >
              Full Operational Coverage
            </h2>
            <p className="mt-3 max-w-xl mx-auto" style={{ fontSize: "14px", color: "#5C4A37", lineHeight: 1.7 }}>
              Beyond the OFMS core, Kettan includes everything needed to manage your people, finances, and platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {additionalModules.map(({ icon: Icon, title, desc, color }, i) => (
              <StaticMotionDiv
                key={title}
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(107,76,42,0.1)",
                  boxShadow: "0 2px 12px rgba(107,76,42,0.05)",
                }}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(107,76,42,0.1)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${color}12` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "#2C1A0E", fontSize: "0.95rem", marginBottom: "6px" }}>
                  {title}
                </h3>
                <p style={{ fontSize: "13px", color: "#5C4A37", lineHeight: 1.65 }}>{desc}</p>
              </StaticMotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ALGORITHMS */}
      <section className="py-20" style={{ backgroundColor: "#FDFAF5" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
              style={{ backgroundColor: "rgba(201,168,76,0.15)", color: "#8B6A1A", fontWeight: 600 }}
            >
              Smart Algorithms
            </span>
            <h2
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em" }}
            >
              Intelligence Built Into Every Decision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Calculator,
                title: "EOQ - Economic Order Quantity",
                color: "#6B4C2A",
                bg: "linear-gradient(135deg, #FDF8F0 0%, #F5E8D0 100%)",
                border: "rgba(107,76,42,0.15)",
                desc: "When stock falls below threshold, Kettan doesn't just alert you - it calculates the mathematically optimal reorder quantity that minimizes your total inventory costs, balancing ordering frequency against holding costs.",
                points: [
                  "Minimizes total inventory cost (ordering + holding)",
                  "Applied when auto-drafting supply requests",
                  "Configurable per item per branch",
                  "Based on demand rate, order cost, and holding cost",
                ],
              },
              {
                icon: TrendingUp,
                title: "Weighted Branch Performance Scoring",
                color: "#546B3F",
                bg: "linear-gradient(135deg, #F0FBF4 0%, #DFF0E8 100%)",
                border: "rgba(84,107,63,0.2)",
                desc: "Every branch gets a composite performance score calculated from four key operational metrics, weighted by importance. This turns raw fulfillment data into actionable branch rankings that identify who needs attention.",
                points: [
                  "Fulfillment rate - orders completed on time",
                  "Return rate - items sent back due to errors",
                  "Delivery speed - average time from dispatch to delivery",
                  "Stock accuracy - physical count vs system stock",
                ],
              },
            ].map(({ icon: Icon, title, color, bg, border, desc, points }) => (
              <StaticMotionDiv
                key={title}
                className="rounded-2xl p-8"
                style={{ background: bg, border: `1px solid ${border}` }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "#2C1A0E", fontSize: "1.1rem", marginBottom: "12px" }}>
                  {title}
                </h3>
                <p style={{ fontSize: "14px", color: "#5C4A37", lineHeight: 1.7, marginBottom: "16px" }}>{desc}</p>
                <ul className="space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 size={13} style={{ color, marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: "#5C4A37" }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </StaticMotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section
        className="py-20"
        style={{ background: "linear-gradient(135deg, #2C1A0E 0%, #3D5029 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
              style={{ backgroundColor: "rgba(201,168,76,0.2)", color: "#C9A84C", fontWeight: 600 }}
            >
              Security & Architecture
            </span>
            <h2
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#F5F0E8", letterSpacing: "-0.02em" }}
            >
              Enterprise-Grade Security by Design
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Lock, title: "Multi-Tenant Isolation", desc: "Each coffee chain's data is completely isolated. No cross-tenant data access - ever." },
              { icon: Shield, title: "JWT Authentication", desc: "Secure token-based authentication with server-side validation on every request." },
              { icon: UserCog, title: "6-Role RBAC", desc: "Role-Based Access Control governs every action. Users only see what their role permits." },
              { icon: BookOpen, title: "Audit Logging", desc: "Every significant action is recorded with user, timestamp, and context for full accountability." },
            ].map(({ icon: Icon, title, desc }) => (
              <StaticMotionDiv
                key={title}
                className="rounded-2xl p-6 text-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(201,168,125,0.15)",
                }}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "rgba(201,168,76,0.15)" }}
                >
                  <Icon size={22} style={{ color: "#C9A84C" }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "#F5F0E8", fontSize: "0.95rem", marginBottom: "8px" }}>{title}</h3>
                <p style={{ fontSize: "13px", color: "#A39C93", lineHeight: 1.65 }}>{desc}</p>
              </StaticMotionDiv>
            ))}
          </div>

          {/* Tech Stack */}
          <div
            className="mt-12 rounded-2xl p-6"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,125,0.1)" }}
          >
            <p style={{ color: "#C9A87D", fontWeight: 600, marginBottom: "16px", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Technology Stack
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                "ASP.NET Core (C#)", "React + Vite", "Tailwind CSS",
                "SQL Server + EF Core", "JWT Auth", "EasyPost",
                "PayMongo", "SendGrid", "Google Maps API", "Cloudinary", "Azure / IIS",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 rounded-lg text-sm"
                  style={{
                    backgroundColor: "rgba(201,168,125,0.1)",
                    color: "#C9A87D",
                    fontWeight: 500,
                    border: "1px solid rgba(201,168,125,0.15)",
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: "#FDFAF5" }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em", marginBottom: "14px" }}>
            See It in Action
          </h2>
          <p style={{ fontSize: "15px", color: "#5C4A37", marginBottom: "28px", lineHeight: 1.7 }}>
            All 18 modules. One subscription. Scale as your chain grows.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white transition-all duration-200"
            style={{
              backgroundColor: "#6B4C2A",
              fontWeight: 600,
              fontSize: "15px",
              boxShadow: "0 4px 16px rgba(107,76,42,0.3)",
            }}
          >
            View Pricing Plans
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

