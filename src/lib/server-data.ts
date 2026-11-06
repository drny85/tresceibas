import "server-only";
import { cacheLife } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

/*
 * Server-side reads for page titles and link previews (Google, WhatsApp).
 * Cached for a few minutes; the pages themselves stay live in the browser.
 * Any failure (no database configured yet) falls back to the generic title.
 */

async function safe<T>(run: () => Promise<T>): Promise<T | null> {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return null;
  try {
    return await run();
  } catch {
    return null;
  }
}

export async function loadProject(slug: string) {
  "use cache";
  cacheLife("minutes");
  return safe(() => fetchQuery(api.projects.getBySlug, { slug }));
}

export async function loadActivity(slug: string) {
  "use cache";
  cacheLife("minutes");
  return safe(() => fetchQuery(api.activities.getBySlug, { slug }));
}

export async function loadFeatured() {
  "use cache";
  cacheLife("minutes");
  return safe(() => fetchQuery(api.projects.featured, {}));
}
