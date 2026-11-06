import { Suspense } from "react";
import { ProjectDetailView } from "@/components/views/project-detail-view";

export default function ProjectPage() {
  return (
    <Suspense>
      <ProjectDetailView />
    </Suspense>
  );
}
