"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  Clock,
  Plus,
  Users,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { resolveReminderStatus } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/contexts/ToastContext";
import {
  fetchActiveReminders,
  fetchManagedPaymentStatuses,
  fetchMyGroups,
} from "@/lib/endpoints";
import type { EventMemberStatusResult, GroupSummary, ReminderResponse } from "@/lib/types";

function isToday(dueDate: string): boolean {
  const today = new Date();
  const due = new Date(dueDate + "T00:00:00");
  return (
    today.getFullYear() === due.getFullYear() &&
    today.getMonth() === due.getMonth() &&
    today.getDate() === due.getDate()
  );
}

function formatAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function DashboardContent() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { showError } = useToast();

  const [reminders, setReminders] = useState<ReminderResponse[]>([]);
  const [managed, setManaged] = useState<EventMemberStatusResult[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchActiveReminders().catch(() => [] as ReminderResponse[]),
      fetchManagedPaymentStatuses().catch(() => [] as EventMemberStatusResult[]),
      fetchMyGroups().catch(() => [] as GroupSummary[]),
    ])
      .then(([r, m, g]) => {
        if (!isMounted) return;
        setReminders(r);
        setManaged(m);
        setGroups(g);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t("common.error");
        showError(message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayReminders = useMemo(
    () =>
      reminders
        .filter((r) => isToday(r.dueDate) && !r.completed)
        .sort((a, b) => (a.dueTime ?? "").localeCompare(b.dueTime ?? "")),
    [reminders]
  );

  const overdueReminders = useMemo(
    () => reminders.filter((r) => resolveReminderStatus(r.dueDate, r.completed) === "OVERDUE"),
    [reminders]
  );

  const overduePayments = useMemo(
    () =>
      managed.filter(
        (s) =>
          s.status === "OVERDUE" ||
          (s.event?.targetAmount != null &&
            s.status !== "PAID" &&
            s.status !== "SURPLUS" &&
            s.event?.eventDate &&
            s.event.eventDate < new Date().toISOString().slice(0, 10))
      ),
    [managed]
  );

  const totalOverdue = overdueReminders.length + overduePayments.length;

  const nextGroupLabel = useMemo(() => {
    if (groups.length === 0) return t("dashboard.noGroupSoon");
    return groups[0]?.name ?? t("dashboard.noGroupSoon");
  }, [groups, t]);

  if (isLoading) {
    return <FullPageSpinner label={t("dashboard.loading")} />;
  }

  const firstName = user?.fullName?.split(" ")[0] ?? "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("dashboard.greeting", { name: firstName })}{" "}
          <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Résumé */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <Link
          href="/reminders"
          className="rounded-2xl bg-teal-600 p-4 text-white shadow-sm transition hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
        >
          <Bell className="mb-2 h-5 w-5 opacity-90" />
          <p className="text-2xl font-bold leading-none">{todayReminders.length}</p>
          <p className="mt-1 text-[11px] font-medium leading-tight opacity-90">
            {t("dashboard.remindersToday")}
          </p>
        </Link>
        <Link
          href="/payments/history"
          className="rounded-2xl bg-red-50 p-4 transition hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70"
        >
          <Clock className="mb-2 h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-2xl font-bold leading-none text-red-700 dark:text-red-300">
            {totalOverdue}
          </p>
          <p className="mt-1 text-[11px] font-medium leading-tight text-red-600/80 dark:text-red-400/80">
            {t("dashboard.overdue")}
          </p>
        </Link>
        <Link
          href="/groups"
          className="rounded-2xl bg-slate-100 p-4 transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <Users className="mb-2 h-5 w-5 text-slate-600 dark:text-slate-300" />
          <p className="text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">
            {nextGroupLabel}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {t("dashboard.nextGroup")}
          </p>
        </Link>
      </div>

      {/* Urgent */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("dashboard.urgent")}
          </h2>
          {totalOverdue > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle className="h-3 w-3" />
              {t("dashboard.urgentCount", { count: totalOverdue })}
            </span>
          )}
        </div>

        {totalOverdue === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t("dashboard.noUrgent")}
          </div>
        ) : (
          <ul className="space-y-3">
            {overduePayments.slice(0, 3).map((s) => (
              <li
                key={`pay-${s.id}`}
                className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm dark:border-red-900/40 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {s.event?.title ?? t("dashboard.groupContribution")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {s.groupMember?.contactFullName
                        ? `${s.groupMember.contactFullName} · `
                        : ""}
                      {s.event?.eventDate
                        ? `${t("dashboard.due")} ${s.event.eventDate}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                      {t("common.overdue")}
                    </span>
                    {s.requiredAmount != null && (
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {formatAmount(s.requiredAmount)}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href="/payments/history"
                  className="mt-3 flex w-full items-center justify-center rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  {t("dashboard.settleNow")}
                </Link>
              </li>
            ))}
            {overdueReminders.slice(0, 3).map((r) => (
              <li
                key={`rem-${r.id}`}
                className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm dark:border-amber-900/40 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{r.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {t("dashboard.due")} {r.dueDate}
                      {r.dueTime ? ` · ${r.dueTime.slice(0, 5)}` : ""}
                    </p>
                  </div>
                  <Link
                    href="/reminders"
                    className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    {t("dashboard.settleNow")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Aujourd'hui */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("dashboard.todaySection")}
          </h2>
          <Link
            href="/reminders"
            className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
          >
            {t("common.seeAll")} →
          </Link>
        </div>

        {todayReminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t("dashboard.noRemindersToday")}
          </div>
        ) : (
          <ul className="space-y-2">
            {todayReminders.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Clock className="mb-0.5 h-3.5 w-3.5" />
                  {r.dueTime ? r.dueTime.slice(0, 5) : "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{r.title}</p>
                  {r.description && (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {r.description}
                    </p>
                  )}
                </div>
                <Link
                  href="/reminders"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                  aria-label={t("reminders.markDone")}
                >
                  <Check className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-center">
        <Link
          href="/reminders"
          className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          {t("dashboard.newReminder")}
        </Link>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <DashboardContent />
    </AuthGuard>
  );
}
