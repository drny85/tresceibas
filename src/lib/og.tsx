import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/* Link-preview images (WhatsApp, Facebook, Google) in the community's colours. */

export const ogSize = { width: 1200, height: 630 };
const BLUE = "#002D62";
const RED = "#CE1126";
const GREEN = "#2E7D4F";
const GOLD = "#F2B544";
const CREAM = "#FFF7E8";

// Bundled so previews never depend on a font CDN (OFL licence alongside).
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: "normal" }[]> | null = null;
const loadFonts = () =>
  (fonts ??= Promise.all(
    ([["Regular", 400], ["Bold", 700]] as const).map(async ([file, weight]) => ({
      name: "Bricolage",
      data: await readFile(join(process.cwd(), `src/assets/fonts/BricolageGrotesque-${file}.ttf`)),
      weight,
      style: "normal" as const,
    })),
  ));

let logo: Promise<string> | null = null;
const logoUri = () =>
  (logo ??= readFile(join(process.cwd(), "public/brand/logo-icon.svg")).then((b) => `data:image/svg+xml;base64,${b.toString("base64")}`));

export async function ogImage({
  eyebrow,
  title,
  lines = [],
  progress,
  footer,
}: {
  eyebrow: string;
  title: string;
  lines?: string[];
  progress?: { pct: number; raised: string; goal: string };
  footer: string;
}) {
  const [src, fontList] = await Promise.all([logoUri(), loadFonts()]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: CREAM, color: BLUE, fontFamily: "Bricolage", padding: "56px 64px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, display: "flex" }}>
          <div style={{ flex: 1, background: BLUE }} />
          <div style={{ flex: 1, background: RED }} />
          <div style={{ flex: 1, background: GREEN }} />
          <div style={{ flex: 1, background: GOLD }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={72} height={72} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 700 }}>Tres Ceibas</span>
            <span style={{ fontSize: 22, color: "#55607a" }}>Villa Magante, República Dominicana</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 18 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: 3 }}>{eyebrow}</span>
          <span style={{ fontSize: title.length > 40 ? 64 : 78, fontWeight: 700, lineHeight: 1.04, maxWidth: 1050 }}>{title}</span>
          {lines.map((l) => (
            <span key={l} style={{ fontSize: 32, color: "#3b4762" }}>{l}</span>
          ))}
        </div>
        {progress && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 26 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontSize: 52, fontWeight: 700 }}>{progress.raised}</span>
              <span style={{ fontSize: 30, color: "#55607a" }}>{progress.goal}</span>
              <span style={{ fontSize: 30, fontWeight: 700, color: GREEN, marginLeft: "auto" }}>{progress.pct}%</span>
            </div>
            <div style={{ display: "flex", height: 26, borderRadius: 99, background: "#e8dfcc", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(progress.pct, 2)}%`, background: GREEN, borderRadius: 99 }} />
            </div>
          </div>
        )}
        <span style={{ fontSize: 26, fontWeight: 700 }}>{footer}</span>
      </div>
    ),
    { ...ogSize, fonts: fontList },
  );
}
