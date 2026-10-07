"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, Trash2 } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { ConfirmModal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/contexts/ToastContext";
import {
  deleteAllReminderHistory,
  deleteReminder,
  fetchReminderHistory,
} from "@/lib/endpoints";
import type { ReminderResponse } from "@/lib/types";

function ReminderHistoryContent() {
  const { t } = useLocale();
  const { showSuccess, showError } = useToast();
  const [history, setHistory] = useState<ReminderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reminderToDelete, setReminderToDelete] = useState<ReminderResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchReminderHistory()
      .then((data) => {
        if (isMounted) setHistory(data);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : t("common.error");
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

  async function handleConfirmDelete() {
    if (!reminderToDelete) return;
    setIsDeleting(true);
    try {
      await deleteReminder(reminderToDelete.id);
      setHistory((current) => current.filter((r) => r.id !== reminderToDelete.id));
      showSuccess(t("reminders.deletedFromHistory"));
      setReminderToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.error");
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteAll() {
    setIsDeletingAll(true);
    try {
      await deleteAllReminderHistory();
      setHistory([]);
      showSuccess(t("reminders.historyCleared"));
      setConfirmDeleteAll(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.error");
      showError(message);
    } finally {
      setIsDeletingAll(false);
    }
  }

  if (isLoading) {
    return <FullPageSpinner label={t("reminders.historyLoading")} />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/reminders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("reminders.backToReminders")}
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("reminders.historyTitle")}
          </h1>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmDeleteAll(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
            Tout supprimer
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t("reminders.historyEmpty")}
        </div>
      ) : (
        <ul className="space-y-3">
          {history.map((reminder) => (
            <li
              key={reminder.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">{reminder.title}</p>
                  <StatusBadge status="COMPLETED" />
                </div>
                {reminder.description && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {reminder.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {t("reminders.initialDue")} : {reminder.dueDate}
                  {reminder.nextOccurrence
                    ? ` — ${t("reminders.nextOccurrence")} : ${reminder.nextOccurrence}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReminderToDelete(reminder)}
                aria-label={t("reminders.deleteFromHistory")}
                title={t("common.delete")}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!reminderToDelete}
        title={t("reminders.deleteFromHistoryTitle")}
        description={`"${reminderToDelete?.title ?? ""}" ${t("reminders.deleteFromHistoryDesc")}`}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setReminderToDelete(null)}
      />

      <ConfirmModal
        isOpen={confirmDeleteAll}
        title={t("reminders.deleteAllTitle")}
        description={t("reminders.deleteAllDesc")}
        confirmLabel={t("reminders.deleteAllCta")}
        cancelLabel={t("common.cancel")}
        isDangerous
        isLoading={isDeletingAll}
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDeleteAll(false)}
      />
    </main>
  );
}

export default function ReminderHistoryPage() {
  const { t } = useLocale();
  return (
    <AuthGuard>
      <AppNavbar />
      <ReminderHistoryContent />
    </AuthGuard>
  );
}
