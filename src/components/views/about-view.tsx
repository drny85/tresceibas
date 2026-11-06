"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@/hooks/use-live-query";
import { Check, Church, Drum, HandCoins, HandHeart, Handshake, Heart, Share2, Sprout, Trophy } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useI18n, pick } from "@/i18n/provider";
import { Container } from "@/components/section";
import { Button } from "@/components/ui/button";
import { WhatsAppContact } from "@/components/whatsapp-contact";

const GOAL_ICONS = [Drum, Trophy, Sprout, Church];
const HELP_ICONS = [HandCoins, HandHeart, Handshake, Share2];

export function AboutView() {
  const { locale, dict } = useI18n();
  const t = dict.about;
  const committee = useQuery(api.committee.list);
  const featured = useQuery(api.projects.featured);
  const settings = useQuery(api.settings.get);
  const projectHref = featured ? `/${locale}/proyectos/${featured.slug}` : `/${locale}/proyectos`;
  const donateHref = featured ? `/${locale}/donar?proyecto=${featured.slug}` : `/${locale}/donar`;

  return (
    <div className="grid gap-14 sm:gap-20">
      {/* Story + quick facts */}
      <Container className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
        <section className="grid gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{t.storyTitle}</h2>
          {t.story.map((p, i) => (
            <p key={i} className="max-w-prose text-base leading-relaxed text-pretty sm:text-lg">{p}</p>
          ))}
        </section>
        <dl className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-4 sm:gap-4 sm:p-6 lg:grid-cols-1">
          {t.stats.map((s) => (
            <div key={s.label} className="grid content-start gap-1 lg:grid-cols-[8.5rem_1fr] lg:items-baseline lg:gap-4">
              <dt className="sr-only">{s.label}</dt>
              <dd className="tabular font-display text-2xl font-extrabold text-primary sm:text-4xl">{s.value}</dd>
              <dd className="text-xs leading-snug text-muted-foreground sm:text-sm">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Container>

      {/* Mission + goals */}
      <section className="border-y border-border/70 bg-card py-12 sm:py-16">
        <Container className="grid gap-8">
          <div className="grid max-w-3xl gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-red">{t.missionTitle}</p>
            <p className="font-display text-2xl leading-snug font-bold text-balance sm:text-3xl">{t.mission}</p>
          </div>
          <div className="grid gap-4">
            <h2 className="text-lg font-bold">{t.goalsTitle}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {t.goals.map((g, i) => {
                const Icon = GOAL_ICONS[i] ?? Heart;
                return (
                  <li key={g.title} className="grid content-start gap-2 rounded-2xl border border-border bg-background p-5">
                    <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary" aria-hidden>
                      <Icon className="size-5" />
                    </span>
                    <p className="font-semibold">{g.title}</p>
                    <p className="text-sm text-muted-foreground text-pretty">{g.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </Container>
      </section>

      {/* The dream */}
      <Container className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{t.dreamTitle}</h2>
          <p className="max-w-prose text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">{t.dreamBody}</p>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <Button asChild variant="donate" size="lg"><Link href={donateHref}>{t.donate}</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href={projectHref}>{t.dreamCta}</Link></Button>
          </div>
        </div>
        <ul className="grid gap-2 rounded-2xl border border-border bg-card p-5 sm:p-6">
          {t.dreamPoints.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <Check className="mt-0.5 size-5 shrink-0 text-brand-green" aria-hidden />
              <span className="font-medium">{p}</span>
            </li>
          ))}
        </ul>
      </Container>

      {/* Committee */}
      <Container className="grid gap-5">
        <div className="grid gap-1">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.committee}</h2>
          <p className="text-muted-foreground">{t.committeeLead}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(committee ?? []).map((m) => (
            <li key={m._id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              {m.imageUrl ? (
                <Image src={m.imageUrl} alt="" width={56} height={56} className="size-14 rounded-full object-cover" />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg font-bold" aria-hidden>
                  {m.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm text-muted-foreground">{pick(m.role, locale)}</p>
              </div>
            </li>
          ))}
          {committee === undefined && [0, 1, 2].map((i) => <li key={i} className="h-22 animate-pulse rounded-2xl bg-muted" />)}
        </ul>
      </Container>

      {/* Transparency */}
      <Container>
        <section className="grid gap-5 rounded-3xl bg-primary p-6 text-primary-foreground sm:p-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div className="grid content-start gap-2">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.transparency}</h2>
            <p className="opacity-85 text-pretty">{t.transparencyBody}</p>
          </div>
          <ul className="grid gap-3">
            {t.transparencyPoints.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Check className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span className="text-pretty">{p}</span>
              </li>
            ))}
          </ul>
        </section>
      </Container>

      {/* How to help */}
      <Container className="grid gap-5">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.helpTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.help.map((h, i) => {
            const Icon = HELP_ICONS[i] ?? Heart;
            return (
              <li key={h.title} className="grid content-start gap-2 rounded-2xl border border-border bg-card p-5">
                <Icon className="size-6 text-brand-red" aria-hidden />
                <p className="font-semibold">{h.title}</p>
                <p className="text-sm text-muted-foreground text-pretty">{h.body}</p>
              </li>
            );
          })}
        </ul>
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Button asChild variant="donate" size="lg"><Link href={donateHref}>{t.donate}</Link></Button>
          <Button asChild variant="outline" size="lg"><Link href={`/${locale}/actividades`}>{t.activities}</Link></Button>
          <WhatsAppContact />
        </div>
        {settings?.contactEmail && (
          <p className="text-sm text-muted-foreground">{t.email}: <span className="select-all font-medium text-foreground">{settings.contactEmail}</span></p>
        )}
      </Container>
    </div>
  );
}
