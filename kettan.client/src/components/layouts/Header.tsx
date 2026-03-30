import { Menu, Bell, UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6">
      <div className="flex items-center">
        {/* Mobile menu button */}
        <button
          type="button"
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 border-l pl-4">
          <div className="flex flex-col items-end text-sm">
            <span className="font-semibold text-slate-900">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-slate-500">{user?.role || "Admin"}</span>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-md bg-slate-50 p-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            title="Log out"
          >
            <UserCircle className="h-8 w-8 text-slate-400" />
            <span className="sr-only">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
