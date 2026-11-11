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
import { useLocale } from "@/contexts/LocaleContext";
import { cardLabels } from "@/lib/dateFormat";
import type {
  EventDetailResponse,
  EventMemberDetailItem,
  PaymentStatus,
} from "@/lib/types";

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PARTIALLY_PAID: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  SURPLUS: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  OVERDUE: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  NOT_SEEN: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SEEN: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(value);
}

function EventDetailContent() {
  const { t, dateLocale } = useLocale();
  const methodLabel = (m: string) => {
    if (m === "CASH") return t("ui.physicalPayment");
    const key = `payments.method.${m}`;
    const label = t(key);
    return label === key ? m : label;
  };
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
        const message = error instanceof Error ? error.message : t("msg.eventLoadFailed");
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
      setRecordError(t("msg.enterValidAmount"));
      return;
    }
    setRecordError(null);
    setIsRecording(true);

    try {
      await recordPayment(activeMember.eventMemberStatusId, numericAmount, "CASH");
      showSuccess(t("payments.paymentRecorded"));
      setAmount("");
      setActiveMember(null);
      loadDetail();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("msg.recordPaymentFailed");
      setRecordError(message);
      showError(message);
    } finally {
      setIsRecording(false);
    }
  }

  if (isLoading || !detail) {
    return <FullPageSpinner label={t("payments.loadingEvent")} />;
  }

  const members = detail.members ?? [];

  // Summary shown in the header card.
  const totalMembers = members.length;
  const settledCount = members.filter((m) => m.status === "PAID" || m.status === "SURPLUS").length;
  const seenCount = members.filter((m) => m.status === "SEEN" || !!m.seenAt).length;
  const collected = members.reduce((sum, m) => sum + (m.paidAmount ?? 0), 0);
  const expected = members.reduce((sum, m) => sum + (m.requiredAmount ?? 0), 0);
  const collectedPercent = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;
  const repetitionNames: Record<string, string> = {
    DAILY: t("forms.repetitionDaily"),
    WEEKLY: t("forms.repetitionWeekly"),
    MONTHLY: t("forms.repetitionMonthly"),
    YEARLY: t("forms.repetitionYearly"),
  };
  const headerLabels = cardLabels({
    dateIso: detail.eventDate,
    time: detail.eventTime,
    repetitionLabel: repetitionNames[detail.repetitionType] ?? null,
    dateLocale,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/groups/${groupId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("ui.backToGroup")}
      </Link>

      <section className="mb-6 rounded-2xl bg-teal-700 p-5 text-white dark:bg-teal-800">
        <p className="truncate text-sm text-teal-100">{headerLabels.top}</p>
        <p className="mt-1 text-5xl font-light leading-none tracking-tight tabular-nums">{headerLabels.big}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="break-words text-xl font-semibold">{detail.title}</h1>
          {detail.paused && (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">{t("v3.pausedBadge")}</span>
          )}
        </div>
        {detail.description && <p className="mt-1 break-words text-sm text-teal-100">{detail.description}</p>}
        <p className="mt-2 text-sm text-teal-100">
          {detail.hasMoney
            ? `${t("forms.objective")} : ${formatAmount(detail.targetAmount ?? 0)}`
            : t("ui.infoNoMoney")}
          {detail.withdrawalFeeAmount != null && detail.withdrawalFeeAmount > 0
            ? ` — ${t("v3.withdrawalFee")} : ${formatAmount(detail.withdrawalFeeAmount)}`
            : ""}
        </p>

        {totalMembers > 0 && (
          <div className="mt-4">
            {detail.hasMoney ? (
              <>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span>{t("v3.settledCount", { done: settledCount, total: totalMembers })}</span>
                  <span className="text-teal-100">
                    {formatAmount(collected)} / {formatAmount(expected)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-white" style={{ width: `${collectedPercent}%` }} />
                </div>
              </>
            ) : (
              <p className="text-sm">{t("v3.seenCount", { done: seenCount, total: totalMembers })}</p>
            )}
          </div>
        )}
      </section>

      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
        {t("ui.memberTracking")}
      </h2>

      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t("ui.noMemberLinked")}
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => {
            const expanded = expandedIds.has(member.eventMemberStatusId);
            const hasPayments = (member.payments?.length ?? 0) > 0;
            const canExpand = detail.hasMoney ? hasPayments : !!member.seenAt;
            const required = member.requiredAmount ?? 0;
            const memberPercent =
              required > 0 ? Math.min(100, Math.round(((member.paidAmount ?? 0) / required) * 100)) : 0;
            const barColor =
              member.status === "PAID" || member.status === "SURPLUS"
                ? "bg-emerald-500"
                : member.status === "OVERDUE"
                  ? "bg-red-500"
                  : "bg-teal-500";
            const displayName = member.memberFullName ?? t("groups.memberFallback");

            return (
              <li
                key={member.eventMemberStatusId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-base font-medium text-teal-800 dark:bg-teal-900 dark:text-teal-100"
                    >
                      {displayName.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-medium text-slate-900 dark:text-white">{displayName}</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[member.status]}`}
                        >
                          {t(`status.${member.status}`)}
                        </span>
                      </div>
                      <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
                        {detail.hasMoney
                          ? `${formatAmount(member.paidAmount ?? 0)} / ${formatAmount(member.requiredAmount ?? 0)}`
                          : member.status === "SEEN" && member.seenAt
                            ? t("ui.seenOn", { date: new Date(member.seenAt).toLocaleString(dateLocale) })
                            : t("ui.notViewedYet")}
                        {member.memberEmail ? ` · ${member.memberEmail}` : ""}
                      </p>
                      {detail.hasMoney && required > 0 && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${memberPercent}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    {canExpand && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(member.eventMemberStatusId)}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {t("ui.history")}
                        {detail.hasMoney && hasPayments ? ` (${member.payments.length})` : ""}
                      </button>
                    )}
                    {/* No more button once the member's share is fully settled. */}
                    {detail.hasMoney && member.status !== "PAID" && member.status !== "SURPLUS" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMember(member);
                          setAmount("");
                          setRecordError(null);
                        }}
                        className="rounded-full bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
                      >
                        {t("ui.physicalPayment")}
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
                                {methodLabel(p.paymentMethod)}
                                {" · "}
                                {new Date(p.paidAt).toLocaleString(dateLocale)}
                                {p.transactionRef ? ` · ${t("ui.ref")} ${p.transactionRef}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">{t("ui.noPaymentRecorded")}</p>
                      )
                    ) : (
                      <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                        <Check className="h-4 w-4 text-emerald-600" />
                        {member.seenAt
                          ? t("ui.viewedOn", { date: new Date(member.seenAt).toLocaleString(dateLocale) })
                          : t("ui.notViewedYet")}
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
        title={t("ui.physicalPaymentTitle", { name: activeMember?.memberFullName ?? "" })}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {t("ui.physicalInfoA")} <strong>{t("ui.physicalInfoB")}</strong> {t("ui.physicalInfoC")}
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("ui.amountReceived")}
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
            {t("ui.recordPhysical")}
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
