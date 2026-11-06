"use client";

import Link from "next/link";
import { useState } from "react";
import { Church, Drum, Trophy, Users } from "lucide-react";
import { useI18n, pick } from "@/i18n/provider";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Category = "cultural" | "religious" | "sports" | "community";
export type ProgramActivity = {
  _id: string;
  slug: string;
  title: { es: string; en: string };
  summary: { es: string; en: string };
  startDate: string;
  endDate: string;
  time?: string;
  category?: Category;
  responsible?: string;
};

export const CATEGORY_ICON = { cultural: Drum, religious: Church, sports: Trophy, community: Users } as const;
const CATEGORY_TONE: Record<Category, string> = {
  cultural: "bg-brand-gold/20 text-foreground",
  religious: "bg-primary/10 text-primary",
  sports: "bg-brand-green/15 text-brand-green",
  community: "bg-brand-red/10 text-brand-red",
};

export function CategoryBadge({ category }: { category: Category }) {
  const { dict } = useI18n();
  const Icon = CATEGORY_ICON[category];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", CATEGORY_TONE[category])}>
      <Icon className="size-3.5" aria-hidden /> {dict.activities.categories[category]}
    </span>
  );
}

/** The activities of one event, grouped by day, with a filter by type. */
export function ActivityProgram({ items }: { items: ProgramActivity[] }) {
  const { locale, dict } = useI18n();
  const [filter, setFilter] = useState<Category | null>(null);
  const present = (["cultural", "religious", "sports", "community"] as const).filter((c) => items.some((i) => i.category === c));
  const shown = filter ? items.filter((i) => i.category === filter) : items;
  const days = [...new Set(shown.map((i) => i.startDate))].sort();

  return (
    <div className="grid gap-5">
      {present.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={dict.activities.program}>
          {[null, ...present].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
              className={cn(
                "h-10 shrink-0 cursor-pointer rounded-full border border-border px-4 text-sm font-semibold transition-colors",
                filter === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary",
              )}
            >
              {c ? dict.activities.categories[c] : dict.activities.all}
            </button>
          ))}
        </div>
      )}
      {days.map((day) => (
        <section key={day} className="overflow-hidden rounded-2xl border border-border bg-card">
          <h3 className="border-b border-border bg-muted/60 px-4 py-3 text-base font-bold capitalize sm:px-5 sm:text-lg">
            {formatDate(day, locale, { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          <ol className="divide-y divide-border">
            {shown.filter((i) => i.startDate === day).map((i) => (
              <li key={i._id}>
                <Link
                  href={`/${locale}/actividades/${i.slug}`}
                  className="grid grid-cols-[5.25rem_1fr] gap-x-3 gap-y-1 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:grid-cols-[7rem_1fr_auto] sm:items-baseline sm:gap-4 sm:px-5"
                >
                  <span className="tabular text-sm font-bold text-brand-red">{i.time ?? dict.activities.allDay}</span>
                  <span className="grid gap-1">
                    <span className="font-semibold leading-snug">{pick(i.title, locale)}</span>
                    <span className="text-sm text-muted-foreground text-pretty">{pick(i.summary, locale)}</span>
                  </span>
                  <span className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-3 sm:justify-end">
                    {i.category && <CategoryBadge category={i.category} />}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
