"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AppNavbar } from "@/components/AppNavbar";
import { AuthGuard } from "@/components/AuthGuard";
import { Modal } from "@/components/ui/Modal";
import { Spinner, FullPageSpinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import {
  fetchEventDetail,
  recordPayment,
} from "@/lib/endpoints";
import type {
  EventDetailResponse,
  EventMemberDetailItem,
  PaymentStatus,
} from "@/lib/types";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  PARTIALLY_PAID: "Partiel",
  PAID: "Payé",
  SURPLUS: "Surplus",
  OVERDUE: "En retard",
  NOT_SEEN: "Pas encore vu",
  SEEN: "Vu",
};

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PARTIALLY_PAID: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  SURPLUS: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  OVERDUE: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  NOT_SEEN: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SEEN: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Paiement physique",
  MOBILE_MONEY: "Mobile Money",
  ORANGE_MONEY: "Orange Money",
  CARD: "Carte bancaire",
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(value);
}

function EventDetailContent() {
  const params = useParams<{ groupId: string; eventId: string }>();
  const eventId = Number(params.eventId);
  const groupId = Number(params.groupId);
  const { showSuccess, showError } = useToast();

  const [detail, setDetail] = useState<EventDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [activeMember, setActiveMember] = useState<EventMemberDetailItem | null>(null);
  const [amount, setAmount] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  function loadDetail() {
    setIsLoading(true);
    fetchEventDetail(groupId, eventId)
      .then(setDetail)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Impossible de charger l'événement.";
        showError(message);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, groupId]);

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRecordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeMember) return;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setRecordError("Merci de saisir un montant valide.");
      return;
    }
    setRecordError(null);
    setIsRecording(true);

    try {
      await recordPayment(activeMember.eventMemberStatusId, numericAmount, "CASH");
      showSuccess("Paiement enregistré avec succès.");
      setAmount("");
      setActiveMember(null);
      loadDetail();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l'enregistrement du paiement.";
      setRecordError(message);
      showError(message);
    } finally {
      setIsRecording(false);
    }
  }

  if (isLoading || !detail) {
    return <FullPageSpinner label="Chargement de l'événement..." />;
  }

  const members = detail.members ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/groups/${groupId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au groupe
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{detail.title}</h1>
        {detail.description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail.description}</p>
        )}
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Échéance : {detail.eventDate}
          {detail.eventTime ? ` à ${detail.eventTime.slice(0, 5)}` : ""}
          {detail.hasMoney
            ? ` — Objectif : ${formatAmount(detail.targetAmount ?? 0)}`
            : " — Info (sans argent)"}
          {detail.withdrawalFeeAmount != null && detail.withdrawalFeeAmount > 0
            ? ` — Frais de retrait : ${formatAmount(detail.withdrawalFeeAmount)}`
            : ""}
        </p>
      </header>

      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
        Suivi par membre
      </h2>

      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Aucun membre associé à cet événement.
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => {
            const expanded = expandedIds.has(member.eventMemberStatusId);
            const hasPayments = (member.payments?.length ?? 0) > 0;
            const canExpand = detail.hasMoney ? hasPayments : !!member.seenAt;

            return (
              <li
                key={member.eventMemberStatusId}
                className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {member.memberFullName ?? "Membre"}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[member.status]}`}
                      >
                        {STATUS_LABELS[member.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {detail.hasMoney
                        ? `${formatAmount(member.paidAmount ?? 0)} / ${formatAmount(member.requiredAmount ?? 0)}`
                        : member.status === "SEEN" && member.seenAt
                          ? `Vu le ${new Date(member.seenAt).toLocaleString("fr-FR")}`
                          : "Pas encore consulté"}
                      {member.memberEmail ? ` · ${member.memberEmail}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {canExpand && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(member.eventMemberStatusId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        Historique
                        {detail.hasMoney && hasPayments ? ` (${member.payments.length})` : ""}
                      </button>
                    )}
                    {detail.hasMoney && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMember(member);
                          setAmount("");
                          setRecordError(null);
                        }}
                        className="rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-teal-700"
                      >
                        Paiement physique
                      </button>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                    {detail.hasMoney ? (
                      hasPayments ? (
                        <ul className="space-y-2">
                          {member.payments.map((p) => (
                            <li
                              key={p.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                            >
                              <span className="font-medium text-slate-800 dark:text-slate-100">
                                {formatAmount(p.amountPaid)}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}
                                {" · "}
                                {new Date(p.paidAt).toLocaleString("fr-FR")}
                                {p.transactionRef ? ` · Réf. ${p.transactionRef}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">Aucun versement enregistré.</p>
                      )
                    ) : (
                      <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                        <Check className="h-4 w-4 text-emerald-600" />
                        {member.seenAt
                          ? `Consulté le ${new Date(member.seenAt).toLocaleString("fr-FR")}`
                          : "Pas encore consulté"}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={!!activeMember}
        onClose={() => setActiveMember(null)}
        title={`Paiement physique — ${activeMember?.memberFullName ?? ""}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Enregistrement d&apos;un <strong>paiement physique</strong> reçu en main propre
            (espèces, etc.). Les paiements Mobile Money / Orange Money / carte se font
            uniquement via le lien envoyé au membre.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Montant reçu (FCFA)
            </label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
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
            Enregistrer le paiement physique
          </button>
        </form>
      </Modal>
    </main>
  );
}

export default function EventDetailPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <EventDetailContent />
    </AuthGuard>
  );
}
