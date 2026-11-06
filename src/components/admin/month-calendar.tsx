"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Dates are plain "YYYY-MM-DD" strings everywhere in the admin. */
export const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function todayIso() {
  const d = new Date();
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
}

export type Month = { y: number; m: number }; // m is 0-11
export const monthOf = (date: string): Month => ({ y: Number(date.slice(0, 4)), m: Number(date.slice(5, 7)) - 1 });
export const addMonths = ({ y, m }: Month, n: number): Month => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 });

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const monthName = ({ y, m }: Month) =>
  new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(y, m, 1));

/** The days shown for a month, Monday first, padded with the neighbouring months. */
function gridDays({ y, m }: Month) {
  const first = new Date(Date.UTC(y, m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days: { date: string; inMonth: boolean }[] = [];
  for (let i = -lead; days.length < 42; i++) {
    const d = new Date(Date.UTC(y, m, 1 + i));
    days.push({ date: iso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), inMonth: d.getUTCMonth() === m });
  }
  // Drop a trailing week that is entirely next month.
  return days.slice(35).every((d) => !d.inMonth) ? days.slice(0, 35) : days;
}

export function MonthHeader({ month, onChange, className }: { month: Month; onChange: (m: Month) => void; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <Button type="button" variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => onChange(addMonths(month, -1))}>
        <ChevronLeft />
      </Button>
      <p className="font-display text-lg font-bold first-letter:uppercase" aria-live="polite">{monthName(month)}</p>
      <Button type="button" variant="ghost" size="icon" aria-label="Mes siguiente" onClick={() => onChange(addMonths(month, 1))}>
        <ChevronRight />
      </Button>
    </div>
  );
}

/**
 * A month grid. Used small as a date-range picker in the activity form and
 * large as the activities calendar, where each day renders its own content.
 */
export function MonthGrid({
  month,
  onSelect,
  isSelected,
  isInRange,
  isDisabled,
  renderDay,
  selectedDay,
  size = "sm",
}: {
  month: Month;
  onSelect?: (date: string) => void;
  isSelected?: (date: string) => boolean;
  isInRange?: (date: string) => boolean;
  isDisabled?: (date: string) => boolean;
  renderDay?: (date: string) => React.ReactNode;
  selectedDay?: string;
  size?: "sm" | "lg";
}) {
  const today = todayIso();
  return (
    <div className="grid gap-1">
      <div className="grid grid-cols-7 text-center text-xs font-bold text-muted-foreground" aria-hidden>
        {WEEKDAYS.map((d, i) => <span key={i} className="py-1">{d}</span>)}
      </div>
      <div className={cn("grid grid-cols-7", size === "sm" ? "gap-1" : "gap-px overflow-hidden rounded-xl border border-border bg-border")}>
        {gridDays(month).map(({ date, inMonth }) => {
          const disabled = isDisabled?.(date) ?? false;
          const selected = isSelected?.(date) ?? false;
          const inRange = isInRange?.(date) ?? false;
          const day = Number(date.slice(8));
          if (size === "sm") {
            return (
              <button
                key={date}
                type="button"
                disabled={disabled}
                onClick={() => onSelect?.(date)}
                aria-pressed={selected}
                aria-label={date}
                className={cn(
                  "tabular grid aspect-square min-h-10 place-items-center rounded-lg text-sm font-semibold transition-colors",
                  inMonth ? "" : "text-muted-foreground/50",
                  inRange && !selected && "bg-primary/15",
                  selected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  date === today && !selected && "ring-1 ring-brand-red",
                  disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                )}
              >
                {day}
              </button>
            );
          }
          return (
            <div
              key={date}
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(date)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(date); } }}
              aria-label={date}
              className={cn(
                "grid min-h-14 cursor-pointer content-start gap-1 bg-card p-1 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring sm:min-h-28 sm:p-1.5",
                !inMonth && "bg-muted/40 text-muted-foreground",
                selectedDay === date && "ring-2 ring-primary ring-inset",
              )}
            >
              <span
                className={cn(
                  "tabular grid size-6 place-items-center rounded-full text-xs font-bold",
                  date === today && "bg-brand-red text-white",
                )}
              >
                {day}
              </span>
              {renderDay?.(date)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
