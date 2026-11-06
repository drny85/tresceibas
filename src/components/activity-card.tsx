"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";
import { useI18n, pick } from "@/i18n/provider";
import { formatDate, formatDateRange } from "@/lib/format";

export type ActivityItem = FunctionReturnType<typeof api.activities.list>[number];

export function ActivityCard({ activity }: { activity: ActivityItem }) {
  const { locale } = useI18n();
  const [, m, d] = activity.startDate.split("-");
  return (
    <article className="flex gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid h-fit w-16 shrink-0 place-items-center rounded-xl bg-brand-red py-2 text-center text-white" aria-hidden>
        <span className="text-xs font-bold uppercase tracking-wider">
          {formatDate(activity.startDate, locale, { month: "short" }).replace(".", "")}
        </span>
        <span className="font-display text-2xl font-extrabold leading-none">{Number(d)}</span>
        <span className="sr-only">{m}</span>
      </div>
      <div className="grid min-w-0 gap-1.5">
        <h3 className="text-lg font-bold leading-tight">
          <Link href={`/${locale}/actividades/${activity.slug}`} className="hover:underline">
            {pick(activity.title, locale)}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground text-pretty">{pick(activity.summary, locale)}</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-muted-foreground" />{formatDateRange(activity.startDate, activity.endDate, locale)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-muted-foreground" />{activity.location}</span>
        </p>
      </div>
    </article>
  );
}
