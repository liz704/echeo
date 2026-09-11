"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Wallet } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { deletePaymentHistoryEntry, fetchMyPaymentStatuses, fetchPaymentHistoryFor } from "@/lib/endpoints";
import type { EventMemberStatusResult, PaymentHistoryEntry, PaymentStatus } from "@/lib/types";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  PARTIALLY_PAID: "Partiellement payé",
  PAID: "Payé",
  SURPLUS: "Surplus",
  OVERDUE: "En retard",
};

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  SURPLUS: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  OVERDUE: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte bancaire",
};

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function PaymentStatusRow({ status }: { status: EventMemberStatusResult }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<PaymentHistoryEntry[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSuccess, showError } = useToast();

  async function toggleExpand() {
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
      showSuccess("Entrée supprimée de l'historique.");
      setPendingDeleteId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la suppression.";
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={toggleExpand}
        className="flex w-full flex-col gap-2 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900 dark:text-white">{status.event.title}</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status.status]}`}>
              {STATUS_LABELS[status.status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Échéance : {status.event.eventDate}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="text-slate-500 dark:text-slate-400">
              {formatAmount(status.paidAmount)} / {formatAmount(status.requiredAmount)}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          {isLoadingHistory ? (
            <Spinner size={16} label="Chargement des versements..." />
          ) : history && history.length > 0 ? (
            <ul className="space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  <span className="text-slate-600 dark:text-slate-300">
                    {PAYMENT_METHOD_LABELS[entry.paymentMethod] ?? entry.paymentMethod}
                    {entry.transactionRef ? ` — Réf. ${entry.transactionRef}` : ""}
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
                      aria-label="Supprimer cette entrée"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Aucun versement enregistré pour cette échéance.</p>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!pendingDeleteId}
        title="Supprimer cette entrée ?"
        description="Cette action supprime uniquement la ligne d'historique — elle ne modifie pas le montant déjà payé ni le statut de l'échéance."
        confirmLabel="Supprimer"
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </li>
  );
}

function PaymentHistoryContent() {
  const { showError } = useToast();
  const [statuses, setStatuses] = useState<EventMemberStatusResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchMyPaymentStatuses()
      .then((data) => {
        if (isMounted) setStatuses(data);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Impossible de charger tes cotisations.";
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
    return <FullPageSpinner label="Chargement de tes cotisations..." />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mes paiements</h1>
      </div>

      {statuses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Tu n'as encore aucune cotisation de groupe. Clique sur une ligne pour voir le détail des versements.
        </div>
      ) : (
        <ul className="space-y-3">
          {statuses.map((status) => (
            <PaymentStatusRow key={status.id} status={status} />
          ))}
        </ul>
      )}
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
