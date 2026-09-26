"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Home,
  LogOut,
  Settings,
  Users,
  Wallet,
  ListTodo,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AppNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useLocale();

  const NAV_LINKS = [
    { href: "/dashboard", label: t("nav.home"), Icon: Home },
    { href: "/reminders", label: t("nav.reminders"), Icon: ListTodo },
    { href: "/groups", label: t("nav.groups"), Icon: Users },
    { href: "/payments/history", label: t("nav.payments"), Icon: Wallet },
    { href: "/notifications", label: t("nav.notifications"), Icon: Bell },
  ];

  function isActive(href: string): boolean {
    if (pathname === href) return true;
    if (href === "/dashboard") return false;
    const base = href.replace(/\/history$/, "");
    return pathname.startsWith(base);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-5">
        {/* Logo */}
        <Link href="/dashboard" className="shrink-0">
          <span className="text-lg font-bold tracking-tight text-teal-700 dark:text-teal-400">
            {t("appName")}
          </span>
        </Link>

        {/* Navigation centrale — labels dès lg pour éviter le chevauchement */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions droites — jamais compressées */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div
            className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-900"
            role="group"
            aria-label={t("common.language")}
          >
            <button
              type="button"
              onClick={() => setLocale("fr")}
              className={`rounded-full px-2 py-1 transition ${
                locale === "fr"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded-full px-2 py-1 transition ${
                locale === "en"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              EN
            </button>
          </div>

          {user && (
            <span className="hidden max-w-[8rem] truncate text-xs text-slate-500 dark:text-slate-400 xl:inline">
              {user.fullName}
            </span>
          )}

          <ThemeToggle />

          <Link
            href="/settings"
            aria-label={t("nav.settings")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={logout}
            aria-label={t("nav.logout")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="flex justify-around border-t border-slate-100 py-2 dark:border-slate-800 md:hidden">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-medium ${
                active ? "text-teal-700 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
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
