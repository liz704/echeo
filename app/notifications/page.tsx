"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  CircleCheck,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useLocale } from "@/contexts/LocaleContext";
import { deleteAllNotifications, deleteNotification, fetchNotificationHistory } from "@/lib/endpoints";
import type { NotificationLog, NotificationStatus, NotificationType } from "@/lib/types";

const TYPE_ICONS: Record<NotificationType, typeof Mail> = {
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: Smartphone,
};

const STATUS_CLASSES: Record<NotificationStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SENT: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  DELIVERED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  BOUNCED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const STATUS_ICONS: Record<NotificationStatus, typeof Clock> = {
  PENDING: Clock,
  SENT: CheckCircle2,
  DELIVERED: CircleCheck,
  BOUNCED: XCircle,
  FAILED: XCircle,
};

function NotificationsContent() {
  const { showSuccess, showError } = useToast();
  const { t, locale } = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";

  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<NotificationLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const statusLabels: Record<NotificationStatus, string> = useMemo(
    () => ({
      PENDING: t("notifications.statusPending"),
      SENT: t("notifications.statusSent"),
      DELIVERED: t("notifications.statusDelivered"),
      BOUNCED: t("notifications.statusBounced"),
      FAILED: t("notifications.statusFailed"),
    }),
    [t]
  );

  useEffect(() => {
    let isMounted = true;

    fetchNotificationHistory()
      .then((data) => {
        if (isMounted) setNotifications(data);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t("notifications.loadError");
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
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteNotification(pendingDelete.id);
      setNotifications((current) => current.filter((n) => n.id !== pendingDelete.id));
      showSuccess(t("notifications.deleted"));
      setPendingDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("notifications.deleteFailed");
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleClearAll() {
    setIsClearingAll(true);
    try {
      await deleteAllNotifications();
      setNotifications([]);
      showSuccess(t("notifications.cleared"));
      setConfirmClearAll(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("notifications.deleteFailed");
      showError(message);
    } finally {
      setIsClearingAll(false);
    }
  }

  function groupByMonth(items: NotificationLog[]): Map<string, NotificationLog[]> {
    const groups = new Map<string, NotificationLog[]>();
    for (const notification of items) {
      const date = notification.sentAt ? new Date(notification.sentAt) : null;
      const key = date
        ? date.toLocaleDateString(dateLocale, { month: "long", year: "numeric" })
        : t("notifications.unknownDate");
      const existing = groups.get(key) ?? [];
      existing.push(notification);
      groups.set(key, existing);
    }
    return groups;
  }

  if (isLoading) {
    return <FullPageSpinner label={t("notifications.loading")} />;
  }

  const grouped = groupByMonth(notifications);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("notifications.title")}
          </h1>
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClearAll(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
            {t("notifications.clearAll")}
          </button>
        )}
      </div>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {t("notifications.subtitle")}
      </p>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t("notifications.empty")}
        </div>
      ) : (
        Array.from(grouped.entries()).map(([month, items]) => (
          <section key={month} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold capitalize text-slate-500 dark:text-slate-400">
              {month}
            </h2>
            <ul className="space-y-3">
              {items.map((notification) => {
                const TypeIcon = TYPE_ICONS[notification.type];
                const StatusIcon = STATUS_ICONS[notification.status];
                const statusLabel = statusLabels[notification.status];
                const statusClasses = STATUS_CLASSES[notification.status];

                return (
                  <li
                    key={notification.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                          <TypeIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="break-words text-sm text-slate-800 dark:text-slate-200">
                            {notification.messageContent}
                          </p>
                          {notification.sentAt && (
                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                              {t("notifications.sentAt", {
                                date: new Date(notification.sentAt).toLocaleString(dateLocale),
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(notification)}
                          aria-label={t("notifications.deleteOne")}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        title={t("notifications.deleteTitle")}
        description={t("notifications.deleteDesc")}
        confirmLabel={t("common.delete")}
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmModal
        isOpen={confirmClearAll}
        title={t("notifications.clearAllTitle")}
        description={t("notifications.clearAllDesc", { count: notifications.length })}
        confirmLabel={t("notifications.clearAllConfirm")}
        isDangerous
        isLoading={isClearingAll}
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClearAll(false)}
      />
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <NotificationsContent />
    </AuthGuard>
  );
}
