import { Suspense } from "react";
import { ActivityDetailView } from "@/components/views/activity-detail-view";

export default function ActivityPage() {
  return (
    <Suspense>
      <ActivityDetailView />
    </Suspense>
  );
}
