import type { Metadata } from "next";
import { Suspense } from "react";
import { RequestTime } from "@/components/request-time";
import { ProjectDetailView } from "@/components/views/project-detail-view";
import { loadProject } from "@/lib/server-data";
import { isLocale } from "@/i18n/config";
import { formatDop, percent } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/proyectos/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = await loadProject(slug);
  if (!project || !isLocale(lang)) return {};
  const title = project.title[lang] || project.title.es;
  const progress =
    lang === "es"
      ? `${formatDop(project.raisedDop, lang)} de ${formatDop(project.goalDop, lang)} (${percent(project.raisedDop, project.goalDop)}%).`
      : `${formatDop(project.raisedDop, lang)} of ${formatDop(project.goalDop, lang)} (${percent(project.raisedDop, project.goalDop)}%).`;
  const description = `${project.summary[lang] || project.summary.es} ${progress}`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default function ProjectPage() {
  return (
    <>
      <Suspense>
        <ProjectDetailView />
      </Suspense>
      <Suspense>
        <RequestTime />
      </Suspense>
    </>
  );
}
