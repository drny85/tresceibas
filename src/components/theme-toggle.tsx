"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { THEME_KEY, type ThemePref } from "@/lib/theme";

const ORDER: ThemePref[] = ["system", "light", "dark"];
const listeners = new Set<() => void>();

function read(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function write(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {}
  (window as unknown as { __applyTheme?: () => void }).__applyTheme?.();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Cycles automatic → light → dark. Automatic follows the phone or computer. */
export function ThemeToggle() {
  const { dict } = useI18n();
  const pref = useSyncExternalStore(subscribe, read, () => "system" as ThemePref);
  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  const label = `${dict.nav.theme}: ${dict.nav.themes[pref]}`;
  return (
    <Button variant="ghost" size="icon" className="size-11 sm:size-10" aria-label={label} title={label} onClick={() => write(next)}>
      <Icon />
    </Button>
  );
}
