import { Link } from "react-router";

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#2C1A0E",
        color: "#C9A87D",
        fontFamily: '"DM Sans", "Inter", sans-serif',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 4C12.5 4 7 8 7 15C7 19.5 9.5 23 13.5 24.5C13.5 24.5 13 20.5 14.5 17.5C16 14.5 19 12.5 22.5 12C22.5 12 20.5 16 18.5 18.5C16.5 21 15.5 24 15.5 24L16 26.5C17.5 26 24 22 24 15C24 8 19.5 4 16 4Z"
                  fill="#C9A87D"
                />
                <path d="M13.5 24.5C11 24 9 21.5 8 19L15.5 14.5L13.5 24.5Z" fill="#93AF7E" fillOpacity="0.8" />
              </svg>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "14px",
                    color: "#F5F0E8",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  KETTAN
                </div>
                <div style={{ fontSize: "7px", color: "#8C6B43", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Café Chain Operations
                </div>
              </div>
            </div>
            <p style={{ color: "#A39C93", fontSize: "14px", lineHeight: 1.7, maxWidth: "220px" }}>
              The all-in-one SaaS platform for multi-branch coffee chain operations.
            </p>
            <p style={{ color: "#6B5A4E", fontSize: "12px", marginTop: "16px" }}>
              Derived from <em>Kette</em> (German) — meaning chain.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ color: "#F5F0E8", fontWeight: 600, fontSize: "13px", letterSpacing: "0.05em", marginBottom: "16px", textTransform: "uppercase" }}>
              Product
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Features", to: "/features" },
                { label: "Pricing", to: "/pricing" },
                { label: "Login", to: "/login" },
                { label: "Register", to: "/register" },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="transition-colors duration-200"
                    style={{ color: "#A39C93", fontSize: "14px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A87D")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#A39C93")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ color: "#F5F0E8", fontWeight: 600, fontSize: "13px", letterSpacing: "0.05em", marginBottom: "16px", textTransform: "uppercase" }}>
              Company
            </h4>
            <ul className="space-y-3">
              {["About", "Contact", "Blog"].map((item) => (
                <li key={item}>
                  <span style={{ color: "#A39C93", fontSize: "14px", cursor: "pointer" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ color: "#F5F0E8", fontWeight: 600, fontSize: "13px", letterSpacing: "0.05em", marginBottom: "16px", textTransform: "uppercase" }}>
              Legal
            </h4>
            <ul className="space-y-3">
              {["Terms of Service", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <span style={{ color: "#A39C93", fontSize: "14px", cursor: "pointer" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <p style={{ color: "#6B5A4E", fontSize: "12px" }}>Payment powered by</p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: "6px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(201,168,125,0.1)",
                  color: "#C9A87D",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                PayMongo
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(201,168,125,0.1)" }}
        >
          <p style={{ color: "#6B5A4E", fontSize: "13px" }}>
            © 2026 Kettan. Built for coffee chain operators.
          </p>
          <div className="flex items-center gap-1" style={{ fontSize: "13px", color: "#6B5A4E" }}>
            <span>Made with</span>
            <span style={{ color: "#C9A84C", margin: "0 3px" }}>☕</span>
            <span>and ASP.NET Core + React</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
