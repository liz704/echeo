"use client";

import { useLocale } from "@/contexts/LocaleContext";

const DAY_OPTIONS = [7, 5, 3, 2, 1, 0];

/**
 * Choix des jours de relance AVANT l'échéance. La valeur est une chaîne "3,1,0",
 * "" (non choisi : relances par défaut 7,3,0) ou "none" (aucune relance avant).
 */
export function ReminderDaysPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLocale();
  const selected = value === "none" ? [] : value ? value.split(",").map(Number) : [7, 3, 0];
  const isNone = value === "none";

  function toggle(day: number) {
    const base = isNone ? [] : selected;
    const next = base.includes(day) ? base.filter((d) => d !== day) : [...base, day];
    next.sort((a, b) => b - a);
    onChange(next.length === 0 ? "none" : next.join(","));
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {t("v2.reminderDays")} <span className="font-normal text-slate-400">{t("forms.optional")}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {DAY_OPTIONS.map((day) => {
          const active = selected.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {day === 0 ? t("v2.dayOf") : t("v2.daysBefore", { n: day })}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {isNone ? t("v2.noneBefore") + " — " : ""}
        {t("v2.reminderDaysHint")}
      </p>
    </div>
  );
}
