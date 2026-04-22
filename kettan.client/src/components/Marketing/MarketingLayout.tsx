import { Outlet } from "@tanstack/react-router";
import { MarketingNavbar } from "./MarketingNavbar";
import { MarketingFooter } from "./MarketingFooter";

export function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: '"DM Sans", "Inter", sans-serif', backgroundColor: "#FDFAF5" }}>
      <MarketingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
