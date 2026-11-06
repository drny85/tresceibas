"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@/hooks/use-live-query";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useI18n, pick, fill } from "@/i18n/provider";
import { Container } from "@/components/section";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/format";
import { Confetti } from "@/components/motion/confetti";
import { ShareButtons } from "@/components/share-buttons";

export function ThanksView() {
  const { locale, dict } = useI18n();
  const t = dict.thanks;
  const id = useSearchParams().get("d") ?? "";
  const receipt = useQuery(api.donations.receipt, id ? { id } : "skip");

  if (receipt === undefined && id) {
    return <Container className="py-16"><div className="h-40 animate-pulse rounded-2xl bg-muted" /></Container>;
  }

  const status = receipt?.status;
  const Icon = status === "paid" ? CheckCircle2 : status === "pending" ? Clock : XCircle;
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}${receipt?.project ? `/proyectos/${receipt.project.slug}` : ""}`;

  return (
    <Container className="grid max-w-2xl justify-items-start gap-6 py-16">
      {status === "paid" && <Confetti />}
      <Icon className={status === "paid" ? "size-14 text-brand-green" : status === "pending" ? "size-14 text-brand-gold" : "size-14 text-destructive"} />
      <h1 className="text-4xl font-extrabold tracking-tight">{status === "failed" || !receipt ? (receipt ? t.failed : t.missing) : t.title}</h1>
      {receipt && status === "paid" && (
        <p className="text-lg text-pretty">
          {fill(t.paid, { amount: formatAmount(receipt.amount, receipt.currency, locale), project: pick(receipt.project?.title, locale) })}
        </p>
      )}
      {status === "pending" && <p className="text-lg text-muted-foreground">{t.pending}</p>}
      {status === "paid" && (
        <div className="grid gap-2">
          <p className="font-semibold">{t.share}</p>
          <ShareButtons text={t.shareText} url={shareUrl} />
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {receipt?.project && (
          <Button asChild variant="outline">
            <Link href={`/${locale}/proyectos/${receipt.project.slug}`}>{t.backToProject}</Link>
          </Button>
        )}
      </div>
    </Container>
  );
}
