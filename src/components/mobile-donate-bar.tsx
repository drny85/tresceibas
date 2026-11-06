"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@/hooks/use-live-query";
import { Heart } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { formatDop, percent } from "@/lib/format";

/**
 * Phone-only bar pinned to the bottom of the screen, so the donate button is
 * always one thumb away. Hidden on the donate flow itself and in the admin.
 */
export function MobileDonateBar() {
  const { locale, dict } = useI18n();
  const pathname = usePathname() ?? "";
  const featured = useQuery(api.projects.featured);
  const rest = pathname.replace(/^\/(es|en)/, "");
  if (rest.startsWith("/donar") || rest.startsWith("/admin")) return null;

  const href = featured ? `/${locale}/donar?proyecto=${featured.slug}` : `/${locale}/donar`;
  const pct = featured ? percent(featured.raisedDop, featured.goalDop) : null;

  return (
    <>
      {/* Keeps the footer clear of the bar. */}
      <div aria-hidden className="h-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-6px_20px_-12px_rgb(0_0_0/0.25)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          {featured && pct !== null ? (
            <div className="grid min-w-0 flex-1 gap-1">
              <p className="tabular truncate text-xs text-muted-foreground">
                <span className="font-display text-sm font-extrabold text-foreground">{formatDop(featured.raisedDop, locale)}</span>{" "}
                {dict.common.of} {formatDop(featured.goalDop, locale)}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-brand-green" style={{ width: `${Math.max(pct, 2)}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <Button asChild variant="donate" size="lg" className="h-12 shrink-0 px-6">
            <Link href={href}>
              <Heart className="fill-current" /> {dict.nav.donate}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
