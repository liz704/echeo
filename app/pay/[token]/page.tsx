"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Wallet, AlertTriangle, Smartphone, CreditCard } from "lucide-react";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import {
  fetchOnlinePaymentAvailable,
  fetchPublicPaymentDetails,
  refreshOnlinePayment,
  startOnlinePayment,
  submitPublicPayment,
} from "@/lib/endpoints";
import type { PaymentMethod, PublicPaymentDetails, PublicPaymentResult } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string; Icon: typeof Wallet }[] = [
  { value: "MOBILE_MONEY", label: "payments.method.MOBILE_MONEY", Icon: Smartphone },
  { value: "ORANGE_MONEY", label: "payments.method.ORANGE_MONEY", Icon: Wallet },
  { value: "CARD", label: "payments.method.CARD", Icon: CreditCard },
];

function formatAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

export default function PublicPaymentPage() {
  const { t } = useLocale();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [details, setDetails] = useState<PublicPaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MOBILE_MONEY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicPaymentResult | null>(null);
  const [onlineAvailable, setOnlineAvailable] = useState(false);
  const [isStartingOnline, setIsStartingOnline] = useState(false);
  const [onlineNotice, setOnlineNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      try {
        fetchOnlinePaymentAvailable()
          .then((v) => isMounted && setOnlineAvailable(v))
          .catch(() => undefined);

        // Retour de la page de paiement Faroty : on vérifie le paiement avant d'afficher l'état.
        const returned = new URLSearchParams(window.location.search).get("online");
        if (returned === "success") {
          setOnlineNotice(t("v2.onlineChecking"));
          for (let i = 0; i < 4; i++) {
            try {
              await refreshOnlinePayment(token);
            } catch {
              /* on réessaie */
            }
            const check = await fetchPublicPaymentDetails(token);
            if (check.remainingAmount <= 0) break;
            await new Promise((r) => setTimeout(r, 2500));
          }
          setOnlineNotice(null);
        } else if (returned === "cancel") {
          setOnlineNotice(t("v2.onlineCancel"));
        }
        const data = await fetchPublicPaymentDetails(token);
        if (isMounted) {
          setDetails(data);
          setAmount(data.remainingAmount > 0 ? String(data.remainingAmount) : "");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("msg.paymentLinkInvalid");
        if (isMounted) setLoadError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDetails();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleOnlinePay() {
    setSubmitError(null);
    setIsStartingOnline(true);
    try {
      const url = await startOnlinePayment(token);
      window.location.href = url;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("msg.paymentFailed"));
      setIsStartingOnline(false);
    }
  }

  async function handlePay() {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setSubmitError(t("msg.enterValidAmount"));
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const paymentResult = await submitPublicPayment(token, {
        amount: numericAmount,
        paymentMethod,
      });
      setResult(paymentResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("msg.paymentFailed");
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <FullPageSpinner label={t("payments.loadingDue")} />;
  }

  if (loadError || !details) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-900">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{t("ui.linkUnavailable")}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {loadError ?? t("msg.paymentLinkInvalidShort")}
          </p>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-900">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{t("ui.paymentRecorded")}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t("ui.thanksPayment", { amount: formatAmount(Number(amount)) })}
          </p>
          <div className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-left text-sm dark:bg-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t("ui.totalRequired")}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatAmount(result.requiredAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t("ui.totalPaid")}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatAmount(result.paidAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t("ui.status")}</span>
              <span className="font-medium text-slate-900 dark:text-white">{t(`status.${result.status}`)}</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <Wallet className="mx-auto mb-2 h-8 w-8 text-teal-600 dark:text-teal-400" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{details.eventTitle}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("ui.paymentFor", { name: details.memberFullName })}
          </p>
        </div>

        {/* Résumé explicite : Total, déjà payé, reste */}
        <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("ui.total")}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {formatAmount(Number(details.requiredAmount) + Number(details.withdrawalFeeAmount ?? 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("ui.alreadyPaid")}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {formatAmount(details.paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("ui.remaining")}</p>
            <p className="mt-1 text-sm font-semibold text-red-600 dark:text-red-400">
              {formatAmount(details.remainingAmount)}
            </p>
          </div>
        </div>

        {details.withdrawalFeeAmount != null && Number(details.withdrawalFeeAmount) > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="font-medium">{t("forms.withdrawalFee")}</p>
            <p className="mt-1">
              {formatAmount(details.withdrawalFeeAmount)}
              <span className="mt-1 block text-xs opacity-90">{t("v2.feeIncluded")}</span>
            </p>
          </div>
        )}

        {onlineNotice && (
          <p className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            {onlineNotice}
          </p>
        )}

        {details.remainingAmount <= 0 && (details.status === "PAID" || details.status === "SURPLUS") ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            {t("v2.onlineSuccess")} — {t("v2.settled")}
          </div>
        ) : (
        <div className="space-y-4">
          {onlineAvailable && (
            <div className="space-y-2 rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/30">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {t("v2.amountToPay")} : {formatAmount(details.remainingAmount)}
              </p>
              <button
                type="button"
                onClick={handleOnlinePay}
                disabled={isStartingOnline}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                {isStartingOnline && <Spinner size={18} />}
                {t("v2.payOnline")}
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t("v2.payOnlineHint")}</p>
            </div>
          )}
          {submitError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {submitError}
            </p>
          )}

          <div className={onlineAvailable ? "hidden" : "space-y-4"}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("ui.amountToPay")}
            </label>
            <input
              type="number"
              min={1}
              placeholder={t("ui.example", { value: "15000" })}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("ui.paymentMethod")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHOD_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition ${
                    paymentMethod === value
                      ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {t(label)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isSubmitting && <Spinner size={18} />}
            {t("ui.confirmPayment")}
          </button>
          </div>
        </div>
        )}
      </div>
    </main>
  );
}
