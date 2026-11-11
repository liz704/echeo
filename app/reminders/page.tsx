"use client";

import { useEffect, useState } from "react";
import { Check, CalendarDays, Clock, Plus, RefreshCcw, History, Repeat } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { resolveReminderStatus } from "@/components/ui/Badge";
import { SwipeRow } from "@/components/ui/SwipeRow";
import { Switch } from "@/components/ui/Switch";
import { ReminderCard, type ReminderCardTone } from "@/components/ReminderCard";
import { PRIMARY_BUTTON_CLASS, ReminderDetailSheet } from "@/components/ReminderDetailSheet";
import { cardLabels, formatLongDate, formatTime } from "@/lib/dateFormat";
import { useToast } from "@/contexts/ToastContext";
import { useLocale } from "@/contexts/LocaleContext";
import {
  createReminder,
  updateReminder,
  deleteReminder,
  fetchActiveReminders,
  markReminderCompleted,
  pauseReminder,
  resumeReminder,
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
  const { t, dateLocale } = useLocale();

  const [selectedId, setSelectedId] = useState<number | null>(null);
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
      setEditError(t("msg.reminderRequired"));
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
      const message = error instanceof Error ? error.message : t("msg.reminderEditFailed");
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
      const message = error instanceof Error ? error.message : t("msg.remindersLoadFailed");
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
      showSuccess(t("msg.reminderMarkedDone", { title: reminder.title }));
    } catch (error) {
      // Échec : on restaure la liste précédente.
      setReminders(previousReminders);
      const message = error instanceof Error ? error.message : t("msg.reminderUpdateFailed");
      showError(message);
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleTogglePause(reminder: ReminderResponse) {
    setPendingActionId(reminder.id);
    try {
      const updated = reminder.paused
        ? await resumeReminder(reminder.id)
        : await pauseReminder(reminder.id);
      setReminders((current) => current.map((r) => (r.id === updated.id ? updated : r)));
      showSuccess(updated.paused ? t("v3.reminderPaused") : t("v3.reminderResumed"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("msg.reminderUpdateFailed");
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
      showSuccess(t("msg.reminderDeleted", { title: reminderToDelete.title }));
      setReminderToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("msg.reminderDeleteFailed");
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCreateSubmit() {
    if (!form.title.trim() || !form.dueDate) {
      setCreateError(t("msg.reminderRequired"));
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
      const message = error instanceof Error ? error.message : t("msg.reminderCreateFailed");
      setCreateError(message);
      showError(message);
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return <FullPageSpinner label={t("reminders.loadingList")} />;
  }

  const selected = reminders.find((r) => r.id === selectedId) ?? null;

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
        <>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t("v3.swipeHint")}</p>
          <ul className="space-y-3">
            {reminders.map((reminder) => {
              const status = resolveReminderStatus(reminder.dueDate, reminder.completed);
              const isPending = pendingActionId === reminder.id;
              const labels = cardLabels({
                dateIso: reminder.dueDate,
                time: reminder.dueTime,
                repetitionLabel:
                  reminder.repetitionType === "NONE" ? null : repetitionLabel(t, reminder.repetitionType),
                dateLocale,
              });
              const tone: ReminderCardTone = reminder.paused
                ? "paused"
                : status === "OVERDUE"
                  ? "overdue"
                  : "active";

              return (
                <li key={reminder.id}>
                  <SwipeRow label={t("common.delete")} onSwipe={() => setReminderToDelete(reminder)}>
                    <ReminderCard
                      tone={tone}
                      topLabel={labels.top}
                      bigLabel={labels.big}
                      title={reminder.title}
                      meta={reminder.description}
                      badge={
                        reminder.paused
                          ? t("v3.pausedBadge")
                          : status === "OVERDUE"
                            ? t("common.overdue")
                            : undefined
                      }
                      onOpen={() => setSelectedId(reminder.id)}
                      control={
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={!reminder.paused}
                            disabled={isPending}
                            onChange={() => handleTogglePause(reminder)}
                            label={t("v3.reminderActive")}
                          />
                        <button
                          type="button"
                          onClick={() => handleComplete(reminder)}
                          disabled={isPending}
                          aria-label={t("ui.done")}
                          title={t("ui.done")}
                          className={`inline-flex h-12 w-12 items-center justify-center rounded-full border-2 transition disabled:opacity-60 ${
                            reminder.paused
                              ? "border-slate-400 text-slate-500 hover:bg-slate-300/40 dark:border-slate-500 dark:text-slate-300"
                              : "border-white/70 text-white hover:bg-white/15"
                          }`}
                        >
                          {isPending ? <Spinner size={18} /> : <Check className="h-6 w-6" />}
                        </button>
                        </div>
                      }
                    />
                  </SwipeRow>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {selected && (
        <ReminderDetailSheet
          isOpen
          onClose={() => setSelectedId(null)}
          bigLabel={
            cardLabels({
              dateIso: selected.dueDate,
              time: selected.dueTime,
              dateLocale,
            }).big
          }
          topLabel={formatLongDate(selected.dueDate, dateLocale)}
          title={selected.title}
          description={selected.description}
          rows={[
            {
              icon: <CalendarDays className="h-4 w-4" />,
              label: t("reminders.dueLabel"),
              value: `${selected.dueDate}${formatTime(selected.dueTime) ? ` ${t("reminders.atTime")} ${formatTime(selected.dueTime)}` : ""}`,
            },
            {
              icon: <Repeat className="h-4 w-4" />,
              label: t("reminders.repetitionLabel"),
              value: repetitionLabel(t, selected.repetitionType),
            },
            ...(selected.nextOccurrence
              ? [
                  {
                    icon: <Clock className="h-4 w-4" />,
                    label: t("v3.nextOccurrence"),
                    value: selected.nextOccurrence,
                  },
                ]
              : []),
          ]}
          extra={
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{t("v3.reminderActive")}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selected.paused ? t("v3.reminderPausedHint") : t("v3.reminderActiveHint")}
                </p>
              </div>
              <Switch
                checked={!selected.paused}
                disabled={pendingActionId === selected.id}
                onChange={() => handleTogglePause(selected)}
                label={t("v3.reminderActive")}
              />
            </div>
          }
          onEdit={() => {
            setSelectedId(null);
            openEditModal(selected);
          }}
          onDelete={() => {
            setSelectedId(null);
            setReminderToDelete(selected);
          }}
          primary={
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                handleComplete(selected);
              }}
              className={PRIMARY_BUTTON_CLASS}
            >
              <Check className="h-4 w-4" />
              {t("ui.done")}
            </button>
          }
        />
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
                {t("ui.dueDate")}
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
                {t("ui.dueDate")}
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
