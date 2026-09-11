"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import { fetchReminderHistory } from "@/lib/endpoints";
import type { ReminderResponse } from "@/lib/types";

function ReminderHistoryContent() {
  const { showError } = useToast();
  const [history, setHistory] = useState<ReminderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchReminderHistory()
      .then((data) => {
        if (isMounted) setHistory(data);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Impossible de charger l'historique.";
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

  if (isLoading) {
    return <FullPageSpinner label="Chargement de l'historique..." />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/reminders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux rappels
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <History className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Historique des rappels terminés
        </h1>
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Aucun rappel terminé pour l'instant.
        </div>
      ) : (
        <ul className="space-y-3">
          {history.map((reminder) => (
            <li
              key={reminder.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">{reminder.title}</p>
                  <StatusBadge status="COMPLETED" />
                </div>
                {reminder.description && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{reminder.description}</p>
                )}
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Échéance initiale : {reminder.dueDate}
                  {reminder.nextOccurrence && ` — Prochaine occurrence générée : ${reminder.nextOccurrence}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function ReminderHistoryPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <ReminderHistoryContent />
    </AuthGuard>
  );
}
