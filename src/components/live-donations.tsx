"use client";

import { Heart } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { formatAmount, formatRelative } from "@/lib/format";

type Row = {
  _id: string;
  name: string | null;
  amount: number;
  currency: "USD" | "DOP";
  paidAt: number;
  tribute?: { kind: "honor" | "memory"; name: string } | null;
  project?: { title: { es: string; en: string } } | null;
};

/** A slow strip of the latest donations, so visitors see others giving right now. */
export function LiveDonations({ rows }: { rows: Row[] | undefined }) {
  const { locale, dict } = useI18n();
  if (!rows || rows.length === 0) return null;
  const items = rows.map((d) => (
    <li key={d._id} className="flex shrink-0 items-center gap-2 px-5 text-sm whitespace-nowrap">
      <Heart className="size-3.5 fill-brand-red text-brand-red" aria-hidden />
      <span className="font-semibold">{d.name ?? dict.common.anonymous}</span>
      <span className="text-muted-foreground">{dict.home.gave}</span>
      <span className="tabular font-bold">{formatAmount(d.amount, d.currency, locale)}</span>
      {d.tribute && (
        <span className="text-muted-foreground">
          · {d.tribute.kind === "memory" ? dict.donate.inMemory : dict.donate.inHonor} {d.tribute.name}
        </span>
      )}
      <span className="text-xs text-muted-foreground">· {formatRelative(d.paidAt, locale)}</span>
    </li>
  ));
  // Few donations would leave a gap in the loop, so repeat them until the strip is full.
  const copies = Math.max(1, Math.ceil(8 / rows.length));
  const track = Array.from({ length: copies }, (_, i) => <ul key={i} className="flex" aria-hidden={i > 0 || undefined}>{items}</ul>);
  return (
    <section aria-label={dict.home.recentTitle} className="overflow-hidden border-b border-border/60 bg-card py-2.5">
      <div className="tc-marquee flex w-max" style={{ ["--marquee-duration" as string]: `${Math.max(25, rows.length * copies * 5)}s` }}>
        {track}
        {track.map((t, i) => <div key={`b${i}`} aria-hidden className="flex">{t}</div>)}
      </div>
    </section>
  );
}
