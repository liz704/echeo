"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Trash2, Wallet } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useLocale } from "@/contexts/LocaleContext";
import {
  deleteAllPaymentHistoryFor,
  deletePaymentHistoryEntry,
  fetchManagedPaymentStatuses,
  fetchMyPaymentStatuses,
  fetchPaymentHistoryFor,
} from "@/lib/endpoints";
import type { EventMemberStatusResult, PaymentHistoryEntry, PaymentStatus } from "@/lib/types";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  PARTIALLY_PAID: "Partiellement payé",
  PAID: "Payé",
  SURPLUS: "Surplus",
  OVERDUE: "En retard",
  NOT_SEEN: "Pas encore vu",
  SEEN: "Vu",
};

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  SURPLUS: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  OVERDUE: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  NOT_SEEN: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SEEN: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  ORANGE_MONEY: "Orange Money",
  CARD: "Carte bancaire",
};

function formatAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function PaymentStatusRow({
  status,
  showMember,
}: {
  status: EventMemberStatusResult;
  showMember?: boolean;
}) {
  const { t } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<PaymentHistoryEntry[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const { showSuccess, showError } = useToast();

  const hasMoney = status.event?.targetAmount != null || status.requiredAmount != null;

  async function toggleExpand() {
    if (!hasMoney) return;
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    if (nextExpanded && history === null) {
      setIsLoadingHistory(true);
      try {
        const data = await fetchPaymentHistoryFor(status.id);
        setHistory(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de charger le détail.";
        showError(message);
      } finally {
        setIsLoadingHistory(false);
      }
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await deletePaymentHistoryEntry(pendingDeleteId);
      setHistory((current) => current?.filter((entry) => entry.id !== pendingDeleteId) ?? null);
      showSuccess(t("payments.entryDeleted"));
      setPendingDeleteId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la suppression.";
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleClearAll() {
    setIsClearingAll(true);
    try {
      await deleteAllPaymentHistoryFor(status.id);
      setHistory([]);
      showSuccess(t("payments.historyCleared"));
      setConfirmClearAll(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la suppression.";
      showError(message);
    } finally {
      setIsClearingAll(false);
    }
  }

  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={toggleExpand}
        className={`flex w-full items-center justify-between gap-3 p-4 text-left transition ${
          hasMoney ? "hover:bg-slate-50 dark:hover:bg-slate-800/50" : "cursor-default"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900 dark:text-white">
              {status.event?.title ?? "Événement"}
            </p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_CLASSES[status.status] ?? STATUS_CLASSES.PENDING
              }`}
            >
              {t(`status.${status.status}`) ?? status.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {showMember && status.groupMember?.contactFullName
              ? `${status.groupMember.contactFullName} · `
              : ""}
            {status.event?.eventDate ? `{t("payments.dueLabel")} ${status.event.eventDate}` : ""}
            {!hasMoney ? " · Info (sans argent)" : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {hasMoney && (
            <div className="text-right text-sm">
              <p className="text-slate-500 dark:text-slate-400">
                {formatAmount(status.paidAmount)} / {formatAmount(status.requiredAmount)}
              </p>
            </div>
          )}
          {hasMoney ? (
            isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )
          ) : null}
        </div>
      </button>

      {isExpanded && hasMoney && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          {isLoadingHistory ? (
            <Spinner size={16} label={t("payments.loadingTransfers")} />
          ) : history && history.length > 0 ? (
            <>
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Tout supprimer
              </button>
            </div>
            <ul className="space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  <span className="text-slate-600 dark:text-slate-300">
                    {PAYMENT_METHOD_LABELS[entry.paymentMethod] ?? entry.paymentMethod}
                    {entry.transactionRef ? ` — Réf. ${entry.transactionRef}` : ""}
                    {" · "}
                    {new Date(entry.paidAt).toLocaleString("fr-FR")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatAmount(entry.amountPaid)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteId(entry.id);
                      }}
                      aria-label={t("payments.deleteEntry")}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            </>
          ) : (
            <p className="text-sm text-slate-400">Aucun versement enregistré pour cette échéance.</p>
          )}
          {status.event?.id != null && (
            <div className="mt-3">
              <Link
                href={`/groups`}
                className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
              >
                Gérer dans les groupes
              </Link>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!pendingDeleteId}
        title={t("payments.deleteEntry") + " ?"}
        description="Cette action supprime uniquement la ligne d'historique — elle n'annule pas le paiement ni ne recalcule le montant payé."
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
      <ConfirmModal
        isOpen={confirmClearAll}
        title="Tout supprimer ?"
        description="Tous les versements de cette échéance seront retirés de l'historique. Cela n'annule pas les montants déjà comptabilisés."
        confirmLabel="Tout supprimer"
        cancelLabel={t("common.cancel")}
        isDangerous
        isLoading={isClearingAll}
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClearAll(false)}
      />
    </li>
  );
}

function PaymentHistoryContent() {
  const { t } = useLocale();
  const [myStatuses, setMyStatuses] = useState<EventMemberStatusResult[]>([]);
  const [managedStatuses, setManagedStatuses] = useState<EventMemberStatusResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchMyPaymentStatuses(), fetchManagedPaymentStatuses()])
      .then(([mine, managed]) => {
        setMyStatuses(mine ?? []);
        setManagedStatuses(managed ?? []);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Impossible de charger les paiements.";
        showError(message);
      })
      .finally(() => setIsLoading(false));
  }, [showError]);

  if (isLoading) {
    return <FullPageSpinner label={t("payments.loadingPayments")} />;
  }

  // Côté propriétaire : on n'affiche pas en double les échéances où tu es
  // aussi le membre payeur (déjà dans "{t("payments.myDues")}").
  const myIds = new Set(myStatuses.map((s) => s.id));
  const managedOnly = managedStatuses.filter((s) => !myIds.has(s.id));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("payments.title")}</h1>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          {t("payments.myDues")}
        </h2>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          {t("payments.myDuesHint")}
        </p>
        {myStatuses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t("payments.emptyMine")}
          </div>
        ) : (
          <ul className="space-y-3">
            {myStatuses.map((status) => (
              <PaymentStatusRow key={status.id} status={status} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          {t("payments.managed")}
        </h2>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          {t("payments.managedHint")}
        </p>
        {managedOnly.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t("payments.emptyManaged")}
          </div>
        ) : (
          <ul className="space-y-3">
            {managedOnly.map((status) => (
              <PaymentStatusRow key={status.id} status={status} showMember />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function PaymentHistoryPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <PaymentHistoryContent />
    </AuthGuard>
  );
}
