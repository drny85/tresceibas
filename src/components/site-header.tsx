"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function rememberLocale(l: "es" | "en") {
  document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
}

/** Reads the current path, so it streams in after the static shell. */
export function SiteHeader() {
  const { locale } = useI18n();
  return <HeaderBar pathname={usePathname() ?? `/${locale}`} />;
}

/** Same header without the active link, used in the prerendered shell. */
export function SiteHeaderFallback() {
  const { locale } = useI18n();
  return <HeaderBar pathname={`/${locale}`} />;
}

function HeaderBar({ pathname }: { pathname: string }) {
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const rest = pathname.replace(/^\/(es|en)/, "");
  const links = [
    { href: `/${locale}`, label: dict.nav.home, exact: true },
    { href: `/${locale}/proyectos`, label: dict.nav.projects },
    { href: `/${locale}/actividades`, label: dict.nav.activities },
    { href: `/${locale}/nosotros`, label: dict.nav.about },
  ];
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))]">
        <Link href={`/${locale}`} className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image src="/brand/logo-icon.svg" alt="" width={36} height={36} priority />
          <span className="font-display text-lg font-extrabold leading-none">
            Tres Ceibas
            <span className="hidden text-xs font-semibold text-muted-foreground sm:block">{dict.brand.tagline}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={dict.nav.menu}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
                isActive(l.href, l.exact) && "bg-muted text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-border text-xs font-bold" role="group" aria-label={dict.nav.language}>
            {(["es", "en"] as const).map((l) => (
              <Link
                key={l}
                href={`/${l}${rest}`}
                onClick={() => rememberLocale(l)}
                aria-current={l === locale ? "true" : undefined}
                className={cn("flex h-9 min-w-10 items-center justify-center px-3 uppercase", l === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {l}
              </Link>
            ))}
          </div>
          <Button asChild variant="donate" size="sm" className="hidden sm:inline-flex">
            <Link href={`/${locale}/donar`}>{dict.nav.donate}</Link>
          </Button>
          <Button variant="ghost" size="icon" className="size-11 md:hidden" aria-label={dict.nav.menu} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border px-4 pb-4 md:hidden" aria-label={dict.nav.menu}>
          <ul className="grid gap-1 pt-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className={cn("block rounded-lg px-3 py-3 text-lg font-semibold", isActive(l.href, l.exact) && "bg-muted")}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Button asChild variant="donate" size="lg" className="w-full">
                <Link href={`/${locale}/donar`} onClick={() => setOpen(false)}>{dict.nav.donate}</Link>
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
