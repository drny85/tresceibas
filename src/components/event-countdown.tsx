"use client";

import Link from "next/link";
import { Timer } from "lucide-react";
import { useI18n, pick, fill } from "@/i18n/provider";
import { useToday } from "@/hooks/use-today";

/** "Faltan 105 días para Tres Ceiberos Ausente", or "¡Es hoy!" during the event. */
export function EventCountdown({ event }: { event: { slug: string; title: { es: string; en: string }; startDate: string; endDate: string } }) {
  const { locale, dict } = useI18n();
  const today = useToday();
  if (!today || event.endDate < today) return null;
  const days = Math.round((Date.parse(`${event.startDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  const title = pick(event.title, locale);
  const text = days <= 0 ? fill(dict.home.countdownToday, { event: title }) : fill(days === 1 ? dict.home.countdownOne : dict.home.countdown, { days, event: title });
  return (
    <Link
      href={`/${locale}/actividades/${event.slug}`}
      className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-red/25 bg-brand-red/8 px-3 py-1.5 text-sm font-semibold text-brand-red hover:bg-brand-red/12 dark:text-red-300"
    >
      <Timer className="size-4" /> <span className="tabular">{text}</span>
    </Link>
  );
}
