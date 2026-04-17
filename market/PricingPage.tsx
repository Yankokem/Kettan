import { useState } from "react";
import { Link } from "react-router";
import { StaticAnimatePresence, StaticMotionDiv } from "./noMotion";
import { Check, X, ChevronDown, ArrowRight, Star, Zap, Building2, Globe } from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    color: "#6B4C2A",
    bg: "#FFFFFF",
    tagline: "Perfect for small coffee chains",
    target: "1-3 branches",
    monthlyPrice: 2999,
    annualPrice: 28800,
    monthlyLabel: "PHP 2,999",
    annualLabel: "PHP 28,800",
    popular: false,
    branches: "Up to 3",
    users: "Up to 10",
    support: "Email",
    cta: "Get Started",
    ctaBg: "#6B4C2A",
    ctaColor: "#FFFFFF",
    modules: [
      "Order Processing",
      "Picking & Packing",
      "Shipping & Delivery",
      "Order Tracking",
      "Returns Management",
      "Inventory Management",
      "Consumption Logging",
      "User & Role Management",
      "Notifications & Alerts",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    icon: Building2,
    color: "#FFFFFF",
    bg: "#2C1A0E",
    tagline: "For growing multi-branch chains",
    target: "4-15 branches",
    monthlyPrice: 7999,
    annualPrice: 76800,
    monthlyLabel: "PHP 7,999",
    annualLabel: "PHP 76,800",
    popular: true,
    branches: "Up to 15",
    users: "Up to 50",
    support: "Email + Chat",
    cta: "Get Started",
    ctaBg: "#C9A84C",
    ctaColor: "#2C1A0E",
    modules: [
      "All Starter Modules",
      "HR & Staff Management",
      "Finance & Reports",
      "Tenant & Branch Management",
      "Settings & Configuration",
      "Support & Helpdesk",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Globe,
    color: "#6B4C2A",
    bg: "#FFFFFF",
    tagline: "Unlimited scale, premium support",
    target: "16+ branches",
    monthlyPrice: 14999,
    annualPrice: 143990,
    monthlyLabel: "PHP 14,999",
    annualLabel: "PHP 143,990",
    popular: false,
    branches: "Unlimited",
    users: "Unlimited",
    support: "Dedicated Account Manager",
    cta: "Contact Sales",
    ctaBg: "#546B3F",
    ctaColor: "#FFFFFF",
    modules: [
      "All Growth Modules",
      "Platform Analytics",
      "Audit Logs & Monitoring",
      "Subscription & Billing",
      "Supplier Portal",
      "Priority Support",
      "API Access",
    ],
  },
];

const allFeatures = [
  { name: "Order Processing", starter: true, growth: true, enterprise: true },
  { name: "Picking & Packing", starter: true, growth: true, enterprise: true },
  { name: "Shipping & Delivery", starter: true, growth: true, enterprise: true },
  { name: "Order Tracking", starter: true, growth: true, enterprise: true },
  { name: "Returns Management", starter: true, growth: true, enterprise: true },
  { name: "Inventory Management", starter: true, growth: true, enterprise: true },
  { name: "Consumption Logging", starter: true, growth: true, enterprise: true },
  { name: "User & Role Management", starter: true, growth: true, enterprise: true },
  { name: "Notifications & Alerts", starter: true, growth: true, enterprise: true },
  { name: "HR & Staff Management", starter: false, growth: true, enterprise: true },
  { name: "Finance & Reports", starter: false, growth: true, enterprise: true },
  { name: "Tenant & Branch Management", starter: false, growth: true, enterprise: true },
  { name: "Settings & Configuration", starter: false, growth: true, enterprise: true },
  { name: "Support & Helpdesk", starter: false, growth: true, enterprise: true },
  { name: "Platform Analytics", starter: false, growth: false, enterprise: true },
  { name: "Audit Logs & Monitoring", starter: false, growth: false, enterprise: true },
  { name: "Subscription & Billing", starter: false, growth: false, enterprise: true },
  { name: "Supplier Portal", starter: false, growth: false, enterprise: true },
  { name: "Priority Support", starter: false, growth: false, enterprise: true },
  { name: "API Access", starter: false, growth: false, enterprise: true },
];

const faqs = [
  {
    q: "Can I upgrade my plan later?",
    a: "Yes, you can upgrade at any time. The difference is prorated - you only pay the difference for the remaining billing period.",
  },
  {
    q: "Is there a free trial?",
    a: "We offer a 14-day free trial on any plan. No credit card required to start. You'll only be billed after your trial period ends.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept credit/debit cards, GCash, and bank transfer via PayMongo. All transactions are secured by PayMongo's PCI-compliant gateway.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, cancel anytime from your billing dashboard. Your data is retained for 30 days after cancellation before being permanently deleted.",
  },
  {
    q: "What happens when I exceed my branch limit?",
    a: "You'll receive a notification prompting you to upgrade. You can continue operating your existing branches normally until you're ready to upgrade.",
  },
  {
    q: "Is the pricing in Philippine Peso?",
    a: "Yes, all prices are in Philippine Peso (PHP). Kettan is designed for Philippine coffee chain operators and processes payments via PayMongo.",
  },
];

