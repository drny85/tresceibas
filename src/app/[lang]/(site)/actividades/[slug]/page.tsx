import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivityDetailView } from "@/components/views/activity-detail-view";
import { loadActivity } from "@/lib/server-data";
import { isLocale } from "@/i18n/config";
import { formatDateRange } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/actividades/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const activity = await loadActivity(slug);
  if (!activity || !isLocale(lang)) return {};
  const title = activity.title[lang] || activity.title.es;
  const description = `${formatDateRange(activity.startDate, activity.endDate, lang)} · ${activity.location}. ${activity.summary[lang] || activity.summary.es}`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default function ActivityPage() {
  return (
    <Suspense>
      <ActivityDetailView />
    </Suspense>
  );
}
