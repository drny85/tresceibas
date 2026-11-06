import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/section";
import { ActivitiesView } from "@/components/views/activities-view";
import { dictFor } from "@/lib/page-dict";

export async function generateMetadata({ params }: PageProps<"/[lang]/actividades">): Promise<Metadata> {
  const { dict } = await dictFor(params);
  return { title: dict.activities.title, description: dict.activities.lead };
}

export default async function ActivitiesPage({ params }: PageProps<"/[lang]/actividades">) {
  const { dict } = await dictFor(params);
  return (
    <>
      <PageHeader title={dict.activities.title} lead={dict.activities.lead} />
      <Suspense>
        <ActivitiesView />
      </Suspense>
    </>
  );
}
