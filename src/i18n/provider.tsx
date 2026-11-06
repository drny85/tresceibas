"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./get-dictionary";

type I18n = { locale: Locale; dict: Dictionary };
const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ locale, dict, children }: I18n & { children: React.ReactNode }) {
  return <I18nContext value={{ locale, dict }}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Fills {placeholders} in a translated string. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
}

/** Picks the right language from a bilingual field stored in the database. */
export function pick(text: { es: string; en: string } | undefined | null, locale: Locale) {
  if (!text) return "";
  return text[locale] || text.es;
}
