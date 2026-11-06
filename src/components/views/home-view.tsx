"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useI18n, pick } from "@/i18n/provider";
import { ClubStory } from "@/components/club-story/club-story";
import { ProgressMeter } from "@/components/progress-meter";
import { ActivityCard } from "@/components/activity-card";
import { ProjectCard } from "@/components/project-card";
import { DonorList } from "@/components/donor-wall";
import { Container, SectionTitle } from "@/components/section";
import { Button } from "@/components/ui/button";
import { formatDop } from "@/lib/format";
import { useToday } from "@/hooks/use-today";

export function HomeView() {
  const { locale, dict } = useI18n();
  const featured = useQuery(api.projects.featured);
  const projects = useQuery(api.projects.list);
  const activities = useQuery(api.activities.list);
  const recent = useQuery(api.donations.recent, { limit: 6 });

  const today = useToday();
  const upcoming = (activities ?? []).filter((a) => a.endDate >= today).slice(0, 3);
  const others = (projects ?? []).filter((p) => p._id !== featured?._id);
  const donateHref = featured ? `/${locale}/donar?proyecto=${featured.slug}` : `/${locale}/donar`;

  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-card to-background">
        {/* Phones read top to bottom: headline, the story, then the numbers and the button.
            On wide screens the story moves to its own column. */}
        <Container className="grid gap-6 py-7 sm:gap-8 sm:py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_auto] lg:gap-x-10 lg:gap-y-5">
          <div className="grid gap-3 sm:gap-4 lg:self-end">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brand-red sm:text-xs">{dict.home.eyebrow}</p>
            <h1 className="text-[2.15rem] leading-[1.02] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">{dict.home.title}</h1>
          </div>
          <ClubStory className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center" />
          <div className="grid gap-5 lg:self-start">
            <p className="max-w-xl text-base text-muted-foreground text-pretty sm:text-lg">{dict.home.lead}</p>
            {featured ? (
              <ProgressMeter raised={featured.raisedDop} goal={featured.goalDop} donors={featured.donorCount} size="lg" />
            ) : (
              <div className="h-24 animate-pulse rounded-xl bg-muted" aria-hidden />
            )}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap [&>*:only-child]:col-span-2">
              <Button asChild variant="donate" size="lg">
                <Link href={donateHref}>{dict.common.donateNow}</Link>
              </Button>
              {featured && (
                <Button asChild variant="outline" size="lg">
                  <Link href={`/${locale}/proyectos/${featured.slug}`}>{dict.common.seeMore}</Link>
                </Button>
              )}
            </div>
          </div>
        </Container>
      </section>

      {featured && featured.uses.length > 0 && (
        <Container className="grid gap-6 pt-12 sm:pt-16">
          <SectionTitle>{dict.home.usesTitle}</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {featured.uses.map((u, i) => (
              <li key={i} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <span className="font-semibold">{pick(u.label, locale)}</span>
                <span className="tabular font-display text-lg font-bold">{formatDop(u.amountDop, locale)}</span>
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Container className="grid gap-10 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section className="grid content-start gap-5">
          <SectionTitle
            action={
              <Link href={`/${locale}/actividades`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {dict.common.seeAll} <ArrowRight className="size-4" />
              </Link>
            }
          >
            {dict.home.activitiesTitle}
          </SectionTitle>
          {activities === undefined ? (
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />
          ) : upcoming.length === 0 ? (
            <p className="text-muted-foreground">{dict.activities.empty}</p>
          ) : (
            upcoming.map((a) => <ActivityCard key={a._id} activity={a} />)
          )}
        </section>
        <section className="grid content-start gap-5">
          <SectionTitle>{dict.home.recentTitle}</SectionTitle>
          <DonorList rows={recent} empty={dict.home.recentEmpty} showProject />
        </section>
      </Container>

      {others.length > 0 && (
        <Container className="grid gap-6 pt-12 sm:pt-16">
          <SectionTitle>{dict.home.projectsTitle}</SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((p, i) => <ProjectCard key={p._id} project={p} index={i + 1} />)}
          </div>
        </Container>
      )}
    </>
  );
}
