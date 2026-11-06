"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useI18n, pick } from "@/i18n/provider";
import { PlaceholderImage } from "@/components/placeholder-image";
import { ProgressMeter } from "@/components/progress-meter";
import { DonorWall } from "@/components/donor-wall";
import { ShareButtons } from "@/components/share-buttons";
import { ActivityCard } from "@/components/activity-card";
import { Container } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDop, percent } from "@/lib/format";
import { NotFoundBlock } from "@/components/not-found-block";

export function ProjectDetailView() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, dict } = useI18n();
  const project = useQuery(api.projects.getBySlug, { slug });
  const activities = useQuery(api.activities.list);

  if (project === undefined) {
    return (
      <Container className="grid gap-6 py-12">
        <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      </Container>
    );
  }
  if (project === null) return <NotFoundBlock />;

  const related = (activities ?? []).filter((a) => a.projectId === project._id);
  const totalUses = project.uses.reduce((s, u) => s + u.amountDop, 0);

  return (
    <Container className="grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <title>{`${pick(project.title, locale)} · Tres Ceibas`}</title>
      <div className="grid content-start gap-8">
        <header className="grid gap-3">
          <Badge variant={project.status === "completed" ? "success" : "secondary"}>
            {project.status === "completed" ? dict.projects.completed : project.status === "draft" ? dict.projects.draft : dict.projects.active}
          </Badge>
          <h1 className="text-[2.15rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">{pick(project.title, locale)}</h1>
          <p className="text-lg text-muted-foreground text-pretty">{pick(project.summary, locale)}</p>
        </header>
        <div className="overflow-hidden rounded-2xl border border-border">
          {project.imageUrl ? (
            <Image src={project.imageUrl} alt="" width={1200} height={750} className="aspect-[16/10] w-full object-cover" />
          ) : (
            <PlaceholderImage label={dict.common.photoSoon} />
          )}
        </div>
        <div className="max-w-prose whitespace-pre-line text-lg leading-relaxed text-pretty">{pick(project.description, locale)}</div>

        {project.uses.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-2xl font-bold">{dict.projects.uses}</h2>
            <ul className="grid gap-3">
              {project.uses.map((u, i) => {
                const share = percent(u.amountDop, totalUses || project.goalDop);
                return (
                  <li key={i} className="grid gap-2 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-semibold">{pick(u.label, locale)}</span>
                      <span className="tabular font-display text-lg font-bold">{formatDop(u.amountDop, locale)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-brand-gold" style={{ width: `${share}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-2xl font-bold">{dict.projects.relatedActivities}</h2>
            {related.map((a) => <ActivityCard key={a._id} activity={a} />)}
          </section>
        )}
      </div>

      <aside className="grid content-start gap-6 lg:sticky lg:top-24">
        <div className="grid gap-5 rounded-2xl border border-border bg-card p-6">
          <ProgressMeter raised={project.raisedDop} goal={project.goalDop} donors={project.donorCount} size="lg" />
          {project.status === "active" && (
            <Button asChild variant="donate" size="lg" className="w-full">
              <Link href={`/${locale}/donar?proyecto=${project.slug}`}>{dict.common.donateNow}</Link>
            </Button>
          )}
          <div className="grid gap-2">
            <p className="text-sm font-semibold">{dict.projects.share}</p>
            <ShareButtons text={pick(project.title, locale)} />
          </div>
        </div>
        <section className="grid gap-3">
          <h2 className="text-xl font-bold">{dict.projects.wall}</h2>
          <DonorWall projectId={project._id} />
        </section>
      </aside>
    </Container>
  );
}
