import "server-only";
import type { Locale } from "./config";
import type es from "./dictionaries/es.json";

export type Dictionary = typeof es;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  es: () => import("./dictionaries/es.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
