"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useI18n, pick } from "@/i18n/provider";
import { Container } from "@/components/section";

export function AboutView() {
  const { locale, dict } = useI18n();
  const committee = useQuery(api.committee.list);
  return (
    <Container className="grid gap-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <p className="max-w-prose text-lg leading-relaxed text-pretty">{dict.about.body}</p>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">{dict.about.transparency}</h2>
          <p className="mt-2 text-muted-foreground text-pretty">{dict.about.transparencyBody}</p>
        </div>
      </div>
      <section className="grid gap-5">
        <h2 className="text-2xl font-bold sm:text-3xl">{dict.about.committee}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(committee ?? []).map((m) => (
            <li key={m._id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              {m.imageUrl ? (
                <Image src={m.imageUrl} alt="" width={56} height={56} className="size-14 rounded-full object-cover" />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg font-bold" aria-hidden>
                  {m.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm text-muted-foreground">{pick(m.role, locale)}</p>
              </div>
            </li>
          ))}
          {committee === undefined && [0, 1, 2].map((i) => <li key={i} className="h-22 animate-pulse rounded-2xl bg-muted" />)}
        </ul>
      </section>
    </Container>
  );
}