function PlanCard({ plan, isAnnual }: { plan: typeof plans[0]; isAnnual: boolean }) {
  const price = isAnnual ? plan.annualLabel : plan.monthlyLabel;
  const period = isAnnual ? "/yr" : "/mo";
  const Icon = plan.icon;

  return (
    <StaticMotionDiv
      className="relative rounded-2xl p-7 flex flex-col h-full"
      style={{
        backgroundColor: plan.bg,
        border: plan.popular ? "2px solid #C9A84C" : "1px solid rgba(107,76,42,0.15)",
        boxShadow: plan.popular
          ? "0 20px 60px rgba(44,26,14,0.25)"
          : "0 4px 20px rgba(107,76,42,0.08)",
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {plan.popular && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full flex items-center gap-1.5"
          style={{ backgroundColor: "#C9A84C", color: "#2C1A0E", fontSize: "12px", fontWeight: 700 }}
        >
          <Star size={11} fill="#2C1A0E" />
          MOST POPULAR
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: plan.popular ? "rgba(201,168,76,0.2)" : "rgba(107,76,42,0.08)" }}
        >
          <Icon size={20} style={{ color: plan.popular ? "#C9A84C" : "#6B4C2A" }} />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h3 style={{ fontWeight: 800, fontSize: "1.2rem", color: plan.popular ? "#F5F0E8" : "#2C1A0E" }}>
            {plan.name}
          </h3>
        </div>
        <p style={{ fontSize: "13px", color: plan.popular ? "#A39C93" : "#8C6B43", marginBottom: "14px" }}>
          {plan.tagline}
        </p>

        <StaticAnimatePresence mode="wait">
          <StaticMotionDiv
            key={isAnnual ? "annual" : "monthly"}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-end gap-1">
              <span style={{ fontSize: "2.2rem", fontWeight: 800, color: plan.popular ? "#F5F0E8" : "#2C1A0E", letterSpacing: "-0.03em" }}>
                {price}
              </span>
              <span style={{ fontSize: "14px", color: plan.popular ? "#A39C93" : "#8C6B43", marginBottom: "5px" }}>
                {period}
              </span>
            </div>
            {isAnnual && (
              <p style={{ fontSize: "12px", color: plan.popular ? "#93AF7E" : "#546B3F", fontWeight: 600, marginTop: "2px" }}>
                Save 20% vs monthly billing
              </p>
            )}
          </StaticMotionDiv>
        </StaticAnimatePresence>
      </div>

      {/* Limits */}
      <div
        className="rounded-xl p-4 mb-6 grid grid-cols-3 gap-2"
        style={{ backgroundColor: plan.popular ? "rgba(255,255,255,0.06)" : "rgba(107,76,42,0.04)" }}
      >
        {[
          { label: "Branches", value: plan.branches },
          { label: "Users", value: plan.users },
          { label: "Support", value: plan.support },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div style={{ fontWeight: 700, fontSize: "12px", color: plan.popular ? "#F5F0E8" : "#2C1A0E" }}>
              {value}
            </div>
            <div style={{ fontSize: "10px", color: plan.popular ? "#6B5A4E" : "#8C6B43", fontWeight: 500, marginTop: "1px" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <ul className="space-y-2 flex-1 mb-7">
        {plan.modules.map((m) => (
          <li key={m} className="flex items-center gap-2.5">
            <Check size={14} style={{ color: plan.popular ? "#C9A84C" : "#546B3F", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: plan.popular ? "#C9A87D" : "#5C4A37" }}>{m}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        to={plan.id === "enterprise" ? "mailto:sales@kettan.io" : `/register?plan=${plan.id}`}
        className="block w-full text-center px-5 py-3.5 rounded-xl transition-all duration-200"
        style={{
          backgroundColor: plan.ctaBg,
          color: plan.ctaColor,
          fontWeight: 700,
          fontSize: "14px",
          boxShadow: plan.popular ? "0 4px 16px rgba(201,168,76,0.3)" : "none",
        }}
      >
        {plan.cta} ->
      </Link>
      {plan.id !== "enterprise" && (
        <p style={{ textAlign: "center", fontSize: "11px", color: plan.popular ? "#6B5A4E" : "#A39C93", marginTop: "8px" }}>
          14-day free trial - No credit card required
        </p>
      )}
    </StaticMotionDiv>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(107,76,42,0.12)", backgroundColor: "#FFFFFF" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
        style={{ backgroundColor: "transparent" }}
      >
        <span style={{ fontWeight: 600, color: "#2C1A0E", fontSize: "15px" }}>{q}</span>
        <StaticMotionDiv animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} style={{ color: "#6B4C2A", flexShrink: 0 }} />
        </StaticMotionDiv>
      </button>
      <StaticAnimatePresence>
        {open && (
          <StaticMotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-6 pb-5"
              style={{
                fontSize: "14px",
                color: "#5C4A37",
                lineHeight: 1.7,
                borderTop: "1px solid rgba(107,76,42,0.08)",
                paddingTop: "14px",
              }}
            >
              {a}
            </div>
          </StaticMotionDiv>
        )}
      </StaticAnimatePresence>
    </div>
  );
}

export function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div style={{ fontFamily: '"DM Sans", "Inter", sans-serif' }}>
      {/* HEADER */}
      <section
        className="pt-16 pb-12"
        style={{ background: "linear-gradient(160deg, #FDFAF5 0%, #F5EDD8 60%, #EDE0C4 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <StaticMotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm mb-5"
              style={{ backgroundColor: "rgba(107,76,42,0.1)", color: "#6B4C2A", fontWeight: 600 }}
            >
             Simple Pricing
            </span>
            <h1
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                fontWeight: 800,
                color: "#2C1A0E",
                letterSpacing: "-0.02em",
                marginBottom: "14px",
              }}
            >
              Simple, Transparent Pricing
            </h1>
            <p style={{ fontSize: "1.05rem", color: "#5C4A37", lineHeight: 1.7, maxWidth: "500px", margin: "0 auto 28px" }}>
              Choose the plan that fits your chain. Scale when you're ready.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-xl" style={{ backgroundColor: "rgba(107,76,42,0.08)", border: "1px solid rgba(107,76,42,0.12)" }}>
              <button
                onClick={() => setIsAnnual(false)}
                className="px-5 py-2 rounded-lg text-sm transition-all duration-200"
                style={{
                  backgroundColor: !isAnnual ? "#6B4C2A" : "transparent",
                  color: !isAnnual ? "#FFFFFF" : "#6B4C2A",
                  fontWeight: 600,
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className="px-5 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2"
                style={{
                  backgroundColor: isAnnual ? "#6B4C2A" : "transparent",
                  color: isAnnual ? "#FFFFFF" : "#6B4C2A",
                  fontWeight: 600,
                }}
              >
                Annually
                <span
                  className="px-1.5 py-0.5 rounded-md text-xs"
                  style={{ backgroundColor: "#C9A84C", color: "#2C1A0E", fontWeight: 700, fontSize: "10px" }}
                >
                  -20%
                </span>
              </button>
            </div>
          </StaticMotionDiv>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="py-14" style={{ backgroundColor: "#FDFAF5" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, i) => (
              <StaticMotionDiv
                key={plan.id}
                className="flex"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="w-full">
                  <PlanCard plan={plan} isAnnual={isAnnual} />
                </div>
              </StaticMotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section
        className="py-16"
        style={{ background: "linear-gradient(180deg, #F5EDD8 0%, #EDE0C4 100%)" }}
      >
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em" }}>
              Full Feature Comparison
            </h2>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(107,76,42,0.15)", boxShadow: "0 4px 24px rgba(107,76,42,0.08)" }}
          >
            {/* Table Header */}
            <div
              className="grid grid-cols-4 gap-0"
              style={{ backgroundColor: "#2C1A0E" }}
            >
              <div className="px-5 py-4" style={{ color: "#C9A87D", fontWeight: 600, fontSize: "13px" }}>Module</div>
              {["Starter", "Growth", "Enterprise"].map((name) => (
                <div key={name} className="px-5 py-4 text-center" style={{ color: "#C9A87D", fontWeight: 700, fontSize: "13px" }}>
                  {name}
                </div>
              ))}
            </div>

            {/* Table Rows */}
            {allFeatures.map((feature, i) => (
              <div
                key={feature.name}
                className="grid grid-cols-4"
                style={{
                  backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#FDF9F5",
                  borderTop: "1px solid rgba(107,76,42,0.06)",
                }}
              >
                <div className="px-5 py-3.5" style={{ fontSize: "13px", color: "#2C1A0E", fontWeight: 500 }}>
                  {feature.name}
                </div>
                {(["starter", "growth", "enterprise"] as const).map((plan) => (
                  <div key={plan} className="px-5 py-3.5 flex justify-center items-center">
                    {feature[plan] ? (
                      <Check size={16} style={{ color: "#546B3F" }} />
                    ) : (
                      <X size={14} style={{ color: "#D1C9C0" }} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" style={{ backgroundColor: "#FDFAF5" }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#2C1A0E", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: "14px", color: "#5C4A37" }}>Everything you need to know about Kettan's plans.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          <div className="text-center mt-10">
            <p style={{ fontSize: "14px", color: "#5C4A37", marginBottom: "12px" }}>Still have questions?</p>
            <a
              href="mailto:sales@kettan.io"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border"
              style={{ color: "#6B4C2A", borderColor: "rgba(107,76,42,0.3)", fontWeight: 600, fontSize: "14px" }}
            >
              Contact Sales
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}


