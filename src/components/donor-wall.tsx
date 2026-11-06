"use client";

import Link from "next/link";
import { useQuery } from "@/hooks/use-live-query";
import { Heart } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useI18n, pick } from "@/i18n/provider";
import { formatAmount, formatDop, formatRelative } from "@/lib/format";

type Row = {
  _id: string;
  name: string | null;
  amount: number;
  currency: "USD" | "DOP";
  amountDop: number;
  message: string | null;
  paidAt: number;
  project?: { slug: string; title: { es: string; en: string } } | null;
};

function initials(name: string | null) {
  if (!name) return "♥";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function DonorList({ rows, empty, showProject = false }: { rows: Row[] | undefined; empty: string; showProject?: boolean }) {
  const { locale, dict } = useI18n();
  if (rows === undefined) {
    return (
      <ul className="grid gap-3" aria-busy>
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </ul>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
        <Heart className="size-4 text-brand-red" /> {empty}
      </p>
    );
  }
  return (
    <ul className="grid gap-2">
      {rows.map((d) => (
        <li key={d._id} className="flex gap-3 rounded-xl border border-border bg-card p-3.5">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground"
            aria-hidden
          >
            {initials(d.name)}
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="font-semibold">{d.name ?? dict.common.anonymous}</p>
              <p className="tabular font-display font-bold">
                {formatAmount(d.amount, d.currency, locale)}
                {d.currency === "USD" && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">≈ {formatDop(d.amountDop, locale)}</span>
                )}
              </p>
            </div>
            {d.message && <p className="text-sm text-pretty">“{d.message}”</p>}
            <p className="text-xs text-muted-foreground">
              {formatRelative(d.paidAt, locale)}
              {showProject && d.project && (
                <>
                  {" · "}
                  <Link className="hover:underline" href={`/${locale}/proyectos/${d.project.slug}`}>
                    {pick(d.project.title, locale)}
                  </Link>
                </>
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DonorWall({ projectId }: { projectId: Id<"projects"> }) {
  const { dict } = useI18n();
  const rows = useQuery(api.donations.listForProject, { projectId, limit: 100 });
  return <DonorList rows={rows} empty={dict.projects.wallEmpty} />;
}
