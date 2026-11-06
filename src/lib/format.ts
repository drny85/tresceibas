import type { Locale } from "@/i18n/config";

const tag = (locale: Locale) => (locale === "es" ? "es-DO" : "en-US");

export function formatDop(n: number, locale: Locale) {
  return "RD$" + Math.round(n).toLocaleString(tag(locale));
}

export function formatUsd(n: number, locale: Locale) {
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

export function formatAmount(amount: number, currency: "USD" | "DOP", locale: Locale) {
  return currency === "USD" ? formatUsd(amount, locale) : formatDop(amount, locale);
}

/** Formats an ISO date (YYYY-MM-DD) without timezone surprises. */
export function formatDate(iso: string, locale: Locale, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(tag(locale), { ...opts, timeZone: "UTC" }).format(Date.UTC(y, m - 1, d));
}

export function formatDateRange(start: string, end: string, locale: Locale) {
  if (start === end) return formatDate(start, locale);
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  const fmt = new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return fmt.formatRange(toUtc(start), toUtc(end));
}

export function formatRelative(ms: number, locale: Locale) {
  return new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "short", year: "numeric" }).format(ms);
}

export function percent(raised: number, goal: number) {
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 1000) / 10);
}

/** "16:30" → "4:30 p. m." (es) or "4:30 PM" (en). */
export function formatTime(hhmm: string, locale: Locale) {
  // 23:59 is stored as "end of the night" so it still sorts last; show it as midnight.
  const [h, m] = hhmm === "23:59" ? [24, 0] : hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(tag(locale), { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(Date.UTC(2000, 0, 1, h, m));
}

/** The time line for an activity, or null when it lasts all day. */
export function activityTime(a: { startTime?: string; endTime?: string; time?: string }, locale: Locale) {
  if (a.startTime) {
    return a.endTime ? `${formatTime(a.startTime, locale)} – ${formatTime(a.endTime, locale)}` : formatTime(a.startTime, locale);
  }
  return a.time ?? null;
}
