"use client";

import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { Eye } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { clerkEnabled } from "@/lib/clerk-enabled";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

/** The admin's own frame: no public menu, footer or donate bar. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  return (
    <>
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))]">
          <Link href={`/${locale}/admin`} className="flex min-w-0 items-center gap-2">
            <Image src="/brand/logo-icon.svg" alt="" width={30} height={30} priority />
            <span className="grid leading-tight">
              <span className="font-display text-base font-extrabold">Tres Ceibas</span>
              <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Panel de administración</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/${locale}`}>
                <Eye /> <span className="max-[400px]:sr-only">Ver sitio</span>
              </Link>
            </Button>
            <ThemeToggle />
            {clerkEnabled && <Account />}
          </div>
        </div>
      </header>
      <main className="flex-1 bg-muted/30">{children}</main>
    </>
  );
}

function Account() {
  const { isAuthenticated } = useConvexAuth();
  return isAuthenticated ? <UserButton /> : null;
}
