"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { CheckCircle2, Clock, XCircle, MessageCircle } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useI18n, pick, fill } from "@/i18n/provider";
import { Container } from "@/components/section";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/format";

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
  const share = `https://wa.me/?text=${encodeURIComponent(
    `${t.shareText} ${typeof window !== "undefined" ? window.location.origin : ""}/${locale}${receipt?.project ? `/proyectos/${receipt.project.slug}` : ""}`,
  )}`;

  return (
    <Container className="grid max-w-2xl justify-items-start gap-6 py-16">
      <Icon className={status === "paid" ? "size-14 text-brand-green" : status === "pending" ? "size-14 text-brand-gold" : "size-14 text-destructive"} />
      <h1 className="text-4xl font-extrabold tracking-tight">{status === "failed" || !receipt ? (receipt ? t.failed : t.missing) : t.title}</h1>
      {receipt && status === "paid" && (
        <p className="text-lg text-pretty">
          {fill(t.paid, { amount: formatAmount(receipt.amount, receipt.currency, locale), project: pick(receipt.project?.title, locale) })}
        </p>
      )}
      {status === "pending" && <p className="text-lg text-muted-foreground">{t.pending}</p>}
      <div className="flex flex-wrap gap-3">
        {status === "paid" && (
          <Button asChild variant="donate">
            <a href={share} target="_blank" rel="noopener noreferrer"><MessageCircle /> {t.share}</a>
          </Button>
        )}
        {receipt?.project && (
          <Button asChild variant="outline">
            <Link href={`/${locale}/proyectos/${receipt.project.slug}`}>{t.backToProject}</Link>
          </Button>
        )}
      </div>
    </Container>
  );
}
