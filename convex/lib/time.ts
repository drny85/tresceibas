/** Times are stored as 24-hour "HH:mm" strings, e.g. "16:30". */
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Reads older free-text times like "4:00 p. m.", "10:00A.M" or "12:00 m." (noon). */
export function parseLegacyTime(text?: string): string | undefined {
  if (!text) return undefined;
  const s = text.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a m|p m|m)?$/);
  if (!m) return undefined;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const suffix = m[3]?.replace(" ", "");
  if (suffix === "pm" && h < 12) h += 12;
  if (suffix === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return undefined;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function toMinutes(time?: string) {
  if (!time || !TIME_RE.test(time)) return -1;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
