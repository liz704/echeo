"use client";

import type { PaymentStatus } from "@/lib/types";

const CONFIG: Record<
  PaymentStatus,
  { label: string; classes: string }
> = {
  PENDING: {
    label: "En attente",
    classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  PARTIALLY_PAID: {
    label: "Partiel",
    classes: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  PAID: {
    label: "Payé",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
  SURPLUS: {
    label: "Surplus net",
    classes: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  },
  OVERDUE: {
    label: "En retard",
    classes: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  NOT_SEEN: {
    label: "Pas encore vu",
    classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  SEEN: {
    label: "Vu",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = CONFIG[status] ?? CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

export function paymentProgressPercent(paid: number, required: number): number {
  if (!required || required <= 0) return 0;
  return Math.min(100, Math.round((paid / required) * 100));
}
