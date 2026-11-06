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
  const [ys, ms] = start.split("-");
  const [ye, me] = end.split("-");
  if (ys === ye && ms === me) {
    const s = formatDate(start, locale, { day: "numeric" });
    return `${s}–${formatDate(end, locale)}`;
  }
  return `${formatDate(start, locale)} – ${formatDate(end, locale)}`;
}

export function formatRelative(ms: number, locale: Locale) {
  return new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "short", year: "numeric" }).format(ms);
}

export function percent(raised: number, goal: number) {
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 1000) / 10);
}
