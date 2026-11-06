"use client";

import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CountUp } from "@/components/motion/count-up";
import { useI18n, fill } from "@/i18n/provider";
import { formatDop, percent } from "@/lib/format";
import { cn } from "@/lib/utils";

const MILESTONES = [25, 50, 75];

export function ProgressMeter({
  raised,
  goal,
  donors,
  size = "md",
  className,
}: {
  raised: number;
  goal: number;
  donors?: number;
  size?: "md" | "lg";
  className?: string;
}) {
  const { locale, dict } = useI18n();
  const t = dict.common;
  const pct = percent(raised, goal);
  const big = size === "lg";
  // The bar grows from empty once on screen, so the progress is felt, not just read.
  const [bar, setBar] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setBar(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const next = MILESTONES.find((m) => pct < m);
  const toNext = next !== undefined ? Math.max(0, Math.ceil((goal * next) / 100 - raised)) : 0;
  const reached = raised >= goal && goal > 0;

  return (
    <div className={cn("grid gap-2.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="tabular">
          <span className={cn("font-display font-extrabold", big ? "text-3xl sm:text-4xl" : "text-xl")}>
            {big ? <CountUp value={raised} format={(n) => formatDop(n, locale)} /> : formatDop(raised, locale)}
          </span>{" "}
          <span className="text-sm text-muted-foreground">
            {t.raised} {t.of} {formatDop(goal, locale)}
          </span>
        </p>
        <p className="tabular text-sm font-semibold text-brand-green">{fill(t.percentFunded, { pct })}</p>
      </div>
      <div className="relative">
        <Progress value={bar} className={big ? "h-4" : "h-2.5"} aria-label={fill(t.percentFunded, { pct })} />
        {big &&
          MILESTONES.map((m) => (
            <span
              key={m}
              aria-hidden
              className={cn("absolute top-0 h-full w-0.5 -translate-x-1/2", pct >= m ? "bg-white/70" : "bg-foreground/15")}
              style={{ left: `${m}%` }}
            />
          ))}
      </div>
      {big && (
        <div className="relative h-4 text-[11px] font-semibold text-muted-foreground" aria-hidden>
          {MILESTONES.map((m) => (
            <span key={m} className={cn("absolute -translate-x-1/2 tabular", pct >= m && "text-brand-green")} style={{ left: `${m}%` }}>
              {m}%
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        {donors !== undefined && (
          <p className="tabular text-muted-foreground">
            {donors} {donors === 1 ? t.donor : t.donors}
          </p>
        )}
        {big && reached && (
          <p className="inline-flex items-center gap-1.5 font-bold text-brand-green">
            <PartyPopper className="size-4" /> {t.goalReached}
          </p>
        )}
        {big && !reached && next !== undefined && toNext > 0 && (
          <p className="text-muted-foreground">{fill(t.toMilestone, { amount: formatDop(toNext, locale), pct: next })}</p>
        )}
      </div>
    </div>
  );
}
