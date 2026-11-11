// Small date helpers shared by the reminder cards and detail sheets.

/** "08:30:00" -> "08:30" (empty string when no time is set). */
export function formatTime(value?: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function parseIsoDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00`);
}

function safeFormat(iso: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  const date = parseIsoDate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale, options);
}

/** "12 Nov" */
export function formatShortDate(iso: string, locale: string): string {
  return safeFormat(iso, locale, { day: "numeric", month: "short" });
}

/** "Wed, 12 Nov" */
export function formatWeekdayDate(iso: string, locale: string): string {
  return safeFormat(iso, locale, { weekday: "short", day: "numeric", month: "short" });
}

/** "Wednesday 12 November 2026" */
export function formatLongDate(iso: string, locale: string): string {
  return safeFormat(iso, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/**
 * Labels used by the alarm-style cards.
 * - with a time: big = "08:30", top = "Wed, 12 Nov · Every week"
 * - without a time: big = "12 Nov", top = "Every week" (or the weekday for one-off items)
 */
export function cardLabels(options: {
  dateIso: string;
  time?: string | null;
  repetitionLabel?: string | null;
  dateLocale: string;
}): { big: string; top: string } {
  const { dateIso, time, repetitionLabel, dateLocale } = options;
  const clock = formatTime(time);
  if (clock) {
    const top = [formatWeekdayDate(dateIso, dateLocale), repetitionLabel].filter(Boolean).join(" · ");
    return { big: clock, top };
  }
  const weekday = safeFormat(dateIso, dateLocale, { weekday: "long" });
  return { big: formatShortDate(dateIso, dateLocale), top: repetitionLabel || weekday };
}
