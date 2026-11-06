"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";
import { useI18n, pick } from "@/i18n/provider";
import { PlaceholderImage } from "@/components/placeholder-image";
import { ProgressMeter } from "@/components/progress-meter";
import { Badge } from "@/components/ui/badge";

export type ProjectWithTotals = FunctionReturnType<typeof api.projects.list>[number];

export function ProjectCard({ project, index = 0 }: { project: ProjectWithTotals; index?: number }) {
  const { locale, dict } = useI18n();
  const href = `/${locale}/proyectos/${project.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      <Link href={href} className="block" tabIndex={-1} aria-hidden>
        {project.imageUrl ? (
          <Image src={project.imageUrl} alt="" width={640} height={400} className="aspect-[16/10] w-full object-cover" />
        ) : (
          <PlaceholderImage label={dict.common.photoSoon} tone={index} />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="grid gap-2">
          <Badge variant={project.status === "completed" ? "success" : "secondary"}>
            {project.status === "completed" ? dict.projects.completed : dict.projects.active}
          </Badge>
          <h3 className="text-xl font-bold leading-tight">
            <Link href={href} className="hover:underline">
              {pick(project.title, locale)}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground text-pretty">{pick(project.summary, locale)}</p>
        </div>
        <ProgressMeter raised={project.raisedDop} goal={project.goalDop} donors={project.donorCount} className="mt-auto" />
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {dict.common.seeMore} <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
