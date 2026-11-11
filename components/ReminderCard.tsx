"use client";

import { KeyboardEvent, ReactNode } from "react";

export type ReminderCardTone = "active" | "overdue" | "paused";

const TONES: Record<ReminderCardTone, { card: string; muted: string; badge: string }> = {
  active: {
    card: "bg-teal-700 text-white dark:bg-teal-800",
    muted: "text-teal-100",
    badge: "bg-white/20 text-white",
  },
  overdue: {
    card: "bg-rose-700 text-white dark:bg-rose-800",
    muted: "text-rose-100",
    badge: "bg-white/20 text-white",
  },
  paused: {
    card: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    muted: "text-slate-500 dark:text-slate-400",
    badge: "bg-slate-300/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  },
};

interface ReminderCardProps {
  tone: ReminderCardTone;
  /** Small line above the big label (date, repetition...). */
  topLabel: string;
  /** Big label: the time, or a short date when no time is set. */
  bigLabel: string;
  title: string;
  /** Optional line under the title (description, amount...). */
  meta?: string;
  badge?: string;
  /** Right-hand control (switch, done button...). Clicking it never opens the card. */
  control?: ReactNode;
  onOpen: () => void;
}

/** Alarm-style card shared by personal reminders and group events. */
export function ReminderCard({
  tone,
  topLabel,
  bigLabel,
  title,
  meta,
  badge,
  control,
  onOpen,
}: ReminderCardProps) {
  const styles = TONES[tone];

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className={`flex cursor-pointer items-center justify-between gap-4 p-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-300 sm:p-5 ${styles.card}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${styles.muted}`}>{topLabel}</p>
        <p className="mt-1 text-4xl font-light leading-none tracking-tight tabular-nums">{bigLabel}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="line-clamp-2 min-w-0 break-words text-sm font-medium">{title}</p>
          {badge && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}>{badge}</span>
          )}
        </div>
        {meta && <p className={`mt-0.5 line-clamp-1 break-words text-xs ${styles.muted}`}>{meta}</p>}
      </div>
      {control && (
        <div className="shrink-0" data-no-swipe onClick={(e) => e.stopPropagation()}>
          {control}
        </div>
      )}
    </div>
  );
}
