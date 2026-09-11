"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellRing, LayoutDashboard, LogOut, Settings, Users, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ui/ThemeToggle";

const NAV_LINKS = [
  { href: "/dashboard", label: "Accueil", Icon: LayoutDashboard },
  { href: "/reminders", label: "Rappels", Icon: Bell },
  { href: "/groups", label: "Groupes", Icon: Users },
  { href: "/payments/history", label: "Paiements", Icon: Wallet },
  { href: "/notifications", label: "Notifs", Icon: BellRing },
];

export function AppNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-teal-700 dark:text-teal-400">ÉCHÉO</span>
          <nav className="hidden gap-1 sm:flex">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
              {user.fullName}
            </span>
          )}
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Paramètres"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={logout}
            aria-label="Se déconnecter"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation mobile */}
      <nav className="flex justify-around border-t border-slate-100 py-2 dark:border-slate-800 sm:hidden">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
                isActive ? "text-teal-700 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
