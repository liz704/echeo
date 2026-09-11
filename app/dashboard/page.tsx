"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ListTodo } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { StatusBadge, resolveReminderStatus } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { fetchActiveReminders } from "@/lib/endpoints";
import type { ReminderResponse } from "@/lib/types";

function isToday(dueDate: string): boolean {
  const today = new Date();
  const due = new Date(dueDate);
  return (
    today.getFullYear() === due.getFullYear() &&
    today.getMonth() === due.getMonth() &&
    today.getDate() === due.getDate()
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { showError } = useToast();

  const [reminders, setReminders] = useState<ReminderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadReminders() {
      try {
        const data = await fetchActiveReminders();
        if (isMounted) setReminders(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de charger les rappels.";
        showError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReminders();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayReminders = useMemo(() => reminders.filter((r) => isToday(r.dueDate)), [reminders]);
  const overdueCount = useMemo(
    () => reminders.filter((r) => resolveReminderStatus(r.dueDate, r.completed) === "OVERDUE").length,
    [reminders]
  );
  const upcomingCount = reminders.length - overdueCount;

  if (isLoading) {
    return <FullPageSpinner label="Chargement de votre tableau de bord..." />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Bonjour {user?.fullName?.split(" ")[0] ?? ""} 👋
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Voici un aperçu de vos rappels.
      </p>

      {/* Cartes résumé */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{todayReminders.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Rappels aujourd'hui</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
              <ListTodo className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{overdueCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">En retard</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{upcomingCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">À venir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rappels du jour */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Rappels du jour
        </h2>

        {todayReminders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Aucun rappel prévu aujourd'hui. Profitez-en !
          </div>
        ) : (
          <ul className="space-y-3">
            {todayReminders.map((reminder) => (
              <li
                key={reminder.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{reminder.title}</p>
                  {reminder.description && (
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {reminder.description}
                    </p>
                  )}
                </div>
                <StatusBadge status={resolveReminderStatus(reminder.dueDate, reminder.completed)} />
              </li>
            ))}
          </ul>
        )}
      </section>
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
