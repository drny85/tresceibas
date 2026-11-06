"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useI18n } from "@/i18n/provider";
import { ActivityCard } from "@/components/activity-card";
import { Container } from "@/components/section";

export function ActivitiesView() {
  const { dict } = useI18n();
  const activities = useQuery(api.activities.list);
  return (
    <Container className="grid gap-4">
      {activities === undefined ? (
        [0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)
      ) : activities.length === 0 ? (
        <p className="text-muted-foreground">{dict.activities.empty}</p>
      ) : (
        activities.map((a) => <ActivityCard key={a._id} activity={a} />)
      )}
    </Container>
  );
}
