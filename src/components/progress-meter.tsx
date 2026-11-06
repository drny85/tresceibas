"use client";

import { Progress } from "@/components/ui/progress";
import { useI18n, fill } from "@/i18n/provider";
import { formatDop, percent } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const pct = percent(raised, goal);
  return (
    <div className={cn("grid gap-2.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="tabular">
          <span className={cn("font-display font-extrabold", size === "lg" ? "text-3xl sm:text-4xl" : "text-xl")}>
            {formatDop(raised, locale)}
          </span>{" "}
          <span className="text-sm text-muted-foreground">
            {dict.common.raised} {dict.common.of} {formatDop(goal, locale)}
          </span>
        </p>
        <p className="tabular text-sm font-semibold text-brand-green">{fill(dict.common.percentFunded, { pct })}</p>
      </div>
      <Progress value={pct} className={size === "lg" ? "h-4" : "h-2.5"} aria-label={fill(dict.common.percentFunded, { pct })} />
      {donors !== undefined && (
        <p className="tabular text-sm text-muted-foreground">
          {donors} {donors === 1 ? dict.common.donor : dict.common.donors}
        </p>
      )}
    </div>
  );
}
