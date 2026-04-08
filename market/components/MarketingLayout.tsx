import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: '"DM Sans", "Inter", sans-serif', backgroundColor: "#FDFAF5" }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
