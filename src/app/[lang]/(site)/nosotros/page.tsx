import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/section";
import { AboutView } from "@/components/views/about-view";
import { dictFor } from "@/lib/page-dict";

export async function generateMetadata({ params }: PageProps<"/[lang]/nosotros">): Promise<Metadata> {
  const { dict } = await dictFor(params);
  return { title: dict.about.title, description: dict.about.lead };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/nosotros">) {
  const { dict } = await dictFor(params);
  return (
    <>
      <PageHeader eyebrow={dict.about.eyebrow} title={dict.about.title} lead={dict.about.lead} />
      <Suspense>
        <AboutView />
      </Suspense>
    </>
  );
}
