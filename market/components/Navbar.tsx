import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";

export function Navbar() {
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
    { to: "/", label: "Home" },
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(253, 250, 245, 0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(107,76,42,0.1)" : "1px solid transparent",
        boxShadow: scrolled ? "0 2px 20px rgba(107,76,42,0.07)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
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
                  color: isActive(link.to) ? "#6B4C2A" : "#4B5563",
                  fontWeight: isActive(link.to) ? 600 : 500,
                  backgroundColor: isActive(link.to) ? "rgba(107,76,42,0.08)" : "transparent",
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
                borderColor: "rgba(107,76,42,0.35)",
                fontWeight: 500,
              }}
            >
              Login
            </Link>
            <Link
              to="/pricing"
              className="px-4 py-2 rounded-lg text-sm text-white transition-all duration-200"
              style={{
                backgroundColor: "#6B4C2A",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(107,76,42,0.3)",
              }}
            >
              Get Started →
            </Link>
          </div>

          {/* Mobile Menu Button */}
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
                color: isActive(link.to) ? "#6B4C2A" : "#4B5563",
                fontWeight: isActive(link.to) ? 600 : 500,
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
              to="/pricing"
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
    <div className="flex items-center gap-2">
      {/* Leaf icon */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="15" fill="#6B4C2A" fillOpacity="0.08" />
        <path
          d="M16 6C13 6 8 9.5 8 15.5C8 19.5 10.5 22.5 14 23.5C14 23.5 13.5 20 15 17.5C16.5 15 19 13.5 22 13C22 13 20.5 16.5 19 18.5C17.5 20.5 16.5 23 16.5 23L17 25C18.5 24.5 24 21 24 15.5C24 9.5 19 6 16 6Z"
          fill="#6B4C2A"
        />
        <path
          d="M14 23.5C12 23 10.5 21 9.5 19L16 15L14 23.5Z"
          fill="#546B3F"
          fillOpacity="0.7"
        />
      </svg>
      <div>
        <div
          className="tracking-wider uppercase"
          style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 800,
            fontSize: "15px",
            color: "#4A3418",
            letterSpacing: "0.15em",
          }}
        >
          KETTAN
        </div>
        <div
          style={{
            fontSize: "7px",
            color: "#8C6B43",
            letterSpacing: "0.08em",
            fontWeight: 500,
            textTransform: "uppercase",
            marginTop: "-1px",
          }}
        >
          Café Chain Operations
        </div>
      </div>
    </div>
  );
}
