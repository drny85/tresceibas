import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/section";
import { ProjectsView } from "@/components/views/projects-view";
import { dictFor } from "@/lib/page-dict";

export async function generateMetadata({ params }: PageProps<"/[lang]/proyectos">): Promise<Metadata> {
  const { dict } = await dictFor(params);
  return { title: dict.projects.title, description: dict.projects.lead };
}

export default async function ProjectsPage({ params }: PageProps<"/[lang]/proyectos">) {
  const { dict } = await dictFor(params);
  return (
    <>
      <PageHeader title={dict.projects.title} lead={dict.projects.lead} />
      <Suspense>
        <ProjectsView />
      </Suspense>
    </>
  );
}
