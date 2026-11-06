"use client";

import { useQuery } from "@/hooks/use-live-query";
import { api } from "@convex/_generated/api";
import { useI18n, pick } from "@/i18n/provider";
import { ActivityCard } from "@/components/activity-card";
import { ActivityProgram } from "@/components/activity-program";
import { Container } from "@/components/section";

export function ActivitiesView() {
  const { locale, dict } = useI18n();
  const activities = useQuery(api.activities.list);
  // Main events get a card; activities that belong to an event are listed in its program.
  const events = (activities ?? []).filter((a) => !a.parentId || !activities?.some((p) => p._id === a.parentId));

  if (activities === undefined) {
    return (
      <Container className="grid gap-4">
        {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
      </Container>
    );
  }
  if (activities.length === 0) {
    return <Container><p className="text-muted-foreground">{dict.activities.empty}</p></Container>;
  }

  return (
    <Container className="grid gap-12">
      {events.map((ev) => {
        const program = activities.filter((a) => a.parentId === ev._id);
        return (
          <div key={ev._id} className="grid gap-6">
            <ActivityCard activity={ev} />
            {program.length > 0 && (
              <section className="grid gap-4">
                <div className="grid gap-1">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {dict.activities.program}: {pick(ev.title, locale)}
                  </h2>
                  <p className="text-muted-foreground">{dict.activities.programLead}</p>
                </div>
                <ActivityProgram items={program} />
              </section>
            )}
          </div>
        );
      })}
    </Container>
  );
}
