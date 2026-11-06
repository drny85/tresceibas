import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES, enUS } from "@clerk/localizations";
import { clerkEnabled } from "@/lib/clerk-enabled";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale, locales } from "@/i18n/config";
import { Suspense } from "react";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileDonateBar } from "@/components/mobile-donate-bar";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["600", "700", "800"],
});
const body = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: { default: dict.meta.title, template: `%s · Tres Ceibas` },
    description: dict.meta.description,
    icons: { icon: "/brand/logo-icon.svg" },
    alternates: { languages: { es: "/es", en: "/en" } },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1726" },
  ],
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const app = (
    <ConvexClientProvider>
      <I18nProvider locale={lang} dict={dict}>
        <Suspense fallback={<SiteHeaderFallback />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Suspense fallback={null}>
          <MobileDonateBar />
        </Suspense>
        <Toaster position="top-center" />
      </I18nProvider>
    </ConvexClientProvider>
  );

  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col">
        {clerkEnabled ? (
          <ClerkProvider localization={lang === "es" ? esES : enUS}>
            {app}
          </ClerkProvider>
        ) : (
          app
        )}
      </body>
    </html>
  );
}
