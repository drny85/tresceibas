"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useQuery } from "@/hooks/use-live-query";
import { api } from "@convex/_generated/api";
import { useI18n, fill } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/share-buttons";
import { formatDop, formatUsd } from "@/lib/format";
import { DEFAULT_USD_TO_DOP } from "@convex/lib/money";

/** A heartfelt call to give, with what common amounts mean in pesos. */
export function DonateMotivation({ projectSlug }: { projectSlug?: string }) {
  const { locale, dict } = useI18n();
  const t = dict.projects.motivation;
  const settings = useQuery(api.settings.get);
  const rate = settings?.usdToDop ?? DEFAULT_USD_TO_DOP;
  const base = projectSlug ? `/${locale}/donar?proyecto=${projectSlug}` : `/${locale}/donar`;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <div className="grid content-start gap-4">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-red">
            <Heart className="size-4 fill-current" aria-hidden /> {t.eyebrow}
          </p>
          <h2 className="text-[1.9rem] leading-[1.08] font-extrabold tracking-tight text-balance sm:text-4xl">{t.title}</h2>
          {t.body.map((p, i) => (
            <p key={i} className="max-w-prose text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">{p}</p>
          ))}
        </div>
        <div className="grid content-start gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t.impactTitle}</h3>
          <ul className="grid gap-2">
            {t.impact.map((i) => (
              <li key={i.usd}>
                <Link
                  href={`${base}${base.includes("?") ? "&" : "?"}monto=${i.usd}`}
                  className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-0.5 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary"
                >
                  <span className="row-span-2 font-display text-2xl font-extrabold text-primary tabular">{formatUsd(i.usd, locale)}</span>
                  <span className="tabular text-xs font-semibold text-muted-foreground">{fill(t.approx, { dop: formatDop(i.usd * rate, locale) })}</span>
                  <span className="text-sm text-pretty">{i.text}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild variant="donate" size="lg" className="mt-1 h-14 w-full text-lg">
            <Link href={base}><Heart className="fill-current" /> {t.cta}</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 border-t border-border bg-muted/50 px-6 py-4 sm:flex sm:items-center sm:justify-between sm:px-10">
        <p className="text-sm text-muted-foreground text-pretty">{t.share}</p>
        <ShareButtons text={t.title} />
      </div>
    </section>
  );
}
