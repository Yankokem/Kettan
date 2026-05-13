import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import logo from "../../assets/logo.png";

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { to: "/market" as const, label: "Home" },
    { to: "/market/features" as const, label: "Features" },
    { to: "/market/pricing" as const, label: "Pricing" },
  ];

  const isActive = (path: string) =>
    path === "/market" ? location.pathname === "/market" : location.pathname.startsWith(path);

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: "linear-gradient(170deg, #F0E6D3 0%, #FAF5EF 100%)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(107, 76, 42, 0.1)",
        boxShadow: scrolled ? "0 4px 20px rgba(107, 76, 42, 0.08)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/market" className="flex items-center gap-2 group">
            <KettanLogo />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 rounded-lg transition-all duration-200 text-sm"
                style={{
                  color: isActive(link.to) ? "#6B4C2A" : "#6B4C2A",
                  fontWeight: isActive(link.to) ? 700 : 500,
                  backgroundColor: isActive(link.to) ? "rgba(107, 76, 42, 0.08)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-sm transition-all duration-200 border"
              style={{
                color: "#6B4C2A",
                borderColor: "rgba(107, 76, 42, 0.35)",
                fontWeight: 600,
              }}
            >
              Login
            </Link>
            <Link
              to="/market/pricing"
              className="px-4 py-2 rounded-lg text-sm text-white transition-all duration-200"
              style={{
                backgroundColor: "#6B4C2A",
                color: "#FFFFFF",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(107, 76, 42, 0.3)",
              }}
            >
              Get Started →
            </Link>
          </div>

            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: "#6B4C2A" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-6 py-4 space-y-1"
          style={{
            backgroundColor: "#FDFAF5",
            borderColor: "rgba(107,76,42,0.1)",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-4 py-2.5 rounded-lg text-sm"
              style={{
                color: isActive(link.to) ? "#6B4C2A" : "#6B4C2A",
                fontWeight: isActive(link.to) ? 700 : 500,
                backgroundColor: isActive(link.to) ? "rgba(107,76,42,0.08)" : "transparent",
              }}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full text-center px-4 py-2.5 rounded-lg text-sm border"
              style={{ color: "#6B4C2A", borderColor: "rgba(107,76,42,0.35)", fontWeight: 500 }}
            >
              Login
            </Link>
            <Link
              to="/market/pricing"
              className="w-full text-center px-4 py-2.5 rounded-lg text-sm text-white"
              style={{ backgroundColor: "#6B4C2A", fontWeight: 600 }}
            >
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function KettanLogo() {
  return (
    <img src={logo} alt="Kettan" width="170" />
  );
}
