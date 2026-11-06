"use client";

import { useQuery } from "convex/react";
import { CalendarDays, HandCoins, Hourglass, Target } from "lucide-react";
import { api } from "@convex/_generated/api";
import { activityTime, formatDate, formatDop, percent } from "@/lib/format";
import { todayIso } from "./month-calendar";

/** The numbers an admin checks first: money raised, pending payments, what's next. */
export function AdminSummary() {
  const featured = useQuery(api.projects.featured);
  const pending = useQuery(api.donations.listAll, { status: "pending" });
  const activities = useQuery(api.activities.listAll);
  const today = todayIso();
  const next = activities?.find((a) => a.parentId && a.startDate >= today) ?? activities?.find((a) => a.startDate >= today);

  const tiles = [
    {
      icon: HandCoins,
      label: "Recaudado",
      value: featured ? formatDop(featured.raisedDop, "es") : "—",
      note: featured ? `${featured.donorCount} donantes` : "",
    },
    {
      icon: Target,
      label: "De la meta",
      value: featured ? `${percent(featured.raisedDop, featured.goalDop)}%` : "—",
      note: featured ? formatDop(featured.goalDop, "es") : "",
    },
    {
      icon: Hourglass,
      label: "Pagos pendientes",
      value: pending ? String(pending.length) : "—",
      note: "No cuentan hasta pagarse",
    },
    {
      icon: CalendarDays,
      label: "Próxima actividad",
      value: next ? next.title.es : "—",
      note: next ? `${formatDate(next.startDate, "es", { day: "numeric", month: "short" })}${activityTime(next, "es") ? ` · ${activityTime(next, "es")}` : ""}` : "",
      wide: true,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="grid content-start gap-1 rounded-2xl border border-border bg-card p-4">
          <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <t.icon className="size-4" aria-hidden /> {t.label}
          </dt>
          <dd className={t.wide ? "line-clamp-2 font-display text-base leading-tight font-bold" : "tabular font-display text-2xl font-extrabold"}>{t.value}</dd>
          {t.note && <dd className="text-xs text-muted-foreground">{t.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
