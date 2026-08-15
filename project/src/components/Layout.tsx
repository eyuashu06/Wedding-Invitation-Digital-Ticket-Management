import { type ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Heart, Users, Mail, QrCode, Bell, Moon, Sun, LogOut, Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/weddings", label: "Weddings", icon: Heart },
  { to: "/guests", label: "Guests", icon: Users },
  { to: "/invitations", label: "Invitations", icon: Mail },
  { to: "/check-in", label: "Check-In", icon: QrCode },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-600 text-white">
          <Heart className="h-5 w-5" fill="currentColor" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold leading-none text-stone-900 dark:text-stone-100">WeddingPass</h1>
          <p className="text-xs text-stone-400">Digital Invitations</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gold-50 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-stone-200 px-3 py-4 dark:border-stone-800">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-stone-950">
      <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 lg:block">
        {sidebar}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-stone-950/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 lg:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-900/80 lg:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden flex-1 lg:block" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-200">{user?.email}</p>
              <p className="text-xs text-stone-400">Organizer</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-100 text-sm font-semibold text-gold-700 dark:bg-gold-900/40 dark:text-gold-300">
              {(user?.email ?? "U")[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
