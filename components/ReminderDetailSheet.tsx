"use client";

import { ReactNode } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useLocale } from "@/contexts/LocaleContext";

export const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60";

export interface DetailRow {
  icon: ReactNode;
  label: string;
  value: string;
}

interface ReminderDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bigLabel: string;
  topLabel: string;
  title: string;
  description?: string | null;
  rows: DetailRow[];
  /** Extra block between the rows and the buttons (e.g. a recurrence switch). */
  extra?: ReactNode;
  /** Main action on the right (Done, View details...). */
  primary: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

/** Detail panel opened when a card is tapped (like the alarm editor of the clock app). */
export function ReminderDetailSheet({
  isOpen,
  onClose,
  bigLabel,
  topLabel,
  title,
  description,
  rows,
  extra,
  primary,
  onEdit,
  onDelete,
}: ReminderDetailSheetProps) {
  const { t } = useLocale();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-5xl font-light leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">
          {bigLabel}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {t("common.edit")}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{topLabel}</p>

      <h2 className="mt-5 break-words text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      {description && (
        <p className="mt-1 whitespace-pre-line break-words text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
      )}

      <ul className="mt-5 space-y-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm dark:bg-slate-800"
          >
            <span className="shrink-0 text-teal-700 dark:text-teal-400">{row.icon}</span>
            <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
            <span className="ml-auto text-right font-medium text-slate-900 dark:text-white">{row.value}</span>
          </li>
        ))}
      </ul>

      {extra && <div className="mt-2">{extra}</div>}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full bg-slate-100 px-6 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          {t("common.delete")}
        </button>
        {primary}
      </div>
    </BottomSheet>
  );
}
