import { Suspense } from "react";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileDonateBar } from "@/components/mobile-donate-bar";
import { AdminReturnBar } from "@/components/admin-return-bar";

/** The public site, exactly as visitors see it. */
export default function SiteLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <>
      <AdminReturnBar />
      <Suspense fallback={<SiteHeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <Suspense fallback={null}>
        <MobileDonateBar />
      </Suspense>
    </>
  );
}
