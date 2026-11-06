import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/section";
import { DonateView } from "@/components/views/donate-view";
import { dictFor } from "@/lib/page-dict";

export async function generateMetadata({ params }: PageProps<"/[lang]/donar">): Promise<Metadata> {
  const { dict } = await dictFor(params);
  return { title: dict.donate.title, description: dict.donate.lead };
}

export default async function DonatePage({ params }: PageProps<"/[lang]/donar">) {
  const { dict } = await dictFor(params);
  return (
    <>
      <PageHeader title={dict.donate.title} lead={dict.donate.lead} />
      <Suspense>
        <DonateView />
      </Suspense>
    </>
  );
}
