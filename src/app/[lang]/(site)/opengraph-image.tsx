import { ogImage, ogSize } from "@/lib/og";
import { loadFeatured } from "@/lib/server-data";
import { formatDop, percent } from "@/lib/format";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Tres Ceibas";

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = raw === "en" ? "en" : "es";
  const p = await loadFeatured();
  return ogImage({
    eyebrow: lang === "es" ? "Unidos por nuestra comunidad" : "United for our community",
    title: p ? p.title[lang] || p.title.es : lang === "es" ? "Juntos construimos nuestro club comunitario" : "Together we are building our community club",
    progress: p
      ? { pct: percent(p.raisedDop, p.goalDop), raised: formatDop(p.raisedDop, lang), goal: `${lang === "es" ? "de" : "of"} ${formatDop(p.goalDop, lang)}` }
      : undefined,
    footer: lang === "es" ? "Dona desde cualquier lugar del mundo" : "Give from anywhere in the world",
  });
}
