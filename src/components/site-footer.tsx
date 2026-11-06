"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/i18n/provider";
import { WhatsAppContact } from "@/components/whatsapp-contact";

export function SiteFooter() {
  const { locale, dict } = useI18n();
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-3">
          <Image src="/brand/logo-horizontal.svg" alt="Tres Ceibas" width={220} height={80} className="h-14 w-auto dark:box-content dark:rounded-xl dark:bg-[#fff7e8] dark:px-3 dark:py-2" />
          <p className="max-w-md text-sm text-muted-foreground">{dict.footer.made}</p>
          <WhatsAppContact variant="link" size="sm" className="w-fit font-semibold" />
          <p className="text-sm text-muted-foreground">Villa Magante, República Dominicana</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <Link href={`/${locale}/proyectos`} className="hover:underline">{dict.nav.projects}</Link>
          <Link href={`/${locale}/actividades`} className="hover:underline">{dict.nav.activities}</Link>
          <Link href={`/${locale}/nosotros`} className="hover:underline">{dict.nav.about}</Link>
          <Link href={`/${locale}/donar`} className="hover:underline">{dict.nav.donate}</Link>
          <Link href={`/${locale}/admin`} className="text-muted-foreground hover:underline">{dict.footer.admin}</Link>
        </nav>
      </div>
    </footer>
  );
}
