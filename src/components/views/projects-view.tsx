"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useI18n } from "@/i18n/provider";
import { ProjectCard } from "@/components/project-card";
import { Container } from "@/components/section";

export function ProjectsView() {
  const { dict } = useI18n();
  const projects = useQuery(api.projects.list);
  return (
    <Container>
      {projects === undefined ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-muted-foreground">{dict.projects.empty}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => <ProjectCard key={p._id} project={p} index={i} />)}
        </div>
      )}
    </Container>
  );
}
