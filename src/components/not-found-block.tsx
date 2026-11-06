"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/section";

export function NotFoundBlock() {
  const { locale, dict } = useI18n();
  return (
    <Container className="grid justify-items-start gap-4 py-20">
      <h1 className="text-3xl font-bold">{dict.common.notFound}</h1>
      <Button asChild variant="outline">
        <Link href={`/${locale}`}>{dict.common.backHome}</Link>
      </Button>
    </Container>
  );
}
