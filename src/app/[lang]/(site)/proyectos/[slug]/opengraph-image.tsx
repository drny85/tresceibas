import { ogImage, ogSize } from "@/lib/og";
import { loadProject } from "@/lib/server-data";
import { formatDop, percent } from "@/lib/format";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Tres Ceibas";

export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = raw === "en" ? "en" : "es";
  const p = await loadProject(slug);
  return ogImage({
    eyebrow: lang === "es" ? "Proyecto comunitario" : "Community project",
    title: p ? p.title[lang] || p.title.es : "Tres Ceibas",
    progress: p
      ? { pct: percent(p.raisedDop, p.goalDop), raised: formatDop(p.raisedDop, lang), goal: `${lang === "es" ? "de" : "of"} ${formatDop(p.goalDop, lang)}` }
      : undefined,
    footer: lang === "es" ? "Cada aporte cuenta. ¡Dona y comparte!" : "Every gift counts. Give and share!",
  });
}
