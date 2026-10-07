"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Trash2, Plus, RefreshCcw, History, Pencil } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { StatusBadge, resolveReminderStatus } from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import { useLocale } from "@/contexts/LocaleContext";
import {
  createReminder,
  updateReminder,
  deleteReminder,
  fetchActiveReminders,
  markReminderCompleted,
} from "@/lib/endpoints";
import type { ReminderResponse, RepetitionType } from "@/lib/types";

const REPETITION_KEYS = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
function repetitionLabel(t: (k: string) => string, value: string) {
  const map: Record<string, string> = {
    NONE: t("forms.repetitionNone"),
    DAILY: t("forms.repetitionDaily"),
    WEEKLY: t("forms.repetitionWeekly"),
    MONTHLY: t("forms.repetitionMonthly"),
    YEARLY: t("forms.repetitionYearly"),
  };
  return map[value] ?? value;
}

interface NewReminderForm {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  repetitionType: RepetitionType;
}

const EMPTY_FORM: NewReminderForm = {
  title: "",
  description: "",
  dueDate: "",
  dueTime: "",
  repetitionType: "NONE",
};

function RemindersContent() {
  const { showSuccess, showError } = useToast();
  const { t } = useLocale();

  const [reminders, setReminders] = useState<ReminderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  const [reminderToDelete, setReminderToDelete] = useState<ReminderResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState<NewReminderForm>(EMPTY_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [reminderToEdit, setReminderToEdit] = useState<ReminderResponse | null>(null);
  const [editForm, setEditForm] = useState<NewReminderForm>(EMPTY_FORM);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function openEditModal(reminder: ReminderResponse) {
    setReminderToEdit(reminder);
    setEditForm({
      title: reminder.title,
      description: reminder.description ?? "",
      dueDate: reminder.dueDate,
      // Le backend renvoie "HH:mm:ss" ; l'input time attend "HH:mm".
      dueTime: reminder.dueTime ? reminder.dueTime.slice(0, 5) : "",
      repetitionType: reminder.repetitionType,
    });
    setEditError(null);
  }

  async function handleEditSubmit() {
    if (!reminderToEdit) return;
    if (!editForm.title.trim() || !editForm.dueDate) {
      setEditError("Le titre et la date d'échéance sont obligatoires.");
      return;
    }
    setEditError(null);
    setIsSavingEdit(true);

    try {
      const updated = await updateReminder(reminderToEdit.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        dueDate: editForm.dueDate,
        dueTime: editForm.dueTime || undefined,
        repetitionType: editForm.repetitionType,
      });
      setReminders((current) => current.map((r) => (r.id === updated.id ? updated : r)));
      showSuccess(t("reminders.updatedSuccess"));
      setReminderToEdit(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la modification du rappel.";
      setEditError(message);
      showError(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function loadReminders() {
    setIsLoading(true);
    try {
      const data = await fetchActiveReminders();
      setReminders(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger les rappels.";
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleComplete(reminder: ReminderResponse) {
    setPendingActionId(reminder.id);
    // Mise à jour optimiste : on retire immédiatement le rappel de la liste
    // active, sans attendre la réponse serveur, pour une UI instantanée.
    const previousReminders = reminders;
    setReminders((current) => current.filter((r) => r.id !== reminder.id));

    try {
      await markReminderCompleted(reminder.id);
      showSuccess(`"${reminder.title}" marqué comme terminé.`);
    } catch (error) {
      // Échec : on restaure la liste précédente.
      setReminders(previousReminders);
      const message = error instanceof Error ? error.message : "Échec de la mise à jour du rappel.";
      showError(message);
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!reminderToDelete) return;
    setIsDeleting(true);

    try {
      await deleteReminder(reminderToDelete.id);
      setReminders((current) => current.filter((r) => r.id !== reminderToDelete.id));
      showSuccess(`"${reminderToDelete.title}" a été supprimé.`);
      setReminderToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la suppression du rappel.";
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCreateSubmit() {
    if (!form.title.trim() || !form.dueDate) {
      setCreateError("Le titre et la date d'échéance sont obligatoires.");
      return;
    }
    setCreateError(null);
    setIsCreating(true);

    try {
      const created = await createReminder({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.dueDate,
        dueTime: form.dueTime || undefined,
        repetitionType: form.repetitionType,
      });
      setReminders((current) => [...current, created]);
      showSuccess(t("reminders.createdSuccess"));
      setForm(EMPTY_FORM);
      setIsCreateModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la création du rappel.";
      setCreateError(message);
      showError(message);
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return <FullPageSpinner label={t("reminders.loadingList")} />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("reminders.title")}</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/reminders/history"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t("reminders.viewHistory")}
            title={t("reminders.historyTitle")}
          >
            <History className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={loadReminders}
            aria-label={t("reminders.refresh")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            {t("reminders.newReminder")}
          </button>
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t("reminders.empty")}
        </div>
      ) : (
        <ul className="space-y-3">
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">{reminder.title}</p>
                  <StatusBadge status={resolveReminderStatus(reminder.dueDate, reminder.completed)} />
                </div>
                {reminder.description && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{reminder.description}</p>
                )}
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {t("reminders.dueLabel")} : {reminder.dueDate}
                  {reminder.dueTime ? ` ${t("reminders.atTime")} ${reminder.dueTime.slice(0, 5)}` : ""} — {t("reminders.repetitionLabel")} :{" "}
                  {repetitionLabel(t, reminder.repetitionType)}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(reminder)}
                  aria-label={t("common.edit")}
                  title={t("common.edit")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleComplete(reminder)}
                  disabled={pendingActionId === reminder.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                >
                  {pendingActionId === reminder.id ? (
                    <Spinner size={14} />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Terminé
                </button>
                <button
                  type="button"
                  onClick={() => setReminderToDelete(reminder)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("common.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!reminderToDelete}
        title={t("reminders.deleteTitle")}
        description={`${t("reminders.deleteDesc")} "${reminderToDelete?.title ?? ""}"`}
        confirmLabel={t("common.delete")}
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setReminderToDelete(null)}
      />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateError(null);
        }}
        title={t("reminders.newReminder")}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("forms.title")}
            </label>
            <input
              type="text"
              placeholder={t("forms.placeholderReminder")}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("forms.description")} <span className="font-normal text-slate-400">{t("forms.optional")}</span>
            </label>
            <textarea
              placeholder={t("forms.placeholderReminderDesc")}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Date d'échéance
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Heure <span className="font-normal text-slate-400">{t("forms.optional")}</span>
              </label>
              <input
                type="time"
                value={form.dueTime}
                onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("reminders.repetition")}
            </label>
            <select
              value={form.repetitionType}
              onChange={(e) => setForm((f) => ({ ...f, repetitionType: e.target.value as RepetitionType }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {REPETITION_KEYS.map((value) => (
                <option key={value} value={value}>
                  {repetitionLabel(t, value)}
                </option>
              ))}
            </select>
          </div>

          {createError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {createError}
            </p>
          )}

          <button
            type="button"
            onClick={handleCreateSubmit}
            disabled={isCreating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isCreating && <Spinner size={16} />}
            {t("forms.createReminder")}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!reminderToEdit}
        onClose={() => {
          setReminderToEdit(null);
          setEditError(null);
        }}
        title={t("reminders.editTitle")}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("forms.title")}
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("forms.description")} <span className="font-normal text-slate-400">{t("forms.optional")}</span>
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Date d'échéance
              </label>
              <input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Heure <span className="font-normal text-slate-400">{t("forms.optional")}</span>
              </label>
              <input
                type="time"
                value={editForm.dueTime}
                onChange={(e) => setEditForm((f) => ({ ...f, dueTime: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("reminders.repetition")}
            </label>
            <select
              value={editForm.repetitionType}
              onChange={(e) => setEditForm((f) => ({ ...f, repetitionType: e.target.value as RepetitionType }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {REPETITION_KEYS.map((value) => (
                <option key={value} value={value}>
                  {repetitionLabel(t, value)}
                </option>
              ))}
            </select>
          </div>

          {editError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {editError}
            </p>
          )}

          <button
            type="button"
            onClick={handleEditSubmit}
            disabled={isSavingEdit}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isSavingEdit && <Spinner size={16} />}
            {t("reminders.saveChanges")}
          </button>
        </div>
      </Modal>
    </main>
  );
}

export default function RemindersPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <RemindersContent />
    </AuthGuard>
  );
}
