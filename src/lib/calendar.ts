/** Calendar links for an activity. Times are local Dominican time (UTC-4, no daylight saving). */
type When = { startDate: string; endDate?: string; startTime?: string; endTime?: string };
type CalEvent = When & { title: string; details: string; location: string; url: string };

const DR_OFFSET_HOURS = 4;
const compact = (d: string) => d.replaceAll("-", "");

function nextDay(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** "20270220T190000Z" from a Dominican date and "HH:mm". */
function utcStamp(date: string, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCHours(h + DR_OFFSET_HOURS, m);
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

/** Start and end in calendar format: all-day dates (end is exclusive) or UTC times. */
function range(e: When): [string, string, boolean] {
  const last = e.endDate ?? e.startDate;
  if (!e.startTime) return [compact(e.startDate), compact(nextDay(last)), true];
  const end = e.endTime ?? `${String(Math.min(Number(e.startTime.slice(0, 2)) + 1, 23)).padStart(2, "0")}:${e.startTime.slice(3)}`;
  return [utcStamp(e.startDate, e.startTime), utcStamp(last, end), false];
}

export function googleCalendarUrl(e: CalEvent) {
  const [start, end] = range(e);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${start}/${end}`,
    details: `${e.details}\n\n${e.url}`,
    location: e.location,
    ctz: "America/Santo_Domingo",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const escapeIcs = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** An .ics file for Apple Calendar, Outlook and others. */
export function icsFile(e: CalEvent & { uid: string }) {
  const [start, end, allDay] = range(e);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tres Ceibas//Actividades//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.uid}@tresceibas`,
    `DTSTAMP:${stamp}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    `DESCRIPTION:${escapeIcs(`${e.details}\n\n${e.url}`)}`,
    `LOCATION:${escapeIcs(e.location)}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
