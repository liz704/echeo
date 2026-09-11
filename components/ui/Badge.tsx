import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export type ReminderBadgeStatus = "UPCOMING" | "OVERDUE" | "COMPLETED";

const BADGE_CONFIG: Record<
  ReminderBadgeStatus,
  { label: string; classes: string; Icon: typeof Clock }
> = {
  UPCOMING: {
    label: "À venir",
    classes:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    Icon: Clock,
  },
  OVERDUE: {
    label: "En retard",
    classes:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    Icon: AlertCircle,
  },
  COMPLETED: {
    label: "Terminé",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    Icon: CheckCircle2,
  },
};

export function StatusBadge({ status }: { status: ReminderBadgeStatus }) {
  const config = BADGE_CONFIG[status];
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.classes}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

/**
 * Détermine le statut d'affichage d'un rappel à partir de ses données brutes.
 */
export function resolveReminderStatus(dueDate: string, completed: boolean): ReminderBadgeStatus {
  if (completed) return "COMPLETED";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return due.getTime() < today.getTime() ? "OVERDUE" : "UPCOMING";
}
