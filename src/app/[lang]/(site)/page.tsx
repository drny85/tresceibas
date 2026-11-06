import { Suspense } from "react";
import { HomeView } from "@/components/views/home-view";

export default function HomePage() {
  return (
    <Suspense>
      <HomeView />
    </Suspense>
  );
}
