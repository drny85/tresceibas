"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery } from "@/hooks/use-live-query";
import { CalendarDays, Clock, MapPin, HeartHandshake, UserRound, ArrowLeft } from "lucide-react";
import { ActivityProgram, CategoryBadge, ScheduleDisclaimer } from "@/components/activity-program";
import { api } from "@convex/_generated/api";
import { useI18n, pick } from "@/i18n/provider";
import { PlaceholderImage } from "@/components/placeholder-image";
import { Container } from "@/components/section";
import { Button } from "@/components/ui/button";
import { activityTime, formatDateRange } from "@/lib/format";
import { NotFoundBlock } from "@/components/not-found-block";

export function ActivityDetailView() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, dict } = useI18n();
  const activity = useQuery(api.activities.getBySlug, { slug });

  if (activity === undefined) {
    return (
      <Container className="grid gap-6 py-12">
        <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      </Container>
    );
  }
  if (activity === null) return <NotFoundBlock />;

  return (
    <Container className="grid gap-10 py-10 sm:py-14">
      <title>{`${pick(activity.title, locale)} · Tres Ceibas`}</title>
      <header className="grid max-w-3xl gap-4">
        {activity.parent && (
          <Link href={`/${locale}/actividades/${activity.parent.slug}`} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="size-4" /> {dict.activities.partOf} {pick(activity.parent.title, locale)}
          </Link>
        )}
        {activity.category && <CategoryBadge category={activity.category} />}
        <h1 className="text-[2.15rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">{pick(activity.title, locale)}</h1>
        <p className="text-lg text-muted-foreground text-pretty">{pick(activity.summary, locale)}</p>
        <dl className="grid gap-2 text-base sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-5 text-brand-red" />
            <div><dt className="sr-only">{dict.activities.when}</dt><dd className="font-semibold">{formatDateRange(activity.startDate, activity.endDate, locale)}</dd></div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-5 text-brand-red" />
            <div><dt className="sr-only">{dict.activities.where}</dt><dd className="font-semibold">{activity.location}</dd></div>
          </div>
          {activityTime(activity, locale) && (
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 size-5 text-brand-red" />
              <div><dt className="sr-only">{dict.activities.time}</dt><dd className="font-semibold">{activityTime(activity, locale)}</dd></div>
            </div>
          )}
          {activity.responsible && (
            <div className="flex items-start gap-2">
              <UserRound className="mt-0.5 size-5 text-brand-red" />
              <div><dt className="sr-only">{dict.activities.responsible}</dt><dd className="font-semibold">{activity.responsible}</dd></div>
            </div>
          )}
        </dl>
        <ScheduleDisclaimer />
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="grid content-start gap-8">
          <div className="overflow-hidden rounded-2xl border border-border">
            {activity.imageUrl ? (
              <Image src={activity.imageUrl} alt="" width={1200} height={750} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <PlaceholderImage label={dict.common.photoSoon} tone={1} />
            )}
          </div>
          {pick(activity.description, locale) !== pick(activity.summary, locale) && (
            <p className="max-w-prose whitespace-pre-line text-lg leading-relaxed text-pretty">{pick(activity.description, locale)}</p>
          )}

          {activity.program.length > 0 && (
            <section className="grid gap-4">
              <h2 className="text-2xl font-bold">{dict.activities.program}</h2>
              <ActivityProgram items={activity.program} />
            </section>
          )}

          {activity.program.length === 0 && activity.schedule.length > 0 && (
            <section className="grid gap-5">
              <h2 className="text-2xl font-bold">{dict.activities.schedule}</h2>
              {activity.schedule.map((day, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <h3 className="border-b border-border bg-muted/60 px-5 py-3 text-lg font-bold">{pick(day.day, locale)}</h3>
                  <ol className="divide-y divide-border">
                    {day.items.map((item, j) => (
                      <li key={j} className="grid gap-1 px-5 py-3 sm:grid-cols-[7.5rem_1fr_auto] sm:items-baseline sm:gap-4">
                        <span className="tabular text-sm font-bold text-brand-red">{item.time}</span>
                        <span className="font-semibold">{pick(item.label, locale)}</span>
                        {item.responsible && <span className="text-sm text-muted-foreground">{item.responsible}</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}
        </div>

        {activity.project && (
          <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <HeartHandshake className="size-4" /> {dict.activities.benefits}
            </p>
            <p className="mt-2 font-display text-2xl font-bold">{pick(activity.project.title, locale)}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="donate">
                <Link href={`/${locale}/donar?proyecto=${activity.project.slug}`}>{dict.common.donateNow}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/proyectos/${activity.project.slug}`}>{dict.common.seeMore}</Link>
              </Button>
            </div>
          </aside>
        )}
      </div>
    </Container>
  );
}
