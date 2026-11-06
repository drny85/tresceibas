import type { Metadata } from "next";
import { Suspense } from "react";
import { ThanksView } from "@/components/views/thanks-view";
import { dictFor } from "@/lib/page-dict";

export async function generateMetadata({ params }: PageProps<"/[lang]/donar/gracias">): Promise<Metadata> {
  const { dict } = await dictFor(params);
  return { title: dict.thanks.title, robots: { index: false } };
}

export default function ThanksPage() {
  return (
    <Suspense>
      <ThanksView />
    </Suspense>
  );
}
