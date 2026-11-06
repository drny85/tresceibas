import { ogImage, ogSize } from "@/lib/og";
import { loadActivity } from "@/lib/server-data";
import { activityTime, formatDateRange } from "@/lib/format";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Tres Ceibas";

export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = raw === "en" ? "en" : "es";
  const a = await loadActivity(slug);
  const when = a ? [formatDateRange(a.startDate, a.endDate, lang), activityTime(a, lang)].filter(Boolean).join(" · ") : "";
  return ogImage({
    eyebrow: lang === "es" ? "Actividad" : "Activity",
    title: a ? a.title[lang] || a.title.es : "Tres Ceibas",
    lines: a ? [when, a.location] : [],
    footer: lang === "es" ? "¡Te esperamos! Invita a tu familia" : "See you there! Bring your family",
  });
}
