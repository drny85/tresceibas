import { Suspense } from "react";
import { NotFoundBlock } from "@/components/not-found-block";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <Suspense fallback={<SiteHeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1"><NotFoundBlock /></main>
      <SiteFooter />
    </>
  );
}
