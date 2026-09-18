"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Banknote, Link as LinkIcon, Smartphone } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { fetchEventMemberStatuses, generatePaymentLink, recordPayment } from "@/lib/endpoints";
import type { EventMemberStatusResult, PaymentMethod, PaymentStatus } from "@/lib/types";

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

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function EventStatusesContent() {
  const params = useParams<{ groupId: string; eventId: string }>();
  const eventId = Number(params.eventId);
  const groupId = params.groupId;
  const { showSuccess, showError } = useToast();

  const [statuses, setStatuses] = useState<EventMemberStatusResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeStatus, setActiveStatus] = useState<EventMemberStatusResult | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const [isGeneratingLink, setIsGeneratingLink] = useState<number | null>(null);

  function loadStatuses() {
    setIsLoading(true);
    fetchEventMemberStatuses(eventId)
      .then(setStatuses)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Impossible de charger les statuts.";
        showError(message);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleRecordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeStatus) return;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setRecordError("Merci de saisir un montant valide.");
      return;
    }
    setRecordError(null);
    setIsRecording(true);

    try {
      const updated = await recordPayment(activeStatus.id, numericAmount, method);
      setStatuses((current) => current.map((s) => (s.id === updated.id ? updated : s)));
      showSuccess("Paiement enregistré avec succès.");
      setAmount("");
      setActiveStatus(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l'enregistrement du paiement.";
      setRecordError(message);
      showError(message);
    } finally {
      setIsRecording(false);
    }
  }

  async function handleGenerateLink(statusId: number) {
    setIsGeneratingLink(statusId);
    try {
      const token = await generatePaymentLink(statusId);
      const publicUrl = `${window.location.origin}/pay/${token.tokenUuid}`;
      await navigator.clipboard.writeText(publicUrl);
      showSuccess("Lien de paiement copié dans le presse-papier !");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la génération du lien.";
      showError(message);
    } finally {
      setIsGeneratingLink(null);
    }
  }

  if (isLoading) {
    return <FullPageSpinner label="Chargement des statuts de paiement..." />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={`/groups/${groupId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au groupe
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {statuses[0]?.event?.title ?? "Statuts de paiement"}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Suivi des cotisations par membre. Enregistre un paiement reçu en espèces/Mobile Money,
        ou génère un lien de paiement public à partager.
      </p>

      {statuses.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Aucun membre associé à cet événement.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {statuses.map((status) => (
            <li
              key={status.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {status.groupMember?.contactFullName ?? "Membre"}
                  </p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status.status]}`}>
                    {STATUS_LABELS[status.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {formatAmount(status.paidAmount ?? 0)} / {formatAmount(status.requiredAmount ?? 0)}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStatus(status)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                >
                  <Banknote className="h-4 w-4" />
                  Enregistrer paiement
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateLink(status.id)}
                  disabled={isGeneratingLink === status.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {isGeneratingLink === status.id ? <Spinner size={14} /> : <LinkIcon className="h-4 w-4" />}
                  Lien de paiement
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={!!activeStatus}
        onClose={() => {
          setActiveStatus(null);
          setRecordError(null);
        }}
        title={`Enregistrer un paiement — ${activeStatus?.groupMember?.contactFullName ?? ""}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Montant reçu (FCFA)
            </label>
            <input
              type="number"
              min={1}
              placeholder="Ex : 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Moyen de paiement
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod("CASH")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  method === "CASH"
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-300"
                    : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <Banknote className="h-4 w-4" />
                Espèces
              </button>
              <button
                type="button"
                onClick={() => setMethod("MOBILE_MONEY")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  method === "MOBILE_MONEY"
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-300"
                    : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Mobile Money
              </button>
            </div>
          </div>

          {recordError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {recordError}
            </p>
          )}

          <button
            type="submit"
            disabled={isRecording}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isRecording && <Spinner size={16} />}
            Enregistrer
          </button>
        </form>
      </Modal>
    </main>
  );
}

export default function EventStatusesPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <EventStatusesContent />
    </AuthGuard>
  );
}